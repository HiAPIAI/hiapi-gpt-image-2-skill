# Changelog

## 0.4.0 — 2026-09-23

- `gpt-image-2/image-to-image` now accepts 1–16 `input_urls`, matching the current HiAPI schema (was 1–5).
- Added `--background auto|opaque|transparent`. HiAPI only accepts `background` at `resolution=1K`; the CLI validates this before creating a task.
- Added the documented 1K-only rule for `5:4`, `4:5`, `3:1`, `1:3`, and `9:21` to local validation, so unsupported 2K/4K combinations fail locally instead of as a rejected task.
- Added `update-policy.json` as the repository fallback for the central `hiapi-skills` upgrade policy. This is a soft upgrade: older versions keep working and only print a notice.

## 0.3.0

- Added optional `--storage persistent` for HiAPI Output Storage and documented production callbacks; fixed the `aspect_ratio` default.

## 0.2.0

- Migrated to the `gpt-image-2/text-to-image` and `gpt-image-2/image-to-image` model IDs, retired the Pro variants, and kept legacy names as aliases.
