# Session 1 VdoCipher implementation — 8 September 2026

Implemented and built locally. Not deployed. The production container has not been restarted.

## Mapping and UI

`lib/video-provider-config.ts` contains a server-only override for Session 1 (`7caceae2-03eb-4bc7-a80f-3ef463ff52fd`). A read-only database query confirmed these existing parts:

| Part | Existing part key | Existing title | VdoCipher video ID |
| --- | --- | --- | --- |
| 1 | `main` | Session 1: n8n Foundations — Getting Started | `5b775e705e8c43278ff60092a17c680a` |
| 2 | `1afe54f0-aab2-4583-8d77-22a591cb9885` | Main video General | `5b775e705e8c43278ff60092a17c680a` |
| 3 | `6965a2fa-9dbf-422a-8d64-61e5ed7ce3e2` | Supabase | `5b775e705e8c43278ff60092a17c680a` |

The repeated video ID is intentional. Each part has its own `{ provider, videoId }` entry. `lib/session-video-parts.ts` resolves titles and order from the existing rows, keeping the main recording first, followed by video resources and credential videos in their existing order. It neither mutates rows nor returns legacy file URLs. New, unmapped parts retain their Bunny source when one exists; the resolver supports additional parts and mixed providers.

`SessionVideoPlaylist` displays the three selectable parts under one responsive player. Selection is keyed by the part identity, so returning to a different part obtains fresh authorization even when its VdoCipher video ID is identical. Other sessions keep their existing UI.

## Playback authorization and watermark

The browser POSTs to `/api/course/{sessionId}/parts/{partId}/playback`. The server uses the existing active-device check (authenticated user, auth session, device cookie, active device record), verifies that the session exists, and resolves only a part belonging to that session. It ignores client-supplied video IDs/providers. This preserves the course pages' existing access policy; there is no new enrollment model. Cross-site requests are rejected, and origin validation uses the existing `SITE_URL` to work behind the production reverse proxy.

Only then does the server call VdoCipher's OTP endpoint with the secret in the Authorization header. The request uses a 300-second OTP initialization lifetime, a timeout, no caching, and no redirects. Responses contain only the official player URL (OTP and playbackInfo) and its initialization expiry. Errors are generic; upstream response bodies, request headers, and credentials are never logged or forwarded. The five-minute lifetime concerns player initialization, not a five-minute video limit. See the official [OTP API](https://www.vdocipher.com/docs/server/playbackauth/otp/) and [TTL documentation](https://www.vdocipher.com/docs/server/playbackauth/ttl/).

The same sanitized username and device/auth-session-bound forensic token are included in a moving `rtext` annotation in the server OTP request. The existing token generator and admin lookup are untouched. The annotation is rendered inside VdoCipher's player, covering iframe fullscreen as well as embedded playback, using the documented [watermark API](https://www.vdocipher.com/docs/server/playbackauth/anno/). Browser tests mock the remote player; actual DRM video playback and visual fullscreen watermark behavior on physical devices remain a post-deployment smoke check.

## Rollback and database

Set `SESSION_VIDEO_PROVIDER_OVERRIDES_ENABLED=false` in the runtime configuration and recreate the application container to restore the exact pre-existing Bunny components, routes and resource layout. No rebuild is needed for this switch. Unsetting it or setting it to `true` enables the mapping again.

All Bunny code, IDs, fields, environment variables, settings, and videos are retained. Twenty-nine existing Bunny/watermark/database files were checked against their initial hashes and were unchanged. The two supplemental resource rows already had null Bunny IDs; rollback restores their previous behavior as well. No database migration is required, created, or applied. The pre-existing staged SQL files were not executed.

## Validation

- Existing video-security tests: 10 passed.
- Public-access regression test: 1 passed.
- New VdoCipher mapping, OTP and route tests: 9 passed (`npm run test:vdocipher`).
- Desktop/mobile browser tests: 16 checks passed, including three selections, fresh authorization, aspect ratio, overflow, stale responses, retry, and unexpected-host rejection. The test uses actual React components and Tailwind styles with mock playback, using cached Playwright/esbuild tooling without changing dependencies.
- `npm run lint` and `npx tsc --noEmit --incremental false`: passed.
- `docker compose -f docker-compose.prod.yml build arab-automators-web`: passed with the Dockerfile's normal Next.js 16.3.3 Turbopack production build.
- Isolated production image smoke test: unauthenticated POST 401, cross-site POST 403, unsupported GET 405. No published ports or external networking.
- Live VdoCipher OTP generation succeeded with the configured secret; neither the secret nor playback credentials were printed.

The secret is runtime-only in both Compose definitions and accessed only in a module guarded by `server-only`. It is absent from build arguments and Dockerfile ENV instructions. Existing `.dockerignore` rules exclude `.env`, `.env.*`, `.next`, and `.git`. `.gitignore` now also covers all `.env.*` files.

The actual secret (plus URL/base64 representations) was compared in memory against source and Git objects, with zero matches. The builder and production image audits covered 12 layers and 29,630 files: zero secret matches, zero source `.env` files, and zero image environment entries containing the secret. All 124 client files inspected in those layers were also free of the secret environment-variable reference. Captured builder output and existing application runtime logs contained no secret matches. Audit output contained counts/booleans only; no secret values or playback credentials were emitted.

## Deployment command (not run)

From `/opt/arabautomators/platform`, deploy the already built and checked image with:

```bash
docker compose -f docker-compose.prod.yml up -d --no-deps --no-build arab-automators-web
```

No Bunny settings command or SQL migration belongs in this deployment.
