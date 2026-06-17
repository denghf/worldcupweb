# `/match/[id]` 串关下注落地计划

## 当前进度

- 后端 `src/app/api/bets/route.ts` 已完成 player 串关下注接口：支持 `betMode: "PARLAY"`，会创建一个串关注单、多条 `BetItem`、一条钱包扣款流水，并保留原单场下注行为。
- 已通过一次 `npx tsc --noEmit` 静态检查。
- 当前没有卡住，下一步是落地前端 `/match/[id]` 串关选择 UI。

## 目标

在 `/match/49` 这类比赛详情页顶部增加 `串关` 入口，点击后进入 `串关下注` 选择页。串关页不展示“500 非购彩平台”提示，也不展示“开/停”时间；默认只展示每场比赛的 `胜平负` 和 `让球胜平负`，点击 `其它` 弹出该场全部赔率。

## 实现步骤

### 1. 扩展 player 下注 API

文件：`src/app/api/bets/route.ts`

已完成：
- 新增 `betMode: "PARLAY"` 分支。
- 校验至少 2 场、金额有效、玩法有效、同一比赛只能选一个选项。
- 校验比赛存在且仍可投注。
- 精确锁定 `(matchId, betType, optionKey)` 赔率。
- 计算串关总赔率与预计赔付。
- 事务内创建一个 `PARLAY` 注单、多条投注项、一条钱包流水，并扣款一次。
- 保留原 `{ matchId, selections }` 单场多选行为。

### 2. 在 `/match/[id]` 增加串关入口和视图状态

文件：`src/app/(player)/match/[id]/page.tsx`

需要新增：
- 保存所有比赛：`matches`。
- 新增视图状态：`viewMode: "single" | "parlay"`。
- 新增串关状态：`parlayItems`、`parlayAmount`、`activeMoreMatchId`、`parlaySubmitting`。
- 单场视图标题仍为 `赔率详情`，右侧显示红色 `串关` 按钮。
- 串关视图标题改为 `串关下注`，返回按钮回到单场视图，不跳首页。

### 3. 构建串关选择 UI

串关视图展示：
- 日期条：`YYYY-MM-DD 周X · N 场比赛`。
- 每场比赛一张紧凑卡片。
- 默认赔率区只展示：
  - `胜平负`：胜 / 平 / 负
  - `让球胜平负`：让胜 / 让平 / 让负
- 右侧 `其它` 按钮。

选择规则：
- 每场只能选择一个选项。
- 点击已选选项取消。
- 点击同场其它选项替换旧选择。

### 4. `其它` 弹窗

点击 `其它` 后显示该场全部赔率：
- 胜平负
- 让球胜平负
- 猜比分
- 总进球
- 半全场

弹窗内点击赔率后同样更新串关选择，并关闭弹窗。

### 5. 底部串关投注栏

串关视图固定底部展示：
- 清空按钮。
- 已选场次、总赔率、金额、预计奖。
- 金额 stepper，默认 `5`，步长 `5`。
- 确认串关按钮。

提交逻辑：
- 未登录跳转 `/profile/login`。
- 少于 2 场阻止提交。
- 金额无效阻止提交。
- 调用 `/api/bets`：

```ts
fetch("/api/bets", {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    betMode: "PARLAY",
    items: parlayItems.map((item) => ({
      matchId: item.matchId,
      betMarket: item.betMarket,
      selectedOption: item.selectedOption,
    })),
    totalAmount: parlayStake,
  }),
});
```

成功后清空串关选择并跳转 `/profile`。

## 验证

1. `npx tsc --noEmit`
2. `npm run lint`
3. 单场投注回归：仍可多选并创建多个 `SINGLE` 注单。
4. 串关 UI：标题、入口、默认赔率、`其它` 弹窗、同场替换、底部金额/赔率计算正确。
5. 串关提交：登录且余额足够时创建一个 `PARLAY` 注单，多条 `BetItem`，一条钱包扣款流水。