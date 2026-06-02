# 嗨起来

朋友圈赛事竞猜 Web App。技术栈为 Next.js、PostgreSQL、Prisma 和 Docker。

## Getting Started

本地开发：

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

## Docker 部署

准备 `.env`：

```bash
cp .env.example .env
```

至少配置：

```env
API_FOOTBALL_KEY=你的 RapidAPI Key
JWT_SECRET=生产环境随机长字符串
CRON_SECRET=生产环境随机长字符串
```

启动：

```bash
docker compose up -d --build
```

如果本机 3000 端口被占用：

```bash
APP_PORT=3001 docker compose up -d --build
```

`migrate` 服务会在 app 启动前自动执行 `prisma db push` 和 `npm run db:seed`。默认管理员账号来自 `.env`：

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123456
ADMIN_NICKNAME=管理员
```

## Verification

```bash
npm run lint
npm run build
docker compose build
```
