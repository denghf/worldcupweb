# 服务器更新步骤

本次更新新增了玩家登录相关数据库字段：`phone`、`password`、`mustChangePwd`，需要在服务器执行数据库结构更新。

## 1. 进入项目目录

```bash
cd ~/worldcup
```

## 2. 先备份数据库

```bash
docker exec worldcup-db-1 pg_dump -U hiqi --clean hiqi > backup_$(date +%Y%m%d_%H%M%S).sql
```

确认备份文件存在：

```bash
ls -lh backup_*.sql
```

## 3. 拉取或上传最新代码

如果服务器用 git：

```bash
git pull
```

如果是手动上传代码，请先把本地最新代码同步到服务器项目目录。

## 4. 重新构建镜像

```bash
docker compose build app migrate
```

## 5. 更新数据库结构

由于新增了 `users.phone` 唯一索引，Prisma 会提示潜在风险，需要显式确认：

```bash
docker compose run --rm migrate sh -c "npx prisma db push --accept-data-loss"
```

> 说明：这次是给 `users` 表新增 nullable 字段和唯一索引，不会删除现有用户数据。

## 6. 重启应用

```bash
docker compose up -d app
```

如果 app 没有自动起来，可以执行：

```bash
docker compose up -d
```

## 7. 验证

查看容器状态：

```bash
docker ps
```

查看 app 日志：

```bash
docker logs -f worldcup-app-1
```

浏览器验证：

1. 打开 `/admin/players`
2. 给某个玩家点击「手机」，设置手机号
3. 点击「重置密码」
4. 打开前台「我的」Tab
5. 用手机号 + `123456` 登录
6. 第一次登录应跳转到修改密码页
7. 修改密码后进入「我的」页面
8. 进入比赛详情页，选择赔率后可以投注

## 8. 如果更新失败，恢复备份

注意：恢复会清空当前数据库，再导入备份。

```bash
docker exec worldcup-db-1 psql -U hiqi -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
cat backup_YYYYMMDD_HHMMSS.sql | docker exec -i worldcup-db-1 psql -U hiqi hiqi
```

把 `backup_YYYYMMDD_HHMMSS.sql` 替换成实际备份文件名。

恢复后重启应用：

```bash
docker compose up -d app
```
