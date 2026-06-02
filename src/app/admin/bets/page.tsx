"use client";

import { useState, useEffect } from "react";

interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  kickoffTime: string;
  status: string;
  odds: {
    x1x: Record<string, number>;
    handicapX1x: Record<string, number>;
    halfFull: { label: string; value: number }[];
    totalGoals: { label: string; value: number }[];
    correctScore: { label: string; value: number }[];
  };
}

interface Player {
  id: number;
  nickname: string;
  username: string;
}

interface Bet {
  id: number;
  user: { nickname: string };
  betMode: string;
  items: { match: { homeTeam: string; awayTeam: string }; betMarket: string; selectedOption: string }[];
  totalAmount: number;
  status: string;
}

type BetItem = {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  betMarket: "X1X" | "HANDICAP_X1X" | "HALF_FULL" | "TOTAL_GOALS" | "CORRECT_SCORE";
  selectedOption: string;
  odds: number;
};

const MARKET_NAMES: Record<BetItem["betMarket"], string> = {
  X1X: "胜平负",
  HANDICAP_X1X: "让球胜平负",
  HALF_FULL: "半全场",
  TOTAL_GOALS: "总进球",
  CORRECT_SCORE: "猜比分",
};

const X1X_LABELS: Record<string, string> = { home: "胜", draw: "平", away: "负" };
const HANDICAP_LABELS: Record<string, string> = { home: "让胜", draw: "让平", away: "让负" };

