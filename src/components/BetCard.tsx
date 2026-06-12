interface BetItem {
  match: { homeTeam: string; awayTeam: string };
  betMarket: string;
  selectedOption: string;
  lockedOdds: number;
}

export interface BetCardData {
  id: number;
  user?: { nickname: string };
  betMode: string;
  items: BetItem[];
  totalAmount: number;
  lockedTotalOdds: number;
  potentialPayout: number;
  status: string;
  actualPayout: number | null;
}

const STATUS_MAP: Record<string, { label: string; badge: string }> = {
  PENDING_REVIEW: { label: "待审核", badge: "badge-cancelled" },
  APPROVED: { label: "已下注", badge: "badge-active" },
  ACTIVE: { label: "已下注", badge: "badge-active" },
  WON: { label: "已中奖", badge: "badge-won" },
  LOST: { label: "未中奖", badge: "badge-lost" },
  CANCELLED: { label: "已取消", badge: "badge-cancelled" },
};

const MARKET_LABELS: Record<string, Record<string, string>> = {
  X1X: { home: "胜", draw: "平", away: "负" },
  TOTAL_GOALS: {},
  CORRECT_SCORE: {},
  HANDICAP_X1X: {},
  HALF_FULL: {},
};

export function BetCard({ bet, index, showUser = true }: { bet: BetCardData; index: number; showUser?: boolean }) {
  const statusInfo = STATUS_MAP[bet.status] ?? { label: bet.status, badge: "badge-cancelled" };
  const isParlay = bet.betMode === "PARLAY";
  const item = bet.items[0];

  return (
    <article className={`glass rounded-2xl px-3.5 py-3 animate-fade-in-up stagger-${Math.min(index + 1, 5)}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {showUser && <span className="text-sm font-extrabold text-text-primary truncate">{bet.user?.nickname || "未知"}</span>}
          <span className="shrink-0 text-[10px] font-semibold text-text-muted">{isParlay ? `串关×${bet.items.length}` : "单关"}</span>
        </div>
        <span className={`${statusInfo.badge} shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold`}>{statusInfo.label}</span>
      </div>

      {isParlay ? (
        <div className="space-y-1.5">
          {bet.items.map((it, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="shrink-0 text-[10px] text-text-muted num">{i + 1}.</span>
                <span className="truncate font-medium text-text-primary">{it.match?.homeTeam || "?"} VS {it.match?.awayTeam || "?"}</span>
                <span className="shrink-0 text-text-muted">·</span>
                <span className="shrink-0 text-accent">{formatOptionLabel(it.betMarket, it.selectedOption)}</span>
                <span className="shrink-0 num text-text-muted">@{Number(it.lockedOdds).toFixed(2)}</span>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-border/30">
            <span className="text-[10px] text-text-muted">串关×{bet.items.length} · 赔率 {bet.lockedTotalOdds.toFixed(2)}</span>
            <PayoutLabel bet={bet} />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="truncate font-medium text-text-primary">{item.match?.homeTeam || "?"} VS {item.match?.awayTeam || "?"}</span>
            <span className="shrink-0 text-text-muted">·</span>
            <span className="shrink-0 text-accent">{formatOptionLabel(item.betMarket, item.selectedOption)}</span>
            <span className="shrink-0 num text-text-muted">@{Number(item.lockedOdds).toFixed(2)}</span>
          </div>
          <PayoutLabel bet={bet} />
        </div>
      )}
    </article>
  );
}

function PayoutLabel({ bet }: { bet: BetCardData }) {
  const amount = bet.totalAmount.toFixed(1);
  const potential = bet.potentialPayout.toFixed(1);

  if (bet.status === "WON" && bet.actualPayout !== null) {
    return <span className="shrink-0 text-right num text-xs font-bold text-accent">奖励:{bet.actualPayout.toFixed(1)}</span>;
  }
  if (bet.status === "LOST") {
    return <span className="shrink-0 text-right num text-xs text-text-secondary">投注:{amount}</span>;
  }
  return (
    <span className="shrink-0 text-right text-xs text-text-muted">
      <span className="num">投注:{amount}</span>
      <span className="mx-1">·</span>
      <span className="num">预计奖励:{potential}</span>
    </span>
  );
}

function formatOptionLabel(market: string, option: string) {
  if (market === "HANDICAP_X1X") {
    const labels: Record<string, string> = { home: "让胜", draw: "让平", away: "让负" };
    const [handicap, key] = option.includes(":") ? option.split(":") : ["", option];
    return `${handicap}${labels[key] || key}`;
  }
  return MARKET_LABELS[market]?.[option] ?? option;
}
