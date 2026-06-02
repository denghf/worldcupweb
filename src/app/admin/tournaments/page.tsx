"use client";

import { useState, useEffect } from "react";

interface Tournament {
  id: number;
  name: string;
  leagueId: number;
  season: string;
  startDate: string;
  endDate: string;
  status: string;
  _count: { matches: number };
}

interface Match {
  id: number;
  tournamentId: number;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo: string | null;
  awayTeamLogo: string | null;
  kickoffTime: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  odds: {
    x1x: Record<string, number>;
    totalGoals: { label: string; value: number }[];
    correctScore: { label: string; value: number }[];
  };
}

interface ApiFixture {
  fixtureId: number;
  date: string;
  status: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
}

const POPULAR_LEAGUES = [
  { id: 1, name: "World Cup", season: "2026" },
  { id: 39, name: "Premier League (England)", season: "2024" },
  { id: 140, name: "La Liga (Spain)", season: "2024" },
  { id: 135, name: "Serie A (Italy)", season: "2024" },
  { id: 78, name: "Bundesliga (Germany)", season: "2024" },
  { id: 61, name: "Ligue 1 (France)", season: "2024" },
  { id: 2, name: "Champions League", season: "2024" },
  { id: 4, name: "Euro Championship", season: "2024" },
  { id: 71, name: "Serie A (Brazil)", season: "2026" },
  { id: 88, name: "Eredivisie (Netherlands)", season: "2024" },
];

