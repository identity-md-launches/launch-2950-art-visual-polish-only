# Wheelbound revision validation

Complete for the stated revision scope: both reported defects reproduced, were corrected, and passed the affected Chromium checks. These are worker observations, not independent certification. Publication is outside this assignment.

## Scope and reproduction

The existing single-document game and artwork were retained. The revision changes narrow-screen CSS ordering/spacing and adds an image-load listener for chapter painting caches. A comparison with the accepted source confirmed that all HTML markup, page text, IDs and pre-existing JavaScript are byte-identical; the only JavaScript addition is the art load listener. Both requested pick fixes remain character-for-character intact. No game/wallet handlers, data sources, storage keys, polling intervals, scoring, card rules, runtime assets, build configuration or dependencies changed.

Chromium 155 headless, fresh guest profiles, real public API/history and reduced motion were used for reproduction. Public API and Sepolia RPC responses were forwarded unchanged through curl in a disposable Playwright routing harness because browser transport on this runner required the reviewer's workaround. No game data or document was mocked. Production requests still use the original URLs.

| Finding | Before correction | Final export |
| --- | --- | --- |
| `956d0c…` — guest hand below the phone screen | At 390 × 844, raid y=969.859375; first card y=1482.171875–1606.546875; no complete tactic visible | Raid y=366.921875; active day y=484.515625–528.515625; first card y=592.515625–716.890625. The raid precedes scene/statistics; hand precedes explanation/bars. At 320 × 844 the first complete tactic ends at y=761.28125. |
| `51692d…` — late backdrop missing from completed chapters | Held only `art/night-trail.webp` until history completed. The November 2 canvas stayed byte-identical after release and 11 seconds of normal rendering. | Its pixel serialization changes after release, with identical chapter signature/text and consistent cache markers. Another render leaves the finished pixels unchanged. |

Fix locations: `index.html:214`–`220` contain the phone layout changes; `index.html:746` adds the load listener. `scripts/validate.mjs:49` now checks a complete guest card on the first screen, and `scripts/validate.mjs:144` checks a completed chapter's late art. The scoped typecheck declares the existing renderer in `scripts/typecheck.mjs:30`.

[Raw before/after measurements and hashes](revision-checks.json), [reviewer responses](../.imd-responses.json), [phone before](screenshots/phone-before.png), [phone after](screenshots/phone-after.png), [320 px phone](screenshots/phone-320.png), [chapter before image arrival](screenshots/chapter-before.png), [chapter after image arrival](screenshots/chapter-after.png).

## Commands and observed results

All commands ran from the repository root. Disposable tools, routing harnesses and raw outputs stayed in `test/scratch/`; only the named reports and screenshots were retained.

| Command | Actual result |
| --- | --- |
| `node scripts/export.mjs` | Exit 0; rebuilt the static `dist/` by copying the existing document and required assets. |
| `node scripts/check.mjs` | Exit 0; source/export JavaScript syntax, metadata, unique IDs, relative assets, seeded art, load guards and PNG dimensions pass; source/share assets match the export byte for byte. |
| `node scripts/check-picks.mjs` | Exit 0; 18 pick regression checks pass. |
| `node scripts/typecheck.mjs test/scratch/tools/node_modules/typescript/bin/tsc` | Exit 0 using TypeScript 5.9.3; changed canvas artwork and its load listener pass `--checkJs --noEmit`. Preserved untyped game code remains outside this scoped check. |
| `PLAYWRIGHT_BROWSERS_PATH=test/scratch/browsers node test/scratch/revision/probe.mjs before` | Exit 0; reproduced both reviewer measurements against the unmodified root document. |
| `PLAYWRIGHT_BROWSERS_PATH=test/scratch/browsers node test/scratch/revision/probe.mjs after` | Exit 0; fixed mobile ordering at 320, 360, 390, 640 and 760 px; unchanged desktop ordering at 761, 880 and 1440 px; no horizontal overflow; completed chapter gains art and stays stable. |
| `PLAYWRIGHT_BROWSERS_PATH=test/scratch/browsers node scripts/validate.mjs test/scratch/revision/transport.mjs` | Exit 0; 19 Chromium browser checks pass on the rebuilt export, served under `/preview/`. See [browser results](browser-checks.json). |
| `PLAYWRIGHT_BROWSERS_PATH=test/scratch/browsers IMD_PLAYWRIGHT="$PWD/test/scratch/revision/transport.mjs" node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste` | Exit 0; measured all 16 checks on populated real-data pages, 14 pass. Two copy flags are retained under the explicit text/overlay preservation requirement; see below. |
| Accepted-source comparison using `git show HEAD:index.html` | Markup and pre-existing script unchanged; both exact pick corrections preserved. |

The browser suite exercised guest tactic selection via keyboard and persistence across reload; the no-wallet app links and Back control; weekly sharing; generated chapter copy and a valid 1200 × 630 PNG download; older chapters; keyboard help and trail scrolling; reduced-motion determinism; responsive stream preview; transparent `#overlay`; live motion-preference changes; selected/hover styles; and delayed live/chapter art. Root and subpath game routes returned 200, title `Wheelbound`; both PNG routes returned 200 with `image/png`. The populated suite recorded zero console errors, JavaScript exceptions or failed local resources.