export default function BetManagementPage() {
  const [showForm, setShowForm] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [betItems, setBetItems] = useState<BetItem[]>([]);
  const [totalAmount, setTotalAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [mRes, pRes, bRes] = await Promise.all([
        fetch("/api/matches"),
        fetch("/api/admin/players"),
        fetch("/api/admin/bets"),
      ]);
      const [mData, pData, bData] = await Promise.all([
        mRes.json(),
        pRes.json(),
        bRes.json(),
      ]);
      if (mData.success) setMatches(mData.data || []);
      if (pData.success) setPlayers(pData.data || []);
      if (bData.success) setBets(bData.data || []);
    } finally {
      setLoading(false);
    }
  }

  const addBetItem = (item: BetItem) => {
    setBetItems((prev) => {
      const filtered = prev.filter((p) => p.matchId !== item.matchId);
      return [...filtered, item];
    });
  };

  const removeBetItem = (matchId: number) => {
    setBetItems((prev) => prev.filter((p) => p.matchId !== matchId));
  };

  const totalOdds = betItems.reduce((acc, item) => acc * item.odds, 1);
  const roundedTotalOdds = Math.round(totalOdds * 100) / 100;
  const potentialPayout = totalAmount ? Math.round(Number(totalAmount) * roundedTotalOdds * 100) / 100 : 0;

  const handleSubmit = async () => {
    if (!selectedPlayer || betItems.length === 0 || !totalAmount) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: Number(selectedPlayer),
          items: betItems.map((b) => ({
            matchId: b.matchId,
            betMarket: b.betMarket,
            selectedOption: b.selectedOption,
          })),
          totalAmount: Number(totalAmount),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        setBetItems([]);
        setTotalAmount("");
        setSelectedPlayer("");
        loadData();
      } else {
        alert(data.error || "录入失败");
      }
    } catch {
      alert("网络错误");
    } finally {
      setSubmitting(false);
    }
  };

  const STATUS_MAP: Record<string, string> = {
    PENDING_REVIEW: "待审核",
    APPROVED: "已生效",
    ACTIVE: "进行中",
    WON: "已中奖",
    LOST: "未中奖",
    CANCELLED: "已取消",
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-lg font-semibold">下注管理</h2>
          <p className="text-text-muted text-xs mt-1">录入玩家的下注信息</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary px-4 py-2 rounded-lg text-sm"
        >
          {showForm ? "收起" : "+ 录入下注"}
        </button>
      </div>

      {showForm && (
        <div className="glass rounded-xl p-5 mb-6 animate-fade-in-up">
          <div className="mb-4">
            <label className="text-sm text-text-secondary mb-2 block">选择玩家</label>
            <select
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              className="input-field w-full rounded-lg px-3 py-2 text-sm"
            >
              <option value="">选择玩家...</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>{p.nickname}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="text-sm text-text-secondary mb-2 block">选择比赛和赔率</label>
            {matches.filter((m) => m.status === "UPCOMING").length === 0 ? (
              <div className="text-text-muted text-sm bg-bg-primary rounded-lg p-3">
                暂无可下注的比赛，请先添加赛事和赔率
              </div>
            ) : (
              <div className="space-y-3">
                {matches.filter((m) => m.status === "UPCOMING").map((match) => {
                  const existing = betItems.find((b) => b.matchId === match.id);
                  return (
                    <div key={match.id} className="bg-bg-primary rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{match.homeTeam} vs {match.awayTeam}</span>
                      </div>

                      {existing ? (
                        <div className="flex items-center justify-between bg-accent/10 rounded-lg px-3 py-2">
                          <span className="text-sm">
                            {MARKET_NAMES[existing.betMarket]} ·
                            <span className="text-accent ml-1">{formatOptionLabel(existing.betMarket, existing.selectedOption)}</span>
                            <span className="num text-text-muted ml-2">@ {existing.odds.toFixed(2)}</span>
                          </span>
                          <button onClick={() => removeBetItem(match.id)} className="text-red text-xs hover:underline">
                            移除
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <OddsSection title="胜平负" columns="grid-cols-3">
                            {Object.entries(match.odds.x1x).map(([key, odds]) => (
                              <OddsPickButton
                                key={key}
                                label={X1X_LABELS[key] || key}
                                odds={odds}
                                onClick={() => addBetItem({
                                  matchId: match.id, homeTeam: match.homeTeam, awayTeam: match.awayTeam,
                                  betMarket: "X1X", selectedOption: key, odds,
                                })}
                              />
                            ))}
                          </OddsSection>

                          {Object.keys(match.odds.handicapX1x).length > 0 && (
                            <OddsSection title="让球胜平负" columns="grid-cols-3">
                              {Object.entries(match.odds.handicapX1x).map(([key, odds]) => {
                                const [handicap, option] = key.includes(":") ? key.split(":") : ["", key];
                                return (
                                  <OddsPickButton
                                    key={key}
                                    label={`${handicap}${HANDICAP_LABELS[option] || option}`}
                                    odds={odds}
                                    onClick={() => addBetItem({
                                      matchId: match.id, homeTeam: match.homeTeam, awayTeam: match.awayTeam,
                                      betMarket: "HANDICAP_X1X", selectedOption: key, odds,
                                    })}
                                  />
                                );
                              })}
                            </OddsSection>
                          )}

                          {match.odds.halfFull.length > 0 && (
                            <OddsSection title="半全场" columns="grid-cols-3">
                              {match.odds.halfFull.map((option) => (
                                <OddsPickButton
                                  key={option.label}
                                  label={option.label}
                                  odds={option.value}
                                  onClick={() => addBetItem({
                                    matchId: match.id, homeTeam: match.homeTeam, awayTeam: match.awayTeam,
                                    betMarket: "HALF_FULL", selectedOption: option.label, odds: option.value,
                                  })}
                                />
                              ))}
                            </OddsSection>
                          )}

                          {match.odds.totalGoals.length > 0 && (
                            <OddsSection title="总进球" columns="grid-cols-4">
                              {match.odds.totalGoals.map((g) => (
                                <OddsPickButton
                                  key={g.label}
                                  label={g.label}
                                  odds={g.value}
                                  onClick={() => addBetItem({
                                    matchId: match.id, homeTeam: match.homeTeam, awayTeam: match.awayTeam,
                                    betMarket: "TOTAL_GOALS", selectedOption: g.label, odds: g.value,
                                  })}
                                />
                              ))}
                            </OddsSection>
                          )}

                          {match.odds.correctScore.length > 0 && (
                            <OddsSection title="比分" columns="grid-cols-4">
                              {match.odds.correctScore.map((score) => (
                                <OddsPickButton
                                  key={score.label}
                                  label={score.label}
                                  odds={score.value}
                                  onClick={() => addBetItem({
                                    matchId: match.id, homeTeam: match.homeTeam, awayTeam: match.awayTeam,
                                    betMarket: "CORRECT_SCORE", selectedOption: score.label, odds: score.value,
                                  })}
                                />
                              ))}
                            </OddsSection>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-sm text-text-secondary mb-2 block">下注金额（欢乐豆）</label>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="输入金额"
                className="input-field w-full rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="text-right text-xs text-text-muted py-2 min-w-[100px]">
              {betItems.length > 1 && <div>串关 ×{betItems.length}</div>}
              {betItems.length > 0 && (
                <>
                  <div>赔率 <span className="num text-text-primary">{roundedTotalOdds.toFixed(2)}</span></div>
                  <div>可赢 <span className="num text-accent">¥{potentialPayout}</span></div>
                </>
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={!selectedPlayer || betItems.length === 0 || !totalAmount || submitting}
              className="btn-primary px-6 py-2 rounded-lg text-sm disabled:opacity-40"
            >
              {submitting ? "提交中..." : "确认录入"}
            </button>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium text-text-secondary mb-3">下注记录</h3>
        {loading ? (
          <div className="text-text-muted text-sm py-8 text-center">加载中...</div>
        ) : bets.length === 0 ? (
          <div className="text-text-muted text-sm py-8 text-center">暂无下注记录</div>
        ) : (
          <div className="glass rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-muted text-xs">
                  <th className="text-left py-2.5 px-4 font-medium">玩家</th>
                  <th className="text-left py-2.5 px-4 font-medium">比赛</th>
                  <th className="text-left py-2.5 px-4 font-medium">选择</th>
                  <th className="text-right py-2.5 px-4 font-medium">金额</th>
                  <th className="text-right py-2.5 px-4 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {bets.map((bet) => (
                  <tr key={bet.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 px-4">{bet.user?.nickname || "-"}</td>
                    <td className="py-2.5 px-4 text-text-secondary">
                      {bet.items.map((it) => `${it.match.homeTeam} vs ${it.match.awayTeam}`).join(", ")}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="text-accent">
                        {bet.items.map((it) => it.selectedOption).join(" + ")}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right num">¥{Number(bet.totalAmount).toFixed(0)}</td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                        {STATUS_MAP[bet.status] || bet.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function OddsSection({ title, columns, children }: { title: string; columns: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-1.5 text-[10px] font-semibold text-text-muted">{title}</div>
      <div className={`grid ${columns} gap-1`}>{children}</div>
    </section>
  );
}

function OddsPickButton({ label, odds, onClick }: { label: string; odds: number; onClick: () => void }) {
  return (
    <button onClick={onClick} className="odds-btn flex items-center justify-center gap-1 px-1.5 py-1.5 text-center text-[10px]">
      <span>{label}</span>
      <span className="num">{odds.toFixed(2)}</span>
    </button>
  );
}

function formatOptionLabel(market: BetItem["betMarket"], option: string) {
  if (market === "X1X") return X1X_LABELS[option] || option;
  if (market === "HANDICAP_X1X") {
    const [handicap, key] = option.includes(":") ? option.split(":") : ["", option];
    return `${handicap}${HANDICAP_LABELS[key] || key}`;
  }
  return option;
}
