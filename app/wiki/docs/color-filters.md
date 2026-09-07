---
title: "Color filters: exact colors, RGB distance and patterns"
description: "Build SkyBlock color searches with matching swatches. Learn exact hex, RGB lists, absolute color distance, repeating patterns and exotic color options."
order: 9
---

Search for a specific armor color, a near match, or a repeating hex pattern. Use
the **Color** filter on an item page or in a flip whitelist or blacklist group.
For example, start with [Oxford Shoes](/item/OXFORD_SHOES) or
[Satin Trousers](/item/SATIN_TROUSERS) to narrow the search to that item.

## Try the color builder

Choose a mode, edit its value, or select a pattern preset. The swatches update as
you type and show up to three distinct colors satisfying the color rule. They
are generated examples, not available auctions. Exact colors and a distance of
zero have only one possible matching color. This playground does not save a config.

<ColorFilterDemo />

## Available modes

| Mode | Color filter value | What it matches |
| --- | --- | --- |
| Exact hex | `D07D07` | Only `#D07D07` |
| Exact RGB | `208:125:7` | The same `#D07D07`, written as three decimal channels |
| Color list | `D07D07, F0DE09, AAAAAA` | Any of the three listed colors |
| RGB distance | `F2DF11-11` | Colors with a summed absolute RGB difference of at most 11 |
| Repeating pattern | `pattern:ABCABC` | Two identical three-digit blocks, such as `D07D07` |

In the editor, **Filter value** is the value to paste into your Color filter.
For example, select Color and enter `pattern:ABCABC`. In a config this is the
key/value pair `Color: pattern:ABCABC`.

## Exact hex and RGB

A hex color has six digits, `RRGGBB`. Each pair gives a red, green or blue channel
from `00` to `FF`. Hex letters are case-insensitive and a leading `#` is optional.
`D07D07`, `#d07d07`, and `208:125:7` select the same color.

For decimal RGB, use colons between three whole numbers from 0 to 255. Each exact
value has one matching color, so the preview deliberately shows only one swatch.

| Exact value | Matching color |
| --- | --- |
| `D07D07` | `#D07D07` |
| `F0DE09` | `#F0DE09` |
| `AAAAAA` | `#AAAAAA` |

## Lists of colors

Separate exact hex colors with commas or spaces. For example,
`D07D07, F0DE09, AAAAAA` matches each of those three colors. A list is an OR rule:
an auction needs to match only one entry. **HexColorList** also accepts this syntax
and uses the same builder.

Use only exact hex values inside a list. Do not mix RGB triples, distance suffixes,
or patterns into the list. For multiple pattern or distance rules in a flip config,
use separate groups. See [filter group logic](/wiki/filters).

## Absolute RGB distance

Write `TARGET-N`, where TARGET is an exact six-digit hex color and N is a whole
decimal number from 0 to 765. For example, `F2DF11-11` means:

```text
abs(red - targetRed) + abs(green - targetGreen) + abs(blue - targetBlue) <= 11
```

The comparison includes the limit and allows channel values to differ in either
direction. There is one shared budget across all three channels.

| Rule | Matching color | Channel differences | Total distance |
| --- | --- | --- | --- |
| `F2DF11-11` | `F2DF11` | 0 + 0 + 0 | 0 |
| `F2DF11-11` | `F0DE09` | 2 + 1 + 8 | 11 |
| `F2DF11-11` | `F3DF11` | 1 + 0 + 0 | 1 |

`AAAAAA-3` matches `AAAAAC` (distance 2) and `ABABAB` (1 + 1 + 1 = 3), but
does not match `ABABAC` (distance 4). `D07F00-9` matches the repeating color
`D07D07` (0 + 2 + 7 = 9).

**This is the “Absolute” RGB metric, not perceptual Delta E.** A display can show
both, but they are separate calculations. This filter does not calculate CIE Lab
or Delta E, and it does not subtract the two whole hex numbers. A limit of zero
is exact matching; 765 permits every RGB color, subject to other filters and the
flip default-color rule below.

## Repeating patterns

Patterns have exactly six positions. A repeated letter means the corresponding
hex digits must be equal. The letters are placeholders, not literal hex digits.
Each underscore matches any hex digit independently. Different letters are
allowed to have the same value.

