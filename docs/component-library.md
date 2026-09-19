# Component library

Primary exports from `src/components/os`:

- `OsShell` — desktop sidebar, mobile tabs, command palette, theme toggle
- `CommandPalette` — route jump + Navigator
- `Button`, `Card`, `Badge`, `Avatar`, `PageHeader`
- `EmptyState`, `ErrorState`, `SkeletonGrid`, `OfflineBanner`

Legacy cards (`allShopItems`, `allPublicProjects`, laundry, etc.) remain on `/` and operational pages. Do not duplicate their mutations inside OS components.
