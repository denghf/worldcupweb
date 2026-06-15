"use client";

import { useState, useEffect, useMemo, useRef, type ReactNode } from "react";
import {
  STATUS_MAP,
  MARKET_NAMES,
  X1X_LABELS,
  HANDICAP_LABELS,
  RESULT_MAP,
  formatOptionLabel,
  isWinningOption,
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
  const [expandedBet, setExpandedBet] = useState<number | null>(null);
  const [selectedOverviewOption, setSelectedOverviewOption] = useState<string | null>(null);
  const [activeItemKey, setActiveItemKey] = useState<string | null>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

  useEffect(() => {
    if (!activeItemKey) return;
    const frame = requestAnimationFrame(() => {
      itemRefs.current[activeItemKey]?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => cancelAnimationFrame(frame);
  }, [activeItemKey, expandedBet]);

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

  const matchGroups = useMemo(() => buildMatchBetGroups(filtered), [filtered]);

  const focusBetItem = (record: OverviewRecord) => {
    setExpandedBet(record.betId);
    setActiveItemKey(getBetItemKey(record.betId, record.itemId));
  };

  return (
    <div className="w-full">
      <h2 className="font-display text-lg font-semibold mb-1">下注详情</h2>
      <p className="text-text-muted text-sm mb-4">查看每笔下注的详细内容</p>

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
                setSelectedOverviewOption(null);
                setActiveItemKey(null);
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
            setSelectedOverviewOption(null);
            setActiveItemKey(null);
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
                const isExpanded = expandedBet === bet.id;

                return (
                  <div key={bet.id} className="glass rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedBet(isExpanded ? null : bet.id)}
                      className="w-full px-4 py-3 text-left"
                    >
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-medium shrink-0">{bet.user?.nickname || "未知"}</span>
                          {bet.betMode === "PARLAY" && (
                            <span className="text-sm bg-accent/10 text-accent px-1.5 py-0.5 rounded font-medium shrink-0">
                              串关 ×{bet.items.length}
                            </span>
                          )}
                          <span className="text-text-muted text-sm truncate">{bet.betUid}</span>
                        </div>
                        <span className={`${statusInfo.badge} text-sm px-2 py-0.5 rounded-full font-medium shrink-0`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-text-muted shrink-0">
                          {new Date(bet.createdAt).toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <div className="flex items-center gap-3 min-w-0">
                          {bet.items.length > 0 && (
                            <span className="text-text-secondary truncate">
                              {bet.items.map((it) => `${MARKET_NAMES[it.betMarket] ?? it.betMarket} ${formatOptionLabel(it.betMarket, it.selectedOption)}`).join(" + ")}
                            </span>
                          )}
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
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-3 border-t border-border pt-3 space-y-3 animate-fade-in-up">
                        {bet.items.map((item) => {
                          const resultInfo = RESULT_MAP[item.result] ?? { label: item.result, color: "" };
                          const itemKey = getBetItemKey(bet.id, item.id);
                          const highlighted = activeItemKey === itemKey;
                          return (
                            <div
                              key={item.id}
                              ref={(node) => { itemRefs.current[itemKey] = node; }}
                              className={`bg-bg-primary rounded-lg overflow-hidden border transition-all duration-300 ${
                                highlighted
                                  ? "border-red/60 ring-2 ring-red/25 shadow-lg shadow-red/10"
                                  : "border-transparent"
                              }`}
                            >
                              <div className={`px-3 py-2 border-b border-border/30 flex items-center justify-between gap-3 ${highlighted ? "bg-red/5" : ""}`}>
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-sm font-medium truncate">{item.match.homeTeam} vs {item.match.awayTeam}</span>
                                  {item.match.homeScore !== null && item.match.awayScore !== null && (
                                    <span className="text-sm bg-accent/10 text-accent px-1.5 py-0.5 rounded font-medium shrink-0">
                                      全场 {item.match.homeScore}:{item.match.awayScore}
                                    </span>
                                  )}
                                  {item.match.halfHomeScore !== null && item.match.halfAwayScore !== null && (
                                    <span className="text-sm bg-text-muted/10 text-text-muted px-1.5 py-0.5 rounded shrink-0">
                                      半场 {item.match.halfHomeScore}:{item.match.halfAwayScore}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-sm text-text-muted">{MARKET_NAMES[item.betMarket] ?? item.betMarket}</span>
                                  <span className="text-accent text-sm">{formatOptionLabel(item.betMarket, item.selectedOption)}</span>
                                  <span className="text-text-muted text-sm">@ {Number(item.lockedOdds).toFixed(2)}</span>
                                  <span className={`text-sm ${resultInfo.color}`}>{resultInfo.label}</span>
                                </div>
                              </div>

                              <div className="px-3 py-2 space-y-2">
                                <MatchOddsGrid
                                  odds={item.match.odds}
                                  homeScore={item.match.homeScore}
                                  awayScore={item.match.awayScore}
                                  halfHomeScore={item.match.halfHomeScore}
                                  halfAwayScore={item.match.halfAwayScore}
                                  marketFilter={item.betMarket}
                                />
                              </div>
                            </div>
                          );
                        })}
                        <div className="flex items-center justify-between text-sm pt-1">
                          <span className="text-text-muted">潜在赔付</span>
                          <span className="text-text-secondary">{bet.potentialPayout.toFixed(1)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <MatchBetOverview
            groups={matchGroups}
            selectedOptionKey={selectedOverviewOption}
            activeItemKey={activeItemKey}
            onSelectOption={setSelectedOverviewOption}
            onSelectRecord={focusBetItem}
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
  activeItemKey,
  onSelectOption,
  onSelectRecord,
}: {
  groups: MatchBetGroup[];
  selectedOptionKey: string | null;
  activeItemKey: string | null;
  onSelectOption: (key: string) => void;
  onSelectRecord: (record: OverviewRecord) => void;
}) {
  return (
    <aside className="glass rounded-2xl p-3 lg:sticky lg:top-4 max-h-[calc(100vh-7rem)] overflow-y-auto">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-display text-base font-semibold">赛事下注概览</h3>
          <p className="text-xs text-text-muted mt-0.5">红色表示当前筛选结果中有人下注</p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-red/10 text-red border border-red/25 shrink-0">
          当前筛选
        </span>
      </div>

      {groups.length === 0 ? (
        <div className="text-text-muted text-sm py-8 text-center">当前筛选下暂无下注赛事</div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <MatchBetOverviewCard
              key={group.key}
              group={group}
              selectedOptionKey={selectedOptionKey}
              activeItemKey={activeItemKey}
              onSelectOption={onSelectOption}
              onSelectRecord={onSelectRecord}
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
  activeItemKey,
  onSelectOption,
  onSelectRecord,
}: {
  group: MatchBetGroup;
  selectedOptionKey: string | null;
  activeItemKey: string | null;
  onSelectOption: (key: string) => void;
  onSelectRecord: (record: OverviewRecord) => void;
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
            <div className="text-sm font-semibold leading-tight truncate">{group.match.homeTeam} vs {group.match.awayTeam}</div>
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
              active={activeItemKey === getBetItemKey(record.betId, record.itemId)}
              onClick={() => onSelectRecord(record)}
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
            <div className="grid grid-cols-3 gap-1.5">
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
      className={`flex min-w-0 items-center justify-center gap-1 rounded border px-1.5 py-1.5 text-center text-xs transition-all ${
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
  active,
  onClick,
}: {
  record: OverviewRecord;
  highlighted: boolean;
  active: boolean;
  onClick: () => void;
}) {
  const resultInfo = RESULT_MAP[record.result] ?? { label: record.result, color: "" };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-md border px-2 py-1.5 text-left transition-all ${
        active
          ? "border-red/70 bg-red/20"
          : highlighted
            ? "border-red/35 bg-red/10"
            : "border-border/40 bg-bg-surface hover:border-red/35 hover:bg-red/10"
      }`}
    >
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium truncate">{record.userNickname}</span>
        <span className={`${resultInfo.color} shrink-0`}>{resultInfo.label}</span>
      </div>
      <div className="flex items-center justify-between gap-2 text-[11px] text-text-muted mt-0.5">
        <span className="truncate">{record.betMode === "PARLAY" ? "串关" : "单关"} · {record.betUid}</span>
        <span className="shrink-0">@ {record.lockedOdds.toFixed(2)}</span>
      </div>
    </button>
  );
}

function MatchOddsGrid({
  odds,
  homeScore,
  awayScore,
  halfHomeScore,
  halfAwayScore,
  marketFilter,
}: {
  odds: OddsRow[];
  homeScore: number | null;
  awayScore: number | null;
  halfHomeScore: number | null;
  halfAwayScore: number | null;
  marketFilter?: string;
}) {
  const byType: Record<string, OddsRow[]> = {};
  for (const o of odds) {
    if (!byType[o.betType]) byType[o.betType] = [];
    byType[o.betType].push(o);
  }

  const hasScores = homeScore !== null && awayScore !== null;

  return (
    <div className="space-y-2">
      {byType["X1X"] && (!marketFilter || marketFilter === "X1X") && (
        <OddsDisplaySection title="胜平负" columns="grid-cols-3">
          {byType["X1X"].map((o) => (
            <OddsResultButton
              key={o.optionKey}
              label={X1X_LABELS[o.optionKey] || o.optionKey}
              odds={Number(o.oddsValue)}
              isWinner={hasScores && isWinningOption("X1X", o.optionKey, homeScore!, awayScore, halfHomeScore, halfAwayScore)}
            />
          ))}
        </OddsDisplaySection>
      )}

      {byType["HANDICAP_X1X"] && (!marketFilter || marketFilter === "HANDICAP_X1X") && (
        <OddsDisplaySection title="让球胜平负" columns="grid-cols-3">
          {byType["HANDICAP_X1X"].map((o) => {
            const [handicap, option] = o.optionKey.includes(":") ? o.optionKey.split(":") : ["", o.optionKey];
            return (
              <OddsResultButton
                key={o.optionKey}
                label={`${handicap}${HANDICAP_LABELS[option] || option}`}
                odds={Number(o.oddsValue)}
                isWinner={hasScores && isWinningOption("HANDICAP_X1X", o.optionKey, homeScore!, awayScore, halfHomeScore, halfAwayScore)}
              />
            );
          })}
        </OddsDisplaySection>
      )}

      {byType["HALF_FULL"] && (!marketFilter || marketFilter === "HALF_FULL") && (
        <OddsDisplaySection title="半全场" columns="grid-cols-3">
          {byType["HALF_FULL"].map((o) => (
            <OddsResultButton
              key={o.optionKey}
              label={o.optionKey}
              odds={Number(o.oddsValue)}
              isWinner={hasScores && halfHomeScore !== null && halfAwayScore !== null &&
                isWinningOption("HALF_FULL", o.optionKey, homeScore!, awayScore, halfHomeScore, halfAwayScore)}
            />
          ))}
        </OddsDisplaySection>
      )}

      {byType["TOTAL_GOALS"] && (!marketFilter || marketFilter === "TOTAL_GOALS") && (
        <OddsDisplaySection title="总进球" columns="grid-cols-4">
          {byType["TOTAL_GOALS"].map((o) => (
            <OddsResultButton
              key={o.optionKey}
              label={o.optionKey}
              odds={Number(o.oddsValue)}
              isWinner={hasScores && isWinningOption("TOTAL_GOALS", o.optionKey, homeScore!, awayScore, halfHomeScore, halfAwayScore)}
            />
          ))}
        </OddsDisplaySection>
      )}

      {byType["CORRECT_SCORE"] && (!marketFilter || marketFilter === "CORRECT_SCORE") && (
        <OddsDisplaySection title="猜比分" columns="grid-cols-4">
          {byType["CORRECT_SCORE"].map((o) => (
            <OddsResultButton
              key={o.optionKey}
              label={o.optionKey}
              odds={Number(o.oddsValue)}
              isWinner={hasScores && isWinningOption("CORRECT_SCORE", o.optionKey, homeScore!, awayScore, halfHomeScore, halfAwayScore)}
            />
          ))}
        </OddsDisplaySection>
      )}
    </div>
  );
}

function OddsDisplaySection({ title, columns, children }: { title: string; columns: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-1 text-sm font-semibold text-text-muted">{title}</div>
      <div className={`grid ${columns} gap-1`}>{children}</div>
    </section>
  );
}

function OddsResultButton({
  label,
  odds,
  isWinner,
}: {
  label: string;
  odds: number;
  isWinner: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-center gap-1 px-2 py-2 text-center text-sm rounded border ${
        isWinner
          ? "bg-red/15 text-red border-red/40 font-semibold"
          : "bg-bg-surface text-text-secondary border-border/50"
      }`}
    >
      {isWinner && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="shrink-0">
          <path d="M5 13l4 4L19 7" />
        </svg>
      )}
      <span>{label}</span>
      <span className={`${isWinner ? "text-red" : ""}`}>{odds.toFixed(2)}</span>
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

function getBetItemKey(betId: number, itemId: number) {
  return `${betId}-${itemId}`;
}
