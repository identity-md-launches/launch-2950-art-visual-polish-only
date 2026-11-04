# Wheelbound design

## Overview

Wheelbound is a daily tactic game and a journal of Squeektoshi's real running. The visual idea is a cosy moonlit storybook trail: cool, deep scenery with small pools of lantern light. The serif wordmark and chapter titles carry the story; the sans-serif controls and clearly aligned numbers carry the game.

The implementation remains one document, [index.html](index.html), with inline CSS and JavaScript. The existing wallet bar sits immediately after the header so its primary action is visible on a 390 px first screen. Game copy, element IDs, card rules, data, wallets, scoring and polling are preserved apart from the two specifically requested pick corrections.

## Colors

Canonical tokens are hex values in `index.html`'s `:root` block.

| Token | Value | Role |
| --- | --- | --- |
| `--ink` | `#0e1420` | Night background |
| `--panel` | `#151e2c` | Content panels and chapters |
| `--panel-2` | `#1b2837` | Secondary surfaces and disabled buttons |
| `--line` | `#304151` | Noninteractive separators |
| `--fg` | `#f3eddf` | Main text |
| `--muted` | `#abb8c8` | Descriptions, captions and quiet data |
| `--lantern` | `#ffc861` | Primary button, focus, selected card and journey progress |
| `--ember` | `#ff7a59` | Boss progress and problem status |
| `--moss` | `#7bd389` | Verified / positive status and passed landmarks |

Interactive boundaries are deliberately brighter than separators: `#63788a` on ordinary buttons/tabs and `#81785e` on tactic cards. Selected cards use a gold border and a checkmark. Status labels retain their text alongside color.

Measured contrast includes muted text at 8.31:1 on panels, 6.90:1 at the brightest normal-card gradient stop, and 5.26:1 at the brightest selected-card stop. The primary button is 11.06:1. Button and card boundaries measure 3.66:1 and 3.17:1 against their measured fills. See [color evidence](artifacts/color-contrast.json) and [validation](artifacts/validation.md) for the scope and caption measurements.

## Typography

The existing three families are bundled locally as WOFF2 under `art/fonts/`, with their SIL Open Font Licenses alongside them. `font-display: swap` keeps the page usable during loading.

| Role | Family and fallback | Sizes / weight |
| --- | --- | --- |
| Wordmark, headings, narrative numbers | Gloock; Iowan Old Style, Palatino Linotype, Georgia, serif | 24, 32 and 64 px; 400 |
| Body, controls, descriptions, labels | Instrument Sans; Segoe UI, system-ui, sans-serif | 12, 14 and 16 px; 400 / 600 |
| Round IDs, distances, addresses and code | JetBrains Mono; ui-monospace, SFMono-Regular, Menlo, Consolas, monospace | 12 / 14 px; 400 / 600 |

The six size tokens are `--text-note:12px`, `--text-small:14px`, `--text-body:16px`, `--text-heading:24px`, `--text-feature:32px` and `--text-brand:64px`. Below 760 px, the brand token becomes 44 px; below 360 px, statistic values reuse 24 px. Each measured viewport uses six sizes and two weights.

Body line height is 1.6; most headings use 1.2 and the wordmark 1.05 with `-.035em` tracking. Labels use natural case and zero tracking. Descriptions use `text-wrap: pretty`; headings use `balance`. Narrative paragraphs are capped at 65 characters. Changing numeric values use tabular figures. Useful text remains selectable.

## Layout

`.wrap` centers a maximum 1120 px column. Desktop body padding is 40 px above and 48 px below; inline padding respects safe areas with a 16 px minimum. Primary groups have 28 px gaps, reduced to 24 px on phones. Within components, spacing primarily uses 8, 12, 16, 20, 24 and 28 px.

| Breakpoint | Implemented adaptation |
| --- | --- |
| Up to 880 px | Raid heading, boss/trail panels and stream preview use one column; feed indicators wrap |
| Up to 760 px | Statistics use two columns; tactic cards become full-width rows; week strip becomes four cells then three; chapter facts move above prose; brand becomes 44 px |
| Up to 640 px | Scene caption moves below the painting on a solid surface; canvas uses a 16:8 display frame; round rows use two columns with transaction links on another row; panel padding becomes 20 px |
| Up to 360 px | Card icon becomes 40 px; card padding tightens; statistics reuse the 24 px size |

Text containers use flexible minimums and wrapping rather than fixed heights. The trail is an intentional local horizontal scroll strip with a visible scrollbar and a native keyboard focus target. The page itself has no horizontal overflow at the tested 320, 390, 768 and 1440 px widths.

## Elevation & Depth

The painting provides the depth. UI surfaces use tonal separation, dividers and state borders, without raised shadows. The scene has a subtle white outline. Tactic cards have a quiet inset decorative line and restrained warm radial lighting; the selected card has a stronger border and tint.

