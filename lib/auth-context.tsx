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
    setLoading(true)
    await auth.signOut()
    setUser(null)
    setLoading(false)
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