'use client'

import { useState } from 'react'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'
import { saveAs } from 'file-saver'

interface MessageActionsProps {
  messageText: string
  messageId: string
  timestamp: Date
  model?: string
}

export function MessageActions({ messageText, messageId, timestamp, model }: MessageActionsProps) {
  const [isCopying, setIsCopying] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [showSuccess, setShowSuccess] = useState<'copy' | 'export' | null>(null)

  // 复制功能
  const handleCopy = async () => {
    try {
      setIsCopying(true)
      await navigator.clipboard.writeText(messageText)
      setShowSuccess('copy')
      setTimeout(() => setShowSuccess(null), 2000)
    } catch (error) {
      console.error('复制失败:', error)
      // 备用方案：创建临时textarea元素
      const textArea = document.createElement('textarea')
      textArea.value = messageText
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setShowSuccess('copy')
      setTimeout(() => setShowSuccess(null), 2000)
    } finally {
      setIsCopying(false)
    }
  }

  // 导出为Word文档
  const handleExportToWord = async () => {
    try {
      setIsExporting(true)
      
      // 处理markdown格式的文本，简单转换
      const cleanText = messageText
        .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体标记
        .replace(/\*(.*?)\*/g, '$1')     // 移除斜体标记
        .replace(/`(.*?)`/g, '$1')       // 移除代码标记
        .replace(/#{1,6}\s/g, '')        // 移除标题标记
        .replace(/\n/g, '\n')            // 保持换行
      
      // 创建Word文档
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // 标题
            new Paragraph({
              children: [
                new TextRun({
                  text: "AI助手对话记录",
                  bold: true,
                  size: 32,
                  color: "2E5BBF"
                })
              ],
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 400
              }
            }),
            
            // 元信息
            new Paragraph({
              children: [
                new TextRun({
                  text: `生成时间: ${timestamp.toLocaleString('zh-CN')}`,
                  size: 20,
                  color: "666666"
                })
              ],
              spacing: { after: 200 }
            }),
            
            ...(model ? [new Paragraph({
              children: [
                new TextRun({
                  text: `AI模型: ${model}`,
                  size: 20,
                  color: "666666"
                })
              ],
              spacing: { after: 400 }
            })] : []),
            
            // 分割线
            new Paragraph({
              children: [
                new TextRun({
                  text: "──────────────────────────────────",
                  color: "CCCCCC"
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 }
            }),
            
            // 内容标题
            new Paragraph({
              children: [
                new TextRun({
                  text: "回复内容:",
                  bold: true,
                  size: 24,
                  color: "333333"
                })
              ],
              spacing: { after: 200 }
            }),
            
            // 主要内容 - 按段落分割
            ...cleanText.split('\n\n').map(paragraph => 
              new Paragraph({
                children: [
                  new TextRun({
                    text: paragraph.trim(),
                    size: 22,
                    color: "333333"
                  })
                ],
                spacing: { 
                  after: 200,
                  line: 360 // 1.5倍行距
                }
              })
            ),
            
            // 底部信息
            new Paragraph({
              children: [
                new TextRun({
                  text: "\n\n",
                })
              ]
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "──────────────────────────────────",
                  color: "CCCCCC"
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 400, after: 200 }
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "本文档由AI智能助手生成",
                  size: 18,
                  color: "999999",
                  italics: true
                })
              ],
              alignment: AlignmentType.CENTER
            })
          ]
        }]
      })

      // 生成并下载文件
      const blob = await Packer.toBlob(doc)
      
      // 生成文件名
      const dateStr = timestamp.toLocaleDateString('zh-CN').replace(/\//g, '-')
      const timeStr = timestamp.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }).replace(/:/g, '-')
      const fileName = `AI助手对话_${dateStr}_${timeStr}.docx`
      
      saveAs(blob, fileName)
      setShowSuccess('export')
      setTimeout(() => setShowSuccess(null), 2000)
      
    } catch (error) {
      console.error('导出Word失败:', error)
      alert('导出失败，请稍后重试')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex items-center space-x-2 mt-2">
      {/* 复制按钮 */}
      <button
        onClick={handleCopy}
        disabled={isCopying}
        className="flex items-center space-x-1 px-2 py-1 rounded-md text-xs transition-all duration-200 hover:bg-opacity-80"
        style={{
          backgroundColor: showSuccess === 'copy' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          color: showSuccess === 'copy' ? '#22c55e' : 'var(--color-text)',
          opacity: 0.7
        }}
        onMouseEnter={(e) => {
          if (showSuccess !== 'copy') {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'
            e.currentTarget.style.opacity = '1'
          }
        }}
        onMouseLeave={(e) => {
          if (showSuccess !== 'copy') {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'
            e.currentTarget.style.opacity = '0.7'
          }
        }}
      >
        {isCopying ? (
          <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ) : showSuccess === 'copy' ? (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
        <span>
          {isCopying ? '复制中...' : showSuccess === 'copy' ? '已复制' : '复制'}
        </span>
      </button>

      {/* 导出Word按钮 */}
      <button
        onClick={handleExportToWord}
        disabled={isExporting}
        className="flex items-center space-x-1 px-2 py-1 rounded-md text-xs transition-all duration-200 hover:bg-opacity-80"
        style={{
          backgroundColor: showSuccess === 'export' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          color: showSuccess === 'export' ? '#22c55e' : 'var(--color-text)',
          opacity: 0.7
        }}
        onMouseEnter={(e) => {
          if (showSuccess !== 'export') {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'
            e.currentTarget.style.opacity = '1'
          }
        }}
        onMouseLeave={(e) => {
          if (showSuccess !== 'export') {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'
            e.currentTarget.style.opacity = '0.7'
          }
        }}
      >
        {isExporting ? (
          <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ) : showSuccess === 'export' ? (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        <span>
          {isExporting ? '导出中...' : showSuccess === 'export' ? '已导出' : '导出Word'}
        </span>
      </button>
    </div>
  )
} 