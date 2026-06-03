#!/usr/bin/env python3
"""
Fetch 500.com jczq match & odds data and output JSON compatible with the app's local import API.

Usage:
    python scripts/fetch_500.py 2026-06-03
    python scripts/fetch_500.py 2026-06-03 --out json/0603.json
"""

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://trade.500.com/jczq/"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9",
}

HALF_FULL_OPTIONS = ["胜胜", "胜平", "胜负", "平胜", "平平", "平负", "负胜", "负平", "负负"]
TOTAL_GOALS_OPTIONS = ["0球", "1球", "2球", "3球", "4球", "5球", "6球", "7+"]


def fetch_page(playid: int, date: str) -> BeautifulSoup:
    url = f"{BASE_URL}?playid={playid}&g=2&date={date}"
    resp = requests.get(url, headers=HEADERS, timeout=30)
    if resp.status_code != 200:
        raise RuntimeError(f"Failed to fetch playid={playid}: HTTP {resp.status_code}")
    return BeautifulSoup(resp.content, "html.parser", from_encoding="gb18030")


def parse_odds_string(s: str, count: int) -> list[float]:
    """Parse a concatenated odds string like '1.373.907.00' into floats."""
    matches = re.findall(r"\d+\.\d{2}", s)
    return [float(v) for v in matches[:count]]


def parse_team_names(text: str) -> tuple[str, str]:
    """Extract home/away team names from '[21]丹麦VS刚果(金)[61]单关'."""
    clean = re.sub(r"\[\d+\]", "", text).replace("单关", "").strip()
    parts = clean.split("VS")
    if len(parts) != 2:
        raise ValueError(f"Cannot parse teams from: {text}")
    return parts[0].strip(), parts[1].strip()


def parse_handicap(text: str) -> Optional[int]:
    """Parse handicap from strings like '0-1', '0+1', '+1', '-1'."""
    m = re.match(r"^0?([+-]?\d+)$", text.strip())
    if m:
        return int(m.group(1))
    return None


def parse_kickoff(time_str: str, base_date: str) -> str:
    """Convert '06-04 02:00' to ISO datetime using year from base_date."""
    base_year = int(base_date.split("-")[0])
    base_month = int(base_date.split("-")[1])
    match_md, match_hm = time_str.split()
    match_month = int(match_md.split("-")[0])

    year = base_year
    if match_month < base_month:
        year += 1

    dt = datetime.strptime(f"{year}-{match_md} {match_hm}", "%Y-%m-%d %H:%M")
    return dt.strftime("%Y-%m-%dT%H:%M:%S+08:00")


def parse_correct_score_cell(cell_text: str) -> Optional[tuple[str, float]]:
    """Parse a score cell like '1:05.70' or '胜其它40.00'."""
    text = cell_text.strip()
    m = re.match(r"^(\d+):(\d)(\d+\.\d+)$", text)
    if m:
        score = f"{m.group(1)}:{m.group(2)}"
        odds = float(m.group(3))
        return score, odds

    m2 = re.match(r"^(胜其它|平其它|负其它)(\d+\.\d+)$", text)
    if m2:
        return m2.group(1), float(m2.group(2))

    return None


def extract_match_rows(soup: BeautifulSoup) -> list[list[str]]:
    """Extract match rows from a 500.com page. Returns list of td text lists."""
    rows = []
    for tr in soup.find_all("tr"):
        tds = tr.find_all("td")
        if len(tds) < 5:
            continue
        texts = [td.get_text(strip=True) for td in tds]
        if not any("VS" in t or "vs" in t for t in texts):
            continue
        rows.append(texts)

    # playid=271 (correct score) sometimes puts ALL matches in a single row.
    # Detect: one row with tons of tds, split by matchNo pattern.
    if len(rows) == 1 and len(rows[0]) > 30:
        return split_merged_row(rows[0])

    return rows


def split_merged_row(all_tds: list[str]) -> list[list[str]]:
    """Split a merged row (e.g. playid=271) into individual matches by matchNo."""
    result: list[list[str]] = []
    current: list[str] = []
    for td in all_tds:
        if re.match(r"^周[一二三四五六日]\d{3}$", td):
            if current:
                result.append(current)
            current = [td]
        else:
            current.append(td)
    if current:
        result.append(current)
    return result


