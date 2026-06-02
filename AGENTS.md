<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Data import convention

Use script-based batch imports for new match and odds data. Follow approach C: create or update a TypeScript import script under `prisma/` and run it with `npx tsx`, instead of relying on the admin UI for full odds imports.

The expected per-match shape should mirror `prisma/seed-500-test.ts`: `apiMatchId`, optional display-only `matchNo`, `homeTeam`, `awayTeam`, `kickoffTime`, optional `handicap`, and an `odds` array of `{ betType, optionKey, oddsValue }` rows.

Keep odds keys compatible with the current app:
- `X1X`: `home`, `draw`, `away`
- `HANDICAP_X1X`: `${handicap}:home`, `${handicap}:draw`, `${handicap}:away`
- `HALF_FULL`: `胜胜`, `胜平`, `胜负`, `平胜`, `平平`, `平负`, `负胜`, `负平`, `负负`
- `TOTAL_GOALS`: usually `0球`, `1球`, `2球`, `3球`, `4球`, `5球`, `6球`, `7+`
- `CORRECT_SCORE`: score strings like `1:0`, plus `胜其它`, `平其它`, `负其它`

Prefer idempotent scripts: upsert the tournament, remove or upsert only the target imported matches by `apiMatchId`, and insert/update odds using the `(matchId, betType, optionKey)` uniqueness rule.
