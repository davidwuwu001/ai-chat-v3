import { NextRequest, NextResponse } from 'next/server'
import { config } from '../../../lib/config'

// API配置
const AIHUBMIX_API_URL = config.ai.apiUrl
const AIHUBMIX_API_KEY = process.env.AIHUBMIX_API_KEY || 'your_api_key_here'

// 消息类型定义
interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatRequest {
  messages: ChatMessage[]
  model?: string
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body: ChatRequest = await request.json()
    
    // 验证请求数据
    if (!body.messages || body.messages.length === 0) {
      return NextResponse.json(
        { error: '消息不能为空' },
        { status: 400 }
      )
    }

    // 构造发送给AI API的请求数据
    const aiRequest = {
      model: body.model || config.ai.defaultModel,
      messages: [
        {
          role: 'system',
          content: '你是一个友善、专业的AI助手。请用简洁、有用的方式回答用户的问题。回答要准确、有帮助，并保持友好的语气。'
        },
        ...body.messages
      ],
      temperature: body.temperature || config.ai.temperature,
      max_tokens: body.max_tokens || config.ai.maxTokens,
      stream: body.stream || false
    }

    console.log('发送请求到AI API:', {
      url: AIHUBMIX_API_URL,
      model: aiRequest.model,
      messageCount: aiRequest.messages.length,
      stream: aiRequest.stream
    })

    // 调用AI API
    const response = await fetch(AIHUBMIX_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AIHUBMIX_API_KEY}`,
      },
      body: JSON.stringify(aiRequest),
    })

    // 检查响应状态
    if (!response.ok) {
      const errorText = await response.text()
      console.error('AI API错误:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      
      return NextResponse.json(
        { 
          error: `AI服务暂时不可用 (${response.status})`,
          details: response.status === 401 ? 'API密钥无效' : '请稍后重试'
        },
        { status: response.status }
      )
    }

    // 处理流式响应
    if (aiRequest.stream) {
      console.log('开始处理流式响应')
      
      // 创建一个可读流来转发AI API的流式数据
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const reader = response.body?.getReader()
            if (!reader) {
              controller.error(new Error('无法获取响应流'))
              return
            }

            const decoder = new TextDecoder()
            let buffer = ''

            while (true) {
              const { done, value } = await reader.read()
              
              if (done) {
                // 发送结束信号
                controller.enqueue(`data: [DONE]\n\n`)
                controller.close()
                break
              }

              // 解码数据块
              const chunk = decoder.decode(value, { stream: true })
              buffer += chunk

              // 处理完整的数据行
              const lines = buffer.split('\n')
              buffer = lines.pop() || '' // 保留不完整的行

              for (const line of lines) {
                if (line.trim() === '') continue
                
                // 处理Server-Sent Events格式的数据
                if (line.startsWith('data: ')) {
                  const data = line.slice(6) // 移除 "data: " 前缀
                  
                  if (data === '[DONE]') {
                    controller.enqueue(`data: [DONE]\n\n`)
                    controller.close()
                    return
                  }

                  try {
                    // 解析JSON数据
                    const parsed = JSON.parse(data)
                    
                    // 提取AI回复的内容
                    if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
                      const content = parsed.choices[0].delta.content
                      if (content) {
                        // 转发内容给客户端
                        controller.enqueue(`data: ${JSON.stringify({ content, model: aiRequest.model })}\n\n`)
                      }
                    }
                  } catch (parseError) {
                    console.warn('解析流式数据时出错:', parseError)
                    // 继续处理其他数据
                  }
                } else {
                  // 非标准格式，直接转发
                  controller.enqueue(`${line}\n`)
                }
              }
            }
          } catch (error) {
            console.error('流式处理错误:', error)
            controller.error(error)
          }
        }
      })

      // 返回流式响应
      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      })
    }

    // 处理非流式响应（原有逻辑）
    const aiResponse = await response.json()
    
    console.log('AI API响应:', {
      hasChoices: !!aiResponse.choices,
      choicesLength: aiResponse.choices?.length || 0
    })

    // 验证响应格式
    if (!aiResponse.choices || aiResponse.choices.length === 0) {
      return NextResponse.json(
        { error: 'AI服务返回了无效的响应' },
        { status: 500 }
      )
    }

    // 提取AI回复
    const aiMessage = aiResponse.choices[0].message.content

    // 返回结果
    return NextResponse.json({
      message: aiMessage,
      usage: aiResponse.usage || null,
      model: aiRequest.model
    })

  } catch (error) {
    console.error('聊天API错误:', error)
    
    // 网络错误或其他异常
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: '无法连接到AI服务，请检查网络连接' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: '服务器内部错误，请稍后重试' },
      { status: 500 }
    )
  }
}

// 处理OPTIONS请求（CORS预检）
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
} 