'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'

interface MarkdownRendererProps {
  content: string
  className?: string
}

// HTML预览模态框组件
function HtmlPreviewModal({ html, isOpen, onClose }: { html: string; isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid rgba(0, 0, 0, 0.1)'
      }}>
        <div className="flex items-center justify-between p-4 border-b" style={{
          borderColor: 'rgba(0, 0, 0, 0.1)'
        }}>
          <h3 className="text-lg font-medium" style={{ color: 'var(--color-text)' }}>
            HTML 预览
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--color-text)', opacity: 0.7 }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex flex-col h-full max-h-[calc(90vh-80px)]">
          {/* 预览区域 */}
          <div className="flex-1 overflow-auto p-4 border-b" style={{
            borderColor: 'rgba(0, 0, 0, 0.1)',
            backgroundColor: 'white'
          }}>
            <iframe
              srcDoc={`
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>HTML预览</title>
                  <style>
                    body { 
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                      margin: 16px;
                      line-height: 1.5;
                    }
                    * { box-sizing: border-box; }
                  </style>
                </head>
                <body>
                  ${html}
                </body>
                </html>
              `}
              className="w-full h-64 border-0 rounded-lg"
              title="HTML预览"
            />
          </div>
          
          {/* 代码显示区域 */}
          <div className="h-48 overflow-auto p-4" style={{
            backgroundColor: 'var(--color-surface)',
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace'
          }}>
            <pre className="text-sm" style={{ color: 'var(--color-text)' }}>
              <code>{html}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const [previewHtml, setPreviewHtml] = useState('')
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      // 可以添加一个简单的反馈
      const button = document.activeElement as HTMLButtonElement
      if (button) {
        const originalText = button.innerHTML
        button.innerHTML = '✅'
        setTimeout(() => {
          button.innerHTML = originalText
        }, 1000)
      }
    } catch (error) {
      console.error('复制失败:', error)
      // 备用方案
      const textArea = document.createElement('textarea')
      textArea.value = code
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
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
              const codeText = String(children).replace(/\n$/, '')
              
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
      
      {/* HTML预览模态框 */}
      <HtmlPreviewModal 
        html={previewHtml}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </>
  )
} 