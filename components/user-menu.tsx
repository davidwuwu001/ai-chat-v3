'use client'

import { useState } from 'react'
import { useAuth } from '../lib/auth-context'
import { UserSettingsModal } from './user-settings-modal'

export function UserMenu() {
  const { user, signOut, loading } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  if (!user) return null

  const getUserDisplayName = () => {
    return user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  }

  const getUserInitials = () => {
    const name = getUserDisplayName()
    return name.charAt(0).toUpperCase()
  }

  const getUserAvatar = () => {
    return user.user_metadata?.avatar_url
  }

  const generateColorAvatar = (name: string) => {
    const colors = [
      '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', 
      '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
      '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
      '#ec4899', '#f43f5e'
    ]
    const colorIndex = name.charCodeAt(0) % colors.length
    return colors[colorIndex]
  }

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      setIsOpen(false) // 先关闭菜单
      
      // 立即给用户反馈
      console.log('正在退出登录...')
      
      await signOut()
      
      // 成功后的反馈（实际上页面会刷新，但这是备用）
      console.log('已成功退出登录')
    } catch (error) {
      console.error('退出登录失败:', error)
      // 即使失败也不用担心，auth-context会强制清除并刷新页面
    } finally {
      // 通常不会执行到这里，因为页面会刷新
      setIsSigningOut(false)
    }
  }

  const openSettings = () => {
    setIsSettingsOpen(true)
    setIsOpen(false)
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 p-2 rounded-lg transition-colors"
          style={{
            color: 'var(--color-text)',
            opacity: 0.8
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'
            e.currentTarget.style.opacity = '1'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.opacity = '0.8'
          }}
        >
          {getUserAvatar() ? (
            <img
              src={getUserAvatar()}
              alt="用户头像"
              className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
            />
          ) : (
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm"
              style={{ backgroundColor: generateColorAvatar(getUserDisplayName()) }}
            >
              {getUserInitials()}
            </div>
          )}
          <span className="text-sm font-medium hidden md:block">
            {getUserDisplayName()}
          </span>
          <svg 
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg border z-50" style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'rgba(0, 0, 0, 0.1)'
          }}>
            <div className="p-2">
              {/* 用户信息 */}
              <div className="px-3 py-2 border-b" style={{ borderColor: 'rgba(0, 0, 0, 0.1)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  {getUserDisplayName()}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.6 }}>
                  {user.email}
                </p>
              </div>

              {/* 菜单选项 */}
              <div className="py-2">
                <button
                  onClick={openSettings}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{ color: 'var(--color-text)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>个人设置</span>
                </button>

                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut || loading}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors text-red-600 disabled:opacity-50"
                  onMouseEnter={(e) => {
                    if (!isSigningOut && !loading) {
                      e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  {isSigningOut || loading ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  )}
                  <span>{isSigningOut || loading ? '正在退出...' : '退出登录'}</span>
                </button>
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

      {/* 用户设置模态框 */}
      <UserSettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  )
}