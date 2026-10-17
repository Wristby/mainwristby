---
name: Intake workflow parity
description: Preserve established watch-entry behavior when changing form layout
---
Treat the tabbed intake redesign as a layout change, not permission to remove existing shortcuts or substitute legacy condition choices. Use the current Watch Details choices as the reference when older Add Watch implementations disagree.

**Why:** The user corrected both a missing Open Folder shortcut and legacy condition labels after the redesign. Copying the old intake implementations alone did not preserve the workflow they expected.

**How to apply:** Check field options and adjacent actions against the current watch workflow when refactoring entry forms. Preserve the existing folder destination unless the user explicitly changes it.
