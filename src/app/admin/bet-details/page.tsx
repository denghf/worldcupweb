"use client";

import { useState, useEffect, useMemo } from "react";
import { displayTeamName } from "@/lib/team-display";
import {
  STATUS_MAP,
  MARKET_NAMES,
  formatOptionLabel,
} from "@/lib/bet-display";

interface OddsRow {
  id: number;
  matchId: number;
  betType: string;
  optionKey: string;
  oddsValue: number;
}

interface MatchDetail {
  id: number;
  homeTeam: string;
  awayTeam: string;
  kickoffTime: string;
  homeScore: number | null;
  awayScore: number | null;
  halfHomeScore: number | null;
  halfAwayScore: number | null;
  odds: OddsRow[];
}

interface BetItem {
  id: number;
  matchId: number;
  match: MatchDetail;
  betMarket: string;
  selectedOption: string;
  lockedOdds: number;
  result: string;
}

interface Bet {
  id: number;
  betUid: string;
  user: { nickname: string };
  betMode: string;
  totalAmount: number;
  lockedTotalOdds: number;
  potentialPayout: number;
  actualPayout: number | null;
  status: string;
  createdAt: string;
  settledAt: string | null;
  items: BetItem[];
}

interface OverviewRecord {
  betId: number;
  betUid: string;
  betMode: string;
  betStatus: string;
  userNickname: string;
  totalAmount: number;
  itemId: number;
  betMarket: string;
  selectedOption: string;
  lockedOdds: number;
  result: string;
}

interface MatchBetGroup {
  key: string;
  match: MatchDetail;
  wageredOptionKeys: Set<string>;
  recordsByOptionKey: Map<string, OverviewRecord[]>;
  records: OverviewRecord[];
}

type Filter = "ALL" | "APPROVED" | "WON" | "LOST";

