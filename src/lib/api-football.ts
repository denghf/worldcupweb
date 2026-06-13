const API_FOOTBALL_BASE = "https://v3.football.api-sports.io";

type FetchOptions = {
  endpoint: string;
  params: Record<string, string>;
};

async function apiFootballFetch<T>({ endpoint, params }: FetchOptions): Promise<T> {
  const url = new URL(`${API_FOOTBALL_BASE}/${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const res = await fetch(url.toString(), {
    headers: {
      "x-apisports-key": process.env.API_FOOTBALL_KEY!,
      "x-apisports-host": "v3.football.api-sports.io",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`API-Football error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  if (data.errors && Object.keys(data.errors).length > 0) {
    throw new Error(`API-Football errors: ${JSON.stringify(data.errors)}`);
  }
  return data.response as T;
}

export type ApiFixture = {
  fixture: {
    id: number;
    date: string;
    status: { short: string; long: string };
  };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: { home: number | null; away: number | null };
  league: {
    id: number;
    name: string;
    season: number;
    logo: string;
  };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
  };
};

// 获取赛程
export async function fetchFixtures(
  leagueId: number,
  season: string,
  opts?: { date?: string; from?: string; to?: string }
) {
  const params: Record<string, string> = {
    league: String(leagueId),
    season,
  };
  if (opts?.date) params.date = opts.date;
  if (opts?.from) params.from = opts.from;
  if (opts?.to) params.to = opts.to;

  return apiFootballFetch<ApiFixture[]>({ endpoint: "fixtures", params });
}

export async function fetchFixturesByDate(date: string) {
  return apiFootballFetch<ApiFixture[]>({
    endpoint: "fixtures",
    params: { date },
  });
}

// 获取赔率
export async function fetchOdds(fixtureId: number) {
  return apiFootballFetch<
    {
      fixture: { id: number };
      bookmakers: {
        id: number;
        name: string;
        bets: {
          id: number;
          name: string;
          values: { value: string; odd: string }[];
        }[];
      }[];
    }[]
  >({ endpoint: "odds", params: { fixture: String(fixtureId) } });
}

// 获取赛果
export async function fetchFixtureResult(fixtureId: number) {
  return apiFootballFetch<ApiFixture[]>({
    endpoint: "fixtures",
    params: { id: String(fixtureId) },
  });
}

// 获取联赛列表（常用联赛）
export async function fetchLeagues() {
  return apiFootballFetch<
    {
      league: { id: number; name: string; type: string; logo: string };
      country: { name: string; code: string | null; flag: string | null };
      seasons: { year: number; current: boolean }[];
    }[]
  >({ endpoint: "leagues", params: {} });
}
