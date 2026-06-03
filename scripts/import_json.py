#!/usr/bin/env python3
"""
Validate /json/*.json files and upload them via /api/admin/import/local.

Usage:
    python scripts/import_json.py --tournament-id 1
    python scripts/import_json.py --tournament-id 1 --file json/0603.json
    python scripts/import_json.py --tournament-id 1 --token <jwt>
    python scripts/import_json.py --tournament-id 1 --base-url http://localhost:3000
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

import requests

VALID_BET_TYPES = {"X1X", "HANDICAP_X1X", "HALF_FULL", "TOTAL_GOALS", "CORRECT_SCORE"}


def validate_match(match: dict, file_name: str, idx: int) -> list[str]:
    errors = []
    prefix = f"{file_name}[{idx}]"

    required = ["apiMatchId", "homeTeam", "awayTeam", "kickoffTime", "odds"]
    for key in required:
        if key not in match:
            errors.append(f"{prefix}: missing '{key}'")

    if not isinstance(match.get("odds"), list):
        errors.append(f"{prefix}: 'odds' must be an array")
        return errors

    seen = set()
    for oi, odd in enumerate(match["odds"]):
        oprefix = f"{prefix}.odds[{oi}]"
        if not isinstance(odd, dict):
            errors.append(f"{oprefix}: must be an object")
            continue

        for key in ["betType", "optionKey", "oddsValue"]:
            if key not in odd:
                errors.append(f"{oprefix}: missing '{key}'")

        bet_type = odd.get("betType")
        if bet_type and bet_type not in VALID_BET_TYPES:
            errors.append(f"{oprefix}: invalid betType '{bet_type}'")

        odds_value = odd.get("oddsValue")
        if odds_value is not None and not isinstance(odds_value, (int, float)):
            errors.append(f"{oprefix}: oddsValue must be a number")

        key = f"{bet_type}:{odd.get('optionKey')}"
        if key in seen:
            errors.append(f"{oprefix}: duplicate (betType, optionKey) '{key}'")
        seen.add(key)

    # Validate kickoffTime format
    kt = match.get("kickoffTime", "")
    if kt:
        try:
            datetime.fromisoformat(kt.replace("Z", "+00:00"))
        except ValueError:
            errors.append(f"{prefix}: invalid kickoffTime '{kt}'")

    return errors


def validate_file(path: Path) -> tuple[list[dict], list[str]]:
    errors = []
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        return [], [f"{path.name}: invalid JSON - {e}"]
    except Exception as e:
        return [], [f"{path.name}: read error - {e}"]

    if not isinstance(data, list):
        return [], [f"{path.name}: root must be an array"]

    for i, match in enumerate(data):
        if not isinstance(match, dict):
            errors.append(f"{path.name}[{i}]: must be an object")
            continue
        errors.extend(validate_match(match, path.name, i))

    return data, errors


def login(base_url: str, username: str, password: str) -> Optional[str]:
    resp = requests.post(
        f"{base_url}/api/auth/login",
        json={"username": username, "password": password},
        timeout=30,
    )
    if resp.status_code == 200:
        data = resp.json()
        if data.get("success"):
            # Extract token from cookies
            token = resp.cookies.get("token")
            if token:
                return token
    return None


def upload(
    base_url: str,
    token: str,
    tournament_id: int,
    matches: list[dict],
) -> dict:
    resp = requests.post(
        f"{base_url}/api/admin/import/local",
        cookies={"token": token},
        json={"tournamentId": tournament_id, "matches": matches},
        timeout=60,
    )
    try:
        return resp.json()
    except Exception:
        return {"success": False, "error": f"HTTP {resp.status_code}: {resp.text[:200]}"}


def run(
    tournament_id: int,
    file_path: Optional[Path],
    base_url: str,
    token: Optional[str],
    username: str,
    password: str,
) -> None:
    # Resolve token
    if not token:
        token = login(base_url, username, password)
        if not token:
            print("Failed to login. Provide --token or check credentials.", file=sys.stderr)
            sys.exit(1)
        print("Logged in successfully.")

    # Collect files
    if file_path:
        files = [file_path]
    else:
        json_dir = Path("json")
        files = sorted(json_dir.glob("*.json"))
        if not files:
            print("No /json/*.json files found.", file=sys.stderr)
            sys.exit(1)

    # Validate all files first
    all_valid = True
    file_data = []
    for path in files:
        data, errors = validate_file(path)
        if errors:
            all_valid = False
            print(f"\n❌ {path.name} - {len(errors)} error(s):")
            for e in errors[:20]:
                print(f"   - {e}")
            if len(errors) > 20:
                print(f"   ... and {len(errors) - 20} more")
        else:
            print(f"✅ {path.name} - {len(data)} match(es) valid")
        file_data.append((path, data))

    if not all_valid:
        print("\nValidation failed. Fix errors before uploading.", file=sys.stderr)
        sys.exit(1)

    # Upload
    print(f"\nUploading to {base_url}/api/admin/import/local (tournamentId={tournament_id})...")
    for path, data in file_data:
        if not data:
            continue
        result = upload(base_url, token, tournament_id, data)
        if result.get("success"):
            imported = result.get("data", {}).get("imported", 0)
            print(f"✅ {path.name}: imported {imported} match(es)")
        else:
            print(f"❌ {path.name}: {result.get('error', 'Unknown error')}", file=sys.stderr)


def main():
    parser = argparse.ArgumentParser(description="Validate and upload JSON match data")
    parser.add_argument("--tournament-id", "-t", type=int, required=True, help="Target tournament ID")
    parser.add_argument("--file", "-f", type=Path, help="Specific JSON file to upload (default: all /json/*.json)")
    parser.add_argument("--base-url", "-u", default="http://localhost:3000", help="Base URL of the app")
    parser.add_argument("--token", help="Admin JWT token (optional, will login otherwise)")
    parser.add_argument("--username", default="admin", help="Admin username for auto-login")
    parser.add_argument("--password", default="admin123456", help="Admin password for auto-login")
    args = parser.parse_args()

    run(
        tournament_id=args.tournament_id,
        file_path=args.file,
        base_url=args.base_url,
        token=args.token,
        username=args.username,
        password=args.password,
    )


if __name__ == "__main__":
    main()