const MARKET_ORDER = ["X1X", "HANDICAP_X1X", "HALF_FULL", "TOTAL_GOALS", "CORRECT_SCORE"];
export default function BetDetailsPage() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [nameFilter, setNameFilter] = useState<string>("");
  const [selectedBetId, setSelectedBetId] = useState<number | null>(null);
  const [selectedOverviewOption, setSelectedOverviewOption] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/bets")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBets(
            (data.data || []).map((b: Bet) => ({
              ...b,
              totalAmount: Number(b.totalAmount),
              lockedTotalOdds: Number(b.lockedTotalOdds),
              potentialPayout: Number(b.potentialPayout),
              actualPayout: b.actualPayout ? Number(b.actualPayout) : null,
            }))
          );
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);


  const uniqueNames = useMemo(
    () => Array.from(new Set(bets.map((b) => b.user?.nickname).filter(Boolean))),
    [bets]
  );

  const filtered = useMemo(() => {
    return bets.filter((b) => {
      if (filter !== "ALL" && b.status !== filter) return false;
      if (nameFilter && b.user?.nickname !== nameFilter) return false;
      return true;
    });
  }, [bets, filter, nameFilter]);

  const selectedBet = useMemo(() => {
    if (selectedBetId !== null) {
      const found = filtered.find((b) => b.id === selectedBetId);
      if (found) return found;
    }
    return filtered[0] ?? null;
  }, [filtered, selectedBetId]);

  const matchGroups = useMemo(() => {
    if (!selectedBet) return [];
    const selectedMatchKeys = new Set(selectedBet.items.map((it) => getMatchKey(it)));
    return buildMatchBetGroups(filtered).filter((g) => selectedMatchKeys.has(g.key));
  }, [selectedBet, filtered]);


  return (
    <div className="w-full">
      <h2 className="font-display text-lg font-semibold mb-1">下注详情</h2>
      <p className="text-text-muted text-sm mb-4">点击左侧下注，右侧查看对应赛事详情</p>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {([
            { key: "ALL", label: "全部" },
            { key: "APPROVED", label: "已下注" },
            { key: "WON", label: "已中奖" },
            { key: "LOST", label: "未中奖" },
          ] as const).map((f) => (
            <button
              key={f.key}
              onClick={() => {
                setFilter(f.key);
                setSelectedBetId(null);
                setSelectedOverviewOption(null);
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filter === f.key
                  ? "bg-accent/15 text-accent border border-accent/30"
                  : "glass text-text-secondary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          value={nameFilter}
          onChange={(e) => {
            setNameFilter(e.target.value);
            setSelectedBetId(null);
            setSelectedOverviewOption(null);
          }}
          className="input-field rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">全部玩家</option>
          {uniqueNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-text-muted text-sm py-8 text-center">加载中...</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 items-start">
          <div className="space-y-2 min-w-0">
            {filtered.length === 0 ? (
              <div className="text-text-muted text-sm py-8 text-center">暂无下注记录</div>
            ) : (
              filtered.map((bet) => {
                const statusInfo = STATUS_MAP[bet.status] ?? { label: bet.status, badge: "" };
                const isSelected = selectedBet?.id === bet.id;
                const matchNames = bet.items
                  .map((it) => `${displayTeamName(it.match.homeTeam)} vs ${displayTeamName(it.match.awayTeam)}`)
                  .join(" · ");

                return (
                  <button
                    key={bet.id}
                    type="button"
                    onClick={() => {
                      setSelectedBetId(bet.id);
                      setSelectedOverviewOption(null);
                    }}
                    className={`w-full text-left glass rounded-xl transition-all ${
                      isSelected ? "ring-1 ring-accent/60 border-accent/40" : ""
                    }`}
                  >
                    <div className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-medium shrink-0">{bet.user?.nickname || "未知"}</span>
                          {bet.betMode === "PARLAY" && (
                            <span className="text-sm bg-accent/10 text-accent px-1.5 py-0.5 rounded font-medium shrink-0">
                              串关 ×{bet.items.length}
                            </span>
                          )}
                        </div>
                        <span className={`${statusInfo.badge} text-sm px-2 py-0.5 rounded-full font-medium shrink-0`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="text-sm text-text-secondary truncate mb-1">{matchNames || "—"}</div>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-text-muted shrink-0">
                          {new Date(bet.createdAt).toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <div className="flex items-center gap-3 min-w-0">
                          {bet.lockedTotalOdds > 0 && (
                            <span className="text-text-secondary shrink-0">赔率 {bet.lockedTotalOdds.toFixed(2)}</span>
                          )}
                          {bet.totalAmount > 0 && (
                            <span className="font-medium shrink-0">下注 {bet.totalAmount}</span>
                          )}
                          {bet.status === "WON" && bet.actualPayout !== null && (
                            <span className="text-accent font-semibold shrink-0">奖励 +{bet.actualPayout.toFixed(1)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <MatchBetOverview
            groups={matchGroups}
            selectedOptionKey={selectedOverviewOption}
            onSelectOption={setSelectedOverviewOption}
            hasBets={filtered.length > 0}
          />
        </div>
      )}
    </div>
  );
}

function buildMatchBetGroups(bets: Bet[]): MatchBetGroup[] {
  const groups = new Map<string, MatchBetGroup>();

  for (const bet of bets) {
    for (const item of bet.items) {
      const matchKey = getMatchKey(item);
      let group = groups.get(matchKey);
      if (!group) {
        group = {
          key: matchKey,
          match: item.match,
          wageredOptionKeys: new Set<string>(),
          recordsByOptionKey: new Map<string, OverviewRecord[]>(),
          records: [],
        };
        groups.set(matchKey, group);
      }

      const optionKey = getWagerOptionKey(item.betMarket, item.selectedOption);
      const record = {
        betId: bet.id,
        betUid: bet.betUid,
        betMode: bet.betMode,
        betStatus: bet.status,
        userNickname: bet.user?.nickname || "未知",
        totalAmount: bet.totalAmount,
        itemId: item.id,
        betMarket: item.betMarket,
        selectedOption: item.selectedOption,
        lockedOdds: Number(item.lockedOdds),
        result: item.result,
      };

      group.wageredOptionKeys.add(optionKey);
      group.records.push(record);

      const records = group.recordsByOptionKey.get(optionKey) ?? [];
      records.push(record);
      group.recordsByOptionKey.set(optionKey, records);
    }
  }

  return Array.from(groups.values()).sort(
    (a, b) => new Date(a.match.kickoffTime).getTime() - new Date(b.match.kickoffTime).getTime()
  );
}

function MatchBetOverview({
  groups,
  selectedOptionKey,
  onSelectOption,
  hasBets,
}: {
  groups: MatchBetGroup[];
  selectedOptionKey: string | null;
  onSelectOption: (key: string) => void;
  hasBets: boolean;
}) {
  return (
    <aside className="glass rounded-2xl p-3 lg:sticky lg:top-4 max-h-[calc(100vh-7rem)] overflow-y-auto">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-display text-base font-semibold">赛事下注概览</h3>
          <p className="text-xs text-text-muted mt-0.5">红色表示该选项被下注</p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent border border-accent/25 shrink-0">
          选中下注
        </span>
      </div>

      {groups.length === 0 ? (
        <div className="text-text-muted text-sm py-8 text-center">
          {hasBets ? "请选择左侧下注查看详情" : "当前筛选下暂无下注赛事"}
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <MatchBetOverviewCard
              key={group.key}
              group={group}
              selectedOptionKey={selectedOptionKey}
              onSelectOption={onSelectOption}
            />
          ))}
        </div>
      )}
    </aside>
  );
}

function MatchBetOverviewCard({
  group,
  selectedOptionKey,
  onSelectOption,
}: {
  group: MatchBetGroup;
  selectedOptionKey: string | null;
  onSelectOption: (key: string) => void;
}) {
  const selected = selectedOptionKey ? parseOverviewOptionKey(selectedOptionKey) : null;
  const selectedWagerKey = selected?.matchKey === group.key
    ? getWagerOptionKey(selected.betMarket, selected.selectedOption)
    : null;

  return (
    <section className="rounded-xl border border-border/70 bg-bg-primary/70 overflow-hidden">
      <div className="px-3 py-3 border-b border-border/50 space-y-2">
        <OverviewSectionTitle label="赛事详情" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold leading-tight truncate">{displayTeamName(group.match.homeTeam)} vs {displayTeamName(group.match.awayTeam)}</div>
            <div className="text-xs text-text-muted mt-0.5">
              {new Date(group.match.kickoffTime).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
          {group.match.homeScore !== null && group.match.awayScore !== null && (
            <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent border border-accent/25 shrink-0">
              全场 {group.match.homeScore}:{group.match.awayScore}
            </span>
          )}
        </div>
      </div>

      <div className="p-3 border-b border-border/50 space-y-2">
        <OverviewSectionTitle label="赔率详情" />
        <OverviewOddsGrid
          group={group}
          selectedOptionKey={selectedOptionKey}
          onSelectOption={onSelectOption}
        />
      </div>

      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <OverviewSectionTitle label="下注详情" />
          <span className="text-xs text-text-muted">共 {group.records.length} 条</span>
        </div>
        <div className="space-y-1.5">
          {group.records.map((record) => (
            <OverviewRecordButton
              key={`${record.betId}-${record.itemId}`}
              record={record}
              highlighted={selectedWagerKey === getWagerOptionKey(record.betMarket, record.selectedOption)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function OverviewSectionTitle({ label }: { label: string }) {
  return <div className="text-xs font-semibold tracking-wide text-text-muted">{label}</div>;
}

function OverviewOddsGrid({
  group,
  selectedOptionKey,
  onSelectOption,
}: {
  group: MatchBetGroup;
  selectedOptionKey: string | null;
  onSelectOption: (key: string) => void;
}) {
  const byType: Record<string, OddsRow[]> = {};
  for (const o of group.match.odds) {
    if (!byType[o.betType]) byType[o.betType] = [];
    byType[o.betType].push(o);
  }

  return (
    <div className="space-y-2">
      {MARKET_ORDER.map((market) => {
        const rows = byType[market];
        if (!rows?.length) return null;
        return (
          <section key={market} className="space-y-1.5">
            <div className="text-sm font-semibold text-text-muted">{MARKET_NAMES[market] ?? market}</div>
            <div className={getOverviewOddsGridClass(market)}>
              {rows.map((o) => {
                const wagerKey = getWagerOptionKey(o.betType, o.optionKey);
                const overviewKey = getOverviewOptionKey(group.key, o.betType, o.optionKey);
                const wagered = group.wageredOptionKeys.has(wagerKey);
                const selected = selectedOptionKey === overviewKey;
                return (
                  <OverviewOddsButton
                    key={o.optionKey}
                    label={formatOptionLabel(o.betType, o.optionKey)}
                    odds={Number(o.oddsValue)}
                    wagered={wagered}
                    selected={selected}
                    onClick={() => onSelectOption(overviewKey)}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function getOverviewOddsGridClass(market: string) {
  if (market === "TOTAL_GOALS") return "grid grid-cols-8 gap-1";
  if (market === "CORRECT_SCORE") return "grid grid-cols-6 gap-1";
  return "grid grid-cols-3 gap-1.5";
}

function OverviewOddsButton({
  label,
  odds,
  wagered,
  selected,
  onClick,
}: {
  label: string;
  odds: number;
  wagered: boolean;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!wagered}
      onClick={onClick}
      className={`flex min-w-0 items-center justify-center gap-0.5 rounded border px-1 py-1.5 text-center text-xs transition-all ${
        wagered
          ? selected
            ? "border-red bg-red/20 text-red ring-1 ring-red/40 font-semibold"
            : "border-red/45 bg-red/10 text-red hover:bg-red/15 font-semibold"
          : "border-border/40 bg-bg-surface/70 text-text-muted cursor-default"
      }`}
    >
      <span className="truncate">{label}</span>
      <span className="shrink-0">{odds.toFixed(2)}</span>
    </button>
  );
}

function OverviewRecordButton({
  record,
  highlighted,
}: {
  record: OverviewRecord;
  highlighted: boolean;
}) {
  const betContent = `${MARKET_NAMES[record.betMarket] ?? record.betMarket} ${formatOptionLabel(record.betMarket, record.selectedOption)}`;
  return (
    <div
      className={`w-full rounded-md border px-2 py-1.5 text-left transition-all ${
        highlighted
          ? "border-red/35 bg-red/10"
          : "border-border/40 bg-bg-surface"
      }`}
    >
      <div className="flex items-center gap-2 text-[12px] leading-4">
        <span className="font-medium shrink-0">{record.userNickname}</span>
        <span className="text-text-muted truncate">{betContent}</span>
        <span className="shrink-0 text-text-muted">@ {record.lockedOdds.toFixed(2)}</span>
      </div>
    </div>
  );
}

function getMatchKey(item: BetItem) {
  return String(item.match?.id ?? item.matchId ?? `${item.match.homeTeam}-${item.match.awayTeam}-${item.match.kickoffTime}`);
}

function getWagerOptionKey(market: string, option: string) {
  return `${market}~~${option}`;
}

function getOverviewOptionKey(matchKey: string, market: string, option: string) {
  return `${matchKey}~~${market}~~${option}`;
}

function parseOverviewOptionKey(key: string) {
  const [matchKey, betMarket, selectedOption] = key.split("~~");
  return { matchKey, betMarket, selectedOption };
}

