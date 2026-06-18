"use client";

import { useState, useEffect } from "react";
import { displayTeamName } from "@/lib/team-display";
import { AdminMobileTopBar } from "@/components/admin/mobile-nav";
import { InlineFullscreen } from "@/components/admin/inline-fullscreen";
import { Sheet } from "@/components/admin/sheet";

interface Tournament {
  id:number;
  name: string;
  leagueId:number;
  season: string;
  startDate: string;
  endDate: string;
  status: string;
  _count: { matches:number };
}

interface Match {
  id:number;
  tournamentId:number;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo: string | null;
  awayTeamLogo: string | null;
  kickoffTime: string;
  status: string;
  homeScore:number | null;
  awayScore:number | null;
  halfHomeScore:number | null;
  halfAwayScore:number | null;
  finalHomeScore:number | null;
  finalAwayScore:number | null;
  odds: {
    x1x: Record<string,number>;
    handicapX1x: Record<string,number>;
    halfFull: { label: string; value:number }[];
    totalGoals: { label: string; value:number }[];
    correctScore: { label: string; value:number }[];
  };
}

interface LocalMatch {
  apiMatchId: string;
  matchNo?: string;
  homeTeam: string;
  awayTeam: string;
  kickoffTime: string;
  handicap?:number;
  odds: { betType: string; optionKey: string; oddsValue:number }[];
}

type PullKind = "ODDS" | "RESULTS";
type PullStatus = "SUCCESS" | "FAILED";

type OddsPullItem = {
  matchNo: string;
  apiMatchId: string;
  matchId?: number;
  homeTeam: string;
  awayTeam: string;
  kickoffTime: string;
  handicap: number | null;
  action: "updated" | "created";
  matchedBy: "apiMatchId" | "fuzzy" | "created";
  marketCounts: Record<string, number>;
  oddsCount: number;
};

type ResultsPullItem = {
  matchNo: string;
  apiMatchId: string;
  matchId?: number;
  homeTeam: string;
  awayTeam: string;
  kickoffDate: string;
  homeScore: number;
  awayScore: number;
  halfHomeScore: number;
  halfAwayScore: number;
  action: "settled" | "skipped";
  matchedBy: "apiMatchId" | "fuzzy" | "none";
  reason?: "no_matching_match" | "already_finished_without_pending_items";
};

type PullOutcome = {
  kind: PullKind;
  status: PullStatus;
  importDate: string;
  fetched: number;
  updated?: number;
  created?: number;
  settled?: number;
  skipped?: number;
  message?: string | null;
  error?: string | null;
  items: (OddsPullItem | ResultsPullItem)[];
  merge?: {
    minDate: string;
    mergedGroups: number;
    deletedMatches: number;
    migratedBetItems: number;
    dedupedBetItems: number;
  };
};

type PullLog = PullOutcome & {
  id: number;
  batchId: string | null;
  source: string;
  trigger: "MANUAL" | "SCHEDULED";
  startedAt: string;
  finishedAt: string;
  createdAt: string;
};

