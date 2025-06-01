'use client'

import { useState, useRef, useEffect } from 'react'
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
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)
  const [canCancel, setCanCancel] = useState(false)
  const [networkStatus, setNetworkStatus] = useState<'checking' | 'good' | 'slow' | 'poor'>('good')
  const abortControllerRef = useRef<AbortController | null>(null)

  const { signUp, signIn, resetPassword } = useAuth()

  useEffect(() => {
    const checkNetworkSpeed = async () => {
      if (!loading) return
      
      const start = Date.now()
      try {
        await fetch('https://httpbin.org/delay/1', { method: 'HEAD' })
        const duration = Date.now() - start
        
        if (duration < 2000) setNetworkStatus('good')
        else if (duration < 5000) setNetworkStatus('slow')
        else setNetworkStatus('poor')
      } catch {
        setNetworkStatus('poor')
      }
    }

    if (loading) {
      setNetworkStatus('checking')
      checkNetworkSpeed()
    }
  }, [loading])

  const cleanup = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      setTimeoutId(null)
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setCanCancel(false)
    setLoadingProgress(0)
    setLoadingText('')
    setNetworkStatus('good')
  }

  const handleCancel = () => {
    cleanup()
    setLoading(false)
    setError('操作已取消')
  }

  const createSmartTimeout = (operation: string, baseTimeout: number = 20000) => {
    const timeout = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      setError(`${operation}超时。\n\n可能的原因：\n• 网络连接较慢\n• 服务器响应延迟\n• 防火墙阻止连接\n\n建议：\n• 检查网络连接\n• 稍后重试\n• 尝试切换网络环境`)
      setLoading(false)
      cleanup()
    }, baseTimeout)
    
    setTimeoutId(timeout)
    return timeout
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    setLoadingProgress(0)
    setCanCancel(true)

    abortControllerRef.current = new AbortController()

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
        setLoadingProgress(20)
        
        createSmartTimeout('注册', 25000)

        const { error } = await signUp(email, password, username)
        
        setLoadingProgress(80)
        
        if (error) {
          if (error.message.includes('User already registered')) {
            setError('该邮箱已被注册，请尝试登录或使用其他邮箱')
          } else if (error.message.includes('Password should be at least')) {
            setError('密码至少需要6位字符')
          } else if (error.message.includes('timeout') || error.message.includes('network') || error.message.includes('AbortError')) {
            setError('网络连接超时。\n\n解决建议：\n• 检查网络连接\n• 尝试关闭VPN后重试\n• 稍后重新尝试\n• 确保防火墙允许连接')
          } else {
            setError(error.message || '注册失败')
          }
        } else {
          setLoadingProgress(100)
          setLoadingText('注册成功！')
          setMessage('注册成功！请检查邮箱中的验证链接（可能在垃圾邮件中）')
          setTimeout(() => {
            onClose()
          }, 2000)
        }
      } else {
        setLoadingText('正在连接服务器...')
        setLoadingProgress(10)
        
        const progressInterval = setInterval(() => {
          setLoadingProgress(prev => {
            if (prev < 60) return prev + 8
            return prev
          })
        }, 1000)

        createSmartTimeout('登录', 30000)

        const startTime = Date.now()
        setLoadingText('正在验证身份...')
        
        const { error } = await signIn(email, password)
        const endTime = Date.now()
        const duration = endTime - startTime
        
        clearInterval(progressInterval)
        setLoadingProgress(90)
        
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('邮箱或密码错误，请检查后重试')
          } else if (error.message.includes('timeout') || error.message.includes('network') || error.message.includes('AbortError')) {
            setError(`登录超时（用时${Math.round(duration/1000)}秒）\n\n可能的原因：\n• 网络连接较慢\n• Supabase服务器地域较远\n• 防火墙或网络限制\n\n解决方案：\n• 检查网络连接\n• 尝试关闭VPN\n• 清除浏览器缓存\n• 稍后重试`)
          } else if (error.message.includes('Too many requests')) {
            setError('请求过于频繁，请稍后再试（建议等待1-2分钟）')
          } else if (error.message.includes('AuthSessionMissingError')) {
            setError('会话错误，请刷新页面后重试')
          } else {
            setError(`登录失败：${error.message}\n\n如果问题持续，请尝试：\n• 刷新页面\n• 清除浏览器缓存\n• 检查网络设置`)
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
      if (err.name === 'AbortError') {
        setError('操作被取消')
      } else if (err.message.includes('timeout')) {
        setError('请求超时，服务器响应较慢。\n\n建议：\n• 检查网络连接\n• 稍后重试\n• 尝试切换网络环境')
      } else {
        setError(`网络错误：${err.message}\n\n请检查网络连接后重试`)
      }
    } finally {
      setLoading(false)
      cleanup()
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

        {loading && (
          <div className="mb-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 animate-spin text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-blue-600 font-medium">{loadingText}</p>
                  {canCancel && (
                    <button
                      onClick={handleCancel}
                      className="text-xs text-blue-500 hover:text-blue-700 underline"
                    >
                      取消
                    </button>
                  )}
                </div>
                
                {/* 进度条 */}
                <div className="w-full bg-blue-200 rounded-full h-2.5 mb-3">
                  <div 
                    className="bg-blue-500 h-2.5 rounded-full transition-all duration-500 relative overflow-hidden"
                    style={{ width: `${loadingProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
                  </div>
                </div>
                
                {/* 网络状态指示器 */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      networkStatus === 'good' ? 'bg-green-500' :
                      networkStatus === 'slow' ? 'bg-yellow-500' :
                      networkStatus === 'poor' ? 'bg-red-500' :
                      'bg-gray-400 animate-pulse'
                    }`}></div>
                    <span className="text-gray-600">
                      网络: {
                        networkStatus === 'checking' ? '检测中...' :
                        networkStatus === 'good' ? '良好' :
                        networkStatus === 'slow' ? '较慢' :
                        networkStatus === 'poor' ? '不稳定' : '未知'
                      }
                    </span>
                  </div>
                  <span className="text-gray-500">{loadingProgress}%</span>
                </div>
                
                {/* 耐心提示 */}
                {loadingProgress > 30 && networkStatus === 'slow' && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                    💡 网络较慢，请耐心等待。首次登录可能需要更长时间。
                  </div>
                )}
                
                {loadingProgress > 50 && networkStatus === 'poor' && (
                  <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
                    ⚠️ 网络不稳定，建议检查网络连接或稍后重试。
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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