| Pattern | Example 1 | Example 2 | Example 3 |
| --- | --- | --- | --- |
| `pattern:ABCABC` | `D07D07` | `A1BA1B` | `39F39F` |
| `pattern:AABBCC` | `1122FF` | `FFCC88` | `000000` |
| `_E_E_E` | `1A2A3A` | `0F1F2F` | `A0B0C0` |
| `pattern:ABABAB` | `121212` | `ABABAB` | `F0F0F0` |
| `pattern:AAAAAA` | `000000` | `AAAAAA` | `FFFFFF` |
| `______` | `123456` | `D07D07` | `FFFFFF` |

To find repeating colors like the Seymour example `#D07D07`, choose
**Repeating pattern → ABCABC · repeated block**, or enter `pattern:ABCABC`.
`D07D08` does not match, because its final digit differs from the third digit.

Always use `pattern:` for patterns without underscores. Bare `AABBCC` and
`AAAAAA` are valid exact hex colors, so they keep their exact meaning.
Patterns with underscores can omit the prefix. Pattern letters are
case-insensitive. Use letters A–Z and underscores only; numeric digits inside a
pattern are not supported. Literal hex digits mixed with placeholders and a
distance suffix on a pattern are also not supported.

## Item searches and flip filtering

On an **item page**, these rules match the item's recorded color, including its
default color when it satisfies the rule. They work for database searches and
live matching.

In **flip whitelist and blacklist groups**, pattern and RGB-distance rules first
reject items with no recorded color or a known default color. They then test the
non-default color. If default-color metadata is unavailable, a recorded color is
still checked. Exact-color and exact-list rules can match default colors.

The preview demonstrates the color rule only. A swatch does not guarantee that
an auction will match an item-specific default-color check, an exotic
classification, or your other config filters. “Non-default” also does not by
itself establish that an item is valuable or classified as exotic.

All filters in one group are combined with AND. Separate groups provide OR
alternatives. Select the relevant item, or use the `ArmorSet` value `seymour`
for Oxford Shoes, Satin Trousers, Cashmere Jacket and Velvet Top Hat in flip configs.

```text
ArmorSet: seymour
Color: pattern:ABCABC
```

## Other color-related filter options

The **Color** builder describes the recorded RGB value. Other filters select
classifications or particular item attributes. Their available dropdown values
come from the filter service and may depend on the selected item.

| Filter | Purpose and available options |
| --- | --- |
| `ExoticColor` | Classification labels: `Any`, `Exotic`, `Original`, `Fairy`, `Fairy+Crystal`, `Crystal`, `Plain Fairy`, `OG Fairy`, `Undyed`, `Glitched`, `Spook` |
| `FairyColor` | `Fairy` (plain and OG fairy) |
| `CrystalColor` | `Crystal` |
| `HexColorList` | A list of exact hex colors; also accepts an individual Color pattern or RGB-distance rule |
| `DyeItem` | Select an applied dye. `Any` means an item with a dye applied, not a standalone dye item |
| `CrabHatColor`, `PartyHatColor`, `CakeSoulColor` | Specialized item color attributes; use their own available options |

For ExoticColor, `Any` includes exotic, glitched and spook classifications;
`Fairy` includes plain and OG fairy; `Fairy+Crystal` adds crystal.
`Original` selects the item default and `Undyed` selects the undyed category.
These labels are not Color values: do not enter `Fairy` or `Any` into the Color
field. Use `______` for an unrestricted Color pattern, with the flip behavior
described above.

## Common input mistakes

- `AABBCC` is exact. Use `pattern:AABBCC` for paired digits.
- `_E_E_E` means repeated unknown digits, not three literal E digits.
- `F2DF11-11` uses decimal 11, not hexadecimal `0x11` and not Delta E 11.
- RGB uses `208:125:7`; commas separate hex colors in a list.
- A pattern must have six positions. `ABCABC` needs the `pattern:` prefix.
- Keep a distance or pattern rule on its own; do not put it inside a color list.

The builder marks incomplete or invalid values and does not apply them. Narrowing
a search to an item reduces the number of candidate auctions. Pattern and
RGB-distance database searches need to inspect color values; their runtime
depends on the number of candidates, not just the complexity of the input.
