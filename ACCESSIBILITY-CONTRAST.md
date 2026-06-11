# ROAMR — WCAG 2.1 AA contrast audit

Computed contrast ratios for every real text/background pairing in the app
(AA threshold: 4.5 for normal text, 3.0 for large/bold text and UI components).

## Passing (no change needed)
| Foreground | Background | Ratio | Verdict |
|---|---|---|---|
| brand-navy `#173142` | white | 13.51 | PASS |
| ink `#1B2A33` | white | 14.73 | PASS |
| white | brand-navy `#173142` | 13.51 | PASS |
| white | brand-navyDeep `#122046` | 15.90 | PASS |
| brand-navy | brand-tint `#E8F0DD` | 11.54 | PASS |
| brand-green `#7DAD3F` | brand-navy (icons on navy) | 5.10 | PASS |

## Fixed this pass
- **muted text** `#7E8C97` → **`#626E79`**. Was 3.45:1 on white (fail); now **5.22:1 (AA pass)**.
  Used only as `text-muted` on light surfaces (55 uses), so darkening carries no dark-surface regression.

## Needs a brand decision (NOT changed — affects core green / logo)
The brand green `#7DAD3F` fails contrast in two contexts:
- white text on green **buttons** → 2.65:1 (fail)
- green **text** on white/tint → 2.65:1 (fail)
…but it must stay light enough for green **icons on navy** (5.10:1, pass). A single darker
green can't satisfy all three — e.g. `#5A7E2D` fixes buttons/text (4.71:1) but drops
green-on-navy to 2.87:1 (fail), and visibly darkens the brand + logo.

**Recommended fix (two-green system):**
- Keep `brand.green #7DAD3F` for fills, accents, and green-on-navy icons.
- Add `brand.greenText #5A7E2D` (4.71:1 on white) for green TEXT on light backgrounds.
- For white-text CTAs, set button background to `#5A7E2D` (white-on-it = 4.71:1) — keep the
  bright green for hover/large decorative fills.

This is mechanical once approved (one token + routing the ~25 white-on-green buttons and the
green-text-on-light spots to it; leave the 6 green-on-navy icon spots on `brand.green`).
