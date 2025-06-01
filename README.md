# AI 智能聊天平台

这是一个现代化的 AI 聊天应用，支持多种 AI 模型对话。

## 功能特性

- 🤖 支持多种 AI 模型（GPT、Claude、Gemini等）
- 💬 实时流式对话体验
- 🔐 用户认证和会话管理
- 📱 响应式设计，支持移动端
- 🎨 现代化 UI 界面
- 📋 消息复制功能
- 📄 Word文档导出功能

## 技术栈

- **前端框架**: Next.js 15
- **样式**: Tailwind CSS
- **认证**: Supabase Auth
- **数据库**: Supabase
- **部署**: Vercel
- **开发语言**: TypeScript

## 本地开发

1. 克隆项目
```bash
git clone https://github.com/davidwuwu001/test.git
cd test
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
创建 `.env.local` 文件并添加以下配置：
```env
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI API配置
AI_API_URL=your_ai_api_url
AI_API_KEY=your_ai_api_key
```

4. 启动开发服务器
```bash
npm run dev
```

5. 打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 项目结构

```
test/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx          # 主页面
├── components/            # React 组件
│   ├── auth-modal.tsx     # 认证模态框
│   ├── chat-interface.tsx # 聊天界面
│   └── message-actions.tsx # 消息操作组件
├── lib/                   # 工具库
│   ├── auth-context.tsx   # 认证上下文
│   └── supabase.ts       # Supabase 客户端
├── public/               # 静态资源
└── types/                # TypeScript 类型定义
```

## 部署指南

### Vercel 部署

1. **连接 GitHub**
   - 在 Vercel 控制台创建新项目
   - 连接到此 GitHub 仓库

2. **配置环境变量**
   在 Vercel 项目设置中添加以下环境变量：
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   AI_API_URL
   AI_API_KEY
   ```

3. **自定义域名**（可选）
   - 在 Vercel 项目设置中添加自定义域名
   - 配置 DNS 记录指向 Vercel

### 环境变量说明

| 变量名 | 描述 | 是否必需 |
|--------|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | ✅ |
| `AI_API_URL` | AI API 服务地址 | ✅ |
| `AI_API_KEY` | AI API 密钥 | ✅ |

## 故障排除

### 常见问题

1. **登录缓慢或超时**
   - 检查网络连接
   - 验证 Supabase 配置是否正确
   - 查看浏览器开发者工具的网络面板

2. **AI 对话无响应**
   - 检查 AI API 配置
   - 验证 API 密钥是否有效
   - 确认 API 额度是否充足

3. **部署失败**
   - 检查环境变量配置
   - 查看 Vercel 构建日志
   - 确认所有依赖都已正确安装

### 调试步骤

1. 检查环境变量是否正确配置
2. 验证 Supabase 连接状态
3. AI API 额度是否充足
4. 查看 Vercel 构建日志获取详细错误信息

## 部署状态
- 最后更新：2025-06-01 强制重新部署修复Vercel缓存问题