def fetch_base_data(date: str) -> dict[str, dict]:
    """Fetch playid=269 to get base match info + X1X + HANDICAP_X1X odds."""
    soup = fetch_page(269, date)
    matches = {}

    for tds in extract_match_rows(soup):
        match_no = tds[0]
        time_str = tds[2]
        teams_text = tds[3]
        handicap_text = tds[4]
        odds_str = tds[5]

        home_team, away_team = parse_team_names(teams_text)
        odds_vals = parse_odds_string(odds_str, 6)
        if len(odds_vals) != 6:
            print(f"  [WARN] {match_no}: expected 6 odds, got {len(odds_vals)} from '{odds_str}'", file=sys.stderr)
            continue

        x1x = odds_vals[:3]
        hc = odds_vals[3:]
        handicap = parse_handicap(handicap_text)

        odds = []
        for key, val in zip(["home", "draw", "away"], x1x):
            odds.append({"betType": "X1X", "optionKey": key, "oddsValue": val})

        if handicap is not None:
            for key, val in zip(["home", "draw", "away"], hc):
                odds.append({
                    "betType": "HANDICAP_X1X",
                    "optionKey": f"{handicap}:{key}",
                    "oddsValue": val,
                })

        matches[match_no] = {
            "apiMatchId": f"500-{match_no}",
            "matchNo": match_no,
            "homeTeam": home_team,
            "awayTeam": away_team,
            "kickoffTime": parse_kickoff(time_str, date),
            "handicap": handicap,
            "odds": odds,
        }

    return matches


def fetch_total_goals(date: str) -> dict[str, list[dict]]:
    """Fetch playid=270 to get TOTAL_GOALS odds."""
    soup = fetch_page(270, date)
    result = {}

    for tds in extract_match_rows(soup):
        match_no = tds[0]
        odds_str = tds[4]
        odds_vals = parse_odds_string(odds_str, 8)
        if len(odds_vals) != 8:
            print(f"  [WARN] {match_no} total goals: expected 8 odds, got {len(odds_vals)}", file=sys.stderr)
            continue

        result[match_no] = [
            {"betType": "TOTAL_GOALS", "optionKey": key, "oddsValue": val}
            for key, val in zip(TOTAL_GOALS_OPTIONS, odds_vals)
        ]

    return result


def fetch_half_full(date: str) -> dict[str, list[dict]]:
    """Fetch playid=272 to get HALF_FULL odds."""
    soup = fetch_page(272, date)
    result = {}

    for tds in extract_match_rows(soup):
        match_no = tds[0]
        odds_str = tds[4]
        odds_vals = parse_odds_string(odds_str, 9)
        if len(odds_vals) != 9:
            print(f"  [WARN] {match_no} half/full: expected 9 odds, got {len(odds_vals)}", file=sys.stderr)
            continue

        result[match_no] = [
            {"betType": "HALF_FULL", "optionKey": key, "oddsValue": val}
            for key, val in zip(HALF_FULL_OPTIONS, odds_vals)
        ]

    return result


def fetch_correct_scores(date: str) -> dict[str, list[dict]]:
    """Fetch playid=271 to get CORRECT_SCORE odds."""
    soup = fetch_page(271, date)
    result = {}

    for tds in extract_match_rows(soup):
        match_no = tds[0]
        odds = []
        seen = set()

        for cell in tds[8:]:
            parsed = parse_correct_score_cell(cell)
            if parsed is None:
                continue
            score, val = parsed
            if score in seen:
                continue
            seen.add(score)
            odds.append({"betType": "CORRECT_SCORE", "optionKey": score, "oddsValue": val})

        if odds:
            result[match_no] = odds

    return result


def run(date: str, out_path: Optional[Path] = None) -> Path:
    print(f"Fetching 500.com data for {date}...")

    base = fetch_base_data(date)
    print(f"  Base matches: {len(base)}")

    tg = fetch_total_goals(date)
    print(f"  Total goals fetched: {len(tg)} matches")

    hf = fetch_half_full(date)
    print(f"  Half/full fetched: {len(hf)} matches")

    cs = fetch_correct_scores(date)
    print(f"  Correct scores fetched: {len(cs)} matches")

    # Merge
    for match_no, match in base.items():
        if match_no in tg:
            match["odds"].extend(tg[match_no])
        if match_no in hf:
            match["odds"].extend(hf[match_no])
        if match_no in cs:
            # Deduplicate correct scores
            seen = set()
            unique_cs = []
            for o in cs[match_no]:
                if o["optionKey"] not in seen:
                    seen.add(o["optionKey"])
                    unique_cs.append(o)
            match["odds"].extend(unique_cs)

    result = list(base.values())

    if out_path is None:
        out_dir = Path("json")
        out_dir.mkdir(exist_ok=True)
        out_path = out_dir / f"{date.replace('-', '')}.json"

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"Saved {len(result)} matches with {sum(len(m['odds']) for m in result)} odds to {out_path}")
    return out_path


def main():
    parser = argparse.ArgumentParser(description="Fetch 500.com match & odds data")
    parser.add_argument("date", help="Date in YYYY-MM-DD format")
    parser.add_argument("--out", "-o", help="Output JSON file path")
    args = parser.parse_args()

    out_path = Path(args.out) if args.out else None
    run(args.date, out_path)


if __name__ == "__main__":
    main()
