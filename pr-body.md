## Summary

This PR introduces several UX improvements, a major SCSS refactoring, and new test coverage.

### New Features

- **Floating Action Buttons (FABs)** on verse hover — two buttons for note editing and verse comparison appear when hovering anywhere on the verse row (hidden on touch devices where long-press is used)
- **Swipe gesture navigation** in comparison view — swipe left/right to navigate between verses on touch devices
- **Unified TranslationSelector** — the comparison grid now uses the same `TranslationSelector` component as the main UI, with collapsible language groups, favorites, and chevron indicators
- **Chevron icons** for translation group collapse/expand (replaced +/- with chevron-right/chevron-down)

### Improvements

- **App link format** updated from `rbiblia://col/1/14` to `bib://col1:14`
- **Note preview threshold** reduced from 140 to 80 characters
- **Note icon consistency** — icon no longer changes appearance when a note exists (`fill="none"` always)
- **Comparison title** uses smaller font on mobile (< 768px) to fit more text
- **Spacing** between diff toggle and close button in comparison view

### SCSS Refactoring

Split the monolithic `app.scss` (5440 lines) into **13 well-named partials**:

| Partial | Content |
|---|---|
| `_dark-mode.scss` | Dark mode CSS custom properties |
| `_base.scss` | Typography, body, header, footer, verse layout |
| `_selection-grid.scss` | Book & chapter picker overlay |
| `_comparison-grid.scss` | Translation comparison container |
| `_skeleton.scss` | Shimmer loading placeholders |
| `_bottom-nav.scss` | Mobile bottom navigation |
| `_controls.scss` | Font size control, compact tiles, swipe hint |
| `_side-menu.scss` | Settings panel, dock, favorites |
| `_notes.scss` | Notes panel & editor modal |
| `_search.scss` | Search panel & autocomplete |
| `_comparison-modal.scss` | Verse comparison overlay |
| `_translation-selector.scss` | Translation selector, settings tabs, panels |
| `_mobile.scss` | Mobile improvements, a11y, chapter comparison |

> **Zero CSS output changes** — this is a purely structural refactoring.

### Tests

Added 2 new test suites (**12 test groups, 40+ assertions**):

- **`verse.test.js`** — app link format, note threshold, FAB visibility, action handlers, icon consistency
- **`comparisonGrid.test.js`** — verse navigation boundaries, swipe gestures, disabled options, translation grouping, group toggle, diff availability, keyboard shortcuts

All existing tests continue to pass.

### Files Changed

- `Verse.js` — FABs, app link, note threshold, icon fix
- `Reader.js` — `onVerseCompare` prop passthrough
- `Bible.js` — `onVerseCompare` handler
- `ComparisonGrid.js` — swipe navigation, TranslationSelector integration
- `TranslationSelector.js` — chevron icons for groups
- `app.scss` — replaced with imports
- 13 new SCSS partials
- 2 new test files
