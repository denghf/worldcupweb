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
  finalHomeScore: number | null;
  finalAwayScore: number | null;
  odds: {
    x1x: Record<string, number>;
    handicapX1x: Record<string, number>;
    halfFull: { label: string; value: number }[];
    totalGoals: { label: string; value: number }[];
    correctScore: { label: string; value: number }[];
  };
}

interface LocalMatch {
  apiMatchId: string;
  matchNo?: string;
  homeTeam: string;
  awayTeam: string;
  kickoffTime: string;
  handicap?: number;
  odds: { betType: string; optionKey: string; oddsValue: number }[];
}

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
  const [settleForm, setSettleForm] = useState({ homeScore: "", awayScore: "", halfHomeScore: "", halfAwayScore: "", finalHomeScore: "", finalAwayScore: "" });

  // Local import
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<string>("");

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

  const handleLocalImport = async () => {
    if (!selectedTournamentId || !importJson.trim()) return;
    let parsed: LocalMatch[];
    try {
      parsed = JSON.parse(importJson);
    } catch {
      alert("JSON 格式错误，请检查输入");
      return;
    }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      alert("数据必须是非空数组");
      return;
    }
    setImportLoading(true);
    setImportResult("");
    try {
      const res = await fetch("/api/admin/import/local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId: selectedTournamentId, matches: parsed }),
      });
      const data = await res.json();
      if (data.success) {
        setImportResult(`成功导入 ${data.data.imported} 场比赛`);
        loadData();
      } else {
        alert(data.error || "导入失败");
      }
    } catch {
      alert("网络错误");
    } finally {
      setImportLoading(false);
    }
  };

  const openOddsModal = (match: Match) => {
    setSelectedMatch(match);
    const o = match.odds;
    const form: Record<string, string> = {
      x1xHome: o.x1x.home?.toString() || "",
      x1xDraw: o.x1x.draw?.toString() || "",
      x1xAway: o.x1x.away?.toString() || "",
    };

    // Handicap — extract handicap value from existing keys (e.g. "-1:home" → "-1")
    const hcKeys = Object.keys(o.handicapX1x);
    if (hcKeys.length > 0) {
      const hcValue = hcKeys[0].split(":")[0];
      form.hcValue = hcValue;
      form.hcHome = o.handicapX1x[`${hcValue}:home`]?.toString() || "";
      form.hcDraw = o.handicapX1x[`${hcValue}:draw`]?.toString() || "";
      form.hcAway = o.handicapX1x[`${hcValue}:away`]?.toString() || "";
    } else {
      form.hcValue = "-1";
    }

    // Half/Full
    const hfOptions = ["胜胜", "胜平", "胜负", "平胜", "平平", "平负", "负胜", "负平", "负负"];
    for (const opt of hfOptions) {
      form[`hf_${opt}`] = o.halfFull.find((h) => h.label === opt)?.value?.toString() || "";
    }

    // Total Goals
    const tgOptions = ["0球", "1球", "2球", "3球", "4球", "5球", "6球", "7+"];
    for (const opt of tgOptions) {
      form[`tg_${opt}`] = o.totalGoals.find((g) => g.label === opt)?.value?.toString() || "";
    }

    // Correct Score
    const csOptions = [
      "1:0", "2:0", "2:1", "3:0", "3:1", "3:2", "4:0", "4:1", "4:2", "5:0", "5:1", "5:2",
      "0:0", "1:1", "2:2", "3:3",
      "0:1", "0:2", "1:2", "0:3", "1:3", "2:3", "0:4", "1:4", "2:4", "0:5", "1:5", "2:5",
      "胜其它", "平其它", "负其它",
    ];
    for (const opt of csOptions) {
      form[`cs_${opt}`] = o.correctScore.find((s) => s.label === opt)?.value?.toString() || "";
    }

    setOddsForm(form);
    setShowEditOdds(true);
  };

  const saveOdds = async () => {
    if (!selectedMatch) return;
    const odds: { betType: string; optionKey: string; oddsValue: number }[] = [];

    // X1X
    for (const [key, optKey] of [["x1xHome", "home"], ["x1xDraw", "draw"], ["x1xAway", "away"]] as const) {
      const v = parseFloat(oddsForm[key]);
      if (!isNaN(v)) odds.push({ betType: "X1X", optionKey: optKey, oddsValue: v });
    }

    // Handicap X1X
    const hc = oddsForm.hcValue?.trim();
    if (hc) {
      for (const [key, side] of [["hcHome", "home"], ["hcDraw", "draw"], ["hcAway", "away"]] as const) {
        const v = parseFloat(oddsForm[key]);
        if (!isNaN(v)) odds.push({ betType: "HANDICAP_X1X", optionKey: `${hc}:${side}`, oddsValue: v });
      }
    }

    // Half/Full
    for (const opt of ["胜胜", "胜平", "胜负", "平胜", "平平", "平负", "负胜", "负平", "负负"]) {
      const v = parseFloat(oddsForm[`hf_${opt}`]);
      if (!isNaN(v)) odds.push({ betType: "HALF_FULL", optionKey: opt, oddsValue: v });
    }

    // Total Goals
    for (const opt of ["0球", "1球", "2球", "3球", "4球", "5球", "6球", "7+"]) {
      const v = parseFloat(oddsForm[`tg_${opt}`]);
      if (!isNaN(v)) odds.push({ betType: "TOTAL_GOALS", optionKey: opt, oddsValue: v });
    }

    // Correct Score
    for (const opt of [
      "1:0", "2:0", "2:1", "3:0", "3:1", "3:2", "4:0", "4:1", "4:2", "5:0", "5:1", "5:2",
      "0:0", "1:1", "2:2", "3:3",
      "0:1", "0:2", "1:2", "0:3", "1:3", "2:3", "0:4", "1:4", "2:4", "0:5", "1:5", "2:5",
      "胜其它", "平其它", "负其它",
    ]) {
      const v = parseFloat(oddsForm[`cs_${opt}`]);
      if (!isNaN(v)) odds.push({ betType: "CORRECT_SCORE", optionKey: opt, oddsValue: v });
    }

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
    const finalHomeScore = settleForm.finalHomeScore === "" ? undefined : Number(settleForm.finalHomeScore);
    const finalAwayScore = settleForm.finalAwayScore === "" ? undefined : Number(settleForm.finalAwayScore);
    if (isNaN(homeScore) || isNaN(awayScore)) return;

    const res = await fetch("/api/admin/matches/settle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: settleMatchData.id, homeScore, awayScore, halfHomeScore, halfAwayScore, finalHomeScore, finalAwayScore }),
    });
    const data = await res.json();
    if (data.success) {
      setShowSettle(false);
      setSettleForm({ homeScore: "", awayScore: "", halfHomeScore: "", halfAwayScore: "", finalHomeScore: "", finalAwayScore: "" });
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
            从本地数据导入
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
                                  <span className="text-xs num font-semibold">
                                    {m.homeScore}:{m.awayScore}
                                    {m.finalHomeScore !== null && m.finalAwayScore !== null &&
                                      (m.finalHomeScore !== m.homeScore || m.finalAwayScore !== m.awayScore) && (
                                      <span className="text-text-muted font-normal ml-1">({m.finalHomeScore}:{m.finalAwayScore})</span>
                                    )}
                                  </span>
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
        <Modal onClose={() => setShowEditOdds(false)} title={`编辑赔率 · ${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam}`} wide>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {/* X1X */}
            <div>
              <label className="text-xs text-text-secondary mb-2 block font-medium">胜负 (X1X)</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  ["x1xHome", "主胜"], ["x1xDraw", "平局"], ["x1xAway", "客胜"],
                ] as const).map(([key, label]) => (
                  <div key={key}>
                    <span className="text-[10px] text-text-muted block mb-1">{label}</span>
                    <input type="number" step="0.01" value={oddsForm[key] || ""} onChange={(e) => setOddsForm({ ...oddsForm, [key]: e.target.value })} className="input-field w-full rounded-lg px-3 py-2 text-sm num" placeholder="0.00" />
                  </div>
                ))}
              </div>
            </div>

            {/* Handicap X1X */}
            <div>
              <label className="text-xs text-text-secondary mb-2 block font-medium">让球胜平负 (HANDICAP)</label>
              <div className="mb-2 flex items-center">
                <span className="text-[10px] text-text-muted">让球值</span>
                <input type="text" value={oddsForm.hcValue || ""} onChange={(e) => setOddsForm({ ...oddsForm, hcValue: e.target.value })} className="input-field w-20 rounded-lg px-2 py-1.5 text-sm num ml-2" placeholder="-1" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {([
                  ["hcHome", "主胜"], ["hcDraw", "平局"], ["hcAway", "客胜"],
                ] as const).map(([key, label]) => (
                  <div key={key}>
                    <span className="text-[10px] text-text-muted block mb-1">{label}</span>
                    <input type="number" step="0.01" value={oddsForm[key] || ""} onChange={(e) => setOddsForm({ ...oddsForm, [key]: e.target.value })} className="input-field w-full rounded-lg px-3 py-2 text-sm num" placeholder="0.00" />
                  </div>
                ))}
              </div>
            </div>

            {/* Half/Full */}
            <div>
              <label className="text-xs text-text-secondary mb-2 block font-medium">半全场</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  ["hf_胜胜", "胜-胜"], ["hf_胜平", "胜-平"], ["hf_胜负", "胜-负"],
                  ["hf_平胜", "平-胜"], ["hf_平平", "平-平"], ["hf_平负", "平-负"],
                  ["hf_负胜", "负-胜"], ["hf_负平", "负-平"], ["hf_负负", "负-负"],
                ] as const).map(([key, label]) => (
                  <div key={key}>
                    <span className="text-[10px] text-text-muted block mb-1">{label}</span>
                    <input type="number" step="0.01" value={oddsForm[key] || ""} onChange={(e) => setOddsForm({ ...oddsForm, [key]: e.target.value })} className="input-field w-full rounded-lg px-3 py-2 text-sm num" placeholder="0.00" />
                  </div>
                ))}
              </div>
            </div>

            {/* Total Goals */}
            <div>
              <label className="text-xs text-text-secondary mb-2 block font-medium">总进球数</label>
              <div className="grid grid-cols-4 gap-2">
                {([
                  ["tg_0球", "0球"], ["tg_1球", "1球"], ["tg_2球", "2球"], ["tg_3球", "3球"],
                  ["tg_4球", "4球"], ["tg_5球", "5球"], ["tg_6球", "6球"], ["tg_7+", "7+"],
                ] as const).map(([key, label]) => (
                  <div key={key}>
                    <span className="text-[10px] text-text-muted block mb-1">{label}</span>
                    <input type="number" step="0.01" value={oddsForm[key] || ""} onChange={(e) => setOddsForm({ ...oddsForm, [key]: e.target.value })} className="input-field w-full rounded-lg px-3 py-2 text-sm num" placeholder="0.00" />
                  </div>
                ))}
              </div>
            </div>

            {/* Correct Score */}
            <div>
              <label className="text-xs text-text-secondary mb-2 block font-medium">猜比分</label>
              <div className="space-y-1.5">
                <span className="text-[10px] text-accent">主胜</span>
                <div className="grid grid-cols-6 gap-1.5">
                  {([
                    ["cs_1:0", "1:0"], ["cs_2:0", "2:0"], ["cs_2:1", "2:1"], ["cs_3:0", "3:0"],
                    ["cs_3:1", "3:1"], ["cs_3:2", "3:2"], ["cs_4:0", "4:0"], ["cs_4:1", "4:1"],
                    ["cs_4:2", "4:2"], ["cs_5:0", "5:0"], ["cs_5:1", "5:1"], ["cs_5:2", "5:2"],
                  ] as const).map(([key, label]) => (
                    <div key={key}>
                      <span className="text-[10px] text-text-muted block mb-0.5">{label}</span>
                      <input type="number" step="0.01" value={oddsForm[key] || ""} onChange={(e) => setOddsForm({ ...oddsForm, [key]: e.target.value })} className="input-field w-full rounded px-2 py-1.5 text-xs num" placeholder="0.00" />
                    </div>
                  ))}
                </div>
                <span className="text-[10px] text-yellow-500">平局</span>
                <div className="grid grid-cols-6 gap-1.5">
                  {([
                    ["cs_0:0", "0:0"], ["cs_1:1", "1:1"], ["cs_2:2", "2:2"], ["cs_3:3", "3:3"],
                  ] as const).map(([key, label]) => (
                    <div key={key}>
                      <span className="text-[10px] text-text-muted block mb-0.5">{label}</span>
                      <input type="number" step="0.01" value={oddsForm[key] || ""} onChange={(e) => setOddsForm({ ...oddsForm, [key]: e.target.value })} className="input-field w-full rounded px-2 py-1.5 text-xs num" placeholder="0.00" />
                    </div>
                  ))}
                </div>
                <span className="text-[10px] text-red">客胜</span>
                <div className="grid grid-cols-6 gap-1.5">
                  {([
                    ["cs_0:1", "0:1"], ["cs_0:2", "0:2"], ["cs_1:2", "1:2"], ["cs_0:3", "0:3"],
                    ["cs_1:3", "1:3"], ["cs_2:3", "2:3"], ["cs_0:4", "0:4"], ["cs_1:4", "1:4"],
                    ["cs_2:4", "2:4"], ["cs_0:5", "0:5"], ["cs_1:5", "1:5"], ["cs_2:5", "2:5"],
                  ] as const).map(([key, label]) => (
                    <div key={key}>
                      <span className="text-[10px] text-text-muted block mb-0.5">{label}</span>
                      <input type="number" step="0.01" value={oddsForm[key] || ""} onChange={(e) => setOddsForm({ ...oddsForm, [key]: e.target.value })} className="input-field w-full rounded px-2 py-1.5 text-xs num" placeholder="0.00" />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-1.5 mt-1">
                  {([
                    ["cs_胜其它", "胜其它"], ["cs_平其它", "平其它"], ["cs_负其它", "负其它"],
                  ] as const).map(([key, label]) => (
                    <div key={key}>
                      <span className="text-[10px] text-text-muted block mb-0.5">{label}</span>
                      <input type="number" step="0.01" value={oddsForm[key] || ""} onChange={(e) => setOddsForm({ ...oddsForm, [key]: e.target.value })} className="input-field w-full rounded px-2 py-1.5 text-xs num" placeholder="0.00" />
                    </div>
                  ))}
                </div>
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
              <div className="mb-2 text-xs font-semibold text-text-secondary">半场比分</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-text-secondary text-xs mb-1.5 block">{settleMatchData.homeTeam}</label>
                  <input type="number" value={settleForm.halfHomeScore} onChange={(e) => setSettleForm({ ...settleForm, halfHomeScore: e.target.value })} className="input-field w-full rounded-xl px-4 py-3 text-sm num" placeholder="0" />
                </div>
                <div>
                  <label className="text-text-secondary text-xs mb-1.5 block">{settleMatchData.awayTeam}</label>
                  <input type="number" value={settleForm.halfAwayScore} onChange={(e) => setSettleForm({ ...settleForm, halfAwayScore: e.target.value })} className="input-field w-full rounded-xl px-4 py-3 text-sm num" placeholder="0" />
                </div>
              </div>
            </div>
            <div>
              <div className="mb-2 text-xs font-semibold text-text-secondary">全场比分（90分钟）<span className="text-accent ml-1">*用于结算</span></div>
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
              <div className="mb-2 text-xs font-semibold text-text-secondary">最终比分（含加时/点球）<span className="text-text-muted ml-1">仅记录，不参与结算</span></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-text-secondary text-xs mb-1.5 block">{settleMatchData.homeTeam}</label>
                  <input type="number" value={settleForm.finalHomeScore} onChange={(e) => setSettleForm({ ...settleForm, finalHomeScore: e.target.value })} className="input-field w-full rounded-xl px-4 py-3 text-sm num" placeholder="可选" />
                </div>
                <div>
                  <label className="text-text-secondary text-xs mb-1.5 block">{settleMatchData.awayTeam}</label>
                  <input type="number" value={settleForm.finalAwayScore} onChange={(e) => setSettleForm({ ...settleForm, finalAwayScore: e.target.value })} className="input-field w-full rounded-xl px-4 py-3 text-sm num" placeholder="可选" />
                </div>
              </div>
            </div>
            <p className="text-text-muted text-xs">结算依据半场+全场（90分钟）比分。最终比分仅作记录。</p>
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
        <Modal onClose={() => { setShowImport(false); setImportResult(""); }} title="从本地数据导入">
          <div className="space-y-4">
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
            <div>
              <label className="text-text-secondary text-xs mb-1.5 block">比赛数据 (JSON)</label>
              <textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                rows={12}
                className="input-field w-full rounded-xl px-4 py-3 text-xs font-mono num leading-relaxed"
                placeholder={`[
  {
    "apiMatchId": "500-001",
    "matchNo": "周二201",
    "homeTeam": "巴西",
    "awayTeam": "德国",
    "kickoffTime": "2026-06-03T00:00:00+08:00",
    "handicap": -1,
    "odds": [
      { "betType": "X1X", "optionKey": "home", "oddsValue": 2.57 },
      { "betType": "X1X", "optionKey": "draw", "oddsValue": 2.85 },
      { "betType": "X1X", "optionKey": "away", "oddsValue": 2.57 }
    ]
  }
]`}
              />
            </div>
            <button
              disabled={!selectedTournamentId || !importJson.trim() || importLoading}
              onClick={handleLocalImport}
              className="btn-primary w-full py-3 rounded-xl text-sm disabled:opacity-40"
            >
              {importLoading ? "导入中..." : "确认导入"}
            </button>
            {importResult && (
              <div className="text-accent text-xs text-center">{importResult}</div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose, wide }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 modal-overlay flex items-center justify-center p-4">
      <div className={`bg-bg-surface w-full rounded-2xl p-6 animate-fade-in-up ${wide ? "max-w-lg" : "max-w-md"}`}>
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
