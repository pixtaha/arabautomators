The current-platform hardening is prepared in the working tree. Application code has not been deployed, and the SQL migration has not been applied to production. Deploying this code before Enterprise delivery is ready intentionally shows unavailable video placeholders. The existing production application continues to use its previous playback implementation until cutover. No screen-recording blackout has been verified on this VPS.

The only remote configuration changes performed were `EnableMP4Fallback=false` and `AllowDirectPlay=false` on Bunny library **739542**. They were sent as a two-field POST to `/videolibrary/739542`, then read back. Unrelated library fields were compared in memory and remained unchanged. The separate embed/CDN token security key was installed in the ignored local `.env` as `BUNNY_STREAM_TOKEN_SECURITY_KEY`, with file permissions 0600. No key values or fingerprints are in this report. That key differs from `BUNNY_STREAM_API_KEY`. The application does not need the account-level key at runtime.

The playback map is:

| Content/data source | Previous path | Prepared path |
| --- | --- | --- |
| `/course/[sessionId]`, `sessions.main_video_bunny_id` | `SessionVideoPlayer` → `BunnyPlayer` → unsigned `iframe.mediadelivery.net/embed/{library}/{video}` | Same main-video position → authenticated session/video playback API → server-signed official `player.mediadelivery.net/embed/{library}/{video}` iframe |
| `session_resources.type=video` or `credential_video`, `bunny_video_id` | Bunny iframe when an ID exists | Same expandable cards and category ordering → the same protected playback API |
| Those resource types with only `file_url` | Native HTML video with public Supabase URL | No native video/fallback and no clear URL in application responses; unavailable card until its existing row is linked to a processed Bunny video |
| `session_videos` | Two stored references in Session 1, order 1/2, but **no reader or renderer in the current codebase** | Unchanged. They are not silently inserted into the current UI or authorized as new playback paths |
| `/test-video` | Separate placeholder/debug iframe route | Always returns 404; real course association is required for signing |
| PDFs, voice notes, workflow files, text notes | Supabase links/audio through `SessionResourcesPanel`, `VoiceNoteCard`, and `WorkflowResourceCard` | Unchanged storage and presentation; the uploader rejects obvious video files/manifests under a non-video category |
| Admin resource upload/list | All uploaded files, including video, sent to public `session-resources`; raw video links shown to admins | Video categories link a processed video ID verified against the configured Bunny library. Non-video uploads retain the existing Supabase path. Admin lists suppress video file URLs |

There was no application HLS player or custom MP4 URL builder. The clear paths were the Supabase video fallback and Bunny's own unprotected delivery configuration. `lib/bunny.ts` constructs server-side Stream metadata API URLs. `lib/bunny-playback.ts` now constructs the server-side play-data request and the official signed embed URL. The raw play-data response, including any CDN playlist/source/fallback URLs, is never returned to the browser. Bunny's embedded player necessarily requests its own manifests, segments and DRM licenses in the browser; those must be encrypted/authorized by Bunny.

The new playback API checks an active device session, validates both IDs, and confirms the video is the requested session's main video or a linked video resource. It never signs an arbitrary library video. Responses use `private, no-store` and vary on cookies. Cross-site fetches are rejected. The signer is a `server-only` module and uses the documented SHA-256 hex signature over the token security key, video ID, and expiration. Tokens are requested when the iframe mounts, including when an expandable card opens, to avoid serving a token minted hours before a hidden card is opened. Lifetime covers video duration plus allowance, bounded between one and six hours. The iframe permits `encrypted-media` and sends the production origin as its referrer.

The gate refuses Basic DRM versions 0/2, missing protection metadata, early play, exposed original URLs, disabled CDN token authentication, unfinished/unplayable videos, mismatched library/video IDs, and video records still advertising MP4 fallbacks. This is a deployment safety gate, **not proof that every stored rendition or old URL has been reprotected**. The media audit and actual license/device tests below remain mandatory.

Current configuration and activation targets:

| Setting | Verified after preparation | Activation target |
| --- | --- | --- |
| `EnableDRM` / `DrmVersion` | false / 0 | true / Enterprise (1), only after Bunny provisioning |
| `GoogleWidevineDrm.Enabled` | false, no provider/certificate | true after provisioning |
| `AppleFairPlayDrm.Enabled` | false, no provider/certificate | true after provisioning and FairPlay material |
| `EnableMP4Fallback` | changed to false | false, including old media availability |
| `AllowDirectPlay` | changed to false | false; verify direct-play requests fail |
| `ExposeOriginals` / `AllowEarlyPlay` | already false / false | remain false |
| `KeepOriginalFiles` | already true | remain true; retained originals must stay private |
| `PlayerTokenAuthenticationEnabled` | false | true with deployed signed player |
| CDN `ZoneSecurityEnabled` | false | true via library update `EnableTokenAuthentication=true` |
| `AllowedReferrers` | `arabautomators.com` only | retain this production allowlist; no preview, wildcard or localhost domains |
| `BlockNoneReferrer` | already true | retain true; validate the embedded player and license requests |
| `GoogleWidevineDrm.SdOnlyForL3` | false | staged true; this limits L3 quality, not screen capture |

