# 🌟 星豆 StarBean — AI 明星合照卡牌平台

## 项目简介

星豆是一个 **AI 驱动的明星合照卡牌收集平台**。用户可以关注喜欢的明星、抽取卡牌、上传自己的照片并通过 AI 生成与明星的合照卡牌。

核心玩法：**抽卡 → 上传照片 → AI 生成合照 → 收藏卡牌**

---

## 技术架构

```
┌────────────────────────────────────────────────────────┐
│                     前端 (Frontend)                      │
│         React 19 + TypeScript + Vite + TailwindCSS       │
│                  Zustand 状态管理 + SPA 路由               │
├────────────────────────────────────────────────────────┤
│                        ↕ HTTP API                       │
├────────────────────────────────────────────────────────┤
│                     后端 (Backend)                       │
│              Python FastAPI + Uvicorn                    │
│     ┌──────────┬──────────────┬──────────────┐          │
│     │ API 层    │  Service 层   │ Repository 层 │         │
│     │ 请求解析   │  业务逻辑     │  数据访问      │         │
│     └──────────┴──────────────┴──────────────┘          │
│                        ↕                                │
│              JSON 文件存储 (data/*.json)                  │
│                        ↕                                │
│            Google Gemini API (AI 生图)                    │
└────────────────────────────────────────────────────────┘
```

---

## 目录结构

```
starbean-app/
├── src/                          # 前端源码
│   ├── App.tsx                   # 路由配置
│   ├── main.tsx                  # 入口
│   ├── store/useStore.ts         # Zustand 全局状态管理
│   ├── services/api.ts           # 后端 API 封装
│   ├── pages/                    # 页面组件
│   │   ├── Home.tsx              #   首页（明星推荐 + 模板浏览）
│   │   ├── Auth.tsx              #   登录/注册
│   │   ├── Gacha.tsx             #   抽卡页（动画 + 等级揭示 + 合照生成）
│   │   ├── Collection.tsx        #   卡包（卡牌管理 + 合照生成）
│   │   ├── Profile.tsx           #   个人中心
│   │   ├── ArtistSpace.tsx       #   明星空间
│   │   ├── TemplateDetails.tsx   #   模板详情
│   │   ├── Community.tsx         #   社区
│   │   ├── AvatarGenerate.tsx    #   数字形象生成
│   │   └── admin/                #   管理后台
│   └── components/               # 公共组件（导航栏等）
│
├── backend/                      # 后端源码
│   ├── main.py                   # FastAPI 入口 + CORS + 静态文件
│   ├── config.py                 # 配置（JWT 密钥等）
│   ├── .env                      # 环境变量（GEMINI_API_KEY）
│   ├── requirements.txt          # Python 依赖
│   ├── api/                      # API 层（请求解析 + 响应封装）
│   │   ├── auth_api.py           #   认证（登录/注册）
│   │   ├── user_api.py           #   用户（头像/形象）
│   │   ├── gacha_api.py          #   抽卡（抽卡/生成合照）
│   │   ├── artist_api.py         #   明星（关注/模板）
│   │   ├── community_api.py      #   社区（帖子）
│   │   └── admin_api.py          #   管理后台
│   ├── service/                  # 业务逻辑层
│   │   ├── auth_service.py       #   认证（JWT + bcrypt）
│   │   ├── gacha_service.py      #   抽卡（概率 + 保底 + 默认 prompt）
│   │   ├── seedream_service.py   #   AI 生图（Gemini API 调用）
│   │   ├── user_service.py       #   用户管理
│   │   └── community_service.py  #   社区管理
│   ├── repository/               # 数据访问层
│   │   ├── user_repo.py          #   用户数据
│   │   ├── card_repo.py          #   卡牌数据
│   │   ├── artist_repo.py        #   明星/模板数据
│   │   └── community_repo.py     #   社区数据
│   ├── data/                     # JSON 文件数据存储
│   │   ├── users.json            #   用户数据
│   │   ├── cards.json            #   卡牌数据
│   │   ├── templates.json        #   模板配置（含 prompt）
│   │   ├── artists.json          #   明星数据
│   │   └── community_posts.json  #   社区帖子
│   └── uploads/                  # 上传文件（头像/合照）
│
├── package.json                  # 前端依赖
├── vite.config.ts                # Vite 构建配置
├── render.yaml                   # Render 部署配置
├── Dockerfile.backend            # 后端 Docker 镜像
├── Dockerfile.frontend           # 前端 Docker 镜像
└── docker-compose.yml            # Docker Compose 编排
```

---

## 核心功能模块

### 1. 抽卡系统 (`gacha_service.py`)
- **概率配置**：N(70%) / R(20%) / SR(8%) / SSR(2%)
- **保底机制**：连续 50 抽未出 SSR 则必出
- **十连保底**：至少一张 R 及以上
- **默认 Prompt**：N/R/SR/SSR 各有专属的 AI 生图 prompt

