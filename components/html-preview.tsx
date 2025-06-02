'use client'

import { useState, useEffect } from 'react'

interface HtmlPreviewProps {
  html: string
  isOpen: boolean
  onClose: () => void
}

export function HtmlPreview({ html, isOpen, onClose }: HtmlPreviewProps) {
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<'preview' | 'code' | 'split'>('preview')

  // 处理键盘事件
  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(html)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="html-preview-overlay">
      <div className="html-preview-container">
        {/* 头部工具栏 */}
        <div className="html-preview-header">
          <div className="html-preview-title">
            <h3>HTML 预览</h3>
            <div className="html-preview-controls">
              {/* 视图模式切换 */}
              <div className="view-mode-tabs">
                <button
                  className={`view-tab ${viewMode === 'preview' ? 'active' : ''}`}
                  onClick={() => setViewMode('preview')}
                >
                  👁️ 预览
                </button>
                <button
                  className={`view-tab ${viewMode === 'code' ? 'active' : ''}`}
                  onClick={() => setViewMode('code')}
                >
                  📝 代码
                </button>
                <button
                  className={`view-tab ${viewMode === 'split' ? 'active' : ''}`}
                  onClick={() => setViewMode('split')}
                >
                  🔀 分割
                </button>
              </div>
              
              {/* 工具按钮 */}
              <div className="html-preview-actions">
                <button
                  onClick={handleCopyCode}
                  className={`copy-action-btn ${copied ? 'copied' : ''}`}
                  title="复制HTML代码"
                >
                  {copied ? '✅ 已复制' : '📋 复制'}
                </button>
                <button
                  onClick={onClose}
                  className="close-action-btn"
                  title="关闭预览"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="html-preview-content">
          {viewMode === 'preview' && (
            <div className="preview-only">
              <iframe
                srcDoc={`
                  <!DOCTYPE html>
                  <html lang="zh-CN">
                  <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>HTML预览</title>
                    <style>
                      body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        margin: 20px;
                        line-height: 1.6;
                        color: #333;
                        background-color: #fff;
                      }
                      * { box-sizing: border-box; }
                      img { max-width: 100%; height: auto; }
                      table { width: 100%; border-collapse: collapse; margin: 1em 0; }
                      th, td { padding: 0.5em; border: 1px solid #ddd; text-align: left; }
                      th { background-color: #f5f5f5; font-weight: 600; }
                      .container { max-width: 1200px; margin: 0 auto; }
                      h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; }
                      p { margin-bottom: 1em; }
                      ul, ol { margin: 1em 0; padding-left: 2em; }
                      blockquote { 
                        margin: 1em 0; 
                        padding: 1em; 
                        border-left: 4px solid #007acc; 
                        background-color: #f8f9fa; 
                      }
                      pre, code { 
                        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; 
                        background-color: #f5f5f5; 
                        padding: 0.25em 0.5em; 
                        border-radius: 4px; 
                      }
                      pre { padding: 1em; overflow-x: auto; }
                      .responsive { max-width: 100%; height: auto; }
                    </style>
                  </head>
                  <body>
                    ${html}
                  </body>
                  </html>
                `}
                className="preview-iframe"
                title="HTML预览"
              />
            </div>
          )}

          {viewMode === 'code' && (
            <div className="code-only">
              <pre className="html-code-display">
                <code>{html}</code>
              </pre>
            </div>
          )}

          {viewMode === 'split' && (
            <div className="split-view">
              <div className="split-preview">
                <h4>预览效果</h4>
                <iframe
                  srcDoc={`
                    <!DOCTYPE html>
                    <html lang="zh-CN">
                    <head>
                      <meta charset="UTF-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <title>HTML预览</title>
                      <style>
                        body { 
                          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                          margin: 16px;
                          line-height: 1.5;
                          font-size: 14px;
                        }
                        * { box-sizing: border-box; }
                        img { max-width: 100%; height: auto; }
                      </style>
                    </head>
                    <body>
                      ${html}
                    </body>
                    </html>
                  `}
                  className="split-iframe"
                  title="HTML预览"
                />
              </div>
              <div className="split-code">
                <h4>HTML代码</h4>
                <pre className="html-code-display">
                  <code>{html}</code>
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* 底部工具栏 */}
        <div className="html-preview-footer">
          <div className="footer-info">
            <span className="code-stats">
              代码长度: {html.length} 字符 | 行数: {html.split('\n').length}
            </span>
          </div>
          <div className="footer-actions">
            <button onClick={onClose} className="footer-close-btn">
              关闭预览
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}