import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// 认证相关的辅助函数
export const auth = {
  // 注册用户（支持用户名）
  async signUp(email: string, password: string, username?: string) {
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
    return { data, error }
  },

  // 登录用户
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  // 登出用户
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // 获取当前用户
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  // 更新用户资料
  async updateProfile(updates: { username?: string; avatar_url?: string; full_name?: string }) {
    const { data, error } = await supabase.auth.updateUser({
      data: updates
    })
    return { data, error }
  },

  // 重置密码
  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    return { data, error }
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