The normal stream preview uses a square checkerboard field around the translucent overlay to demonstrate transparency. The surrounding section has a separator rather than another enclosing card. In `#overlay` mode, the document, body and section backgrounds remain transparent.

## Shapes

`--r:20px` is the shared panel, scene and chapter radius. Tactic cards use 14 px, ordinary buttons 9 px, tabs 8 px, and the week strip 12 px. Progress tracks and status dots remain rounded. Clipping is used for decorative art and rounded surfaces; important values and controls wrap instead of being ellipsized.

## Components

All components live in the inline stylesheet and existing rendering functions in `index.html`.

- **Wallet bar:** `.wallet`, `.wbtns`, `.wstate`, `.badge`. Flexible controls and text; one gold `.btn.primary` connect action. Existing connected, choosing, wrong-network and no-wallet states keep their behavior and text.
- **Buttons and day tabs:** `.btn`, `.primary`, `.tab`. Minimum 44 px height; visible 2 px focus outline with 4 px offset. Selected tabs are ivory and keep a light fill on hover. Disabled buttons retain readable text.
- **Tactic cards:** `.card` with preserved `role="radio"` and `aria-checked`. Gold border and checkmark identify selection without relying only on color. The native button supports keyboard activation. Desktop has three cards; phones use icon-and-text rows.
- **Week strip:** `.week`, `.wday.now`, `.future`. Seven fixed grid positions, a gold rule above the current day, full-opacity muted future labels, and wrapping names.
- **Round list:** `.strike-list`, `.rest`, `.hit`, `.tx`. Aligned data and separators; real transaction links remain underlined with their original verification badges. Dense links retain at least 24 px targets or adequate separation.
- **Chapters:** `.chapter`, `.facts`, `.text`, `.acts`. Painting, statistics, title, prose and unchanged save/copy actions. The facts rail becomes a row on phones.
- **Trail:** `.trail`, `.lm`, `.passed`, `.next`, `.biome`. A local scrolling route; moss marks passed landmarks, gold marks the next, and biome headings use quieter unboxed treatment.
- **Help and overlay:** native `details.how`, `.ov-panel` and `#ov`. Keyboard disclosure and copy controls remain unchanged. The overlay has its own transparent mode.

Hover treatments are gated by `@media(hover:hover)`. Under normal motion preferences, buttons and cards transition only named properties for 150 ms with `cubic-bezier(.2,0,0,1)`; cards lift 3 px and buttons press to `.96`. Reduced motion removes CSS transitions and movement. The live canvas checks the motion preference each frame, including changes while the page is open. Forced-color focus uses the system Highlight color.

### Artwork

`og.png` is a 1200×630 illustrated preview with the requested title, sentence and three tactic cards. `card.png` is a 1600×900, two-color black-and-white adaptation with bold `WHEELBOUND` lettering for the LED board. The OG and Twitter image metadata both use `https://wheelbound.imd.site/og.png`.

`art/night-trail.webp` is a 1600×700 decorative painted backdrop. `drawNightSky` uses it only when `complete && naturalWidth > 0`; the procedural sky and character remain available while it loads. `drawScene` adds the cratered moon, layered hills, lit landmark, lanterns, botanical details, textured earth and Squeektoshi. `drawHamster` uses radial shading, a cream belly, pink ears and feet, eye highlights and seeded fur strokes. `finishPainting` reuses a cached 96×96 seeded paper-grain tile.

`paintDay` retains the original half-hour series, running-shaped hills, reached landmarks and accumulated-distance path. Its saved-card moon leaves room for the title. All random details use the existing `rng(seed)` helper; no `Math.random()` is used.

## Do's and Don'ts

- Reuse the existing tokens and six type roles; keep story headings serif and controls sans-serif.
- Keep the connect action visible before the scene on narrow screens. Preserve the full explanatory copy.
- Use a boundary or static marker for interactive state; keep rest/future text at full opacity.
- Keep controls and numeric values in flexible layouts. Confine horizontal scrolling to the trail.
- Keep decorative art optional until decoded, seeded, and independent of the game state calculations.
- Preserve transparent overlay mode and all existing data, wallet and scoring code when extending the presentation.

For another static surface, start with `.wrap`, reuse `.panel` and the existing button/text tokens, and collapse grids when their content no longer fits. No second theme, framework or component library is needed.

Design review draws on Jakub Krehel's Better Interface (MIT, commit `267330e1adfc66a718fb65fa6918c1f06d0a689e`). Documentation structure is adapted from Paul Bakaus's Impeccable (Apache-2.0, commit `9d715cc4f5564a990ca8345abfdd5df6dc9b41c8`). [License notices](artifacts/design-guidance-LICENSE.txt) are included.
