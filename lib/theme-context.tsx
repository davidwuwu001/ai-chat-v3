'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { config } from './config'

interface ThemeInfo {
  name: string
  displayName: string
  preview: {
    primary: string
    secondary: string
    background: string
  }
}

interface ThemeContextType {
  currentTheme: string
  setTheme: (theme: string) => void
  availableThemes: ThemeInfo[]
}

// 创建主题上下文
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// 可用主题列表
const themes: ThemeInfo[] = [
  {
    name: 'light',
    displayName: '浅色主题',
    preview: {
      primary: config.themes.light.primary,
      secondary: config.themes.light.secondary,
      background: config.themes.light.background
    }
  },
  {
    name: 'dark',
    displayName: '深色主题',
    preview: {
      primary: config.themes.dark.primary,
      secondary: config.themes.dark.secondary,
      background: config.themes.dark.background
    }
  },
  {
    name: 'purple',
    displayName: '紫色主题',
    preview: {
      primary: config.themes.purple.primary,
      secondary: config.themes.purple.secondary,
      background: config.themes.purple.background
    }
  },
  {
    name: 'green',
    displayName: '绿色主题',
    preview: {
      primary: config.themes.green.primary,
      secondary: config.themes.green.secondary,
      background: config.themes.green.background
    }
  }
]

// 主题提供者组件
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState('light')
  const [isClient, setIsClient] = useState(false)

  // 检查是否在客户端
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 从localStorage加载主题
  useEffect(() => {
    if (isClient) {
      const savedTheme = localStorage.getItem('app-theme')
      if (savedTheme && themes.find(t => t.name === savedTheme)) {
        setCurrentTheme(savedTheme)
      }
    }
  }, [isClient])

  // 应用主题到body元素
  useEffect(() => {
    if (isClient) {
      // 移除所有主题类
      themes.forEach(theme => {
        document.body.classList.remove(`theme-${theme.name}`)
      })
      
      // 添加当前主题类
      document.body.classList.add(`theme-${currentTheme}`)
      
      // 为兼容性添加data属性
      document.body.setAttribute('data-theme', currentTheme)
      
      console.log('主题已切换到:', currentTheme, '应用的类:', `theme-${currentTheme}`)
    }
  }, [currentTheme, isClient])

  const setTheme = (theme: string) => {
    if (themes.find(t => t.name === theme)) {
      setCurrentTheme(theme)
      if (isClient) {
        localStorage.setItem('app-theme', theme)
      }
    }
  }

  return (
    <ThemeContext.Provider value={{ 
      currentTheme, 
      setTheme, 
      availableThemes: themes 
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

// 使用主题的Hook
export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
} 