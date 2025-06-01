'use client'

import { useState } from 'react'
import { clientConfig } from '../lib/config'

interface ModelSelectorProps {
  selectedModel: string
  onModelChange: (model: string) => void
  disabled?: boolean
}

export function ModelSelector({ selectedModel, onModelChange, disabled = false }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const currentModel = clientConfig.ai.availableModels.find(m => m.id === selectedModel)
  
  const getCostColor = (cost: string) => {
    switch (cost) {
      case 'low': return '#10b981'
      case 'medium': return '#f59e0b'
      case 'high': return '#ef4444'
      default: return 'var(--color-text)'
    }
  }
  
  const getCostIcon = (cost: string) => {
    switch (cost) {
      case 'low': return '💰'
      case 'medium': return '💰💰'
      case 'high': return '💰💰💰'
      default: return '💰'
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center space-x-2 px-3 py-2 border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderColor: 'rgba(0, 0, 0, 0.2)',
          color: 'var(--color-text)'
        }}
      >
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }}></div>
          <span className="text-sm font-medium">
            {currentModel?.name || selectedModel}
          </span>
        </div>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          style={{ color: 'var(--color-text)', opacity: 0.7 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 rounded-xl shadow-lg border z-50" style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'rgba(0, 0, 0, 0.1)'
        }}>
          <div className="p-2">
            <div className="text-xs font-medium mb-2 px-2" style={{
              color: 'var(--color-text)',
              opacity: 0.7
            }}>
              选择AI模型
            </div>
            
            {clientConfig.ai.availableModels.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  onModelChange(model.id)
                  setIsOpen(false)
                }}
                className="w-full text-left p-3 rounded-lg transition-colors"
                style={{
                  backgroundColor: selectedModel === model.id 
                    ? 'rgba(59, 130, 246, 0.1)' 
                    : 'transparent',
                  borderColor: selectedModel === model.id 
                    ? 'var(--color-primary)' 
                    : 'transparent',
                  border: selectedModel === model.id ? '1px solid' : '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  if (selectedModel !== model.id) {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedModel !== model.id) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium" style={{ 
                        color: selectedModel === model.id ? 'var(--color-primary)' : 'var(--color-text)' 
                      }}>
                        {model.name}
                      </span>
                      {selectedModel === model.id && (
                        <svg className="w-4 h-4" fill="var(--color-primary)" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <p className="text-xs mb-2" style={{
                      color: 'var(--color-text)',
                      opacity: 0.7
                    }}>
                      {model.description}
                    </p>
                    <div className="flex items-center space-x-4 text-xs">
                      <span style={{
                        color: 'var(--color-text)',
                        opacity: 0.6
                      }}>
                        最大 {model.maxTokens.toLocaleString()} tokens
                      </span>
                      <span style={{ color: getCostColor(model.cost) }}>
                        {getCostIcon(model.cost)} {model.cost === 'low' ? '经济' : model.cost === 'medium' ? '中等' : '高级'}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
            
            <div className="border-t mt-2 pt-2" style={{ borderColor: 'rgba(0, 0, 0, 0.1)' }}>
              <p className="text-xs px-2" style={{
                color: 'var(--color-text)',
                opacity: 0.6
              }}>
                💡 不同模型有不同的能力和成本，请根据需求选择
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* 点击外部关闭 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
} 