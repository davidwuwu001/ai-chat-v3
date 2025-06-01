'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { auth } from './supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, username?: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  updateProfile: (updates: { username?: string; avatar_url?: string; full_name?: string }) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 获取初始用户状态
    const getInitialUser = async () => {
      const { user } = await auth.getCurrentUser()
      setUser(user)
      setLoading(false)
    }

    getInitialUser()

    // 监听认证状态变化
    const { data: { subscription } } = auth.onAuthStateChange(
      (event, session) => {
        console.log('认证状态变化:', event, session?.user?.email)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    const { error } = await auth.signIn(email, password)
    setLoading(false)
    return { error }
  }

  const signUp = async (email: string, password: string, username?: string) => {
    setLoading(true)
    const { error } = await auth.signUp(email, password, username)
    setLoading(false)
    return { error }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      
      // 立即清除本地状态，不等待网络请求
      setUser(null)
      
      // 清除所有可能的本地存储
      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch (e) {
        console.warn('清除本地存储时出错:', e)
      }
      
      // 尝试调用远程登出，但不依赖它
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000) // 缩短到3秒
      
      try {
        await auth.signOut()
        clearTimeout(timeoutId)
        console.log('远程登出成功')
      } catch (authError) {
        console.warn('远程登出失败，但本地已清除:', authError)
      }
      
    } catch (error: any) {
      console.error('退出登录时出错:', error)
      // 确保无论如何都清除用户状态
      setUser(null)
    } finally {
      setLoading(false)
      
      // 强制刷新页面作为最终兜底
      setTimeout(() => {
        if (window.location.pathname !== '/') {
          window.location.href = '/'
        } else {
          window.location.reload()
        }
      }, 100)
    }
  }

  const resetPassword = async (email: string) => {
    const { error } = await auth.resetPassword(email)
    return { error }
  }

  const updateProfile = async (updates: { username?: string; avatar_url?: string; full_name?: string }) => {
    setLoading(true)
    const { error } = await auth.updateProfile(updates)
    if (!error) {
      // 更新本地用户状态
      const { user } = await auth.getCurrentUser()
      setUser(user)
    }
    setLoading(false)
    return { error }
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 