'use client'

import { useState, useRef, useEffect } from 'react'
import { useTheme } from '../lib/theme-context'
import { useAuth } from '../lib/auth-context'
import { ModelSelector } from '../components/model-selector'
import { MarkdownRenderer } from '../components/markdown-renderer'
import { AuthModal } from '../components/auth-modal'
import { UserMenu } from '../components/user-menu'
import { clientConfig } from '../lib/config'

// 定义消息类型
interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
  error?: boolean
  model?: string
}

// API错误类型
interface ApiError {
  error: string
  details?: string
}

export default function Home() {
  // 管理聊天消息的状态
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState(clientConfig.ai.defaultModel)
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false)
  const [useStreamMode, setUseStreamMode] = useState(true) // 流式模式开关
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false) // 认证模态框状态
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { currentTheme, setTheme, availableThemes } = useTheme()
  const { user } = useAuth()

  // 获取用户显示名称
  const getUserDisplayName = () => {
    if (!user) return ''
    return user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  }

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 调用AI API的函数 - 支持流式响应
  const callAiApi = async (userMessage: string, isStream: boolean = true): Promise<string> => {
    if (!isStream) {
      // 非流式请求（原有逻辑）
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            ...messages.map(msg => ({
              role: msg.isUser ? 'user' : 'assistant',
              content: msg.text
            })),
            {
              role: 'user',
              content: userMessage
            }
          ],
          model: selectedModel,
          stream: false
        }),
      })

      if (!response.ok) {
        const errorData: ApiError = await response.json()
        throw new Error(errorData.error || '请求失败')
      }

      const data = await response.json()
      return data.message
    }

    // 流式请求处理
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              ...messages.map(msg => ({
                role: msg.isUser ? 'user' : 'assistant',
                content: msg.text
              })),
              {
                role: 'user',
                content: userMessage
              }
            ],
            model: selectedModel,
            stream: true
          }),
        })

        if (!response.ok) {
          const errorData: ApiError = await response.json()
          throw new Error(errorData.error || '请求失败')
        }

        if (!response.body) {
          throw new Error('无法获取响应流')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let fullContent = ''
        let buffer = ''

        // 创建AI消息，先显示空内容
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: '',
          isUser: false,
          timestamp: new Date(),
          model: selectedModel
        }
        
        setMessages(prev => [...prev, aiMessage])

        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            console.log('流式响应完成')
            break
          }

          // 解码数据块
          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk

          // 处理完整的数据行
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.trim() === '') continue
            
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              
              if (data === '[DONE]') {
                console.log('收到流式结束信号')
                resolve(fullContent)
                return
              }

              try {
                const parsed = JSON.parse(data)
                if (parsed.content) {
                  fullContent += parsed.content
                  
                  // 实时更新AI消息内容
                  setMessages(prev => prev.map(msg => 
                    msg.id === aiMessage.id 
                      ? { ...msg, text: fullContent }
                      : msg
                  ))
                }
              } catch (parseError) {
                console.warn('解析流式数据出错:', parseError)
              }
            }
          }
        }

        resolve(fullContent)
      } catch (error) {
        console.error('流式请求错误:', error)
        reject(error)
      }
    })
  }

  // 发送消息的函数 - 支持流式和非流式
  const sendMessage = async (useStream: boolean = true) => {
    // 检查用户是否已登录
    if (!user) {
      setIsAuthModalOpen(true) // 打开登录模态框
      return
    }

    if (!inputText.trim() || isTyping) return

    const userMessageText = inputText.trim()
    setInputText('')
    setError(null)

    // 创建用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      text: userMessageText,
      isUser: true,
      timestamp: new Date()
    }

    // 更新消息列表
    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    try {
      if (useStream) {
        // 流式响应 - callAiApi已经处理了消息更新
        await callAiApi(userMessageText, true)
      } else {
        // 非流式响应
        const aiResponse = await callAiApi(userMessageText, false)
        
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: aiResponse,
          isUser: false,
          timestamp: new Date(),
          model: selectedModel
        }
        
        setMessages(prev => [...prev, aiMessage])
      }
    } catch (error) {
      console.error('AI API调用失败:', error)
      
      // 创建错误消息
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: error instanceof Error ? error.message : '抱歉，我现在无法回复。请稍后重试。',
        isUser: false,
        timestamp: new Date(),
        error: true
      }
      
      setMessages(prev => [...prev, errorMessage])
      setError(error instanceof Error ? error.message : '未知错误')
    } finally {
      setIsTyping(false)
    }
  }

  // 处理回车键发送
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(useStreamMode) // 使用当前选择的模式
    }
  }

  // 清空对话
  const clearMessages = () => {
    setMessages([])
    setError(null)
  }

  // 重试上一条消息
  const retryLastMessage = () => {
    if (messages.length < 2) return
    
    const lastUserMessage = messages.filter(msg => msg.isUser).pop()
    if (lastUserMessage) {
      // 移除最后的AI回复（可能是错误消息）
      setMessages(prev => prev.filter(msg => 
        !(msg.isUser === false && msg.timestamp > lastUserMessage.timestamp)
      ))
      
      // 重新发送
      setInputText(lastUserMessage.text)
      // 使用非流式响应作为备用方案
      setTimeout(() => sendMessage(false), 100)
    }
  }

  // 获取模型信息
  const getModelInfo = (modelId?: string) => {
    return clientConfig.ai.availableModels.find(m => m.id === modelId)
  }

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300" style={{
      background: 'var(--color-background)'
    }}>
      {/* 顶部导航栏 */}
      <header className="border-b backdrop-blur-xl sticky top-0 z-10" style={{
        borderColor: 'rgba(0, 0, 0, 0.1)',
        backgroundColor: 'rgba(255, 255, 255, 0.7)'
      }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo区域 */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center gradient-animate shadow-lg">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
                智能助手
              </h1>
            </div>

            {/* 中间模型选择器 */}
            <div className="hidden md:flex">
              <ModelSelector 
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                disabled={isTyping}
              />
            </div>

            {/* 右侧按钮 */}
            <div className="flex items-center space-x-2">
              {messages.length > 0 && user && (
                <button 
                  onClick={clearMessages}
                  className="p-2 rounded-lg transition-colors group"
                  style={{
                    color: 'var(--color-text)',
                    opacity: 0.7
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'
                    e.currentTarget.style.opacity = '1'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.opacity = '0.7'
                  }}
                  title="清空对话"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              
              {/* 主题切换按钮 */}
              <div className="relative">
                <button 
                  onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                  className="p-2 rounded-lg transition-colors" 
                  style={{
                    color: 'var(--color-text)',
                    opacity: 0.7
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </button>
                
                {/* 主题选择器下拉菜单 */}
                {isThemeMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg border transition-all duration-200 z-50" style={{
                    backgroundColor: 'var(--color-surface)',
                    borderColor: 'rgba(0, 0, 0, 0.1)'
                  }}>
                    <div className="p-2">
                      <p className="text-xs font-medium mb-2 px-2" style={{
                        color: 'var(--color-text)',
                        opacity: 0.7
                      }}>选择主题</p>
                      {availableThemes.map((theme) => (
                        <button
                          key={theme.name}
                          onClick={() => {
                            setTheme(theme.name)
                            setIsThemeMenuOpen(false)
                          }}
                          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors"
                          style={{
                            backgroundColor: currentTheme === theme.name ? 'rgba(59, 130, 246, 0.1)' : undefined,
                            color: currentTheme === theme.name ? 'var(--color-primary)' : 'var(--color-text)'
                          }}
                          onMouseEnter={(e) => {
                            if (currentTheme !== theme.name) {
                              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (currentTheme !== theme.name) {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }
                          }}
                        >
                          <div 
                            className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: theme.preview.primary }}
                          />
                          <span>{theme.displayName}</span>
                          {currentTheme === theme.name && (
                            <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 点击外部关闭 */}
                {isThemeMenuOpen && (
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsThemeMenuOpen(false)}
                  />
                )}
              </div>

              {/* 用户认证区域 */}
              {user ? (
                <UserMenu />
              ) : (
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 shadow-sm"
                >
                  登录
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 错误提示栏 */}
      {error && (
        <div className="border-l-4 border-red-400 p-4" style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: 'var(--color-text)'
        }}>
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={retryLastMessage}
                className="text-sm text-red-600 hover:text-red-500 font-medium"
              >
                重试
              </button>
              <button 
                onClick={() => setError(null)}
                className="text-sm text-red-600 hover:text-red-500"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 主要内容区域 */}
      <main className="flex-1 max-w-4xl mx-auto w-full flex flex-col">
        {messages.length === 0 ? (
          // 欢迎界面（没有消息时显示）
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="text-center max-w-2xl">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-8 gradient-animate shadow-2xl">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {user ? `你好${getUserDisplayName()}！我是你的AI助手` : '你好！我是你的AI助手'}
              </h2>
              <p className="text-xl mb-8 leading-relaxed" style={{ color: 'var(--color-text)', opacity: 0.8 }}>
                {user ? (
                  <>
                    我由真实的AI大模型驱动，可以帮你解答问题、协助思考、提供建议。<br/>
                    当前模型：<span className="font-semibold" style={{ color: 'var(--color-primary)' }}>{getModelInfo(selectedModel)?.name}</span>
                  </>
                ) : (
                  <>
                    我由真实的AI大模型驱动，可以帮你解答问题、协助思考、提供建议。<br/>
                    <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>请先登录体验完整功能</span>
                  </>
                )}
              </p>

              {/* 未登录用户的特殊提示 */}
              {!user && (
                <div className="mb-8 p-4 rounded-xl border" style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  borderColor: 'rgba(59, 130, 246, 0.3)'
                }}>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: 'var(--color-primary)' }}>
                        🎉 免费注册，立即体验AI对话
                      </p>
                      <p className="text-sm" style={{ color: 'var(--color-text)', opacity: 0.8 }}>
                        注册后可保存聊天记录，享受完整功能
                      </p>
                    </div>
                    <button
                      onClick={() => setIsAuthModalOpen(true)}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                    >
                      立即注册
                    </button>
                  </div>
                </div>
              )}

              {/* 移动端模型选择器 */}
              <div className="md:hidden mb-8">
                <ModelSelector 
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  disabled={isTyping}
                />
              </div>
              
              {/* 示例问题卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {[
                  { text: "帮我写一篇关于技术的文章", icon: "📝" },
                  { text: "解释一下React的工作原理", icon: "⚛️" },
                  { text: "给我一些学习编程的建议", icon: "💡" },
                  { text: "帮我制定今天的工作计划", icon: "📅" }
                ].map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (user) {
                        setInputText(item.text)
                      } else {
                        setIsAuthModalOpen(true)
                      }
                    }}
                    className="p-6 text-left rounded-2xl transition-all duration-200 border card-hover backdrop-blur-sm relative"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.6)',
                      borderColor: 'rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{item.icon}</span>
                      <span style={{ color: 'var(--color-text)' }} className="font-medium">{item.text}</span>
                    </div>
                    {!user && (
                      <div className="absolute top-2 right-2">
                        <svg className="w-4 h-4" style={{ color: 'var(--color-text)', opacity: 0.5 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* 特色功能说明 */}
              <div className="text-sm space-y-2" style={{ color: 'var(--color-text)', opacity: 0.6 }}>
                <p>✨ 多模型选择 • 🎨 主题切换 • 📱 响应式设计 • 🔄 错误重试</p>
              </div>
            </div>
          </div>
        ) : (
          // 聊天消息区域
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} message-enter`}
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  <div className={`flex space-x-3 max-w-3xl ${message.isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* 头像 */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
                      message.isUser 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                        : message.error
                        ? 'bg-gradient-to-r from-red-500 to-red-600'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500'
                    }`}>
                      <span className="text-white text-sm font-medium">
                        {message.isUser ? '👤' : message.error ? '⚠️' : '🤖'}
                      </span>
                    </div>
                    
                    {/* 消息内容 */}
                    <div className={`rounded-2xl px-5 py-4 shadow-sm ${
                      message.isUser
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                        : message.error
                        ? 'border border-red-200'
                        : 'border backdrop-blur-sm'
                    }`} style={{
                      backgroundColor: message.isUser ? undefined : message.error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.8)',
                      borderColor: message.isUser ? undefined : message.error ? '#ef4444' : 'rgba(0, 0, 0, 0.1)',
                      color: message.isUser ? 'white' : message.error ? '#dc2626' : 'var(--color-text)'
                    }}>
                      {message.isUser ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                      ) : (
                        <MarkdownRenderer content={message.text} />
                      )}
                      <div className={`text-xs mt-2 opacity-70 flex items-center justify-between ${
                        message.isUser 
                          ? 'text-blue-100' 
                          : message.error
                          ? 'text-red-500'
                          : ''
                      }`} style={{
                        color: message.isUser ? 'rgba(255, 255, 255, 0.8)' : message.error ? '#dc2626' : 'var(--color-text)',
                        opacity: 0.7
                      }}>
                        <span>
                          {message.timestamp.toLocaleTimeString('zh-CN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {!message.isUser && message.model && !message.error && (
                            <span className="ml-2">• {getModelInfo(message.model)?.name}</span>
                          )}
                        </span>
                        {message.error && (
                          <button 
                            onClick={retryLastMessage}
                            className="underline hover:no-underline"
                          >
                            重试
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* 正在输入指示器 */}
              {isTyping && (
                <div className="flex justify-start message-enter">
                  <div className="flex space-x-3 max-w-3xl">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <span className="text-white text-sm font-medium">🤖</span>
                    </div>
                    <div className="rounded-2xl px-5 py-4 border backdrop-blur-sm" style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      borderColor: 'rgba(0, 0, 0, 0.1)'
                    }}>
                      <div className="flex space-x-1 typing-indicator">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* 底部输入区域 */}
        <div className="border-t backdrop-blur-xl p-4" style={{
          borderColor: 'rgba(0, 0, 0, 0.1)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)'
        }}>
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={user ? "输入你的消息..." : "请先登录后使用AI助手..."}
                className="w-full px-5 py-4 pr-14 border rounded-2xl focus:outline-none focus:ring-2 resize-none backdrop-blur-sm shadow-sm"
                style={{
                  backgroundColor: user ? 'rgba(255, 255, 255, 0.8)' : 'rgba(200, 200, 200, 0.5)',
                  borderColor: user ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.2)',
                  color: user ? 'var(--color-text)' : 'rgba(0, 0, 0, 0.5)',
                  minHeight: '56px',
                  maxHeight: '120px',
                  cursor: user ? 'text' : 'not-allowed'
                }}
                rows={1}
                disabled={isTyping || !user}
                readOnly={!user}
                onClick={() => {
                  if (!user) {
                    setIsAuthModalOpen(true)
                  }
                }}
              />
              <button
                onClick={() => sendMessage(useStreamMode)}
                disabled={!inputText.trim() || isTyping || !user}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
                title={!user ? "请先登录" : undefined}
              >
                {isTyping ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : !user ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          {/* 底部提示 */}
          <div className="text-xs text-center mt-3 flex items-center justify-center space-x-4" style={{
            color: 'var(--color-text)',
            opacity: 0.6
          }}>
            {user ? (
              <>
                <span>按 Enter 发送消息</span>
                <span>•</span>
                <span>当前模型：{getModelInfo(selectedModel)?.name}</span>
                <span>•</span>
                <button
                  onClick={() => setUseStreamMode(!useStreamMode)}
                  className="text-xs hover:opacity-100 transition-opacity"
                  style={{
                    color: useStreamMode ? '#10b981' : '#f59e0b',
                    opacity: 0.8
                  }}
                >
                  {useStreamMode ? '🔄 流式模式' : '📋 标准模式'}
                </button>
                <span>•</span>
                <span className="text-green-600">🟢 AI已连接</span>
              </>
            ) : (
              <>
                <span>🔐 请先登录体验完整功能</span>
                <span>•</span>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="text-blue-600 hover:text-blue-500 font-medium underline"
                >
                  立即登录
                </button>
                <span>•</span>
                <span>体验最先进的AI对话技术</span>
              </>
            )}
          </div>
        </div>
      </main>

      {/* 认证模态框 */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  )
}
