"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

export type ProfitChartPoint = {
  date: string;
  label: string;
  dailyProfit: number;
  cumulativeProfit: number;
};

export type ProfitChartPlayer = {
  id: number;
  nickname: string;
  totalProfit: number;
  points: ProfitChartPoint[];
};

export type ProfitChartsData = {
  startDate: string;
  endDate: string;
  dates: { key: string; label: string }[];
  players: ProfitChartPlayer[];
};

const PLAYER_COLORS = [
  "#e60012",
  "#1677ff",
  "#7c3aed",
  "#f97316",
  "#10a15f",
  "#0891b2",
  "#ec4899",
  "#f4b42a",
  "#64748b",
];

function formatMoney(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
}

function formatAxis(value: number) {
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  return String(Math.round(value));
}

function niceDomain(values: number[]): [number, number] {
  if (!values.length) return [-10, 10];
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const span = max - min || 1;
  const pad = Math.max(span * 0.12, 10);
  return [Math.floor(min - pad), Math.ceil(max + pad)];
}

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function useContainerWidth<T extends HTMLElement>(fallback = 720) {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(fallback);
  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth || fallback);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fallback]);
  return { ref, width };
}

export function PlayerProfitCharts({ data }: { data: ProfitChartsData }) {
  const [hiddenIds, setHiddenIds] = useState<Set<number>>(() => new Set());
  const lastDateIndex = Math.max(0, data.dates.length - 1);
  const [selectedDateIndex, setSelectedDateIndex] = useState<number>(lastDateIndex);

  const playersWithColor = useMemo(
    () =>
      data.players.map((player, index) => ({
        ...player,
        color: PLAYER_COLORS[index % PLAYER_COLORS.length],
      })),
    [data.players],
  );

  const visiblePlayers = useMemo(
    () => playersWithColor.filter((player) => !hiddenIds.has(player.id)),
    [playersWithColor, hiddenIds],
  );

  const togglePlayer = (id: number) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setHiddenIds(new Set());
  const clearAll = () => setHiddenIds(new Set(data.players.map((p) => p.id)));

  const safeSelectedIndex = Math.max(0, Math.min(selectedDateIndex, lastDateIndex));
  const visibleCount = data.players.length - hiddenIds.size;

  return (
    <section className="space-y-3" aria-label="各玩家投注盈亏趋势">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold">各玩家投注盈亏趋势</h2>
          <p className="text-text-muted text-xs mt-0.5">
            玩家视角：中奖金额 - 投注金额；统计起始 {data.startDate}；共 {data.players.length} 名未禁用玩家
          </p>
        </div>
        <div className="text-xs text-text-muted whitespace-nowrap">展示 {visibleCount}/{data.players.length}</div>
      </div>

      <div className="glass rounded-xl p-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-text-secondary text-xs font-semibold">曲线筛选</span>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={selectAll} className="px-2.5 py-1 rounded-full text-xs bg-accent/10 text-accent font-semibold">全选</button>
            <button type="button" onClick={clearAll} className="px-2.5 py-1 rounded-full text-xs bg-bg-elevated text-text-secondary">清空</button>
          </div>
        </div>
        {data.players.length === 0 ? (
          <div className="text-text-muted text-xs py-2">暂无未禁用玩家</div>
        ) : (
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
            {playersWithColor.map((player) => {
              const visible = !hiddenIds.has(player.id);
              return (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => togglePlayer(player.id)}
                  className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap inline-flex items-center gap-1.5 transition-all ${
                    visible
                      ? "bg-bg-elevated text-text-primary font-semibold"
                      : "bg-transparent text-text-muted"
                  }`}
                  style={visible ? { boxShadow: `inset 0 0 0 1px ${player.color}55` } : { opacity: 0.55 }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: player.color }} />
                  {player.nickname}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <CumulativeProfitLineChart
        players={visiblePlayers}
        dates={data.dates}
        selectedDateIndex={safeSelectedIndex}
        onSelectDateIndex={setSelectedDateIndex}
      />
      <DailyProfitGroupedBarChart
        players={visiblePlayers}
        dates={data.dates}
        selectedDateIndex={safeSelectedIndex}
        onSelectDateIndex={setSelectedDateIndex}
      />
      <DayDetailCard
        players={visiblePlayers}
        dates={data.dates}
        selectedDateIndex={safeSelectedIndex}
      />
    </section>
  );
}

type ChartPlayer = ProfitChartPlayer & { color: string };

function CumulativeProfitLineChart({
  players,
  dates,
  selectedDateIndex,
  onSelectDateIndex,
}: {
  players: ChartPlayer[];
  dates: ProfitChartsData["dates"];
  selectedDateIndex: number;
  onSelectDateIndex: (index: number) => void;
}) {
  const { ref, width } = useContainerWidth<HTMLDivElement>(720);
  const height = 260;
  const padding = { top: 16, right: 16, bottom: 28, left: 48 };

  const values = useMemo(() => players.flatMap((p) => p.points.map((pt) => pt.cumulativeProfit)), [players]);
  const [min, max] = useMemo(() => niceDomain(values), [values]);

  const plotW = Math.max(0, width - padding.left - padding.right);
  const plotH = height - padding.top - padding.bottom;

  const stepX = dates.length > 1 ? plotW / (dates.length - 1) : plotW;
  const getX = (i: number) => padding.left + (dates.length <= 1 ? plotW / 2 : i * stepX);
  const getY = (v: number) => padding.top + plotH - ((v - min) / (max - min || 1)) * plotH;

  const hitStart = (i: number) => (i === 0 ? padding.left : getX(i) - stepX / 2);
  const hitEnd = (i: number) => (i === dates.length - 1 ? width - padding.right : getX(i) + stepX / 2);
  const hitWidth = (i: number) => Math.max(0, hitEnd(i) - hitStart(i));

  const gridYs = [min, (min + max) / 2, max].filter((v, i, arr) => arr.indexOf(v) === i);
  const zeroY = getY(0);
  const showZero = min < 0 && max > 0;

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-display text-sm font-semibold">各玩家总投注盈亏每日曲线</h3>
          <p className="text-text-muted text-xs mt-0.5">点击曲线区域可切换下方当日明细</p>
        </div>
        {players.length > 0 && (
          <div className="text-right">
            <div className="text-text-muted text-[10px]">当前最高</div>
            <div className="font-display text-sm font-bold text-accent">
              {players.reduce((acc, p) => (p.totalProfit > acc.totalProfit ? p : acc), players[0]).nickname}{" "}
              {formatMoney(players.reduce((acc, p) => (p.totalProfit > acc ? p.totalProfit : acc), -Infinity))}
            </div>
          </div>
        )}
      </div>
      {players.length === 0 ? (
        <div className="text-text-muted text-sm py-10 text-center">请至少选择一名玩家查看曲线</div>
      ) : (
        <div ref={ref} className="w-full">
          <svg width={width} height={height} className="block" role="img" aria-label="各玩家总投注盈亏每日曲线">
            {gridYs.map((v) => (
              <g key={v}>
                <line x1={padding.left} x2={width - padding.right} y1={getY(v)} y2={getY(v)} stroke="rgba(31, 37, 48, 0.08)" strokeWidth={1} />
                <text x={padding.left - 8} y={getY(v) + 3} textAnchor="end" fontSize={10} fill="var(--color-text-muted)">{formatAxis(v)}</text>
              </g>
            ))}
            {showZero && (
              <line x1={padding.left} x2={width - padding.right} y1={zeroY} y2={zeroY} stroke="rgba(31, 37, 48, 0.28)" strokeWidth={1} strokeDasharray="4 4" />
            )}
            <rect
              x={hitStart(selectedDateIndex)}
              y={padding.top}
              width={hitWidth(selectedDateIndex)}
              height={plotH}
              fill="rgba(230, 0, 18, 0.06)"
              rx={6}
            />
            {players.map((player) => {
              const path = player.points
                .map((pt, i) => `${i === 0 ? "M" : "L"}${getX(i)},${getY(pt.cumulativeProfit)}`)
                .join(" ");
              return (
                <g key={player.id}>
                  <path d={path} fill="none" stroke={player.color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                  {player.points.map((pt, i) => (
                    <circle key={pt.date} cx={getX(i)} cy={getY(pt.cumulativeProfit)} r={3} fill="#fff" stroke={player.color} strokeWidth={2}>
                      <title>{`${player.nickname} ${pt.label}: ${formatMoney(pt.cumulativeProfit)}`}</title>
                    </circle>
                  ))}
                </g>
              );
            })}
            {dates.map((d, i) => (
              <g key={`hit-${d.key}`} onClick={() => onSelectDateIndex(i)} style={{ cursor: "pointer" }}>
                <rect x={hitStart(i)} y={padding.top} width={hitWidth(i)} height={plotH} fill="transparent" />
                <text
                  x={getX(i)}
                  y={height - 8}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={i === selectedDateIndex ? 700 : 400}
                  fill={i === selectedDateIndex ? "var(--color-accent)" : "var(--color-text-muted)"}
                >
                  {d.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      )}
    </div>
  );
}

function DailyProfitGroupedBarChart({
  players,
  dates,
  selectedDateIndex,
  onSelectDateIndex,
}: {
  players: ChartPlayer[];
  dates: ProfitChartsData["dates"];
  selectedDateIndex: number;
  onSelectDateIndex: (index: number) => void;
}) {
  const { ref, width } = useContainerWidth<HTMLDivElement>(720);
  const height = 280;
  const padding = { top: 16, right: 16, bottom: 28, left: 48 };

  const values = useMemo(() => players.flatMap((p) => p.points.map((pt) => pt.dailyProfit)), [players]);
  const [min, max] = useMemo(() => niceDomain(values), [values]);

  const plotW = Math.max(0, width - padding.left - padding.right);
  const plotH = height - padding.top - padding.bottom;
  const groupWidth = plotW / Math.max(dates.length, 1);
  const innerPad = 6;
  const barGap = 2;
  const barWidth = players.length > 0 ? Math.max(3, (groupWidth - innerPad * 2 - barGap * (players.length - 1)) / players.length) : 0;

  const getY = (v: number) => padding.top + plotH - ((v - min) / (max - min || 1)) * plotH;
  const zeroY = getY(0);
  const gridYs = [min, (min + max) / 2, max].filter((v, i, arr) => arr.indexOf(v) === i);
  const showZero = min < 0 && max > 0;

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-display text-sm font-semibold">各玩家每日盈亏柱状图</h3>
          <p className="text-text-muted text-xs mt-0.5">点击当日列可在下方查看明细；正向上、负向下</p>
        </div>
        {players.length > 0 && (
          <div className="text-right">
            <div className="text-text-muted text-[10px]">今日数据</div>
            <div className="font-display text-sm font-bold">
              {(() => {
                const last = dates.length - 1;
                if (last < 0) return null;
                let best = players[0];
                let bestVal = players[0]?.points[last]?.dailyProfit ?? 0;
                for (const p of players) {
                  const v = p.points[last]?.dailyProfit ?? 0;
                  if (v > bestVal) {
                    best = p;
                    bestVal = v;
                  }
                }
                return best ? `${best.nickname} ${formatMoney(bestVal)}` : null;
              })()}
            </div>
          </div>
        )}
      </div>
      {players.length === 0 ? (
        <div className="text-text-muted text-sm py-10 text-center">请至少选择一名玩家查看柱状图</div>
      ) : (
        <div ref={ref} className="w-full">
          <svg width={width} height={height} className="block" role="img" aria-label="各玩家每日盈亏柱状图">
            {gridYs.map((v) => (
              <g key={v}>
                <line x1={padding.left} x2={width - padding.right} y1={getY(v)} y2={getY(v)} stroke="rgba(31, 37, 48, 0.08)" strokeWidth={1} />
                <text x={padding.left - 8} y={getY(v) + 3} textAnchor="end" fontSize={10} fill="var(--color-text-muted)">{formatAxis(v)}</text>
              </g>
            ))}
            {showZero && (
              <line x1={padding.left} x2={width - padding.right} y1={zeroY} y2={zeroY} stroke="rgba(31, 37, 48, 0.28)" strokeWidth={1} strokeDasharray="4 4" />
            )}
            <rect
              x={padding.left + selectedDateIndex * groupWidth}
              y={padding.top}
              width={groupWidth}
              height={plotH}
              fill="rgba(230, 0, 18, 0.06)"
              rx={6}
            />
            {dates.map((d, di) => {
              const groupX = padding.left + di * groupWidth + innerPad;
              return (
                <g key={d.key} onClick={() => onSelectDateIndex(di)} style={{ cursor: "pointer" }}>
                  {players.map((player, pi) => {
                    const value = player.points[di]?.dailyProfit ?? 0;
                    if (value === 0) return null;
                    const x = groupX + pi * (barWidth + barGap);
                    const y = value >= 0 ? getY(value) : zeroY;
                    const h = Math.max(1, Math.abs(getY(value) - zeroY));
                    return (
                      <rect key={player.id} x={x} y={y} width={barWidth} height={h} fill={player.color} rx={Math.min(3, barWidth / 2)}>
                        <title>{`${player.nickname} ${d.label}: ${formatMoney(value)}`}</title>
                      </rect>
                    );
                  })}
                  <text
                    x={padding.left + di * groupWidth + groupWidth / 2}
                    y={height - 8}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight={di === selectedDateIndex ? 700 : 400}
                    fill={di === selectedDateIndex ? "var(--color-accent)" : "var(--color-text-muted)"}
                  >
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}

function DayDetailCard({
  players,
  dates,
  selectedDateIndex,
}: {
  players: ChartPlayer[];
  dates: ProfitChartsData["dates"];
  selectedDateIndex: number;
}) {
  const date = dates[selectedDateIndex];

  const rows = useMemo(() => {
    if (!date) return [];
    return players
      .map((p) => ({
        nickname: p.nickname,
        color: p.color,
        daily: p.points[selectedDateIndex]?.dailyProfit ?? 0,
        cumulative: p.points[selectedDateIndex]?.cumulativeProfit ?? 0,
      }))
      .sort((a, b) => b.daily - a.daily);
  }, [players, selectedDateIndex, date]);

  if (!date) {
    return (
      <div className="glass rounded-xl p-4 text-text-muted text-sm">暂无数据</div>
    );
  }

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h3 className="font-display text-sm font-semibold">{date.label} 当日明细</h3>
        <span className="text-xs text-text-muted whitespace-nowrap">点击上方图表切换日期</span>
      </div>
      {players.length === 0 ? (
        <div className="text-text-muted text-sm py-4">请至少选择一名玩家</div>
      ) : (
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="text-text-muted text-xs">
                <th className="text-left font-medium pb-2">玩家</th>
                <th className="text-right font-medium pb-2">当日盈亏</th>
                <th className="text-right font-medium pb-2">累计盈亏</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.nickname} className="border-t border-border/50">
                  <td className="py-2">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: r.color }} />
                      {r.nickname}
                    </span>
                  </td>
                  <td className={`py-2 text-right font-display font-semibold ${r.daily >= 0 ? "text-red" : "text-emerald-500"}`}>
                    {formatMoney(r.daily)}
                  </td>
                  <td className={`py-2 text-right font-display ${r.cumulative >= 0 ? "text-red" : "text-emerald-500"}`}>
                    {formatMoney(r.cumulative)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
