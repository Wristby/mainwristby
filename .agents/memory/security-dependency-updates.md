---
name: Security dependency updates
description: Why parent upgrades alone may not clear advisories and how to keep security updates compatible
---
Upgrade affected direct dependencies or their parents first, then inspect the resolved dependency tree and rescan. If the latest compatible parent still leaves vulnerable transitive versions locked, use narrowly scoped security overrides that preserve each transitive dependency's major version.

**Why:** Parent upgrades in this project retained older transitive versions that still satisfied their dependency ranges. Simply reinstalling the latest compatible parents did not clear those advisories. A wholesale styling-framework upgrade would change much more than the security dependency update.

**How to apply:** Recheck current advisories and patched versions rather than trusting old scan results. Remove overrides when upstream dependency resolution makes them unnecessary. Do not suppress an advisory or rename a vulnerable package to hide it; report any unpatched remainder explicitly.

Keep the existing appearance when changing styling build tools for security. Do not discard compatibility palette/effect values merely to adopt a framework's newer defaults.

**Why:** The styling compiler was migrated to remove an unpatched build dependency, not to redesign the watch-management interface. New framework defaults can subtly change colors, shadows, focus indicators and menu sizing.

**How to apply:** Preserve visible design tokens, test generated utilities and class conflict resolution, and check relevant viewport sizes. Any intentional visual redesign is a separate user decision.
