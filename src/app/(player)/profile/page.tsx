"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import multiavatar from "@multiavatar/multiavatar";
import { BetCard, type BetCardData } from "@/components/BetCard";

interface Profile {
  id: number;
  nickname: string;
  mustChangePwd: boolean;
  totalBets: number;
  totalWonBets: number;
  totalBetAmount: number;
  totalWinAmount: number;
  netProfit: number;
}

type Tab = "all" | "APPROVED" | "WON" | "LOST";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bets, setBets] = useState<BetCardData[]>([]);
  const [tab, setTab] = useState<Tab>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("player_token");
    if (!token) {
      router.replace("/profile/login");
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([fetch("/api/profile", { headers }), fetch("/api/bets?mine=1", { headers })])
      .then(async ([profileRes, betsRes]) => {
        if (profileRes.status === 401) {
          localStorage.removeItem("player_token");
          router.replace("/profile/login");
          return;
        }
        const profileJson = await profileRes.json();
        const betsJson = await betsRes.json();
        if (profileJson.success) {
          if (profileJson.data.mustChangePwd) {
            router.replace("/profile/change-password");
            return;
          }
          setProfile(profileJson.data);
        }
        if (betsJson.success) {
          setBets((betsJson.data || []).map((bet: BetCardData) => ({
            ...bet,
            totalAmount: Number(bet.totalAmount),
            lockedTotalOdds: Number(bet.lockedTotalOdds),
            potentialPayout: Number(bet.potentialPayout),
            actualPayout: bet.actualPayout !== null ? Number(bet.actualPayout) : null,
          })));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const logout = async () => {
    if (!confirm("确定要退出登录吗？")) return;
    localStorage.removeItem("player_token");
    router.replace("/profile/login");
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="rounded-full bg-white px-4 py-2 text-sm text-text-muted shadow-sm">加载中...</div>
      </div>
    );
  }

  if (!profile) return null;

  const filtered = tab === "all" ? bets : bets.filter((bet) => bet.status === tab);
  const avatar = multiavatar(profile.nickname);

  return (
    <div className="px-3 pb-4 pt-3">
      <section className="mb-3 rounded-3xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-bg-surface"
              aria-label={profile.nickname}
              dangerouslySetInnerHTML={{ __html: avatar }}
            />
            <div className="min-w-0">
              <h1 className="truncate text-xl font-black text-text-primary">{profile.nickname}</h1>
              <div className="mt-1 text-xs font-semibold text-text-muted">我的竞猜中心</div>
            </div>
          </div>
          <button onClick={logout} className="rounded-xl bg-bg-surface px-3 py-2 text-xs font-bold text-text-secondary">
            退出
          </button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat label="下注" value={profile.totalBets} />
          <Stat label="中奖" value={profile.totalWonBets} />
          <Stat label="盈亏" value={`${profile.netProfit >= 0 ? "+" : ""}${profile.netProfit.toFixed(1)}`} highlight={profile.netProfit >= 0} />
        </div>
      </section>

      <section className="mb-3 rounded-2xl bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-black text-text-primary">我的投注</h2>
          <span className="text-xs font-semibold text-text-muted">{bets.length} 注</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {([
            { key: "all", label: "全部" },
            { key: "APPROVED", label: "已下注" },
            { key: "WON", label: "已中奖" },
            { key: "LOST", label: "未中奖" },
          ] as const).map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                tab === item.key ? "bg-accent text-white" : "bg-bg-surface text-text-secondary"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="rounded-2xl bg-white py-12 text-center shadow-sm">
            <div className="mb-2 text-3xl">🎫</div>
            <div className="text-sm font-bold text-text-primary">暂无投注记录</div>
            <div className="mt-1 text-xs text-text-muted">去赛事页选择赔率下注吧</div>
          </div>
        ) : (
          filtered.map((bet, index) => <BetCard key={bet.id} bet={bet} index={index} showUser={false} />)
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="rounded-2xl bg-bg-surface px-3 py-2">
      <div className="text-[10px] font-semibold text-text-muted">{label}</div>
      <div className={`num mt-0.5 text-lg font-black ${highlight ? "text-accent" : "text-text-primary"}`}>{value}</div>
    </div>
  );
}
