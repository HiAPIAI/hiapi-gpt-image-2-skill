# Changelog

## 0.5.0 — 2026-09-29

- Added `--route beta|ext`. beta (text-to-image) takes `--size auto|WIDTHxHEIGHT`; ext supports every aspect ratio at 1K/2K/4K with required `--quality low|medium|high`, and sends image-to-image references as `image_urls` (1-6).
- Added non-billing `--dry-run` and `--estimate` (public pricing snapshot, `paidTaskCreated: false`).
- Every create now sends an `Idempotency-Key`; the key and task ID are printed on stderr. `--idempotency-key` retries an ambiguous create safely.
- Added `--resume-task-id` to poll and download an existing task without creating a new one. It keeps working when a hard upgrade is pending, and timeouts now point to it.
- Default route: image-to-image now allows `1:1` at 4K (its documented 4K gaps are `3:1`, `1:3`, `9:21`); text-to-image still excludes `1:1` at 4K.
- **Hard upgrade**: `minimumVersion` is 0.5.0. Older versions stop creating new paid tasks until updated.

## 0.4.1 — 2026-09-29

- Replaced the stale "1K-only" rule with the current default-route limits: 2K is unavailable for `5:4`, `4:5`, `3:1`, `1:3`, `9:21`; 4K is unavailable for `1:1`, `3:1`, `1:3`, `9:21`. `5:4` and `4:5` now pass at 4K instead of failing locally.
- **Hard upgrade**: `minimumVersion` is 0.4.1, so 0.4.0 and older stop creating new paid tasks until updated (dry-run, validation, and recovery of existing tasks are unaffected).

## 0.4.0 — 2026-09-23

- `gpt-image-2/image-to-image` now accepts 1–16 `input_urls`, matching the current HiAPI schema (was 1–5).
- Added `--background auto|opaque|transparent`. HiAPI only accepts `background` at `resolution=1K`; the CLI validates this before creating a task.
- Added the documented 1K-only rule for `5:4`, `4:5`, `3:1`, `1:3`, and `9:21` to local validation, so unsupported 2K/4K combinations fail locally instead of as a rejected task.
- Added `update-policy.json` as the repository fallback for the central `hiapi-skills` upgrade policy. This is a **hard upgrade**: `minimumVersion` is 0.4.0, so older versions stop creating new paid tasks and print the update command until updated (dry-run, validation, and recovery of existing tasks are unaffected).

## 0.3.0

- Added optional `--storage persistent` for HiAPI Output Storage and documented production callbacks; fixed the `aspect_ratio` default.

## 0.2.0

- Migrated to the `gpt-image-2/text-to-image` and `gpt-image-2/image-to-image` model IDs, retired the Pro variants, and kept legacy names as aliases.
