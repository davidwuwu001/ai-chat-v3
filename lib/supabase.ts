import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 创建Supabase客户端，优化网络配置
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // 优化认证配置
    flowType: 'pkce', // 使用更安全的认证流程
    debug: false // 生产环境关闭调试
  },
  global: {
    headers: {
      'x-my-custom-header': 'chat-app',
    },
  },
  // 添加网络超时配置
  realtime: {
    params: {
      eventsPerSecond: 10, // 限制事件频率
    },
    timeout: 10000, // 10秒超时
  },
})

// 添加重试机制的辅助函数
async function withRetry<T>(
  operation: () => Promise<T>, 
  maxRetries: number = 3, 
  delay: number = 1000
): Promise<T> {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      console.warn(`操作失败，尝试第 ${attempt} 次，共 ${maxRetries} 次:`, error)
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    }
  }
  
  throw lastError
}

// 认证相关的辅助函数
export const auth = {
  // 注册用户（支持用户名）
  async signUp(email: string, password: string, username?: string) {
    return withRetry(async () => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username || email.split('@')[0], // 如果没有用户名，使用邮箱前缀
            avatar_url: null, // 初始头像为空
            full_name: username || email.split('@')[0]
          }
        }
      })
      
      if (error) throw error
      return { data, error: null }
    }, 2, 2000) // 最多重试2次，延迟2秒
  },

  // 登录用户（添加重试机制）
  async signIn(email: string, password: string) {
    return withRetry(async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15秒超时
      
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        clearTimeout(timeoutId)
        
        if (error) {
          if (error.message.includes('timeout') || error.message.includes('network')) {
            throw new Error('网络连接超时，请检查网络后重试')
          }
          throw error
        }
        
        return { data, error: null }
      } catch (err: any) {
        clearTimeout(timeoutId)
        if (err.name === 'AbortError') {
          throw new Error('登录请求超时，请检查网络连接')
        }
        throw err
      }
    }, 3, 3000) // 最多重试3次，延迟3秒
  },

  // 登出用户
  async signOut() {
    return withRetry(async () => {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    }, 2, 1000)
  },

  // 获取当前用户
  async getCurrentUser() {
    return withRetry(async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return { user, error: null }
    }, 2, 1000)
  },

  // 更新用户资料
  async updateProfile(updates: { username?: string; avatar_url?: string; full_name?: string }) {
    return withRetry(async () => {
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      })
      if (error) throw error
      return { data, error: null }
    }, 2, 2000)
  },

  // 重置密码
  async resetPassword(email: string) {
    return withRetry(async () => {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) throw error
      return { data, error: null }
    }, 2, 2000)
  },

  // 监听认证状态变化
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// 数据库操作
export const database = {
  // 保存聊天记录
  async saveChatMessage(userId: string, message: any) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([
        {
          user_id: userId,
          message_text: message.text,
          is_user: message.isUser,
          model: message.model,
          timestamp: message.timestamp.toISOString(),
        }
      ])
    return { data, error }
  },

  // 获取用户聊天记录
  async getChatMessages(userId: string) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: true })
    return { data, error }
  },

  // 删除聊天记录
  async deleteChatMessages(userId: string) {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', userId)
    return { error }
  }
} 