# Wheelbound

The endless journey of Squeektoshi, written by the wheel, and a daily tactic game played on top of it.

[Squeekchain](https://squeekchain.com/) is a blockchain powered by a real hamster on a real wheel. Wheelbound turns that wheel's public, on-chain record into a story that every settled round moves forward, and lets you play each week against a boss that only the real running can defeat.

## The Raid Table (the game)

- Every wheel day (12:00 to 12:00 UTC, as Squeekchain counts it), everyone is dealt **the same three tactic cards**.
- Pick one before the wheel first turns that day. Squeektoshi's real running, shaped by your card, is the damage you deal to the week's boss. A day without a card deals only half.
- The cards were tuned on the real wheel's first week, so each averages about ×1.3 and the right one depends on how the night goes: **Night Owl** (×1.6 on running 22:00–02:00 UTC), **Early Bird** (×3.5 on running 04:00–09:00 UTC), **Marathon** (×1.7 on the longest unbroken run), **Sprint** (×3.5 on the fiercest half-hour), **Second Wind** (×3 on everything after the longest pause between runs), **Big Day** (×1.7 if today goes farther than yesterday, ×0.8 if not), **Lazy Day** (×1.7 if today stays shorter than yesterday, ×0.8 if not), **Steady Pace** (×1.3).
- Each finished day earns up to three stars, and Wheelbound reveals which card in the hand would have dealt the most. Today's score is shown live.
- Beat the boss's health ×1.4 by the end of the week to win the raid, then share the week as an emoji grid.
- Fair play: picks are checked against Squeekchain's own clock (not the computer's), and a pick made after the wheel first turned does not count.

## Wallet and Sepolia

- **Connect any EVM wallet**: every wallet that announces itself (EIP-6963: MetaMask, Rabby, OKX, Coinbase, Trust, Bitget, Phantom, Brave, Keplr, …) is listed to choose from, and older wallets that only inject `window.ethereum`, `window.okxwallet` and the like are found too. Wheelbound asks to switch to Sepolia, where Squeekchain runs. On a phone without a wallet, it offers to open the page inside the MetaMask, OKX, Trust or Coinbase app.
- **Signed picks.** With a wallet connected, every card pick is signed with a plain message (`personal_sign`): it is free and sends no transaction. Picks are kept per wallet; without a wallet you play as a guest on this device.
- **Your holdings.** The wallet bar shows the SQK balance and the number of Squeek NFTs the address holds, read straight from Sepolia.
- **Round by round.** Every settled 10-minute round is a hit on the boss, shaped by that day's card. Each hit links its settlement transaction on Sepolia, and Wheelbound reads that transaction back from Sepolia (public RPC) and checks that its SqueekCore log carries the same rounds and the same running total of work as the API before marking it ✓.

## The journey

