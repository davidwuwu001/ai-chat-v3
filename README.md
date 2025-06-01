# 🤖 AI聊天助手网站

一个基于Next.js 14开发的现代化AI聊天网站，灵感来自ChatGPT，采用顶级互联网公司的设计美学。

## ✨ 项目特色

### 🎨 设计风格
- **Apple风格简洁**：干净的布局和优雅的视觉效果
- **Google Material Design**：流畅的动画和现代化的交互
- **响应式设计**：完美适配手机、平板、桌面设备
- **多主题支持**：浅色、深色、紫色、绿色四种主题自由切换

### 🚀 核心功能
- **真实AI对话**：集成aihubmix.com API，支持真实的AI大模型对话
- **智能聊天界面**：流畅的对话体验，支持连续对话
- **实时打字效果**：模拟真实的AI回复过程
- **错误处理机制**：网络错误自动重试，用户体验友好
- **主题切换系统**：4种精美主题，本地存储用户偏好
- **美观的UI组件**：现代化的按钮、输入框、卡片等

### 🛠️ 技术栈
- **Next.js 14**：React框架，支持服务端渲染和API路由
- **TypeScript**：类型安全的JavaScript
- **Tailwind CSS v4**：快速构建美观界面
- **React 19**：最新版本的React
- **Context API**：状态管理（主题系统）

## 📱 界面设计说明

### 主页面布局
1. **顶部导航栏**：网站logo、主题切换按钮、清空对话按钮
2. **欢迎区域**：吸引人的标题和描述，示例问题卡片
3. **聊天区域**：消息展示和输入框
4. **错误提示栏**：API错误提示和重试功能

### 色彩方案
- **浅色主题**：现代蓝色系，干净清新
- **深色主题**：优雅的深灰和白色组合
- **紫色主题**：梦幻紫色系，优雅浪漫
- **绿色主题**：自然绿色系，清新舒适

## 🔧 环境配置

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
创建 `.env.local` 文件（在项目根目录），并添加以下配置：

```bash
# AI API 配置
AIHUBMIX_API_KEY=your_api_key_here
AIHUBMIX_API_URL=https://aihubmix.com/v1/chat/completions

# NextAuth 配置 (后续功能)
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# 数据库配置 (后续功能)
DATABASE_URL=file:./dev.db
```

**重要说明：**
- 将 `your_api_key_here` 替换为你的真实 aihubmix.com API 密钥
- 如果没有API密钥，聊天功能将显示演示消息

### 3. 启动开发服务器
```bash
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 🎯 开发计划

### ✅ 已完成功能
- [x] 项目初始化和配置
- [x] 主页面布局设计
- [x] 响应式导航栏
- [x] 聊天界面组件
- [x] 真实AI API集成
- [x] 多主题切换系统
- [x] 错误处理和重试机制

### 🚧 第二阶段：用户认证系统
- [ ] NextAuth.js集成
- [ ] 用户注册/登录界面
- [ ] 用户会话管理
- [ ] 聊天记录关联用户

### 🚧 第三阶段：数据持久化
- [ ] 数据库设计和配置
- [ ] 聊天记录保存
- [ ] 聊天历史查看
- [ ] 数据导出功能

### 🚧 第四阶段：高级特性
- [ ] 文件上传支持
- [ ] 图片对话功能
- [ ] 流式响应支持
- [ ] 聊天分享功能

### 🚧 第五阶段：性能优化
- [ ] 代码分割优化
- [ ] 图片懒加载
- [ ] 缓存机制
- [ ] PWA支持

## 📖 API接口说明

### 聊天接口
**端点：** `POST /api/chat`

**请求体：**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "你好"
    }
  ],
  "model": "gpt-3.5-turbo",
  "temperature": 0.7,
  "max_tokens": 2048
}
```

**响应：**
```json
{
  "message": "你好！我是AI助手，有什么可以帮助你的吗？",
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 15,
    "total_tokens": 25
  },
  "model": "gpt-3.5-turbo"
}
```

## 🎨 主题系统

### 使用方法
```typescript
import { useTheme } from '../lib/theme-context'

function MyComponent() {
  const { currentTheme, setTheme, availableThemes } = useTheme()
  
  return (
    <button onClick={() => setTheme('dark')}>
      切换到深色主题
    </button>
  )
}
```

### 可用主题
- `light` - 浅色主题
- `dark` - 深色主题  
- `purple` - 紫色主题
- `green` - 绿色主题

## 🚀 部署指南

### Vercel部署（推荐）
1. 将代码推送到GitHub
2. 在Vercel中导入项目
3. 配置环境变量
4. 部署完成

### 其他平台
- **Netlify**：支持，需要配置构建命令
- **自托管**：使用 `npm run build && npm start`

## 📝 开发说明
- 所有组件都有详细的中文注释
- 遵循React最佳实践和Next.js规范
- 使用TypeScript确保代码质量
- Tailwind CSS实现响应式设计
- 组件化开发，便于维护和扩展

## 🐛 故障排除

### 常见问题

1. **API调用失败**
   - 检查 `.env.local` 文件中的API密钥是否正确
   - 确认网络连接正常
   - 查看浏览器控制台的错误信息

2. **主题切换不生效**
   - 检查浏览器的localStorage是否启用
   - 清除浏览器缓存重试

3. **样式显示异常**
   - 确认Tailwind CSS正确安装
   - 重新启动开发服务器

### 获取帮助
- 查看浏览器开发者工具的控制台
- 检查网络请求状态
- 查看服务器日志

---

让我们一起创造一个令人惊艳的AI聊天体验！🎉

## 📄 许可证
MIT License - 自由使用和修改

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 🚀 部署到 Vercel

### 环境变量配置

在 Vercel 部署前，需要在 Vercel Dashboard 中配置以下环境变量：

#### 1. 登录 Vercel Dashboard
- 访问 https://vercel.com/dashboard
- 找到你的项目并点击进入

#### 2. 配置环境变量
进入项目 Settings → Environment Variables，添加以下变量：

```bash
# Supabase 数据库配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI API 配置
AIHUBMIX_API_KEY=your_aihubmix_api_key
```

#### 3. 获取 Supabase 配置
1. 访问 https://supabase.com/dashboard
2. 选择你的项目
3. 在 Settings → API 中找到：
   - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
   - anon public key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)

#### 4. 获取 AI API 密钥
1. 访问 https://aihubmix.com
2. 注册/登录账户
3. 在 API 设置中获取你的 API 密钥 (`AIHUBMIX_API_KEY`)

#### 5. 重新部署
配置完环境变量后，在 Vercel Dashboard 中触发重新部署：
- 点击 "Deployments" 选项卡
- 点击最新部署旁的 "..." 按钮
- 选择 "Redeploy"

### 本地开发环境变量

创建 `.env.local` 文件（不要提交到 Git）：

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
AIHUBMIX_API_KEY=your_aihubmix_api_key
```

### 常见部署问题

#### 问题：`supabaseUrl is required`
**解决方案**：确保在 Vercel 中正确配置了 `NEXT_PUBLIC_SUPABASE_URL` 环境变量

#### 问题：API 请求失败
**解决方案**：检查 `AIHUBMIX_API_KEY` 是否正确配置

#### 问题：认证不工作
**解决方案**：确认 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 配置正确

### 部署成功后
- 访问你的 Vercel 域名
- 注册一个新账户测试功能
- 检查 AI 对话是否正常工作

---

## 📞 技术支持

如果遇到问题，请检查：
1. 环境变量是否正确配置
2. Supabase 项目是否正常运行
3. AI API 额度是否充足
4. 查看 Vercel 构建日志获取详细错误信息
