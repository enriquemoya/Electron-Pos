# Design reference analysis (no code change)

Reference screenshots show two target patterns:
1. Inventory list page: scope selector, category/game/stock filters, inline adjustment controls per row.
2. Inventory detail page: tabbed sections (branch stock, movements, configuration), branch-scoped adjustment controls and movement history.

Recommended parity mapping for future UI refinement:
- Online-store admin inventory list should keep scope selector (ONLINE_STORE/BRANCH) and branch selector visible.
- Detail page should expose branch tabs and movement history table with actor role and before/after quantities.
- POS inventory should mirror the same increment/decrement control language and status chips, with role-based gating retained.

This run did not change UI design; only runtime evidence workflow executed.
