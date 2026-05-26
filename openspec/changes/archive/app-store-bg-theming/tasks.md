# Tasks

- [x] Backend: Add `backgroundColor` to `store_settings` table and TypeORM entity.
- [x] Backend: Create DB migration for new column.
- [x] Backend: Update `UpdateStoreSettingsDto` and validation rules.
- [x] Backend: Expose `backgroundColor` in public `/stores/:slug` endpoint.
- [x] Frontend (Admin): Update `/admin/settings/theme` form to handle `backgroundColor`.
- [x] Frontend (Admin): Expand preset list from 5 to 15 robust background options (dark & light).
- [x] Frontend (Admin): Update `StorePreview` to reflect dynamic background and calculate contrasting foreground color.
- [x] Frontend (Storefront): Read `store.theme.backgroundColor` and inject `--color-background` globally.
- [x] Frontend (Storefront): Implement dynamic contrast checking to adapt text and borders for dark themes automatically.
