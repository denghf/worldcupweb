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

## 数据脚本

`scripts/` 目录提供两个辅助脚本，用于从 500.com 抓取竞彩数据并导入系统。

### 依赖

```bash
pip install requests beautifulsoup4
```

### `scripts/fetch_500.py` — 抓取 500.com 数据

抓取指定日期的赛事和赔率，生成 `/json/YYYYMMDD.json`。

```bash
# 抓取 2026-06-03 的数据（默认输出到 json/20260603.json）
python3 scripts/fetch_500.py 2026-06-03

# 指定输出路径
python3 scripts/fetch_500.py 2026-06-03 --out json/0603.json
```

支持抓取的玩法：胜平负、让球胜平负、总进球、半全场、猜比分。

### `scripts/import_json.py` — 校验并上传

校验 `/json/*.json` 格式，并调用 `/api/admin/import/local` 批量导入。

```bash
# 校验并上传所有 json 文件到 tournamentId=1
python3 scripts/import_json.py --tournament-id 1

# 只上传指定文件
python3 scripts/import_json.py --tournament-id 1 --file json/0603.json

# 指定远程地址或手动传入 admin token
python3 scripts/import_json.py --tournament-id 1 \
  --base-url http://localhost:3000 \
  --token <jwt>
```

校验规则：
- JSON 根必须是数组
- 每场比赛必须包含 `apiMatchId`、`homeTeam`、`awayTeam`、`kickoffTime`、`odds`
- `betType` 仅限 `X1X` / `HANDICAP_X1X` / `HALF_FULL` / `TOTAL_GOALS` / `CORRECT_SCORE`
- 自动检测同一比赛内重复的 `(betType, optionKey)`

## 数据库备份与恢复

备份：

```bash
docker exec worldcup-db-1 pg_dump -U hiqi --clean hiqi > backup_$(date +%Y%m%d).sql
```

恢复（先清空再导入）：

```bash
docker exec worldcup-db-1 psql -U hiqi -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
cat backup_20260612.sql | docker exec -i worldcup-db-1 psql -U hiqi hiqi
```

## Verification

```bash
npm run lint
npm run build
docker compose build
```