## Better Interface review coverage

The pinned workflow and core principles of all six domains were applied to the two changed surfaces. Established tokens, artwork, fonts and copy were retained.

| Domain | Coverage and result | Limits |
| --- | --- | --- |
| Accessibility | **Checked.** Named native buttons/radio states retained; keyboard connect, guest selection and persistence work; inspected focused phone screenshot and 2 px outline; reduced-motion canvas remains stable; overlay remains transparent; probe target-spacing check passes. | Screen-reader sessions, physical touch devices, a full automated accessibility audit and forced-colors rendering were not performed. CSS visual order changes only noninteractive wrappers/content; the existing control sequence stays connect → day tabs → tactic buttons. |
| Layout | **Checked.** Inspected screenshots at 320 and 390 px. Complete guest control and active day fit within 844 px. Measured 320, 360, 390, 640, 760, 761, 768, 880 and 1440 px without horizontal scroll. Probe found no text overlap, clipping or floating-control obstruction. Desktop ordering is retained. | Native 200% browser zoom, RTL and translated strings were not tested; localization is not introduced by this revision. A narrow viewport is not a native zoom test. |
| Writing | **Checked.** Existing action labels, rules, explanatory copy and state messages were compared with the accepted source and preserved. Day choice and hand now precede lengthy explanation on phones. | Two probe copy flags remain because the task forbids changing page text and overlay content. |
| Typography | **Checked.** Existing local WOFF2 fonts loaded without resource failures; inspected phone wrapping. Probe reports six sizes per populated viewport, three families and weights 400/600. No new type tokens or truncation were added. | Font substitution on other operating systems and native text scaling were not checked. |
| Colors | **Checked.** Existing palette/state markers retained. Probe's measured text pairs meet 4.5:1, or 3:1 for large text. Separately computed panel, primary action, selected day and worst card-gradient-stop pairs are in [color measurements](color-contrast.json); muted card hints remain at least 5.26:1 at the measured stops. | Probe skips 187 text boxes over images/canvas/gradients; this is not a comprehensive contrast certification of every painted background. |
| UI | **Checked.** Existing borders/radii, selected checkmark, hover states and focus retained. No border-plus-shadow surfaces, nested cards, gradient text, `transition:all` or endless reduced-motion animations were reported. Delayed chapter repaint was visually inspected and pixel-checked. | Safari/WebKit and physical-device rendering are unverified. |

## Design probe findings retained under the brief

The populated pinned probe passed render, layout, targets, contrast, casing, tracking, eyebrows, type sizes, type faces, glyphs, slogans, chrome, motion and share metadata. [Exact outputs](taste-checks.json) are retained.

- **Copy budget:** 90 prose words on the 390 px first screen, above the 60-word guide threshold. The brief says “Do not change … page text.” The revised screen exposes the daily tactic control as required while preserving the existing brand and guest explanation, lock text and card rules. No text was removed or hidden to satisfy the probe.
- **Repetition:** the next-landmark line appears in both scene and stream preview. The brief requires the existing page text and overlay to remain, so both functional contexts are preserved.

No reproduced revision finding remains unresolved. The more general probe flags above are documented constraints, not claims that all sixteen checks pass.

## Browser/tool limitations

The supplied browser connector and installed full Chrome failed to launch; the successful checks use downloaded Chromium headless. WebKit was downloaded and launch attempted, but it reported missing system libraries including GTK 4 and Graphene. No Safari result is claimed. Wallet signatures/network switching with a real account, physical devices, screen readers and native zoom were not exercised. The two defects and guest flow were validated against real read-only services through the disposable forwarding harness. No deployment or transaction was performed.

## Submission and path budget

The finished runtime remains `index.html`, `favicon.svg`, `og.png`, `card.png` and `art/`, mirrored in `dist/` with relative asset URLs. No framework, package manifest, dependency lockfile, build configuration, submodule, vendor registry or runtime dependency was added. Required images/fonts are preserved.

Reports were excluded by the repository's existing local exclusion rules. The new `.gitignore` narrowly includes only these required response/evidence paths, with the following explicit budgets; other generated files remain excluded. This is a packaging fix for the revision's reviewable results, not a broad ignore-policy change.

| Newly allowed path | Maximum bytes |
| --- | ---: |
| `.gitignore` | 4,096 |
| `.imd-responses.json` | 8,192 |
| Six named `artifacts/` report/document/license files | 131,072 total |
| Five named `artifacts/screenshots/` PNG files | 2,097,152 total |
| Total new allowlist budget | 2,240,512 |

The complete submission must remain below 8,388,608 bytes; the final actual byte check is recorded below. No ignore rule includes tools, browser downloads, caches or `node_modules` at any nesting level. All disposable dependencies and harness outputs are under the already excluded `test/scratch/`.

Final candidate byte check: **3,561,492 bytes across 42 files** (limit 8,388,608); the changed/added files account for **1,999,013 bytes**. The six reports/license/document total **41,919 bytes** and five evidence screenshots total **1,626,064 bytes**, within the explicit path budgets. No dependency/cache/browser directory is in the candidate file list.
