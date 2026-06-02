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
  items: { match: { homeTeam: string; awayTeam: string }; betMarket: string; selectedOption: string; lockedOdds: number }[];
  totalAmount: number;
  lockedTotalOdds: number;
  status: string;
  createdAt: string;
}

type BetItem = {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  betMarket: "X1X" | "HANDICAP_X1X" | "HALF_FULL" | "TOTAL_GOALS" | "CORRECT_SCORE";
  selectedOption: string;
  odds: number;
};

type SingleSelection = BetItem & { amount: string };

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
  const [mode, setMode] = useState<"single" | "parlay">("single");
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Bet | null>(null);

  // Single mode state
  const [singleMatch, setSingleMatch] = useState<number | null>(null);
  const [singleSelections, setSingleSelections] = useState<SingleSelection[]>([]);

  // Parlay mode state
  const [parlayMatchIds, setParlayMatchIds] = useState<number[]>([]);
  const [parlayItems, setParlayItems] = useState<BetItem[]>([]);
  const [parlayAmount, setParlayAmount] = useState("");
  const [expandedParlay, setExpandedParlay] = useState<number | null>(null);

  const upcoming = matches.filter((m) => m.status === "UPCOMING");

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
      const [mData, pData, bData] = await Promise.all([mRes.json(), pRes.json(), bRes.json()]);
      if (mData.success) setMatches(mData.data || []);
      if (pData.success) setPlayers(pData.data || []);
      if (bData.success) setBets(bData.data || []);
    } finally {
      setLoading(false);
    }
  }

  const resetForm = () => {
    setSelectedPlayer("");
    setSingleMatch(null);
    setSingleSelections([]);
    setParlayMatchIds([]);
    setParlayItems([]);
    setParlayAmount("");
    setExpandedParlay(null);
  };

  // --- Single mode handlers ---

  const addSingleSelection = (item: BetItem) => {
    setSingleSelections((prev) => {
      const idx = prev.findIndex(
        (s) => s.matchId === item.matchId && s.betMarket === item.betMarket && s.selectedOption === item.selectedOption
      );
      if (idx >= 0) return prev.filter((_, i) => i !== idx);
      return [...prev, { ...item, amount: "" }];
    });
  };

  const updateSingleAmount = (idx: number, amount: string) => {
    setSingleSelections((prev) => prev.map((s, i) => (i === idx ? { ...s, amount } : s)));
  };

  const removeSingleSelection = (idx: number) => {
    setSingleSelections((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSingleSubmit = async () => {
    if (!selectedPlayer || singleSelections.length === 0) return;
    const validSelections = singleSelections.filter((s) => Number(s.amount) > 0);
    if (validSelections.length === 0) return alert("请填写金额");
    setSubmitting(true);
    try {
      const results = await Promise.all(
        validSelections.map((s) =>
          fetch("/api/admin/bets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: Number(selectedPlayer),
              items: [{ matchId: s.matchId, betMarket: s.betMarket, selectedOption: s.selectedOption }],
              totalAmount: Number(s.amount),
            }),
          }).then((r) => r.json())
        )
      );
      const failed = results.find((r: { success?: boolean; error?: string }) => !r.success);
      if (failed) {
        alert((failed as { error?: string }).error || "录入失败");
      } else {
        setShowForm(false);
        resetForm();
        loadData();
      }
    } catch {
      alert("网络错误");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Parlay mode handlers ---

  const toggleParlayMatch = (matchId: number) => {
    setParlayMatchIds((prev) =>
      prev.includes(matchId) ? prev.filter((id) => id !== matchId) : [...prev, matchId]
    );
    setParlayItems((prev) => prev.filter((p) => p.matchId !== matchId));
  };

  const toggleParlayItem = (item: BetItem) => {
    setParlayItems((prev) => {
      const existing = prev.find((p) => p.matchId === item.matchId);
      if (existing && existing.betMarket === item.betMarket && existing.selectedOption === item.selectedOption) {
        return prev.filter((p) => p.matchId !== item.matchId);
      }
      return [...prev.filter((p) => p.matchId !== item.matchId), item];
    });
  };

  const parlayTotalOdds = parlayItems.reduce((acc, item) => acc * item.odds, 1);
  const parlayRoundedOdds = Math.round(parlayTotalOdds * 100) / 100;
  const parlayPayout = parlayAmount ? Math.round(Number(parlayAmount) * parlayRoundedOdds * 100) / 100 : 0;

  const handleParlaySubmit = async () => {
    if (!selectedPlayer || parlayItems.length < 2 || !parlayAmount) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: Number(selectedPlayer),
          items: parlayItems.map((b) => ({
            matchId: b.matchId,
            betMarket: b.betMarket,
            selectedOption: b.selectedOption,
          })),
          totalAmount: Number(parlayAmount),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        resetForm();
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

  const handleDeleteBet = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch("/api/admin/bets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betId: deleteTarget.id }),
      });
      const data = await res.json();
      if (data.success) {
        setDeleteTarget(null);
        loadData();
      } else {
        alert(data.error || "删除失败");
      }
    } catch {
      alert("网络错误");
    }
  };

  const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    PENDING_REVIEW: { label: "待审核", cls: "bg-yellow/10 text-yellow" },
    APPROVED: { label: "已生效", cls: "bg-accent/10 text-accent" },
    ACTIVE: { label: "进行中", cls: "bg-accent/10 text-accent" },
    WON: { label: "已中奖", cls: "bg-green/10 text-green" },
    LOST: { label: "未中奖", cls: "bg-red/10 text-red" },
    CANCELLED: { label: "已取消", cls: "bg-text-muted/10 text-text-muted" },
  };

  const selectedMatchData = singleMatch ? matches.find((m) => m.id === singleMatch) : null;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-lg font-semibold">下注管理</h2>
          <p className="text-text-muted text-xs mt-1">录入玩家的下注信息</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }} className="btn-primary px-4 py-2 rounded-lg text-sm">
          {showForm ? "收起" : "+ 录入下注"}
        </button>
      </div>

      {showForm && (
        <div className="glass rounded-xl p-5 mb-6 animate-fade-in-up">
          {/* Player */}
          <div className="mb-4">
            <label className="text-sm text-text-secondary mb-2 block">选择玩家</label>
            <select value={selectedPlayer} onChange={(e) => setSelectedPlayer(e.target.value)} className="input-field w-full rounded-lg px-3 py-2 text-sm">
              <option value="">选择玩家...</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>{p.nickname}</option>
              ))}
            </select>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-1 mb-4 bg-bg-primary rounded-lg p-1">
            <button onClick={() => setMode("single")} className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${mode === "single" ? "bg-bg-surface text-text-primary shadow-sm" : "text-text-muted"}`}>
              单场
            </button>
            <button onClick={() => setMode("parlay")} className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${mode === "parlay" ? "bg-bg-surface text-text-primary shadow-sm" : "text-text-muted"}`}>
              串关
            </button>
          </div>

          {upcoming.length === 0 ? (
            <div className="text-text-muted text-sm bg-bg-primary rounded-lg p-3">暂无可下注的比赛，请先添加赛事和赔率</div>
          ) : mode === "single" ? (
            /* ========== SINGLE MODE ========== */
            <div>
              <div className="mb-3">
                <label className="text-sm text-text-secondary mb-2 block">选择比赛</label>
                <select
                  value={singleMatch ?? ""}
                  onChange={(e) => { setSingleMatch(Number(e.target.value) || null); setSingleSelections([]); }}
                  className="input-field w-full rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">选择比赛...</option>
                  {upcoming.map((m) => (
                    <option key={m.id} value={m.id}>{m.homeTeam} vs {m.awayTeam}</option>
                  ))}
                </select>
              </div>

              {selectedMatchData && (
                <div className="bg-bg-primary rounded-lg p-3 mb-3 space-y-1">
                  <div className="text-sm font-medium mb-2">{selectedMatchData.homeTeam} vs {selectedMatchData.awayTeam}</div>

                  <OddsSection title="胜平负" columns="grid-cols-3">
                    {Object.entries(selectedMatchData.odds.x1x).map(([key, odds]) => (
                      <OddsPickButton key={key} label={X1X_LABELS[key] || key} odds={odds}
                        selected={singleSelections.some((s) => s.betMarket === "X1X" && s.selectedOption === key)}
                        onClick={() => addSingleSelection({ matchId: selectedMatchData.id, homeTeam: selectedMatchData.homeTeam, awayTeam: selectedMatchData.awayTeam, betMarket: "X1X", selectedOption: key, odds })}
                      />
                    ))}
                  </OddsSection>

                  {Object.keys(selectedMatchData.odds.handicapX1x).length > 0 && (
                    <OddsSection title="让球胜平负" columns="grid-cols-3">
                      {Object.entries(selectedMatchData.odds.handicapX1x).map(([key, odds]) => {
                        const [handicap, option] = key.includes(":") ? key.split(":") : ["", key];
                        return (
                          <OddsPickButton key={key} label={`${handicap}${HANDICAP_LABELS[option] || option}`} odds={odds}
                            selected={singleSelections.some((s) => s.betMarket === "HANDICAP_X1X" && s.selectedOption === key)}
                            onClick={() => addSingleSelection({ matchId: selectedMatchData.id, homeTeam: selectedMatchData.homeTeam, awayTeam: selectedMatchData.awayTeam, betMarket: "HANDICAP_X1X", selectedOption: key, odds })}
                          />
                        );
                      })}
                    </OddsSection>
                  )}

                  {selectedMatchData.odds.halfFull.length > 0 && (
                    <OddsSection title="半全场" columns="grid-cols-3">
                      {selectedMatchData.odds.halfFull.map((o) => (
                        <OddsPickButton key={o.label} label={o.label} odds={o.value}
                          selected={singleSelections.some((s) => s.betMarket === "HALF_FULL" && s.selectedOption === o.label)}
                          onClick={() => addSingleSelection({ matchId: selectedMatchData.id, homeTeam: selectedMatchData.homeTeam, awayTeam: selectedMatchData.awayTeam, betMarket: "HALF_FULL", selectedOption: o.label, odds: o.value })}
                        />
                      ))}
                    </OddsSection>
                  )}

                  {selectedMatchData.odds.totalGoals.length > 0 && (
                    <OddsSection title="总进球" columns="grid-cols-4">
                      {selectedMatchData.odds.totalGoals.map((g) => (
                        <OddsPickButton key={g.label} label={g.label} odds={g.value}
                          selected={singleSelections.some((s) => s.betMarket === "TOTAL_GOALS" && s.selectedOption === g.label)}
                          onClick={() => addSingleSelection({ matchId: selectedMatchData.id, homeTeam: selectedMatchData.homeTeam, awayTeam: selectedMatchData.awayTeam, betMarket: "TOTAL_GOALS", selectedOption: g.label, odds: g.value })}
                        />
                      ))}
                    </OddsSection>
                  )}

                  {selectedMatchData.odds.correctScore.length > 0 && (
                    <OddsSection title="比分" columns="grid-cols-4">
                      {selectedMatchData.odds.correctScore.map((s) => (
                        <OddsPickButton key={s.label} label={s.label} odds={s.value}
                          selected={singleSelections.some((sel) => sel.betMarket === "CORRECT_SCORE" && sel.selectedOption === s.label)}
                          onClick={() => addSingleSelection({ matchId: selectedMatchData.id, homeTeam: selectedMatchData.homeTeam, awayTeam: selectedMatchData.awayTeam, betMarket: "CORRECT_SCORE", selectedOption: s.label, odds: s.value })}
                        />
                      ))}
                    </OddsSection>
                  )}
                </div>
              )}

              {/* Selected items with amounts */}
              {singleSelections.length > 0 && (
                <div className="space-y-2 mb-4">
                  <div className="text-xs text-text-secondary font-medium">已选 {singleSelections.length} 项</div>
                  {singleSelections.map((sel, idx) => (
                    <div key={`${sel.betMarket}-${sel.selectedOption}`} className="flex items-center gap-2 bg-bg-primary rounded-lg px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <span className="text-xs">{MARKET_NAMES[sel.betMarket]}</span>
                        <span className="text-xs text-accent ml-1">{formatOptionLabel(sel.betMarket, sel.selectedOption)}</span>
                        <span className="text-xs text-text-muted num ml-1">@ {sel.odds.toFixed(2)}</span>
                      </div>
                      <input
                        type="number" value={sel.amount} onChange={(e) => updateSingleAmount(idx, e.target.value)}
                        className="input-field w-24 rounded px-2 py-1 text-xs num text-right" placeholder="金额"
                      />
                      <button onClick={() => removeSingleSelection(idx)} className="text-red text-xs shrink-0">移除</button>
                    </div>
                  ))}
                  <button onClick={handleSingleSubmit} disabled={!selectedPlayer || submitting}
                    className="btn-primary w-full py-2.5 rounded-lg text-sm disabled:opacity-40">
                    {submitting ? "提交中..." : `确认录入 ${singleSelections.filter((s) => Number(s.amount) > 0).length} 单`}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ========== PARLAY MODE ========== */
            <div>
              {/* Step 1: select matches */}
              <div className="mb-4">
                <label className="text-sm text-text-secondary mb-2 block">
                  第一步：选择比赛
                  {parlayMatchIds.length > 0 && <span className="text-accent ml-2">已选 {parlayMatchIds.length} 场</span>}
                </label>
                <div className="bg-bg-primary rounded-lg max-h-48 overflow-y-auto">
                  {upcoming.map((m) => {
                    const checked = parlayMatchIds.includes(m.id);
                    return (
                      <label key={m.id} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-bg-hover transition-colors border-b border-border/30 last:border-0">
                        <input type="checkbox" checked={checked} onChange={() => toggleParlayMatch(m.id)}
                          className="w-3.5 h-3.5 rounded accent-accent" />
                        <span className="text-sm">{m.homeTeam} vs {m.awayTeam}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: pick odds for selected matches */}
              {parlayMatchIds.length > 0 && (
                <div className="mb-4">
                  <label className="text-sm text-text-secondary mb-2 block">
                    第二步：选择赔率
                    <span className="text-text-muted text-xs ml-2">每场选一个，全部猜中才中奖</span>
                  </label>
                  <div className="space-y-2">
                    {parlayMatchIds.map((matchId) => {
                      const match = matches.find((m) => m.id === matchId);
                      if (!match) return null;
                      const picked = parlayItems.find((p) => p.matchId === matchId);
                      const isOpen = expandedParlay === matchId;
                      return (
                        <div key={matchId} className="bg-bg-primary rounded-lg overflow-hidden">
                          <button
                            onClick={() => setExpandedParlay(isOpen ? null : matchId)}
                            className="w-full px-3 py-2.5 flex items-center justify-between text-left"
                          >
                            <div className="flex items-center gap-2">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                className={`text-text-muted transition-transform ${isOpen ? "rotate-90" : ""}`}>
                                <path d="M9 18l6-6-6-6" />
                              </svg>
                              <span className="text-sm font-medium">{match.homeTeam} vs {match.awayTeam}</span>
                            </div>
                            {picked ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-accent">{MARKET_NAMES[picked.betMarket]} · {formatOptionLabel(picked.betMarket, picked.selectedOption)}</span>
                                <span className="text-xs num text-text-muted">@ {picked.odds.toFixed(2)}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-text-muted">点击展开选赔率</span>
                            )}
                          </button>

                          {isOpen && (
                            <div className="px-3 pb-3 space-y-2">
                              <OddsSection title="胜平负" columns="grid-cols-3">
                                {Object.entries(match.odds.x1x).map(([key, odds]) => (
                                  <OddsPickButton key={key} label={X1X_LABELS[key] || key} odds={odds}
                                    selected={picked?.betMarket === "X1X" && picked?.selectedOption === key}
                                    onClick={() => toggleParlayItem({ matchId: match.id, homeTeam: match.homeTeam, awayTeam: match.awayTeam, betMarket: "X1X", selectedOption: key, odds })}
                                  />
                                ))}
                              </OddsSection>

                              {Object.keys(match.odds.handicapX1x).length > 0 && (
                                <OddsSection title="让球胜平负" columns="grid-cols-3">
                                  {Object.entries(match.odds.handicapX1x).map(([key, odds]) => {
                                    const [handicap, option] = key.includes(":") ? key.split(":") : ["", key];
                                    return (
                                      <OddsPickButton key={key} label={`${handicap}${HANDICAP_LABELS[option] || option}`} odds={odds}
                                        selected={picked?.betMarket === "HANDICAP_X1X" && picked?.selectedOption === key}
                                        onClick={() => toggleParlayItem({ matchId: match.id, homeTeam: match.homeTeam, awayTeam: match.awayTeam, betMarket: "HANDICAP_X1X", selectedOption: key, odds })}
                                      />
                                    );
                                  })}
                                </OddsSection>
                              )}

                              {match.odds.halfFull.length > 0 && (
                                <OddsSection title="半全场" columns="grid-cols-3">
                                  {match.odds.halfFull.map((o) => (
                                    <OddsPickButton key={o.label} label={o.label} odds={o.value}
                                      selected={picked?.betMarket === "HALF_FULL" && picked?.selectedOption === o.label}
                                      onClick={() => toggleParlayItem({ matchId: match.id, homeTeam: match.homeTeam, awayTeam: match.awayTeam, betMarket: "HALF_FULL", selectedOption: o.label, odds: o.value })}
                                    />
                                  ))}
                                </OddsSection>
                              )}

                              {match.odds.totalGoals.length > 0 && (
                                <OddsSection title="总进球" columns="grid-cols-4">
                                  {match.odds.totalGoals.map((g) => (
                                    <OddsPickButton key={g.label} label={g.label} odds={g.value}
                                      selected={picked?.betMarket === "TOTAL_GOALS" && picked?.selectedOption === g.label}
                                      onClick={() => toggleParlayItem({ matchId: match.id, homeTeam: match.homeTeam, awayTeam: match.awayTeam, betMarket: "TOTAL_GOALS", selectedOption: g.label, odds: g.value })}
                                    />
                                  ))}
                                </OddsSection>
                              )}

                              {match.odds.correctScore.length > 0 && (
                                <OddsSection title="比分" columns="grid-cols-4">
                                  {match.odds.correctScore.map((s) => (
                                    <OddsPickButton key={s.label} label={s.label} odds={s.value}
                                      selected={picked?.betMarket === "CORRECT_SCORE" && picked?.selectedOption === s.label}
                                      onClick={() => toggleParlayItem({ matchId: match.id, homeTeam: match.homeTeam, awayTeam: match.awayTeam, betMarket: "CORRECT_SCORE", selectedOption: s.label, odds: s.value })}
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
                </div>
              )}

              {/* Step 3: amount and submit */}
              {parlayItems.length >= 2 && (
                <div>
                  <label className="text-sm text-text-secondary mb-2 block">第三步：下注金额</label>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <input type="number" value={parlayAmount} onChange={(e) => setParlayAmount(e.target.value)} placeholder="输入金额（欢乐豆）"
                        className="input-field w-full rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div className="text-right text-xs text-text-muted py-2 min-w-[100px]">
                      <div>串关 ×{parlayItems.length}</div>
                      <div>赔率 <span className="num text-text-primary">{parlayRoundedOdds.toFixed(2)}</span></div>
                      {parlayAmount && <div>可赢 <span className="num text-accent">¥{parlayPayout}</span></div>}
                    </div>
                    <button onClick={handleParlaySubmit}
                      disabled={!selectedPlayer || !parlayAmount || submitting}
                      className="btn-primary px-6 py-2 rounded-lg text-sm disabled:opacity-40">
                      {submitting ? "提交中..." : "确认录入"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bet records */}
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
                  <th className="text-left py-2.5 px-4 font-medium">玩法</th>
                  <th className="text-left py-2.5 px-4 font-medium">选择</th>
                  <th className="text-right py-2.5 px-4 font-medium">赔率</th>
                  <th className="text-right py-2.5 px-4 font-medium">金额</th>
                  <th className="text-right py-2.5 px-4 font-medium">状态</th>
                  <th className="text-right py-2.5 px-4 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {bets.map((bet) => {
                  const st = STATUS_MAP[bet.status] || { label: bet.status, cls: "bg-bg-elevated text-text-muted" };
                  const isParlay = bet.betMode === "PARLAY";
                  return (
                    <tr key={bet.id} className="border-b border-border/50 last:border-0">
                      <td className="py-2.5 px-4">{bet.user?.nickname || "-"}</td>
                      <td className="py-2.5 px-4">
                        {isParlay ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent">串关 ×{bet.items.length}</span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-elevated text-text-secondary">单场</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        {bet.items.map((it, i) => (
                          <div key={i} className={i > 0 ? "mt-0.5" : ""}>
                            <span className="text-text-secondary text-xs">{it.match.homeTeam} vs {it.match.awayTeam}</span>
                            <span className="text-accent text-xs ml-1">{formatOptionLabel(it.betMarket as BetItem["betMarket"], it.selectedOption)}</span>
                          </div>
                        ))}
                      </td>
                      <td className="py-2.5 px-4 text-right num text-xs">{Number(bet.lockedTotalOdds).toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-right num">¥{Number(bet.totalAmount).toFixed(0)}</td>
                      <td className="py-2.5 px-4 text-right">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {!["WON", "LOST", "CANCELLED"].includes(bet.status) && (
                          <button onClick={() => setDeleteTarget(bet)}
                            className="text-[10px] px-2 py-1 rounded bg-red/10 text-red hover:bg-red/20 transition-colors">
                            删除
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 modal-overlay flex items-center justify-center p-4">
          <div className="bg-bg-surface w-full max-w-sm rounded-2xl p-6 animate-fade-in-up">
            <h3 className="font-display text-base font-semibold mb-2">确认删除</h3>
            <p className="text-text-secondary text-sm mb-1">
              确定删除 <span className="text-text-primary font-medium">{deleteTarget.user?.nickname}</span> 的下注单？
            </p>
            <div className="bg-bg-primary rounded-lg px-3 py-2 mb-3 text-xs space-y-0.5">
              {deleteTarget.items.map((it, i) => (
                <div key={i}>
                  {it.match.homeTeam} vs {it.match.awayTeam}
                  <span className="text-accent ml-1">{formatOptionLabel(it.betMarket as BetItem["betMarket"], it.selectedOption)}</span>
                  <span className="text-text-muted num ml-1">@ {Number(it.lockedOdds).toFixed(2)}</span>
                </div>
              ))}
              <div className="pt-1 border-t border-border/30 font-medium">
                金额 ¥{Number(deleteTarget.totalAmount).toFixed(0)}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl text-sm border border-border hover:bg-bg-hover transition-colors">
                取消
              </button>
              <button onClick={handleDeleteBet}
                className="flex-1 py-2.5 rounded-xl text-sm bg-red text-white hover:opacity-90 transition-opacity font-semibold">
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
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

function OddsPickButton({ label, odds, selected, onClick }: { label: string; odds: number; selected?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`odds-btn flex items-center justify-center gap-1 px-1.5 py-1.5 text-center text-[10px] transition-colors ${
        selected ? "!bg-accent/20 !text-accent !border-accent/40 ring-1 ring-accent/30" : ""
      }`}>
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
