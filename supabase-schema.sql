-- 创建聊天消息表
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message_text TEXT NOT NULL,
  is_user BOOLEAN NOT NULL,
  model VARCHAR(100),
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);

-- 启用行级安全性 (RLS)
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能查看和操作自己的聊天记录
CREATE POLICY "Users can view own chat messages" ON chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat messages" ON chat_messages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages" ON chat_messages
  FOR DELETE USING (auth.uid() = user_id);

-- 创建触发器自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chat_messages_updated_at 
  BEFORE UPDATE ON chat_messages 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 