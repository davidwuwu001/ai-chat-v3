'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // 自定义代码块渲染
          code: ({ inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''
            
            if (inline) {
              return (
                <code className="inline-code" {...props}>
                  {children}
                </code>
              )
            }
            
            return (
              <div className="code-block-wrapper">
                {language && (
                  <div className="code-block-header">
                    <span className="code-language">{language}</span>
                    <button 
                      onClick={() => navigator.clipboard.writeText(String(children))}
                      className="copy-button"
                      title="复制代码"
                    >
                      📋
                    </button>
                  </div>
                )}
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
  )
} 