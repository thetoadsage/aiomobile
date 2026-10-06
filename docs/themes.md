# Themes

Open **More → Settings → Appearance** to choose a theme. It applies immediately and saves locally; the rest of the settings form still requires Save preferences. Selecting a theme never applies an unsaved connection address or restarts the live feeds.

| Theme | Appearance |
| --- | --- |
| Sage (default) | Charcoal and soft green |
| Midnight | Deep navy and sky blue |
| Ember | Warm graphite and apricot |
| Paper | Warm white and forest green |
| Glacier | Cool white and ocean blue |
| Use device appearance | Follows the device preference, using Paper for light mode and Sage for dark mode |

Existing preferences without a theme, or with an unknown theme ID, retain Sage. Browser controls, charts, notices, logs, and confirmation sheets use the same palette; warning and error colors retain their meaning. The browser theme-color updates with the active palette. Static PWA launch artwork and manifest colors remain the default identity.

## Verification

Theme tests cover migration, persistence, system appearance changes, keyboard selection, storage errors and unsaved connection isolation. All five palettes are checked across ten routes at 320px; contrast checks cover text and semantic status colors. See the [UI validation summary and current screenshots](mobile-redesign.md#validation).

## Everyday monitoring tools

The recommended attention summary, stream search and sorting, pinned/reordered overview sections, and collapsible advanced settings are now implemented. See [Monitoring tools](monitoring-tools.md) for behavior.