Use [Bunny Stream → library 739542 → Security](https://dash.bunny.net/) to request Enterprise activation. Bunny's [provisioning guide](https://bunny.net/docs/stream/quickstart-mediacage-enterprise) requires coordination with Bunny and the FairPlay deployment material where FairPlay is used. Request Widevine and FairPlay for this current library. Provide FairPlay certificate/private-key/ASK material through Bunny's secure process, never through source control or reports. No sales/support message or purchase was performed here.

Eight security tests, lint and TypeScript validation pass. The production build passes with `npm run build -- --webpack`; the default Turbopack build was blocked by the host's build-worker port restriction even on its approved retry. The client-asset scan found no actual Bunny key values and no private Bunny credential environment names, and confirmed `encrypted-media` in the player asset. Tests cover signer key selection, bounded expiration, Basic/missing protection rejection, legacy URL suppression with ordering/non-video preservation, and the actual route handler's authentication/association/error boundaries. SQL was reviewed but not executed against a database; the migration must be validated in staging before production cutover. Test tooling requires Node 22's TypeScript stripping and VM modules; production application code remains compatible with the existing Node 20 container.

The three existing Bunny videos all have retained originals, status 4, and `hasMP4Fallback=true`:

| Video ID | Current delivery |
| --- | --- |
| `26d3d809-b72c-486f-a28c-05ef5719aff8` | Clear HLS and old MP4 files |
| `028bedbd-4e16-4333-be07-c046383bc58b` | Clear HLS and old MP4 files |
| `8558fc24-b253-449f-a628-68cc62327060` | Clear HLS and old MP4 files |

After the library update propagated, the fresh delivery audit still found all three unsigned master playlists and all 15 renditions accessible with the production referrer. No rendition had encryption-key declarations. All 12 previously generated MP4 fallbacks (360p/480p/720p/1080p) returned 200 with that referrer; the tested MP4 URL without a referrer returned 403 for each video. Referrer enforcement alone therefore does not close those clear paths. Measurements are in `bunny-delivery-verification.json`. The immediate post-update API snapshot in `bunny-enterprise-drm-state.json` still showed cached playback fallback flags; the later delivery audit confirms those flags became false while the old files remained accessible.

For the existing videos, the supported conservative path is **re-encode from the retained originals after Enterprise is active**, using `POST https://video.bunnycdn.com/library/739542/videos/{videoId}/reencode`. No re-upload is required merely to regenerate those retained originals. Bunny documents [reencoding](https://bunny.net/docs/api-reference/stream/manage-videos/reencode-video) and its [original-file prerequisite](https://bunny.net/docs/stream/encoding). It also exposes [repackage](https://bunny.net/docs/api-reference/stream/manage-videos/repackage-video), but that reference alone does not establish that a repackage converts these particular old clear assets and retires all clear versions. Obtain Bunny's confirmation before substituting repackage for reencode. Its `keepOriginalFiles=true` parameter retains previous packaged versions; it must not be interpreted as invalidating old URLs. No reencode, repackage, source deletion, or video upload was executed.

Ask Bunny to confirm the exact handling of old clear files before cutover: regenerate/reprotect the HLS manifests and their video/audio renditions; make previous clear segment paths, `/{videoId}/play_{resolution}.mp4`, direct-play and original-file paths inaccessible; then invalidate the affected CDN caches. Cache purging alone cannot protect a clear file still served by the origin. Embed tokens alone cannot protect raw files either: CDN file token authentication and encrypted delivery are distinct requirements. Test old URLs even with a copied valid media token; a directory token must not permit an old clear MP4. If targeted CDN rules are needed, they must block the old fallback/source paths without blocking DRM initialization/media segments. Do not add a broad `*.mp4` rule blindly.

Two additional protected resources still need migration into Bunny after provisioning:

| Existing resource | ID | Preserve order |
| --- | --- | --- |
| Main video General (`video`) | `1afe54f0-aab2-4583-8d77-22a591cb9885` | 3 |
| Supabase (`credential_video`) | `6965a2fa-9dbf-422a-8d64-61e5ed7ce3e2` | 5 |

Both belong to Session 1 (`7caceae2-03eb-4bc7-a80f-3ef463ff52fd`). The staged migration archives only their video source locations in a table inaccessible to anon/authenticated database roles, then clears video `file_url` values. It leaves all storage objects and non-video rows intact. This also prevents raw legacy URLs being read directly from the public resource table after migration. New/updated video rows must contain a Bunny GUID. The admin PATCH flow replaces the Bunny ID in the existing card rather than deleting/recreating it. After relinking all legacy rows, validate the `session_resources_video_requires_bunny` constraint.

Archiving the database URL is not revoking Storage access. Preserve a verified private copy of each legacy source, move playback to Bunny, and revoke/invalidate the two old public object paths during cutover. Do not make the entire `session-resources` bucket private, because that would break the PDFs/audio/workflow links that must remain on Supabase. No Supabase object has been moved or deleted by this change.

The rollout sequence is:

1. Obtain Enterprise provisioning for library 739542 and activate Widevine/FairPlay. Keep originals private, MP4 fallback/direct play/early play disabled, and the exact production referrer restriction. Choose the Widevine device policy explicitly: SD-only L3 still allows software capture; require a suitable hardware security level if L3 playback must be refused entirely.
2. Confirm with Bunny the reprocessing and old-file invalidation procedure, then re-encode the three retained originals under the active Enterprise configuration. Verify completed encoding and DRM manifests/licensing. The new application refuses videos still reporting MP4 fallback files.
3. Upload the two Supabase video sources to the provisioned Bunny library. Validate/apply the staged SQL migration and relink the existing resource rows; quarantine/invalidate their public source paths. Keep non-video resources unchanged.
4. Build and deploy the prepared application with the separate token key in its runtime environment. The gate stays closed until authentication/protection checks pass. Do not expose the account key to the web container. Coordinate this cutover to avoid presenting an incomplete rollout as usable protected playback.
5. Run `python3 scripts/bunny-drm.py activate-auth`. It refuses to proceed without Enterprise and both DRM providers active and the new production playback API returning 401 to an unauthenticated probe. It minimally enables embed/CDN tokens and SD-only L3, preserving unrelated settings and reading back changes. This command has NOT been run. `python3 scripts/bunny-drm.py inspect` reads the current configuration; `prepare` has already been run.
6. Run `python3 scripts/check-bunny-delivery.py` again: every old unsigned clear URL must be denied. Also inspect an authenticated player's signed playlists, all video/audio renditions and DRM license traffic; verify that copied valid media tokens cannot reach any retained clear fallback. The unsigned-URL audit alone is insufficient to validate a signed encrypted playback session.
7. On a physical iPhone/iPad or Mac using Safari, sign in and play each video; confirm successful FairPlay license acquisition, normal audio/video, seek/fullscreen and expandable-card ordering. Record the screen with the OS recorder and take screenshots. Inspect the saved captures for black/blocked video while normal on-screen playback works. Repeat on an actually supported hardware Widevine device/browser and confirm its negotiated security level.
8. Test an L3 client separately: expect SD restriction if SD-only L3 is chosen, **not guaranteed blackout**; expect refusal if the chosen policy excludes L3. Also verify logged-out/revoked-device playback API rejection, unsigned/expired/tampered embed and license token rejection, invalid-referrer rejection, playback across token/license renewal, and unchanged PDF/voice-note/workflow access. Blackout cannot be certified from server HTTP checks.

No JavaScript or CSS screen-recording prevention is claimed. Capture resistance comes from provisioned Widevine/FairPlay, correctly encrypted delivery, device security policy, and the actual protected media path. Bunny explicitly [excludes L3 from its screen-grab protection](https://bunny.net/docs/stream/drm).

Exact file and changed-line map (new files start at line 1):

| File | Changed-line anchors |
| --- | --- |
| `.dockerignore` | [5](/opt/arabautomators/platform/.dockerignore:5) |
| `app/api/admin/session-resources/[id]/route.ts` | [2](/opt/arabautomators/platform/app/api/admin/session-resources/[id]/route.ts:2), [10](/opt/arabautomators/platform/app/api/admin/session-resources/[id]/route.ts:10) |
| `app/api/admin/session-resources/route.ts` | [2](/opt/arabautomators/platform/app/api/admin/session-resources/route.ts:2), [6](/opt/arabautomators/platform/app/api/admin/session-resources/route.ts:6), [39](/opt/arabautomators/platform/app/api/admin/session-resources/route.ts:39), [64](/opt/arabautomators/platform/app/api/admin/session-resources/route.ts:64), [113](/opt/arabautomators/platform/app/api/admin/session-resources/route.ts:113), [126](/opt/arabautomators/platform/app/api/admin/session-resources/route.ts:126) |
| `app/api/course/[sessionId]/videos/[videoId]/playback/route.ts` | [1](/opt/arabautomators/platform/app/api/course/[sessionId]/videos/[videoId]/playback/route.ts:1) |
| `app/test-video/page.tsx` | [1](/opt/arabautomators/platform/app/test-video/page.tsx:1), [3](/opt/arabautomators/platform/app/test-video/page.tsx:3), [5](/opt/arabautomators/platform/app/test-video/page.tsx:5) |
| `components/admin/SessionResourcesAdminClient.tsx` | [11](/opt/arabautomators/platform/components/admin/SessionResourcesAdminClient.tsx:11), [103](/opt/arabautomators/platform/components/admin/SessionResourcesAdminClient.tsx:103), [160](/opt/arabautomators/platform/components/admin/SessionResourcesAdminClient.tsx:160), [168](/opt/arabautomators/platform/components/admin/SessionResourcesAdminClient.tsx:168), [179](/opt/arabautomators/platform/components/admin/SessionResourcesAdminClient.tsx:179), [189](/opt/arabautomators/platform/components/admin/SessionResourcesAdminClient.tsx:189), [192](/opt/arabautomators/platform/components/admin/SessionResourcesAdminClient.tsx:192), [204](/opt/arabautomators/platform/components/admin/SessionResourcesAdminClient.tsx:204), [215](/opt/arabautomators/platform/components/admin/SessionResourcesAdminClient.tsx:215), [352](/opt/arabautomators/platform/components/admin/SessionResourcesAdminClient.tsx:352), [441](/opt/arabautomators/platform/components/admin/SessionResourcesAdminClient.tsx:441), [469](/opt/arabautomators/platform/components/admin/SessionResourcesAdminClient.tsx:469) |
| `components/course/BunnyPlayer.tsx` | [1](/opt/arabautomators/platform/components/course/BunnyPlayer.tsx:1), [3](/opt/arabautomators/platform/components/course/BunnyPlayer.tsx:3), [5](/opt/arabautomators/platform/components/course/BunnyPlayer.tsx:5), [15](/opt/arabautomators/platform/components/course/BunnyPlayer.tsx:15), [43](/opt/arabautomators/platform/components/course/BunnyPlayer.tsx:43) |
| `components/course/SessionVideoPlayer.tsx` | [8](/opt/arabautomators/platform/components/course/SessionVideoPlayer.tsx:8) |
| `components/course/SessionVideoResourcesRow.tsx` | [20](/opt/arabautomators/platform/components/course/SessionVideoResourcesRow.tsx:20) |
| `docker-compose.prod.yml` | [12](/opt/arabautomators/platform/docker-compose.prod.yml:12) |
| `docker-compose.yml` | [14](/opt/arabautomators/platform/docker-compose.yml:14) |
| `docs/bunny-delivery-verification.json` | [1](/opt/arabautomators/platform/docs/bunny-delivery-verification.json:1) |
| `docs/bunny-enterprise-drm-state.json` | [1](/opt/arabautomators/platform/docs/bunny-enterprise-drm-state.json:1) |
| `lib/bunny-playback.ts` | [1](/opt/arabautomators/platform/lib/bunny-playback.ts:1) |
| `lib/bunny.ts` | [2](/opt/arabautomators/platform/lib/bunny.ts:2), [19](/opt/arabautomators/platform/lib/bunny.ts:19), [30](/opt/arabautomators/platform/lib/bunny.ts:30) |
| `lib/data/courseSessions.ts` | [4](/opt/arabautomators/platform/lib/data/courseSessions.ts:4), [78](/opt/arabautomators/platform/lib/data/courseSessions.ts:78) |
| `lib/sessionResources.ts` | [4](/opt/arabautomators/platform/lib/sessionResources.ts:4) |
| `lib/supabase/admin.ts` | [1](/opt/arabautomators/platform/lib/supabase/admin.ts:1) |
| `package.json` | [9](/opt/arabautomators/platform/package.json:9) |
| `scripts/bunny-drm.py` | [1](/opt/arabautomators/platform/scripts/bunny-drm.py:1) |
| `scripts/check-bunny-delivery.py` | [1](/opt/arabautomators/platform/scripts/check-bunny-delivery.py:1) |
| `supabase/migrations/20260907_protected_session_videos.sql` | [1](/opt/arabautomators/platform/supabase/migrations/20260907_protected_session_videos.sql:1) |
| `tests/bunny-playback.test.mjs` | [1](/opt/arabautomators/platform/tests/bunny-playback.test.mjs:1) |
| `tests/playback-route.test.mjs` | [1](/opt/arabautomators/platform/tests/playback-route.test.mjs:1) |
| `tests/video-security.test.mjs` | [1](/opt/arabautomators/platform/tests/video-security.test.mjs:1) |

The local ignored `.env` additionally received only the separate Bunny token-security-key setting; its secret value is intentionally omitted. This rollout document is also new. Existing historical investigation documents were not changed.