function getBeijingDate(offsetDays = 0) {
  const date = new Date(Date.now() + (8 * 3600 + offsetDays * 86400) * 1000);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function getBeijingTodayStartMs() {
  const beijingNow = new Date(Date.now() + 8 * 3600 * 1000);
  return Date.UTC(beijingNow.getUTCFullYear(), beijingNow.getUTCMonth(), beijingNow.getUTCDate(), -8, 0, 0, 0);
}

function isMatchPast(kickoffTime: string) {
  return new Date(kickoffTime).getTime() < getBeijingTodayStartMs();
}

export default function AdminTournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTournament, setExpandedTournament] = useState<number | null>(null);
  const [expandedPast, setExpandedPast] = useState<Set<number>>(new Set());

  const togglePast = (tournamentId: number) => {
    setExpandedPast((prev) => {
      const next = new Set(prev);
      if (next.has(tournamentId)) next.delete(tournamentId);
      else next.add(tournamentId);
      return next;
    });
  };

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

  // 500.com fetch
  const [fetch500Loading, setFetch500Loading] = useState(false);
  const [fetchResultsLoading, setFetchResultsLoading] = useState(false);
  const [pullOutcome, setPullOutcome] = useState<PullOutcome | null>(null);
  const [scheduledPullLogs, setScheduledPullLogs] = useState<PullLog[]>([]);
  const [scheduledPullLogsLoading, setScheduledPullLogsLoading] = useState(true);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [showLogSheet, setShowLogSheet] = useState(false);

  useEffect(() => {
    loadData();
    loadScheduledPullLogs();
  }, []);

  async function loadData() {
    setLoading(true);
    const [tRes, mRes] = await Promise.all([
      fetch("/api/admin/tournaments"),
      fetch("/api/matches"),
    ]);
    const [tData, mData] = await Promise.all([tRes.json(), mRes.json()]);
    if (tData.success) {
      const rows = tData.data || [];
      setTournaments(rows);
      setExpandedTournament((current) => current ?? rows[0]?.id ?? null);
    }
    if (mData.success) setMatches(mData.data || []);
    setLoading(false);
  }

  async function loadScheduledPullLogs() {
    setScheduledPullLogsLoading(true);
    try {
      const res = await fetch("/api/admin/pull-logs?trigger=SCHEDULED&limit=20");
      const data = await res.json();
      if (data.success) setScheduledPullLogs(data.data || []);
    } finally {
      setScheduledPullLogsLoading(false);
    }
  }

  const getMatchesForTournament = (tournamentId:number) =>
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

  const handleDedup = async () => {
    if (!confirm(`将合并 6/19 及以后的重复赛事：保留最新的一条，把旧条目上的下注迁移过来。继续？`)) return;
    try {
      const res = await fetch("/api/admin/tournaments/dedup", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        const summary = data.data || {};
        const groups = summary.mergedGroups ?? 0;
        const msg = groups > 0
          ? `已合并 ${groups} 组重复赛事（删除 ${summary.deletedMatches ?? 0} 条，迁移下注 ${summary.migratedBetItems ?? 0} 条，清理冲突 ${summary.dedupedBetItems ?? 0} 条）`
          : "没有重复赛事";
        alert(msg);
        loadData();
      } else {
        alert(data.error || "清理失败");
      }
    } catch {
      alert("网络错误");
    }
  };

  const handleFetch500 = async () => {
    if (fetch500Loading) return;
    const date = prompt("请输入日期 (YYYY-MM-DD)：", getBeijingDate());
    if (!date) return;
    setFetch500Loading(true);
    try {
      const res = await fetch("/api/admin/import/500", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date }) });
      const data = await res.json();
      if (data.success) {
        setPullOutcome({ kind: "ODDS", status: "SUCCESS", importDate: date, ...data.data });
        loadData();
        loadScheduledPullLogs();
      } else {
        setPullOutcome({ kind: "ODDS", status: "FAILED", importDate: date, fetched: 0, items: [], error: data.error || "抓取失败" });
      }
    } catch {
      setPullOutcome({ kind: "ODDS", status: "FAILED", importDate: date, fetched: 0, items: [], error: "网络错误" });
    } finally {
      setFetch500Loading(false);
    }
  };

  const handleFetchResults = async () => {
    if (fetchResultsLoading) return;
    const date = prompt("请输入日期 (YYYY-MM-DD)：", getBeijingDate(-1));
    if (!date) return;
    setFetchResultsLoading(true);
    try {
      const res = await fetch("/api/admin/import/results", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date }) });
      const data = await res.json();
      if (data.success) {
        setPullOutcome({ kind: "RESULTS", status: "SUCCESS", importDate: date, ...data.data });
        loadData();
        loadScheduledPullLogs();
      } else {
        setPullOutcome({ kind: "RESULTS", status: "FAILED", importDate: date, fetched: 0, items: [], error: data.error || "抓取失败" });
      }
    } catch {
      setPullOutcome({ kind: "RESULTS", status: "FAILED", importDate: date, fetched: 0, items: [], error: "网络错误" });
    } finally {
      setFetchResultsLoading(false);
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
    const odds: { betType: string; optionKey: string; oddsValue:number }[] = [];

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

  const renderMatchRow = (m: Match) => {
    const kickoff = new Date(m.kickoffTime);
    const timeStr = kickoff.toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    const mobileTimeStr = kickoff.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
    const isFinished = m.status === "FINISHED";
    const hasStarted = kickoff.getTime() <= Date.now();
    const hasOdds = Object.keys(m.odds.x1x).length > 0;
    const statusText = isFinished
      ? m.homeScore !== null
        ? `${m.homeScore} : ${m.awayScore} · 已结算`
        : "已结算"
      : hasStarted
        ? "进行中"
        : hasOdds
          ? "未开赛 · 赔率已配"
          : "未开赛 · 赔率待配";
    return (
      <div key={m.id} className="bg-bg-primary md:rounded-lg px-3.5 md:px-3 py-2.5 border-t border-border/60 first:border-t-0 md:border-t-0 md:flex md:items-center md:justify-between">
        <div className="md:hidden flex items-center gap-2 min-w-0">
          <div className="w-10 shrink-0 text-[11px] text-text-muted font-display num">{mobileTimeStr}</div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium truncate">{displayTeamName(m.homeTeam)} vs {displayTeamName(m.awayTeam)}</div>
            <div className={`text-[11px] mt-0.5 ${isFinished ? "text-emerald-500" : hasStarted ? "text-red" : "text-text-secondary"}`}>{statusText}</div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!isFinished && (
              <button
                onClick={() => openOddsModal(m)}
                className={`text-xs px-2 py-1 rounded-md ${hasOdds ? "btn-ghost" : "btn-primary"}`}
              >
                {hasOdds ? "赔率" : "配置"}
              </button>
            )}
            <button
              onClick={() => {
                setSettleMatchData(m);
                setSettleForm({
                  homeScore: m.homeScore?.toString() ?? "",
                  awayScore: m.awayScore?.toString() ?? "",
                  halfHomeScore: m.halfHomeScore?.toString() ?? "",
                  halfAwayScore: m.halfAwayScore?.toString() ?? "",
                  finalHomeScore: m.finalHomeScore?.toString() ?? "",
                  finalAwayScore: m.finalAwayScore?.toString() ?? "",
                });
                setShowSettle(true);
              }}
              className="text-xs px-2 py-1 rounded-md btn-ghost"
            >
              {isFinished ? "查看" : "结算"}
            </button>
          </div>
        </div>

        <div className="hidden md:flex flex-wrap md:flex-nowrap items-center gap-2 flex-1 min-w-0">
          <span className="text-sm text-text-muted whitespace-nowrap">{timeStr}</span>
          <span className="text-sm font-medium truncate max-w-full md:max-w-none">{displayTeamName(m.homeTeam)} vs {displayTeamName(m.awayTeam)}</span>
          {isFinished ? (
            <span className="text-sm bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">已结算</span>
          ) : hasStarted ? (
            <span className="text-sm bg-red/10 text-red px-1.5 py-0.5 rounded">进行中</span>
          ) : (
            <span className="text-sm bg-accent/10 text-accent px-1.5 py-0.5 rounded">未开赛</span>
          )}
          {isFinished && m.homeScore !== null && (
            <span className="text-sm font-semibold">
              {m.homeScore}:{m.awayScore}
              {m.finalHomeScore !== null && m.finalAwayScore !== null &&
                (m.finalHomeScore !== m.homeScore || m.finalAwayScore !== m.awayScore) && (
                <span className="text-text-muted font-normal ml-1">({m.finalHomeScore}:{m.finalAwayScore})</span>
              )}
            </span>
          )}
          {hasOdds && (
            <span className="text-sm bg-green/10 text-green px-1.5 py-0.5 rounded">已设赔率</span>
          )}
        </div>
        <div className="hidden md:flex md:items-center gap-1.5 md:ml-2 shrink-0">
          {!isFinished && (
            <button
              onClick={() => openOddsModal(m)}
              className="text-sm px-2 py-1 rounded bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors"
            >
              {hasOdds ? "编辑赔率" : "设置赔率"}
            </button>
          )}
          <button
            onClick={() => {
              setSettleMatchData(m);
              setSettleForm({
                homeScore: m.homeScore?.toString() ?? "",
                awayScore: m.awayScore?.toString() ?? "",
                halfHomeScore: m.halfHomeScore?.toString() ?? "",
                halfAwayScore: m.halfAwayScore?.toString() ?? "",
                finalHomeScore: m.finalHomeScore?.toString() ?? "",
                finalAwayScore: m.finalAwayScore?.toString() ?? "",
              });
              setShowSettle(true);
            }}
            className="text-sm px-2 py-1 rounded bg-gold/10 text-gold hover:bg-gold/20 transition-colors"
          >
            {isFinished ? "修改结算" : "结算"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <AdminMobileTopBar
        title="赛事管理"
        right={
          <>
            <button
              type="button"
              onClick={() => setShowCreateTournament(true)}
              className="btn-primary px-3 py-1.5 rounded-lg text-xs"
            >
              新建
            </button>
            <button
              type="button"
              onClick={() => setShowMobileActions(true)}
              aria-label="更多操作"
              className="p-2 -my-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 5v.01M12 12v.01M12 19v.01" />
              </svg>
            </button>
          </>
        }
      />

      <Sheet open={showMobileActions} onClose={() => setShowMobileActions(false)} title="赛事操作" size="sm">
        <div className="space-y-1.5">
          <MobileActionButton label={fetch500Loading ? "抓取中..." : "更新世界杯赔率"} disabled={fetch500Loading} onClick={() => { setShowMobileActions(false); handleFetch500(); }} />
          <MobileActionButton label={fetchResultsLoading ? "抓取中..." : "更新赛果"} disabled={fetchResultsLoading} onClick={() => { setShowMobileActions(false); handleFetchResults(); }} />
          <MobileActionButton label="合并重复赛事（≥6/19）" danger onClick={() => { setShowMobileActions(false); handleDedup(); }} />
          <MobileActionButton label="从本地数据导入" onClick={() => { setShowMobileActions(false); setShowImport(true); }} />
          <MobileActionButton label="查看定时拉取日志" onClick={() => { setShowMobileActions(false); setShowLogSheet(true); }} />
        </div>
      </Sheet>

      <Sheet open={showLogSheet} onClose={() => setShowLogSheet(false)} title="定时拉取日志" size="lg">
        <ScheduledPullLogPanel logs={scheduledPullLogs} loading={scheduledPullLogsLoading} onRefresh={loadScheduledPullLogs} compact />
      </Sheet>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_440px] items-start mt-3 md:mt-0">
        <div className="min-w-0">
      <div className="hidden md:flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-lg font-semibold">赛事管理</h2>
          <p className="text-text-muted text-sm mt-1">管理赛事、比赛和赔率</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={handleFetch500}
            disabled={fetch500Loading}
            className="px-4 py-2 rounded-lg text-sm bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors disabled:opacity-40"
          >
            {fetch500Loading ? "抓取中..." : "更新世界杯赔率"}
          </button>
          <button
            onClick={handleFetchResults}
            disabled={fetchResultsLoading}
            className="px-4 py-2 rounded-lg text-sm bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors disabled:opacity-40"
          >
            {fetchResultsLoading ? "抓取中..." : "更新赛果"}
          </button>
          <button
            onClick={handleDedup}
            className="px-4 py-2 rounded-lg text-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
          >
            合并重复赛事（≥6/19）
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="px-4 py-2 rounded-lg text-sm bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
          >
            从本地数据导入
          </button>
          <button
            onClick={() => setShowCreateTournament(true)}
            className="btn-primary px-4 py-2 rounded-lg text-sm"
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
                  className={`w-full px-3.5 md:px-5 py-3 md:py-4 flex items-center justify-between gap-2 text-left ${isExpanded ? "border-b border-border" : ""}`}
                >
                  <div className="min-w-0">
                    <h3 className="font-display font-semibold text-[15px] md:text-sm truncate">{t.name}</h3>
                    <div className="text-[11px] md:text-sm text-text-muted mt-0.5">
                      {tMatches.length} 场比赛 · {tMatches.filter((m) => m.status === "FINISHED").length} 已结算
                      <span className="hidden md:inline"> · League ID: {t.leagueId} · 赛季: {t.season} · {t.startDate.slice(0, 10)} ~ {t.endDate.slice(0, 10)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`hidden md:inline-flex text-sm px-2 py-0.5 rounded-full font-medium ${
                      t.status === "ACTIVE" ? "bg-accent/15 text-accent" : "text-text-muted bg-bg-elevated"
                    }`}>
                      {t.status === "ACTIVE" ? "进行中" : t.status === "UPCOMING" ? "未开始" : "已结束"}
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-0 md:px-5 pb-2 md:pb-4">
                    <div className="flex items-center justify-between px-3.5 md:px-0 py-2.5 md:py-3">
                      <span className="text-xs md:text-sm text-text-secondary">比赛列表</span>
                      <button
                        onClick={() => { setSelectedTournamentId(t.id); setShowCreateMatch(true); }}
                        className="text-xs md:text-sm bg-accent/10 text-accent px-2.5 py-1 rounded-lg hover:bg-accent/20 transition-colors"
                      >
                        + 添加比赛
                      </button>
                    </div>
                    {tMatches.length === 0 ? (
                      <div className="text-text-muted text-sm py-2">暂无比赛</div>
                    ) : (
                      (() => {
                        const past = tMatches.filter((m) => isMatchPast(m.kickoffTime));
                        const current = tMatches.filter((m) => !isMatchPast(m.kickoffTime));
                        const isPastExpanded = expandedPast.has(t.id);
                        return (
                          <div className="space-y-0 md:space-y-2">
                            {past.length > 0 && (
                              <div className="space-y-0 md:space-y-2">
                                <button
                                  onClick={() => togglePast(t.id)}
                                  className="w-full flex items-center justify-between text-left text-sm text-text-secondary hover:text-text-primary transition-colors py-2 px-3 rounded-lg bg-bg-elevated/50"
                                >
                                  <span>历史比赛 · {past.length} 场</span>
                                  <span className="text-text-muted">{isPastExpanded ? "收起 ↑" : "展开 ↓"}</span>
                                </button>
                                {isPastExpanded && past.map(renderMatchRow)}
                              </div>
                            )}
                            {current.length > 0
                              ? current.map(renderMatchRow)
                              : <div className="text-text-muted text-sm py-2">今日及之后暂无比赛</div>}
                          </div>
                        );
                      })()
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
        </div>
        <div className="hidden xl:block">
          <ScheduledPullLogPanel logs={scheduledPullLogs} loading={scheduledPullLogsLoading} onRefresh={loadScheduledPullLogs} />
        </div>
      </div>

      {/* Pull Outcome Sheet */}
      <Sheet
        open={!!pullOutcome}
        onClose={() => setPullOutcome(null)}
        title={pullOutcome ? `${pullOutcome.kind === "ODDS" ? "更新世界杯赔率" : "更新赛果"} · ${pullOutcome.importDate}` : "拉取结果"}
        size="lg"
      >
        {pullOutcome && <PullOutcomeContent outcome={pullOutcome} />}
      </Sheet>

      {/* Create Tournament Sheet */}
      <Sheet
        open={showCreateTournament}
        onClose={() => setShowCreateTournament(false)}
        title="新建赛事"
        size="md"
      >
        <div className="space-y-3">
            <div>
              <label className="text-text-secondary text-sm mb-1.5 block">赛事名称</label>
              <input value={tournamentForm.name} onChange={(e) => setTournamentForm({ ...tournamentForm, name: e.target.value })} placeholder="如：2026 FIFA 世界杯" className="input-field w-full rounded-xl px-4 py-3 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-text-secondary text-sm mb-1.5 block">League ID</label>
                <input value={tournamentForm.leagueId} onChange={(e) => setTournamentForm({ ...tournamentForm, leagueId: e.target.value })} placeholder="1" className="input-field w-full rounded-xl px-4 py-3 text-sm" />
              </div>
              <div>
                <label className="text-text-secondary text-sm mb-1.5 block">赛季</label>
                <input value={tournamentForm.season} onChange={(e) => setTournamentForm({ ...tournamentForm, season: e.target.value })} placeholder="2026" className="input-field w-full rounded-xl px-4 py-3 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-text-secondary text-sm mb-1.5 block">开始日期</label>
                <input type="date" value={tournamentForm.startDate} onChange={(e) => setTournamentForm({ ...tournamentForm, startDate: e.target.value })} className="input-field w-full rounded-xl px-4 py-3 text-sm" />
              </div>
              <div>
                <label className="text-text-secondary text-sm mb-1.5 block">结束日期</label>
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
      </Sheet>

      {/* Create Match Sheet */}
      <Sheet
        open={showCreateMatch}
        onClose={() => setShowCreateMatch(false)}
        title="手动添加比赛"
        size="md"
      >
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-text-secondary text-sm mb-1.5 block">主队</label>
                <input value={matchForm.homeTeam} onChange={(e) => setMatchForm({ ...matchForm, homeTeam: e.target.value })} placeholder="如：巴西" className="input-field w-full rounded-xl px-4 py-3 text-sm" />
              </div>
              <div>
                <label className="text-text-secondary text-sm mb-1.5 block">客队</label>
                <input value={matchForm.awayTeam} onChange={(e) => setMatchForm({ ...matchForm, awayTeam: e.target.value })} placeholder="如：德国" className="input-field w-full rounded-xl px-4 py-3 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-text-secondary text-sm mb-1.5 block">开赛时间</label>
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
      </Sheet>

      {/* Edit Odds */}
      <InlineFullscreen
        open={showEditOdds && !!selectedMatch}
        onClose={() => setShowEditOdds(false)}
        title={selectedMatch ? `编辑赔率 · ${displayTeamName(selectedMatch.homeTeam)} vs ${displayTeamName(selectedMatch.awayTeam)}` : "编辑赔率"}
        onSave={saveOdds}
        saveLabel="保存"
      >
        {selectedMatch && (
          <div className="space-y-4 p-4 md:p-6">
            {/* X1X */}
            <div>
              <label className="text-sm text-text-secondary mb-2 block font-medium">胜负 (X1X)</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  ["x1xHome", "主胜"], ["x1xDraw", "平局"], ["x1xAway", "客胜"],
                ] as const).map(([key, label]) => (
                  <div key={key}>
                    <span className="text-sm text-text-muted block mb-1">{label}</span>
                    <input type="number" step="0.01" value={oddsForm[key] || ""} onChange={(e) => setOddsForm({ ...oddsForm, [key]: e.target.value })} className="input-field w-full rounded-lg px-3 py-2 text-sm" placeholder="0.00" />
                  </div>
                ))}
              </div>
            </div>

            {/* Handicap X1X */}
            <div>
              <label className="text-sm text-text-secondary mb-2 block font-medium">让球胜平负 (HANDICAP)</label>
              <div className="mb-2 flex items-center">
                <span className="text-sm text-text-muted">让球值</span>
                <input type="text" value={oddsForm.hcValue || ""} onChange={(e) => setOddsForm({ ...oddsForm, hcValue: e.target.value })} className="input-field w-20 rounded-lg px-2 py-1.5 text-sm ml-2" placeholder="-1" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {([
                  ["hcHome", "主胜"], ["hcDraw", "平局"], ["hcAway", "客胜"],
                ] as const).map(([key, label]) => (
                  <div key={key}>
                    <span className="text-sm text-text-muted block mb-1">{label}</span>
                    <input type="number" step="0.01" value={oddsForm[key] || ""} onChange={(e) => setOddsForm({ ...oddsForm, [key]: e.target.value })} className="input-field w-full rounded-lg px-3 py-2 text-sm" placeholder="0.00" />
                  </div>
                ))}
              </div>
            </div>

            {/* Correct Score */}
            <div>
              <label className="text-sm text-text-secondary mb-2 block font-medium">猜比分</label>
              <div className="space-y-1.5">
                <span className="text-sm text-accent">主胜</span>
                <div className="grid grid-cols-4 md:grid-cols-7 gap-1.5">
                  {([
                    ["cs_1:0", "1:0"], ["cs_2:0", "2:0"], ["cs_2:1", "2:1"], ["cs_3:0", "3:0"],
                    ["cs_3:1", "3:1"], ["cs_3:2", "3:2"], ["cs_4:0", "4:0"], ["cs_4:1", "4:1"],
                    ["cs_4:2", "4:2"], ["cs_5:0", "5:0"], ["cs_5:1", "5:1"], ["cs_5:2", "5:2"],
                  ] as const).map(([key, label]) => (
                    <div key={key}>
                      <span className="text-sm text-text-muted block mb-0.5">{label}</span>
                      <input type="number" step="0.01" value={oddsForm[key] || ""} onChange={(e) => setOddsForm({ ...oddsForm, [key]: e.target.value })} className="input-field w-full rounded px-2 py-1.5 text-sm" placeholder="0.00" />
                    </div>
                  ))}
                </div>
                <span className="text-sm text-yellow-500">平局</span>
                <div className="grid grid-cols-4 md:grid-cols-7 gap-1.5">
                  {([
                    ["cs_0:0", "0:0"], ["cs_1:1", "1:1"], ["cs_2:2", "2:2"], ["cs_3:3", "3:3"],
                  ] as const).map(([key, label]) => (
                    <div key={key}>
                      <span className="text-sm text-text-muted block mb-0.5">{label}</span>
                      <input type="number" step="0.01" value={oddsForm[key] || ""} onChange={(e) => setOddsForm({ ...oddsForm, [key]: e.target.value })} className="input-field w-full rounded px-2 py-1.5 text-sm" placeholder="0.00" />
                    </div>
                  ))}
                </div>
                <span className="text-sm text-red">客胜</span>
                <div className="grid grid-cols-4 md:grid-cols-7 gap-1.5">
                  {([
                    ["cs_0:1", "0:1"], ["cs_0:2", "0:2"], ["cs_1:2", "1:2"], ["cs_0:3", "0:3"],
                    ["cs_1:3", "1:3"], ["cs_2:3", "2:3"], ["cs_0:4", "0:4"], ["cs_1:4", "1:4"],
                    ["cs_2:4", "2:4"], ["cs_0:5", "0:5"], ["cs_1:5", "1:5"], ["cs_2:5", "2:5"],
                  ] as const).map(([key, label]) => (
                    <div key={key}>
                      <span className="text-sm text-text-muted block mb-0.5">{label}</span>
                      <input type="number" step="0.01" value={oddsForm[key] || ""} onChange={(e) => setOddsForm({ ...oddsForm, [key]: e.target.value })} className="input-field w-full rounded px-2 py-1.5 text-sm" placeholder="0.00" />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-1.5 mt-1">
                  {([
                    ["cs_胜其它", "胜其它"], ["cs_平其它", "平其它"], ["cs_负其它", "负其它"],
                  ] as const).map(([key, label]) => (
                    <div key={key}>
                      <span className="text-sm text-text-muted block mb-0.5">{label}</span>
                      <input type="number" step="0.01" value={oddsForm[key] || ""} onChange={(e) => setOddsForm({ ...oddsForm, [key]: e.target.value })} className="input-field w-full rounded px-2 py-1.5 text-sm" placeholder="0.00" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Total Goals */}
            <div>
              <label className="text-sm text-text-secondary mb-2 block font-medium">总进球数</label>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                {([
                  ["tg_0球", "0球"], ["tg_1球", "1球"], ["tg_2球", "2球"], ["tg_3球", "3球"],
                  ["tg_4球", "4球"], ["tg_5球", "5球"], ["tg_6球", "6球"], ["tg_7+", "7+"],
                ] as const).map(([key, label]) => (
                  <div key={key}>
                    <span className="text-sm text-text-muted block mb-1">{label}</span>
                    <input type="number" step="0.01" value={oddsForm[key] || ""} onChange={(e) => setOddsForm({ ...oddsForm, [key]: e.target.value })} className="input-field w-full rounded-lg px-3 py-2 text-sm" placeholder="0.00" />
                  </div>
                ))}
              </div>
            </div>

            {/* Half/Full */}
            <div>
              <label className="text-sm text-text-secondary mb-2 block font-medium">半全场</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  ["hf_胜胜", "胜-胜"], ["hf_胜平", "胜-平"], ["hf_胜负", "胜-负"],
                  ["hf_平胜", "平-胜"], ["hf_平平", "平-平"], ["hf_平负", "平-负"],
                  ["hf_负胜", "负-胜"], ["hf_负平", "负-平"], ["hf_负负", "负-负"],
                ] as const).map(([key, label]) => (
                  <div key={key}>
                    <span className="text-sm text-text-muted block mb-1">{label}</span>
                    <input type="number" step="0.01" value={oddsForm[key] || ""} onChange={(e) => setOddsForm({ ...oddsForm, [key]: e.target.value })} className="input-field w-full rounded-lg px-3 py-2 text-sm" placeholder="0.00" />
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </InlineFullscreen>

      {/* Settle Sheet */}
      <Sheet
        open={showSettle && !!settleMatchData}
        onClose={() => setShowSettle(false)}
        title={settleMatchData ? `${settleMatchData.status === "FINISHED" ? "修改结算" : "结算"} · ${displayTeamName(settleMatchData.homeTeam)} vs ${displayTeamName(settleMatchData.awayTeam)}` : "结算"}
        size="sm"
      >
        {settleMatchData && (
          <div className="space-y-3">
            <div>
              <div className="mb-2 text-sm font-semibold text-text-secondary">半场比分</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-text-secondary text-sm mb-1.5 block">{displayTeamName(settleMatchData.homeTeam)}</label>
                  <input type="number" value={settleForm.halfHomeScore} onChange={(e) => setSettleForm({ ...settleForm, halfHomeScore: e.target.value })} className="input-field w-full rounded-xl px-4 py-3 text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="text-text-secondary text-sm mb-1.5 block">{displayTeamName(settleMatchData.awayTeam)}</label>
                  <input type="number" value={settleForm.halfAwayScore} onChange={(e) => setSettleForm({ ...settleForm, halfAwayScore: e.target.value })} className="input-field w-full rounded-xl px-4 py-3 text-sm" placeholder="0" />
                </div>
              </div>
            </div>
            <div>
              <div className="mb-2 text-sm font-semibold text-text-secondary">全场比分（90分钟）<span className="text-accent ml-1">*用于结算</span></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-text-secondary text-sm mb-1.5 block">{displayTeamName(settleMatchData.homeTeam)}</label>
                  <input type="number" value={settleForm.homeScore} onChange={(e) => setSettleForm({ ...settleForm, homeScore: e.target.value })} className="input-field w-full rounded-xl px-4 py-3 text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="text-text-secondary text-sm mb-1.5 block">{displayTeamName(settleMatchData.awayTeam)}</label>
                  <input type="number" value={settleForm.awayScore} onChange={(e) => setSettleForm({ ...settleForm, awayScore: e.target.value })} className="input-field w-full rounded-xl px-4 py-3 text-sm" placeholder="0" />
                </div>
              </div>
            </div>
            <div>
              <div className="mb-2 text-sm font-semibold text-text-secondary">最终比分（含加时/点球）<span className="text-text-muted ml-1">仅记录，不参与结算</span></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-text-secondary text-sm mb-1.5 block">{displayTeamName(settleMatchData.homeTeam)}</label>
                  <input type="number" value={settleForm.finalHomeScore} onChange={(e) => setSettleForm({ ...settleForm, finalHomeScore: e.target.value })} className="input-field w-full rounded-xl px-4 py-3 text-sm" placeholder="可选" />
                </div>
                <div>
                  <label className="text-text-secondary text-sm mb-1.5 block">{displayTeamName(settleMatchData.awayTeam)}</label>
                  <input type="number" value={settleForm.finalAwayScore} onChange={(e) => setSettleForm({ ...settleForm, finalAwayScore: e.target.value })} className="input-field w-full rounded-xl px-4 py-3 text-sm" placeholder="可选" />
                </div>
              </div>
            </div>
            <p className="text-text-muted text-sm">结算依据半场+全场（90分钟）比分。最终比分仅作记录。</p>
            <button
              disabled={settleForm.homeScore === "" || settleForm.awayScore === ""}
              onClick={handleSettle}
              className="btn-primary w-full py-3 rounded-xl text-sm disabled:opacity-40"
            >
              确认结算
            </button>
          </div>
        )}
      </Sheet>

      {/* Import Sheet */}
      <Sheet
        open={showImport}
        onClose={() => { setShowImport(false); setImportResult(""); }}
        title="从本地数据导入"
        size="md"
      >
        <div className="space-y-4">
            <div>
              <label className="text-text-secondary text-sm mb-1.5 block">导入到赛事</label>
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
              <label className="text-text-secondary text-sm mb-1.5 block">比赛数据 (JSON)</label>
              <textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                rows={12}
                className="input-field w-full rounded-xl px-4 py-3 text-sm font-mono leading-relaxed"
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
              <div className="text-accent text-sm text-center">{importResult}</div>
            )}
        </div>
      </Sheet>
    </div>
  );
}

function MobileActionButton({
  label,
  onClick,
  disabled,
  danger,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 ${
        danger ? "text-red hover:bg-red/5" : "text-text-primary hover:bg-bg-elevated"
      }`}
    >
      <span>{label}</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
        <path d="m9 18 6-6-6-6" />
      </svg>
    </button>
  );
}

function PullOutcomeContent({ outcome }: { outcome: PullOutcome }) {
  const isOdds = outcome.kind === "ODDS";
  const items = outcome.items;

  return (
    <div className="space-y-4">
      <div className={`rounded-xl px-4 py-3 ${outcome.status === "SUCCESS" ? "bg-accent/10" : "bg-red/10"}`}>
        <div className={`text-sm font-semibold ${outcome.status === "SUCCESS" ? "text-accent" : "text-red"}`}>
          {outcome.status === "SUCCESS" ? "拉取完成" : "拉取失败"}
        </div>
        <div className="mt-1 text-sm text-text-secondary">
          {outcome.error || outcome.message || (isOdds
            ? `抓取 ${outcome.fetched} 场，更新 ${outcome.updated ?? 0} 场，新建 ${outcome.created ?? 0} 场`
            : `抓取 ${outcome.fetched} 场赛果，已结算 ${outcome.settled ?? 0} 场，跳过 ${outcome.skipped ?? 0} 场`)}
        </div>
      </div>

      {isOdds && outcome.merge && outcome.merge.mergedGroups > 0 && (
        <div className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-600">
          <div className="font-semibold">已合并重复赛事 {outcome.merge.mergedGroups} 组</div>
          <div className="mt-1 text-xs text-text-secondary">
            删除 {outcome.merge.deletedMatches} 条 · 迁移下注 {outcome.merge.migratedBetItems} 条 · 清理冲突 {outcome.merge.dedupedBetItems} 条（{outcome.merge.minDate} 起）
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-text-muted text-sm py-6 text-center">暂无赛事明细</div>
      ) : (
        <div className="max-h-[58vh] overflow-y-auto pr-1 space-y-2">
          {items.map((item) => isOdds
            ? <OddsPullItemRow key={`${item.apiMatchId}-${item.matchId ?? item.matchNo}`} item={item as OddsPullItem} />
            : <ResultsPullItemRow key={`${item.apiMatchId}-${item.matchId ?? item.matchNo}`} item={item as ResultsPullItem} />
          )}
        </div>
      )}
    </div>
  );
}

function ScheduledPullLogPanel({ logs, loading, onRefresh, compact = false }: { logs: PullLog[]; loading: boolean; onRefresh: () => void; compact?: boolean }) {
  return (
    <aside className={`${compact ? "" : "glass rounded-xl p-4 xl:sticky xl:top-6"}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-display text-base font-semibold">定时拉取日志</h3>
          <p className="text-text-muted text-xs mt-0.5">定时拉取时间 03:00 · 06:00 · 09:00 · 12:00 · 15:00（北京时间）</p>
          <p className="text-text-muted text-xs mt-0.5">自动更新记录，赔率不展示具体数值</p>
        </div>
        <button onClick={onRefresh} disabled={loading} className="text-xs px-2.5 py-1 rounded-lg bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors disabled:opacity-40">
          刷新
        </button>
      </div>

      {loading ? (
        <div className="text-text-muted text-sm py-8 text-center">加载日志...</div>
      ) : logs.length === 0 ? (
        <div className="text-text-muted text-sm py-8 text-center">暂无定时拉取日志</div>
      ) : (
        <div className="space-y-3 max-h-[calc(100vh-160px)] overflow-y-auto pr-1">
          {logs.map((log) => (
            <div key={log.id} className="rounded-xl bg-bg-primary border border-border/60 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${log.kind === "ODDS" ? "bg-green/10 text-green" : "bg-blue-500/10 text-blue-400"}`}>
                      {log.kind === "ODDS" ? "赔率" : "赛果"}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${log.status === "SUCCESS" ? "bg-accent/10 text-accent" : "bg-red/10 text-red"}`}>
                      {log.status === "SUCCESS" ? "成功" : "失败"}
                    </span>
                  </div>
                  <div className="mt-1 text-sm font-medium">{formatLogTime(log.startedAt)}</div>
                  <div className="text-xs text-text-muted">导入日期 {log.importDate}</div>
                </div>
                <div className="text-right text-xs text-text-muted">
                  {log.kind === "ODDS" ? (
                    <>
                      <div>抓取 {log.fetched}</div>
                      <div>更新 {log.updated} / 新建 {log.created}</div>
                    </>
                  ) : (
                    <>
                      <div>抓取 {log.fetched}</div>
                      <div>结算 {log.settled} / 跳过 {log.skipped}</div>
                    </>
                  )}
                </div>
              </div>

              {log.error && <div className="mt-2 text-xs text-red">{log.error}</div>}
              {log.message && !log.error && <div className="mt-2 text-xs text-text-muted">{log.message}</div>}

              {log.items.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {log.items.slice(0, 6).map((item) => log.kind === "ODDS"
                    ? <OddsLogLine key={`${item.apiMatchId}-${item.matchId ?? item.matchNo}`} item={item as OddsPullItem} />
                    : <ResultsLogLine key={`${item.apiMatchId}-${item.matchId ?? item.matchNo}`} item={item as ResultsPullItem} />
                  )}
                  {log.items.length > 6 && <div className="text-xs text-text-muted text-center pt-1">还有 {log.items.length - 6} 场</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

function OddsPullItemRow({ item }: { item: OddsPullItem }) {
  return (
    <div className="rounded-xl bg-bg-primary px-4 py-3 border border-border/50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{displayTeamName(item.homeTeam)} vs {displayTeamName(item.awayTeam)}</div>
          <div className="mt-0.5 text-xs text-text-muted">{item.matchNo} · {formatShortTime(item.kickoffTime)}</div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${item.action === "created" ? "bg-gold/10 text-gold" : "bg-accent/10 text-accent"}`}>
          {item.action === "created" ? "新建" : "更新"}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-text-secondary">
        {Object.entries(item.marketCounts).map(([market, count]) => (
          <span key={market} className="px-1.5 py-0.5 rounded bg-bg-elevated">{market} {count}</span>
        ))}
        <span className="px-1.5 py-0.5 rounded bg-bg-elevated">共 {item.oddsCount} 项</span>
      </div>
    </div>
  );
}

function ResultsPullItemRow({ item }: { item: ResultsPullItem }) {
  return (
    <div className="rounded-xl bg-bg-primary px-4 py-3 border border-border/50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{displayTeamName(item.homeTeam)} vs {displayTeamName(item.awayTeam)}</div>
          <div className="mt-0.5 text-xs text-text-muted">{item.matchNo} · {item.kickoffDate} · 半场 {item.halfHomeScore}:{item.halfAwayScore}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-display font-semibold">{item.homeScore}:{item.awayScore}</div>
          <span className={`text-xs px-2 py-0.5 rounded-full ${item.action === "settled" ? "bg-accent/10 text-accent" : "bg-bg-elevated text-text-muted"}`}>
            {item.action === "settled" ? "已结算" : reasonLabel(item.reason)}
          </span>
        </div>
      </div>
    </div>
  );
}

function OddsLogLine({ item }: { item: OddsPullItem }) {
  return (
    <div className="text-xs rounded-lg bg-bg-surface/70 px-2 py-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate">{item.matchNo} {displayTeamName(item.homeTeam)} vs {displayTeamName(item.awayTeam)}</span>
        <span className="text-text-muted shrink-0">{item.action === "created" ? "新建" : "更新"}</span>
      </div>
      <div className="text-text-muted">{formatShortTime(item.kickoffTime)} · {item.oddsCount} 项</div>
    </div>
  );
}

function ResultsLogLine({ item }: { item: ResultsPullItem }) {
  return (
    <div className="text-xs rounded-lg bg-bg-surface/70 px-2 py-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate">{item.matchNo} {displayTeamName(item.homeTeam)} vs {displayTeamName(item.awayTeam)}</span>
        <span className="font-semibold shrink-0">{item.homeScore}:{item.awayScore}</span>
      </div>
      <div className="text-text-muted">半场 {item.halfHomeScore}:{item.halfAwayScore} · {item.action === "settled" ? "已结算" : reasonLabel(item.reason)}</div>
    </div>
  );
}

function reasonLabel(reason?: ResultsPullItem["reason"]) {
  if (reason === "no_matching_match") return "未匹配";
  if (reason === "already_finished_without_pending_items") return "已处理";
  return "跳过";
}

function formatShortTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function formatLogTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value));
}
