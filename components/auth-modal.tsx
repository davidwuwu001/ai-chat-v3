'use client'

import { useState } from 'react'
import { useAuth } from '../lib/auth-context'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const { signIn, signUp, resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    // 表单验证
    if (!email || !password) {
      setError('请填写所有必填字段')
      setLoading(false)
      return
    }

    if (isSignUp && !username.trim()) {
      setError('请输入用户名')
      setLoading(false)
      return
    }

    if (isSignUp && password !== confirmPassword) {
      setError('两次输入的密码不一致')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('密码至少需要6个字符')
      setLoading(false)
      return
    }

    // 用户名长度验证
    if (isSignUp && username.trim().length < 2) {
      setError('用户名至少需要2个字符')
      setLoading(false)
      return
    }

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, username.trim())
        if (error) {
          if (error.message.includes('already registered')) {
            setError('该邮箱已经注册，请直接登录')
          } else {
            setError(error.message || '注册失败')
          }
        } else {
          setMessage('注册成功！请检查邮箱中的确认链接')
          // 清空表单
          setEmail('')
          setPassword('')
          setConfirmPassword('')
          setUsername('')
        }
      } else {
        const { error } = await signIn(email, password)
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('邮箱或密码错误')
          } else {
            setError(error.message || '登录失败')
          }
        } else {
          onClose() // 登录成功后关闭模态框
        }
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!email) {
      setError('请先输入邮箱地址')
      return
    }

    setLoading(true)
    const { error } = await resetPassword(email)
    setLoading(false)

    if (error) {
      setError(error.message || '重置密码失败')
    } else {
      setMessage('重置密码链接已发送到您的邮箱')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 relative" style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid rgba(0, 0, 0, 0.1)'
      }}>
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg transition-colors"
          style={{ color: 'var(--color-text)', opacity: 0.7 }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            {isSignUp ? '创建账户' : '欢迎回来'}
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-text)', opacity: 0.7 }}>
            {isSignUp ? '注册您的AI助手账户' : '登录您的AI助手账户'}
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

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 注册时显示用户名字段 */}
          {isSignUp && (
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
                用户名将作为您的显示名称，可以在设置中修改
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
              邮箱地址
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
              style={{
                backgroundColor: 'var(--color-background)',
                borderColor: 'rgba(0, 0, 0, 0.2)',
                color: 'var(--color-text)'
              }}
              placeholder="请输入邮箱地址"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
              style={{
                backgroundColor: 'var(--color-background)',
                borderColor: 'rgba(0, 0, 0, 0.2)',
                color: 'var(--color-text)'
              }}
              placeholder="请输入密码（至少6位）"
              required
              minLength={6}
            />
          </div>

          {isSignUp && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                确认密码
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                style={{
                  backgroundColor: 'var(--color-background)',
                  borderColor: 'rgba(0, 0, 0, 0.2)',
                  color: 'var(--color-text)'
                }}
                placeholder="请再次输入密码"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all duration-200"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{isSignUp ? '注册中...' : '登录中...'}</span>
              </div>
            ) : (
              isSignUp ? '创建账户' : '立即登录'
            )}
          </button>
        </form>

        {/* 底部链接 */}
        <div className="mt-6 text-center space-y-3">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError(null)
              setMessage(null)
              setUsername('')
            }}
            className="text-sm transition-colors"
            style={{ color: 'var(--color-primary)' }}
          >
            {isSignUp ? '已有账户？立即登录' : '没有账户？免费注册'}
          </button>

          {!isSignUp && (
            <div>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={loading}
                className="text-sm transition-colors"
                style={{ color: 'var(--color-text)', opacity: 0.7 }}
              >
                忘记密码？
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 