export default function AdminTournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTournament, setExpandedTournament] = useState<number | null>(null);

  // Create tournament modal
  const [showCreateTournament, setShowCreateTournament] = useState(false);
  const [tournamentForm, setTournamentForm] = useState({
    name: "",
    leagueId: "",
    season: "2026",
    startDate: "",
    endDate: "",
  });

  // Create match modal
  const [showCreateMatch, setShowCreateMatch] = useState(false);
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
  const [matchForm, setMatchForm] = useState({
    homeTeam: "",
    awayTeam: "",
    homeTeamLogo: "",
    awayTeamLogo: "",
    kickoffTime: "",
  });

  // Edit odds modal
  const [showEditOdds, setShowEditOdds] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [oddsForm, setOddsForm] = useState<Record<string, string>>({});

  // Settle modal
  const [showSettle, setShowSettle] = useState(false);
  const [settleMatchData, setSettleMatchData] = useState<Match | null>(null);
  const [settleForm, setSettleForm] = useState({ homeScore: "", awayScore: "", halfHomeScore: "", halfAwayScore: "" });

  // Import from API
  const [showImport, setShowImport] = useState(false);
  const [importLeagueId, setImportLeagueId] = useState("");
  const [importSeason, setImportSeason] = useState("");
  const [importDate, setImportDate] = useState("");
  const [importPreview, setImportPreview] = useState<ApiFixture[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importingIds, setImportingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [tRes, mRes] = await Promise.all([
      fetch("/api/admin/tournaments"),
      fetch("/api/matches"),
    ]);
    const [tData, mData] = await Promise.all([tRes.json(), mRes.json()]);
    if (tData.success) setTournaments(tData.data || []);
    if (mData.success) setMatches(mData.data || []);
    setLoading(false);
  }

  const getMatchesForTournament = (tournamentId: number) =>
    matches
      .filter((m) => m.tournamentId === tournamentId)
      .sort((a, b) => new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime());

  const handlePreviewImport = async () => {
    if (!importLeagueId || !importSeason) return;
    setImportLoading(true);
    try {
      const params = new URLSearchParams({
        leagueId: importLeagueId,
        season: importSeason,
      });
      if (importDate) params.set("date", importDate);
      const res = await fetch(`/api/admin/import/fixtures?${params}`);
      const data = await res.json();
      if (data.success) {
        setImportPreview(data.data || []);
      } else {
        alert(data.error || "获取赛程失败");
      }
    } catch {
      alert("网络错误");
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportMatch = async (fixture: ApiFixture) => {
    if (!selectedTournamentId) {
      alert("请先选择一个赛事");
      return;
    }
    setImportingIds((prev) => new Set(prev).add(fixture.fixtureId));
    try {
      const res = await fetch("/api/admin/import/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentId: selectedTournamentId,
          fixtureId: fixture.fixtureId,
          homeTeam: fixture.homeTeam,
          awayTeam: fixture.awayTeam,
          homeTeamLogo: fixture.homeTeamLogo,
          awayTeamLogo: fixture.awayTeamLogo,
          kickoffTime: fixture.date,
        }),
      });
      const data = await res.json();
      if (data.success) {
        loadData();
      } else {
        alert(data.error || "导入失败");
      }
    } catch {
      alert("网络错误");
    } finally {
      setImportingIds((prev) => {
        const next = new Set(prev);
        next.delete(fixture.fixtureId);
        return next;
      });
    }
  };

  const openOddsModal = (match: Match) => {
    setSelectedMatch(match);
    const o = match.odds;
    setOddsForm({
      x1xHome: o.x1x.home?.toString() || "",
      x1xDraw: o.x1x.draw?.toString() || "",
      x1xAway: o.x1x.away?.toString() || "",
      tg0: o.totalGoals.find((g) => g.label === "0球")?.value?.toString() || "",
      tg1: o.totalGoals.find((g) => g.label === "1球")?.value?.toString() || "",
      tg2: o.totalGoals.find((g) => g.label === "2球")?.value?.toString() || "",
      tg3: o.totalGoals.find((g) => g.label === "3球+")?.value?.toString() || "",
      cs10: o.correctScore.find((s) => s.label === "1:0")?.value?.toString() || "",
      cs11: o.correctScore.find((s) => s.label === "1:1")?.value?.toString() || "",
      cs20: o.correctScore.find((s) => s.label === "2:0")?.value?.toString() || "",
      cs21: o.correctScore.find((s) => s.label === "2:1")?.value?.toString() || "",
      cs01: o.correctScore.find((s) => s.label === "0:1")?.value?.toString() || "",
      cs00: o.correctScore.find((s) => s.label === "0:0")?.value?.toString() || "",
    });
    setShowEditOdds(true);
  };

  const saveOdds = async () => {
    if (!selectedMatch) return;
    const odds = [
      { betType: "X1X" as const, optionKey: "home", oddsValue: parseFloat(oddsForm.x1xHome) },
      { betType: "X1X" as const, optionKey: "draw", oddsValue: parseFloat(oddsForm.x1xDraw) },
      { betType: "X1X" as const, optionKey: "away", oddsValue: parseFloat(oddsForm.x1xAway) },
      { betType: "TOTAL_GOALS" as const, optionKey: "0球", oddsValue: parseFloat(oddsForm.tg0) },
      { betType: "TOTAL_GOALS" as const, optionKey: "1球", oddsValue: parseFloat(oddsForm.tg1) },
      { betType: "TOTAL_GOALS" as const, optionKey: "2球", oddsValue: parseFloat(oddsForm.tg2) },
      { betType: "TOTAL_GOALS" as const, optionKey: "3球+", oddsValue: parseFloat(oddsForm.tg3) },
      { betType: "CORRECT_SCORE" as const, optionKey: "1:0", oddsValue: parseFloat(oddsForm.cs10) },
      { betType: "CORRECT_SCORE" as const, optionKey: "1:1", oddsValue: parseFloat(oddsForm.cs11) },
      { betType: "CORRECT_SCORE" as const, optionKey: "2:0", oddsValue: parseFloat(oddsForm.cs20) },
      { betType: "CORRECT_SCORE" as const, optionKey: "2:1", oddsValue: parseFloat(oddsForm.cs21) },
      { betType: "CORRECT_SCORE" as const, optionKey: "0:1", oddsValue: parseFloat(oddsForm.cs01) },
      { betType: "CORRECT_SCORE" as const, optionKey: "0:0", oddsValue: parseFloat(oddsForm.cs00) },
    ].filter((o) => !isNaN(o.oddsValue));

    const res = await fetch("/api/admin/odds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: selectedMatch.id, odds }),
    });
    const data = await res.json();
    if (data.success) {
      setShowEditOdds(false);
      loadData();
    } else {
      alert(data.error || "保存失败");
    }
  };

  const handleSettle = async () => {
    if (!settleMatchData) return;
    const homeScore = Number(settleForm.homeScore);
    const awayScore = Number(settleForm.awayScore);
    const halfHomeScore = settleForm.halfHomeScore === "" ? undefined : Number(settleForm.halfHomeScore);
    const halfAwayScore = settleForm.halfAwayScore === "" ? undefined : Number(settleForm.halfAwayScore);
    if (isNaN(homeScore) || isNaN(awayScore)) return;

    const res = await fetch("/api/admin/matches/settle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: settleMatchData.id, homeScore, awayScore, halfHomeScore, halfAwayScore }),
    });
    const data = await res.json();
    if (data.success) {
      setShowSettle(false);
      setSettleForm({ homeScore: "", awayScore: "", halfHomeScore: "", halfAwayScore: "" });
      loadData();
    } else {
      alert(data.error || "结算失败");
    }
  };

  const handleCreateTournament = async () => {
    const res = await fetch("/api/admin/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...tournamentForm,
        leagueId: Number(tournamentForm.leagueId),
      }),
    });
    const data = await res.json();
    if (data.success) {
      setShowCreateTournament(false);
      setTournamentForm({ name: "", leagueId: "", season: "2026", startDate: "", endDate: "" });
      loadData();
    } else {
      alert(data.error || "创建失败");
    }
  };

  const handleCreateMatch = async () => {
    if (!selectedTournamentId) return;
    const res = await fetch("/api/admin/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tournamentId: selectedTournamentId,
        ...matchForm,
        kickoffTime: new Date(matchForm.kickoffTime).toISOString(),
      }),
    });
    const data = await res.json();
    if (data.success) {
      setShowCreateMatch(false);
      setMatchForm({ homeTeam: "", awayTeam: "", homeTeamLogo: "", awayTeamLogo: "", kickoffTime: "" });
      loadData();
    } else {
      alert(data.error || "创建失败");
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-lg font-semibold">赛事管理</h2>
          <p className="text-text-muted text-xs mt-1">管理赛事、比赛和赔率</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="px-4 py-2 rounded-lg text-xs bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
          >
            从 API-Football 导入
          </button>
          <button
            onClick={() => setShowCreateTournament(true)}
            className="btn-primary px-4 py-2 rounded-lg text-xs"
          >
            + 新建赛事
          </button>
        </div>
      </div>

      {loading && tournaments.length === 0 ? (
        <div className="text-text-muted text-sm py-8 text-center">加载中...</div>
      ) : (
        <div className="space-y-3">
          {tournaments.map((t) => {
            const isExpanded = expandedTournament === t.id;
            const tMatches = getMatchesForTournament(t.id);
            return (
              <div key={t.id} className="glass rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedTournament(isExpanded ? null : t.id)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left"
                >
                  <div>
                    <h3 className="font-medium text-sm">{t.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary">
                      <span>League ID: {t.leagueId}</span>
                      <span>赛季: {t.season}</span>
                      <span>{t.startDate.slice(0, 10)} ~ {t.endDate.slice(0, 10)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      t.status === "ACTIVE" ? "bg-accent/15 text-accent" : "text-text-muted bg-bg-elevated"
                    }`}>
                      {t.status === "ACTIVE" ? "进行中" : t.status === "UPCOMING" ? "未开始" : "已结束"}
                    </span>
                    <span className="text-text-muted text-xs">{tMatches.length}场</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-4 border-t border-border">
                    <div className="flex items-center justify-between py-3">
                      <span className="text-xs text-text-secondary">比赛列表</span>
                      <button
                        onClick={() => { setSelectedTournamentId(t.id); setShowCreateMatch(true); }}
                        className="text-xs bg-accent/10 text-accent px-2.5 py-1 rounded-lg hover:bg-accent/20 transition-colors"
                      >
                        + 手动添加比赛
                      </button>
                    </div>
                    {tMatches.length === 0 ? (
                      <div className="text-text-muted text-xs py-2">暂无比赛</div>
                    ) : (
                      <div className="space-y-2">
                        {tMatches.map((m) => {
                          const kickoff = new Date(m.kickoffTime);
                          const timeStr = kickoff.toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
                          const isFinished = m.status === "FINISHED";
                          const hasOdds = Object.keys(m.odds.x1x).length > 0;
                          return (
                            <div key={m.id} className="bg-bg-primary rounded-lg px-3 py-2.5 flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="text-xs text-text-muted whitespace-nowrap">{timeStr}</span>
                                <span className="text-xs font-medium truncate">{m.homeTeam} vs {m.awayTeam}</span>
                                {m.status === "UPCOMING" && (
                                  <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded">未开赛</span>
                                )}
                                {m.status === "FINISHED" && m.homeScore !== null && (
                                  <span className="text-xs num font-semibold">{m.homeScore}:{m.awayScore}</span>
                                )}
                                {hasOdds && (
                                  <span className="text-[10px] bg-green/10 text-green px-1.5 py-0.5 rounded">已设赔率</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 ml-2 shrink-0">
                                <button
                                  onClick={() => openOddsModal(m)}
                                  className="text-[10px] px-2 py-1 rounded bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors"
                                >
                                  {hasOdds ? "编辑赔率" : "设置赔率"}
                                </button>
                                {!isFinished && (
                                  <button
                                    onClick={() => { setSettleMatchData(m); setShowSettle(true); }}
                                    className="text-[10px] px-2 py-1 rounded bg-gold/10 text-gold hover:bg-gold/20 transition-colors"
                                  >
                                    结算
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Tournament Modal */}
      {showCreateTournament && (
        <Modal onClose={() => setShowCreateTournament(false)} title="新建赛事">
          <div className="space-y-3">
            <div>
              <label className="text-text-secondary text-xs mb-1.5 block">赛事名称</label>
              <input value={tournamentForm.name} onChange={(e) => setTournamentForm({ ...tournamentForm, name: e.target.value })} placeholder="如：2026 FIFA 世界杯" className="input-field w-full rounded-xl px-4 py-3 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-text-secondary text-xs mb-1.5 block">League ID</label>
                <input value={tournamentForm.leagueId} onChange={(e) => setTournamentForm({ ...tournamentForm, leagueId: e.target.value })} placeholder="1" className="input-field w-full rounded-xl px-4 py-3 text-sm" />
              </div>
              <div>
                <label className="text-text-secondary text-xs mb-1.5 block">赛季</label>
                <input value={tournamentForm.season} onChange={(e) => setTournamentForm({ ...tournamentForm, season: e.target.value })} placeholder="2026" className="input-field w-full rounded-xl px-4 py-3 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-text-secondary text-xs mb-1.5 block">开始日期</label>
                <input type="date" value={tournamentForm.startDate} onChange={(e) => setTournamentForm({ ...tournamentForm, startDate: e.target.value })} className="input-field w-full rounded-xl px-4 py-3 text-sm" />
              </div>
              <div>
                <label className="text-text-secondary text-xs mb-1.5 block">结束日期</label>
                <input type="date" value={tournamentForm.endDate} onChange={(e) => setTournamentForm({ ...tournamentForm, endDate: e.target.value })} className="input-field w-full rounded-xl px-4 py-3 text-sm" />
              </div>
            </div>
            <button
              disabled={!tournamentForm.name || !tournamentForm.leagueId || !tournamentForm.startDate || !tournamentForm.endDate}
              onClick={handleCreateTournament}
              className="btn-primary w-full py-3.5 rounded-xl text-sm disabled:opacity-40"
            >
              创建赛事
            </button>
          </div>
        </Modal>
      )}

      {/* Create Match Modal */}
      {showCreateMatch && (
        <Modal onClose={() => setShowCreateMatch(false)} title="手动添加比赛">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-text-secondary text-xs mb-1.5 block">主队</label>
                <input value={matchForm.homeTeam} onChange={(e) => setMatchForm({ ...matchForm, homeTeam: e.target.value })} placeholder="如：巴西" className="input-field w-full rounded-xl px-4 py-3 text-sm" />
              </div>
              <div>
                <label className="text-text-secondary text-xs mb-1.5 block">客队</label>
                <input value={matchForm.awayTeam} onChange={(e) => setMatchForm({ ...matchForm, awayTeam: e.target.value })} placeholder="如：德国" className="input-field w-full rounded-xl px-4 py-3 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-text-secondary text-xs mb-1.5 block">开赛时间</label>
              <input type="datetime-local" value={matchForm.kickoffTime} onChange={(e) => setMatchForm({ ...matchForm, kickoffTime: e.target.value })} className="input-field w-full rounded-xl px-4 py-3 text-sm" />
            </div>
            <button
              disabled={!matchForm.homeTeam || !matchForm.awayTeam || !matchForm.kickoffTime}
              onClick={handleCreateMatch}
              className="btn-primary w-full py-3.5 rounded-xl text-sm disabled:opacity-40"
            >
              添加比赛
            </button>
          </div>
        </Modal>
      )}

      {/* Edit Odds Modal */}
      {showEditOdds && selectedMatch && (
        <Modal onClose={() => setShowEditOdds(false)} title={`编辑赔率 · ${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam}`}>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <label className="text-xs text-text-secondary mb-2 block font-medium">胜负 (X1X)</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "x1xHome", label: "主胜" },
                  { key: "x1xDraw", label: "平局" },
                  { key: "x1xAway", label: "客胜" },
                ].map((f) => (
                  <div key={f.key}>
                    <span className="text-[10px] text-text-muted block mb-1">{f.label}</span>
                    <input
                      type="number"
                      step="0.01"
                      value={oddsForm[f.key] || ""}
                      onChange={(e) => setOddsForm({ ...oddsForm, [f.key]: e.target.value })}
                      className="input-field w-full rounded-lg px-3 py-2 text-sm num"
                      placeholder="0.00"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-text-secondary mb-2 block font-medium">总进球数</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: "tg0", label: "0球" },
                  { key: "tg1", label: "1球" },
                  { key: "tg2", label: "2球" },
                  { key: "tg3", label: "3球+" },
                ].map((f) => (
                  <div key={f.key}>
                    <span className="text-[10px] text-text-muted block mb-1">{f.label}</span>
                    <input
                      type="number"
                      step="0.01"
                      value={oddsForm[f.key] || ""}
                      onChange={(e) => setOddsForm({ ...oddsForm, [f.key]: e.target.value })}
                      className="input-field w-full rounded-lg px-3 py-2 text-sm num"
                      placeholder="0.00"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-text-secondary mb-2 block font-medium">猜比分</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "cs10", label: "1:0" },
                  { key: "cs11", label: "1:1" },
                  { key: "cs20", label: "2:0" },
                  { key: "cs21", label: "2:1" },
                  { key: "cs01", label: "0:1" },
                  { key: "cs00", label: "0:0" },
                ].map((f) => (
                  <div key={f.key}>
                    <span className="text-[10px] text-text-muted block mb-1">{f.label}</span>
                    <input
                      type="number"
                      step="0.01"
                      value={oddsForm[f.key] || ""}
                      onChange={(e) => setOddsForm({ ...oddsForm, [f.key]: e.target.value })}
                      className="input-field w-full rounded-lg px-3 py-2 text-sm num"
                      placeholder="0.00"
                    />
                  </div>
                ))}
              </div>
            </div>
            <button onClick={saveOdds} className="btn-primary w-full py-3 rounded-xl text-sm">
              保存赔率
            </button>
          </div>
        </Modal>
      )}

      {/* Settle Modal */}
      {showSettle && settleMatchData && (
        <Modal onClose={() => setShowSettle(false)} title={`结算 · ${settleMatchData.homeTeam} vs ${settleMatchData.awayTeam}`}>
          <div className="space-y-3">
            <div>
              <div className="mb-2 text-xs font-semibold text-text-secondary">全场比分</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-text-secondary text-xs mb-1.5 block">{settleMatchData.homeTeam}</label>
                  <input type="number" value={settleForm.homeScore} onChange={(e) => setSettleForm({ ...settleForm, homeScore: e.target.value })} className="input-field w-full rounded-xl px-4 py-3 text-sm num" placeholder="0" />
                </div>
                <div>
                  <label className="text-text-secondary text-xs mb-1.5 block">{settleMatchData.awayTeam}</label>
                  <input type="number" value={settleForm.awayScore} onChange={(e) => setSettleForm({ ...settleForm, awayScore: e.target.value })} className="input-field w-full rounded-xl px-4 py-3 text-sm num" placeholder="0" />
                </div>
              </div>
            </div>
            <div>
              <div className="mb-2 text-xs font-semibold text-text-secondary">半场比分（用于半全场玩法）</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-text-secondary text-xs mb-1.5 block">{settleMatchData.homeTeam}</label>
                  <input type="number" value={settleForm.halfHomeScore} onChange={(e) => setSettleForm({ ...settleForm, halfHomeScore: e.target.value })} className="input-field w-full rounded-xl px-4 py-3 text-sm num" placeholder="可选" />
                </div>
                <div>
                  <label className="text-text-secondary text-xs mb-1.5 block">{settleMatchData.awayTeam}</label>
                  <input type="number" value={settleForm.halfAwayScore} onChange={(e) => setSettleForm({ ...settleForm, halfAwayScore: e.target.value })} className="input-field w-full rounded-xl px-4 py-3 text-sm num" placeholder="可选" />
                </div>
              </div>
            </div>
            <p className="text-text-muted text-xs">结算后将自动判定所有关联下注单的中奖状态。</p>
            <button
              disabled={settleForm.homeScore === "" || settleForm.awayScore === ""}
              onClick={handleSettle}
              className="btn-primary w-full py-3 rounded-xl text-sm disabled:opacity-40"
            >
              确认结算
            </button>
          </div>
        </Modal>
      )}

      {/* Import Modal */}
      {showImport && (
        <Modal onClose={() => setShowImport(false)} title="从 API-Football 导入比赛">
          <div className="space-y-4">
            <div>
              <label className="text-text-secondary text-xs mb-1.5 block">选择联赛</label>
              <select
                value={importLeagueId}
                onChange={(e) => {
                  setImportLeagueId(e.target.value);
                  const league = POPULAR_LEAGUES.find((l) => String(l.id) === e.target.value);
                  if (league) setImportSeason(league.season);
                }}
                className="input-field w-full rounded-xl px-4 py-3 text-sm"
              >
                <option value="">选择联赛...</option>
                {POPULAR_LEAGUES.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-text-secondary text-xs mb-1.5 block">赛季</label>
                <input value={importSeason} onChange={(e) => setImportSeason(e.target.value)} placeholder="2026" className="input-field w-full rounded-xl px-4 py-3 text-sm" />
              </div>
              <div>
                <label className="text-text-secondary text-xs mb-1.5 block">日期（可选）</label>
                <input type="date" value={importDate} onChange={(e) => setImportDate(e.target.value)} className="input-field w-full rounded-xl px-4 py-3 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-text-secondary text-xs mb-1.5 block">导入到赛事</label>
              <select
                value={selectedTournamentId || ""}
                onChange={(e) => setSelectedTournamentId(Number(e.target.value) || null)}
                className="input-field w-full rounded-xl px-4 py-3 text-sm"
              >
                <option value="">选择赛事...</option>
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <button
              disabled={!importLeagueId || !importSeason || importLoading}
              onClick={handlePreviewImport}
              className="btn-primary w-full py-3 rounded-xl text-sm disabled:opacity-40"
            >
              {importLoading ? "获取中..." : "获取赛程"}
            </button>

            {importPreview.length > 0 && (
              <div className="border-t border-border pt-3">
                <div className="text-xs text-text-secondary mb-2">找到 {importPreview.length} 场比赛</div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {importPreview.map((f) => {
                    const kickoff = new Date(f.date);
                    const timeStr = kickoff.toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
                    const isImporting = importingIds.has(f.fixtureId);
                    return (
                      <div key={f.fixtureId} className="bg-bg-primary rounded-lg px-3 py-2 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-medium">{f.homeTeam} vs {f.awayTeam}</div>
                          <div className="text-[10px] text-text-muted">{timeStr}</div>
                        </div>
                        <button
                          onClick={() => handleImportMatch(f)}
                          disabled={isImporting || !selectedTournamentId}
                          className="text-[10px] px-2.5 py-1 rounded bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-40"
                        >
                          {isImporting ? "导入中..." : "导入"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 modal-overlay flex items-center justify-center p-4">
      <div className="bg-bg-surface w-full max-w-md rounded-2xl p-6 animate-fade-in-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base font-semibold">{title}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
