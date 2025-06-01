// 应用配置
export const config = {
  // AI API 配置
  ai: {
    apiUrl: process.env.AIHUBMIX_API_URL || 'https://aihubmix.com/v1/chat/completions',
    apiKey: process.env.AIHUBMIX_API_KEY || '',
    defaultModel: 'gemini-2.0-flash',
    maxTokens: 10000,
    temperature: 0.7,
    
    // 支持的模型列表 (根据aihubmix.com实际支持的模型调整)
    availableModels: [
      {
        id: 'gemini-2.5-flash-preview-04-17-nothink',
        name: 'gemini-2.5-flash-preview-04-17-nothink',
        description: '最强大的模型，适合复杂任务',
        maxTokens: 8192,
        cost: 'high'
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        description: '更快的GPT-4版本',
        maxTokens: 4096,
        cost: 'medium'
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        description: '快速且经济的选择',
        maxTokens: 4096,
        cost: 'low'
      },
      {
        id: 'claude-3',
        name: 'Claude-3',
        description: 'Anthropic的强大模型',
        maxTokens: 4096,
        cost: 'medium'
      },
      {
        id: 'gemini-2.5-pro-preview-05-06',
        name: 'gemini-2.5-pro-preview-05-06',
        description: 'Google的多模态模型',
        maxTokens: 200000,
        cost: 'medium'
      }
    ]
  },
  
  // 应用设置
  app: {
    name: 'AI聊天助手',
    version: '1.0.0',
    description: '基于Next.js的现代化AI聊天应用',
  },
  
  // 主题配置
  themes: {
    light: {
      name: '浅色主题',
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#1f2937',
    },
    dark: {
      name: '深色主题', 
      primary: '#60a5fa',
      secondary: '#a78bfa',
      background: '#111827',
      surface: '#1f2937',
      text: '#f9fafb',
    },
    purple: {
      name: '紫色主题',
      primary: '#8b5cf6',
      secondary: '#ec4899',
      background: '#faf5ff',
      surface: '#f3e8ff',
      text: '#581c87',
    },
    green: {
      name: '绿色主题',
      primary: '#10b981',
      secondary: '#06b6d4',
      background: '#f0fdf4',
      surface: '#dcfce7',
      text: '#064e3b',
    }
  }
}

// 客户端配置（不包含敏感信息）
export const clientConfig = {
  app: config.app,
  themes: config.themes,
  ai: {
    availableModels: config.ai.availableModels,
    defaultModel: config.ai.defaultModel
  }
} 