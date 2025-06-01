'use client'

import { useState, useRef } from 'react'
import { useAuth } from '../lib/auth-context'

interface UserSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UserSettingsModal({ isOpen, onClose }: UserSettingsModalProps) {
  const { user, updateProfile } = useAuth()
  const [username, setUsername] = useState(user?.user_metadata?.username || user?.user_metadata?.full_name || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    // 验证用户名
    if (!username.trim()) {
      setError('用户名不能为空')
      setLoading(false)
      return
    }

    if (username.trim().length < 2) {
      setError('用户名至少需要2个字符')
      setLoading(false)
      return
    }

    try {
      const { error } = await updateProfile({
        username: username.trim(),
        full_name: username.trim(),
        avatar_url: avatarUrl
      })

      if (error) {
        setError(error.message || '更新失败')
      } else {
        setMessage('个人资料更新成功！')
        setTimeout(() => {
          onClose()
        }, 1500)
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 检查文件大小（限制为2MB）
      if (file.size > 2 * 1024 * 1024) {
        setError('头像文件大小不能超过2MB')
        return
      }

      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        setError('请选择图片文件')
        return
      }

      // 创建预览URL
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setAvatarUrl(result)
      }
      reader.readAsDataURL(file)
    }
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

  const getUserDisplayName = () => {
    return user?.user_metadata?.username || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  }

  const getUserInitials = () => {
    const name = getUserDisplayName()
    return name.charAt(0).toUpperCase()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-8">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto relative" style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid rgba(0, 0, 0, 0.1)'
      }}>
        <div className="p-6">
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-lg transition-colors z-10"
            style={{ color: 'var(--color-text)', opacity: 0.7 }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* 标题 - 简化布局 */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
              个人设置
            </h2>
            <p className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.7 }}>
              更新您的个人资料信息
            </p>
          </div>

          {/* 错误/成功消息 */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          {message && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200">
              <p className="text-sm text-green-600">{message}</p>
            </div>
          )}

          {/* 表单 - 调整间距 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 头像设置 - 优先显示区域 */}
            <div className="text-center">
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--color-text)' }}>
                头像
              </label>
              <div className="relative inline-block mb-3">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="用户头像"
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg"
                    style={{ backgroundColor: generateColorAvatar(getUserDisplayName()) }}
                  >
                    {getUserInitials()}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg z-10"
                  title="上传头像"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <p className="text-xs mb-2" style={{ color: 'var(--color-text)', opacity: 0.6 }}>
                点击图标上传头像，支持 JPG、PNG 格式，大小不超过 2MB
              </p>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  移除头像
                </button>
              )}
            </div>

            {/* 用户名设置 */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                用户名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                style={{
                  backgroundColor: 'var(--color-background)',
                  borderColor: 'rgba(0, 0, 0, 0.2)',
                  color: 'var(--color-text)'
                }}
                placeholder="请输入用户名（至少2个字符）"
                required
                minLength={2}
                maxLength={20}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--color-text)', opacity: 0.6 }}>
                用户名将在聊天界面中显示
              </p>
            </div>

            {/* 邮箱显示（只读） */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                邮箱地址
              </label>
              <input
                type="email"
                value={user?.email || ''}
                className="w-full px-4 py-3 border rounded-lg bg-gray-50 cursor-not-allowed"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  borderColor: 'rgba(0, 0, 0, 0.1)',
                  color: 'var(--color-text)',
                  opacity: 0.7
                }}
                disabled
                readOnly
              />
              <p className="text-xs mt-1" style={{ color: 'var(--color-text)', opacity: 0.6 }}>
                邮箱地址不可修改
              </p>
            </div>

            {/* 按钮 */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border rounded-lg font-medium transition-colors"
                style={{
                  borderColor: 'rgba(0, 0, 0, 0.2)',
                  color: 'var(--color-text)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>保存中...</span>
                  </div>
                ) : (
                  '保存设置'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 