### 2. AI 合照生成 (`seedream_service.py`)
- **模型**：`gemini-3.1-flash-image-preview`（Google Nano Banana 2）
- **图片顺序**：用户照片 = 图片1，明星参考图 = 图片2
- **调用方式**：`types.Part.from_bytes()` 传入压缩后的图片
- **生成图片**：返回 base64 data URI，直接存入卡牌数据

### 3. 认证系统 (`auth_service.py`)
- **密码**：bcrypt 加密存储
- **令牌**：JWT（PyJWT），过期时间 30 天
- **前端**：Zustand persist 持久化 token 到 localStorage

### 4. 前端状态管理 (`useStore.ts`)
- **Zustand + persist**：token 和精简用户数据持久化
- **partialize**：排除 collection（含大量 base64 图片），避免 localStorage 溢出
- **卡牌数据**：每次从 API 获取，不缓存到 localStorage

---

## 环境变量

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `GEMINI_API_KEY` | Google Gemini API 密钥 | ✅ |
| `JWT_SECRET` | JWT 签名密钥（默认内置） | 可选 |

---

## 本地开发

### 前置要求
- **Node.js** ≥ 18
- **Python** ≥ 3.10
- **Google Gemini API Key**（在 [Google AI Studio](https://aistudio.google.com/) 获取）

### 1. 启动后端
```bash
cd backend
pip install -r requirements.txt

# 配置 API Key
echo "GEMINI_API_KEY=你的密钥" > .env

# 启动（开发模式，自动重载）
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. 启动前端
```bash
# 在项目根目录
npm install
npm run dev
```

### 3. 访问
- 前端：`http://localhost:3000`
- 后端 API：`http://localhost:8000/api/`

---

## 生产部署

### 方式一：Render（当前使用）
项目已配置 `render.yaml`，直接在 Render 创建：
- **Backend**：Python Web Service，根目录 `backend`，启动命令 `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Frontend**：Static Site，构建命令 `npm run build`，发布目录 `dist`
- **环境变量**：在 Render Dashboard 设置 `GEMINI_API_KEY`

### 方式二：Docker
```bash
docker-compose up --build
```

### 方式三：打包分享
```bash
# 在项目根目录执行（排除 node_modules 等大文件）
# Windows PowerShell:
Compress-Archive -Path backend, src, public, package.json, package-lock.json, tsconfig.json, vite.config.ts, index.html, render.yaml, docker-compose.yml, Dockerfile.backend, Dockerfile.frontend, .env.example, README.md -DestinationPath starbean-app.zip

# 或使用 git archive（推荐，自动排除 .gitignore 文件）:
git archive --format=zip --output=starbean-app.zip HEAD
```

---

## 前端是否需要 VPN？

**本地开发**：❌ 不需要 VPN。前端是纯静态页面，在本地运行。

**生产环境取决于部署位置**：
| 部署位置 | 是否需要 VPN |
|---------|-------------|
| Render/Vercel（海外） | ✅ 中国大陆需要 VPN 访问 |
| 国内云（阿里云/腾讯云） | ❌ 不需要 |
| 本地局域网 | ❌ 不需要 |

**建议**：如需中国大陆直接访问，将前端部署到国内云服务器（如阿里云 OSS + CDN），后端同样部署到国内云（需要域名备案）。

**注意**：即使前端部署在国内，后端调用 Google Gemini API 仍然需要服务器能访问 Google（海外服务器或配置代理）。

---

## API 接口一览

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| GET | `/api/users/{id}` | 获取用户信息 |
| POST | `/api/users/{id}/avatar` | 上传头像 |
| POST | `/api/users/{id}/generate-avatar` | 生成 AI 形象 |
| POST | `/api/gacha/draw` | 抽卡 |
| POST | `/api/gacha/generate-image` | 生成合照 |
| GET | `/api/cards/user/{id}` | 获取用户卡牌 |
| GET | `/api/artists` | 获取明星列表 |
| GET | `/api/artists/{name}` | 获取明星详情 |
| GET | `/api/templates` | 获取模板列表 |
| GET | `/api/templates/{id}` | 获取模板详情 |
| POST | `/api/users/{id}/follow` | 关注明星 |
| GET | `/api/community/posts` | 获取社区帖子 |
| POST | `/api/community/posts` | 发布帖子 |

---

## 最近更新日志

### 2026-03-09
- ✅ 移除虚拟形象生成模式，只保留照片合拍
- ✅ 确保图片顺序：用户照片=图1，明星参考=图2
- ✅ 统一 N/R/SR/SSR 默认 prompt
- ✅ 切换 AI 模型为 `gemini-3.1-flash-image-preview`
- ✅ 按 Google 官方示例重写 API 调用
- ✅ 修复 localStorage 配额溢出（partialize）
- ✅ 抽卡动画优化（灰色悬念 → 彩色等级揭示）
- ✅ 图片存为 base64 data URI 解决临时磁盘丢失
