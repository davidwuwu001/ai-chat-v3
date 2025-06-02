'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { HtmlPreview } from './html-preview'
import 'highlight.js/styles/github.css'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const [previewHtml, setPreviewHtml] = useState('')
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const handleCopyCode = async (code: string) => {
    try {
      // 确保代码是字符串类型并清理
      let textToCopy = ''
      if (typeof code === 'string') {
        textToCopy = code.trim()
      } else {
        textToCopy = String(code).trim()
      }
      
      // 调试信息：显示要复制的内容
      console.log('准备复制的代码长度:', textToCopy.length)
      console.log('复制内容预览:', textToCopy.substring(0, 100) + (textToCopy.length > 100 ? '...' : ''))
      
      // 使用现代的Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy)
      } else {
        // 备用方案：使用传统的execCommand
        const textArea = document.createElement('textarea')
        textArea.value = textToCopy
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      
      // 视觉反馈
      const button = document.activeElement as HTMLButtonElement
      if (button && (button.innerHTML === '📋' || button.innerHTML.includes('📋'))) {
        const originalText = button.innerHTML
        button.innerHTML = '✅ 已复制'
        button.style.backgroundColor = '#10b981'
        button.style.color = 'white'
        button.style.transform = 'scale(1.05)'
        setTimeout(() => {
          button.innerHTML = originalText
          button.style.backgroundColor = ''
          button.style.color = ''
          button.style.transform = ''
        }, 2000)
      }
      
      console.log('✅ 代码复制成功！长度:', textToCopy.length, '字符')
    } catch (error) {
      console.error('❌ 复制失败:', error)
      
      // 显示错误反馈
      const button = document.activeElement as HTMLButtonElement
      if (button) {
        const originalText = button.innerHTML
        button.innerHTML = '❌ 复制失败'
        button.style.backgroundColor = '#ef4444'
        button.style.color = 'white'
        setTimeout(() => {
          button.innerHTML = originalText
          button.style.backgroundColor = ''
          button.style.color = ''
        }, 2000)
      }
    }
  }

  const handlePreviewHtml = (html: string) => {
    setPreviewHtml(html)
    setIsPreviewOpen(true)
  }

  return (
    <>
      <div className={`markdown-content ${className}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            // 自定义代码块渲染
            code: ({ inline, className, children, ...props }: any) => {
              const match = /language-(\w+)/.exec(className || '')
              const language = match ? match[1] : ''
              
              // 更强大的代码文本提取逻辑
              let codeText = ''
              
              const extractText = (node: any): string => {
                if (typeof node === 'string') {
                  return node
                } else if (typeof node === 'number') {
                  return String(node)
                } else if (Array.isArray(node)) {
                  return node.map(extractText).join('')
                } else if (node && typeof node === 'object' && node.props && node.props.children) {
                  return extractText(node.props.children)
                } else {
                  return ''
                }
              }
              
              codeText = extractText(children)
              
              // 移除末尾的换行符但保留内部换行
              codeText = codeText.replace(/\n$/, '')
              
              // 调试信息
              console.log('提取的代码文本长度:', codeText.length)
              console.log('代码预览:', codeText.substring(0, 50) + (codeText.length > 50 ? '...' : ''))
              
              if (inline) {
                return (
                  <code className="inline-code" {...props}>
                    {children}
                  </code>
                )
              }
              
              return (
                <div className="code-block-wrapper">
                  <div className="code-block-header">
                    <span className="code-language">{language || 'text'}</span>
                    <div className="flex items-center space-x-2">
                      {/* 复制按钮 */}
                      <button 
                        onClick={() => handleCopyCode(codeText)}
                        className="copy-button"
                        title="复制代码"
                      >
                        📋
                      </button>
                      
                      {/* HTML预览按钮 */}
                      {(language === 'html' || language === 'xml') && (
                        <button 
                          onClick={() => handlePreviewHtml(codeText)}
                          className="preview-button"
                          title="预览HTML"
                        >
                          👁️
                        </button>
                      )}
                    </div>
                  </div>
                  <pre className="code-block">
                    <code className={className}>
                      {children}
                    </code>
                  </pre>
                </div>
              )
            },
            
            // 自定义链接渲染
            a: ({ href, children, ...props }: any) => (
              <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="markdown-link"
                {...props}
              >
                {children}
              </a>
            ),
            
            // 自定义表格渲染
            table: ({ children, ...props }: any) => (
              <div className="table-wrapper">
                <table className="markdown-table" {...props}>
                  {children}
                </table>
              </div>
            ),
            
            // 自定义引用块渲染
            blockquote: ({ children, ...props }: any) => (
              <blockquote className="markdown-blockquote" {...props}>
                {children}
              </blockquote>
            )
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
      
      {/* 使用新的HTML预览组件 */}
      <HtmlPreview 
        html={previewHtml}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </>
  )
}