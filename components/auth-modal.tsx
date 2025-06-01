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
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingText, setLoadingText] = useState('')

  const { signUp, signIn, resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    setLoadingProgress(0)

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setError('两次输入的密码不一致')
          return
        }

        if (username.length < 2 || username.length > 20) {
          setError('用户名长度必须在2-20个字符之间')
          return
        }

        setLoadingText('正在创建账户...')
        setLoadingProgress(30)
        
        const { error } = await signUp(email, password, username)
        
        setLoadingProgress(80)
        
        if (error) {
          if (error.message.includes('User already registered')) {
            setError('该邮箱已被注册，请尝试登录或使用其他邮箱')
          } else if (error.message.includes('Password should be at least')) {
            setError('密码至少需要6位字符')
          } else if (error.message.includes('timeout') || error.message.includes('network')) {
            setError('网络连接超时，请检查网络后重试。如果问题持续，可能是服务器响应较慢。')
          } else {
            setError(error.message || '注册失败')
          }
        } else {
          setLoadingProgress(100)
          setMessage('注册成功！请检查邮箱中的验证链接（可能在垃圾邮件中）')
          setTimeout(() => {
            onClose()
          }, 2000)
        }
      } else {
        setLoadingText('正在验证身份...')
        setLoadingProgress(20)
        
        const progressInterval = setInterval(() => {
          setLoadingProgress(prev => {
            if (prev < 70) return prev + 10
            return prev
          })
        }, 1000)

        const startTime = Date.now()
        const { error } = await signIn(email, password)
        const endTime = Date.now()
        const duration = endTime - startTime
        
        clearInterval(progressInterval)
        setLoadingProgress(90)
        
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('邮箱或密码错误，请检查后重试')
          } else if (error.message.includes('timeout') || error.message.includes('network')) {
            setError(`网络连接超时（${Math.round(duration/1000)}秒）。这可能是因为：\n1. 网络连接较慢\n2. 服务器地域较远\n3. 防火墙阻止连接\n\n请稍后重试或检查网络设置。`)
          } else if (error.message.includes('Too many requests')) {
            setError('请求过于频繁，请稍后再试')
          } else {
            setError(error.message || '登录失败')
          }
        } else {
          setLoadingProgress(100)
          setLoadingText('登录成功！')
          setTimeout(() => {
            onClose()
          }, 500)
        }
      }
    } catch (err: any) {
      console.error('认证错误:', err)
      if (err.message.includes('timeout')) {
        setError('请求超时，服务器响应较慢。请检查网络连接并重试。')
      } else {
        setError('网络错误，请检查网络连接后重试')
      }
    } finally {
      setLoading(false)
      setLoadingProgress(0)
      setLoadingText('')
    }
  }

  const handleResetPassword = async () => {
    if (!email) {
      setError('请先输入邮箱地址')
      return
    }

    setLoading(true)
    setLoadingText('正在发送重置链接...')
    
    try {
      const { error } = await resetPassword(email)
      
      if (error) {
        if (error.message.includes('timeout') || error.message.includes('network')) {
          setError('网络连接超时，请稍后重试')
        } else {
          setError(error.message || '重置密码失败')
        }
      } else {
        setMessage('重置密码链接已发送到您的邮箱，请检查收件箱（可能在垃圾邮件中）')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
      setLoadingText('')
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
          disabled={loading}
          className="absolute top-4 right-4 p-2 rounded-lg transition-colors disabled:opacity-30"
          style={{ color: 'var(--color-text)', opacity: 0.7 }}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => !loading && (e.currentTarget.style.opacity = '0.7')}
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
            <p className="text-sm text-red-600 whitespace-pre-line">{error}</p>
          </div>
        )}
        {message && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200">
            <p className="text-sm text-green-600">{message}</p>
          </div>
        )}

        {/* 加载进度条 */}
        {loading && (
          <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center space-x-3">
              <svg className="w-4 h-4 animate-spin text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-blue-600 mb-1">{loadingText}</p>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${loadingProgress}%` }}
                  />
                </div>
              </div>
            </div>
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