- **The trail.** Squeektoshi's position is the real lifetime distance the wheel has turned (exactly 878 mm per unit of settled work). A landmark waits every 5 km and the land changes every 25 km, through eight lands from the Seed Meadows to the Moonlit Burrows.
- **The Chronicle.** Each wheel day becomes a chapter. Its words come from the settled rounds (when the wheel first turned, the longest unbroken run, the fiercest round, the naps), the landmarks reached, and Squeekchain's own milestone, streak and speed-record events.
- **A painting for every day.** An aurora lit by each half-hour of running, hills shaped by the day, the landmarks reached standing on the ridge, and a glowing path that climbs with the distance run.
- **A boss every week.** The week's distance is the damage Squeektoshi deals alone; the boss falls at the exact minute it runs out of health, or escapes when the week ends.
- **Stream overlay.** Add `#overlay` to the address for a transparent card (where Squeektoshi is, the next landmark, the boss's health) for an OBS browser source.

Every name, word and brush stroke is derived from settled chain data with a fixed seed, so everyone who opens Wheelbound reads the same story. Chapters can be saved as 1200×630 cards or copied as text.

## Data

All data is read in the browser from the public Squeekchain API at `https://api.squeekchain.com`:

| Endpoint | Used for |
|---|---|
| `/v1/status` (every 10 s) | live wheel state and today's distance |
| `/v1/core` | round configuration (genesis time, 600 s rounds) |
| `/v1/measurement/stats?range=30d` | the wheel-day boundary, recent half-hour buckets, lifetime distance |
| `/v1/events?category=protocol` | settled round history, read once and cached, then only the newest page; gaps are found and refilled on their own |
| `/v1/events?category=measurement` | distance milestones, streaks and speed records |
| Sepolia RPC (`eth_getTransactionReceipt`, `eth_call`) | checking settlements on SqueekCore, SQK and Squeek balances |

## Run locally

There is nothing to install for the site. It remains plain HTML, CSS and JavaScript, with no framework, external script, package manifest, lockfile or required build step. Fonts and artwork are local. Live game data still needs access to the original public Squeekchain API and Sepolia RPCs.

The finished static export is included in `dist/`. Preview it with:

```sh
python3 -m http.server 8080 --directory dist
```

Open `http://localhost:8080/`. You can also serve the repository root directly. Both serve `index.html` as the game; `/og.png` and `/card.png` are PNG images. Relative runtime asset paths also support hosting under a subpath. Hosting and publishing are separate from this delivery.

## Rebuild the static export

After editing root `index.html` or the local assets, run:

```sh
node scripts/export.mjs
node scripts/check.mjs
node scripts/check-picks.mjs
```

The export command only copies `index.html`, `favicon.svg`, `og.png`, `card.png` and `art/` into `dist/`; it performs no compilation or dependency installation. Keep both source and export in the submission. No existing build configuration or dependency file was changed.

## Artwork and visual system

- `og.png`: 1200×630 full-color moonlit storybook scene, with the requested title, sentence and Night Owl / Sprint / Marathon cards.
- `card.png`: 1600×900, two-color black-and-white board image with bold `WHEELBOUND` lettering.
- `art/night-trail.webp`: local painted scenery used beneath deterministic canvas details. Unloaded images are skipped safely.
- `art/fonts/`: the existing Gloock, Instrument Sans and JetBrains Mono families bundled as WOFF2, with their SIL Open Font Licenses.
- [DESIGN.md](DESIGN.md): implemented tokens, typography, components, responsive layouts and motion behavior.

The visual work preserves page text, IDs, card rules, scoring, wallet code, data sources, storage keys and timers. On phones up to 760 px wide, the raid sits after the header and wallet, ahead of the scene and statistics. Its day tabs and tactic hand precede the full explanation and progress bars, so guests can select a card on the first screen. Late-loading scenery also repaints completed chapter canvases without changing their data or text. The two requested pick fixes remain verbatim: late picks use the first settled round with running and its inclusive end boundary; current-day picks also require a status younger than 30 seconds and a non-stale measurement.

## Validation

The revised export passed static checks, a scoped canvas-art typecheck, 18 pick regression checks, and 19 Chromium browser checks. Both review findings were reproduced before correction and checked again afterwards. At 390 × 844, the active day and the complete first tactic card are visible without scrolling (card y=593–717). The completed November 2 painting acquires a held-back image when released, retaining its signature/text and staying stable after another render. Browser checks also covered guest selection and persistence, wallet app links, sharing, chapter copy/download, older chapters, keyboard controls, responsive reflow, live motion-preference changes and transparent overlay mode. `/` and both image routes returned HTTP 200; the populated browser run had no console errors or failed local resources.

The pinned design probe passed 14/16 checks on the populated export. The two retained flags concern preserved copy: 90 first-screen prose words and the next-landmark distance repeated in the stream preview. The brief explicitly requires the existing page text and overlay to remain. [Validation details and limitations](artifacts/validation.md), [before/after measurements](artifacts/revision-checks.json), [probe results](artifacts/taste-checks.json), [interaction results](artifacts/browser-checks.json) and [color measurements](artifacts/color-contrast.json) are included. Reviewer responses are in [.imd-responses.json](.imd-responses.json).

Browser transport required a test-only curl forwarding harness for unchanged public API/RPC reads, as in the review reproduction; the production site's endpoints and code are unchanged. The supplied browser connector failed to launch. Chromium used the downloaded headless runtime; WebKit could not launch because system libraries were missing. Wallet signing, physical devices, screen-reader sessions and native browser zoom were not tested. The preserved untyped game is outside the scoped artwork typecheck; no claim of a clean full-game TypeScript check is made.

Optional validation tooling can be installed entirely in disposable scratch space:

```sh
npm install --prefix test/scratch/tools --cache test/scratch/npm-cache --no-audit --no-fund typescript@5.9.3 playwright@1.56.1
PLAYWRIGHT_BROWSERS_PATH=test/scratch/browsers node test/scratch/tools/node_modules/playwright/cli.js install chromium-headless-shell
node scripts/typecheck.mjs test/scratch/tools/node_modules/typescript/bin/tsc
PLAYWRIGHT_BROWSERS_PATH=test/scratch/browsers node scripts/validate.mjs test/scratch/tools/node_modules/playwright/index.mjs
```

The browser validation uses the public services and an empty browser profile; it selects a guest card for the available open hand and sends no transaction. Tooling, caches, browser downloads and generated test files are excluded from delivery by keeping them under `test/scratch/`. No ignore file was changed. The pinned taste probe was run from the assignment inputs; it is not a runtime dependency. See the byte budget in [artifacts/validation.md](artifacts/validation.md).
