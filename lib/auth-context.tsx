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
      
      // 添加超时机制
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时
      
      await auth.signOut()
      
      clearTimeout(timeoutId)
      
      // 强制清除用户状态，即使API调用失败
      setUser(null)
      
      // 清除本地存储的认证信息
      localStorage.removeItem('supabase.auth.token')
      
      console.log('用户已成功退出登录')
      
    } catch (error: any) {
      console.error('退出登录时出错:', error)
      
      // 即使发生错误，也要清除用户状态
      setUser(null)
      localStorage.removeItem('supabase.auth.token')
      
      // 如果是超时错误，给出特定提示
      if (error.name === 'AbortError') {
        console.warn('退出登录超时，但已强制退出')
      }
    } finally {
      setLoading(false)
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