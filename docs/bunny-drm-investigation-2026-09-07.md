# Bunny Stream DRM investigation — 7 September 2026

**Status after account-level investigation: account access works, but Enterprise DRM is not provisioned on the only accessible library. DRM remains disabled. No production configuration, videos, application code, or billing settings were changed.**

Library **739542**, named **arab-automators-course**, is serving unencrypted session videos. Account-level inspection now establishes that the authenticated account was created on **2026-08-29 at 15:16:26**, and the library was created about one minute later, at **15:17:34**. It is the account's only current Stream library. This account record does not match a seven-month-old deployment; a different or recreated account is a possible explanation, not a verified fact about the historical setup.

The immediate cause is missing Enterprise DRM provisioning/configuration and clear video renditions. Available audit history supports this library never having been configured for DRM, rather than a recent DRM reset. The earlier working account/library has not been identified.

## Account, entitlement, and history findings

- The supplied account credential authenticated `GET /user`, `GET /billing`, `GET /videolibrary/739542`, library listing, DRM statistics, and daily audit queries successfully. It was used in memory and was not copied into commands, source files, environment files, reports, or evidence.
- `DateJoined=2026-08-29T15:16:26`; `BillingFreeUntilDate=2026-09-12T15:16:26`; `TrialBalance=50`. The account is not suspended or disabled, and payments are not disabled. A zero cash balance is therefore not evidence of an expired account or DRM subscription.
- The library list returned `TotalItems=1` and `HasMoreItems=false`. No other current library with an older DRM configuration is accessible through this credential.
- Daily audit responses from 28 August through 7 September all returned `HasMoreData=false`. They show the library's creation, allowed-referrer changes, and user/payment setup. There are no returned DRM activation/deactivation, certificate, or library deletion events. The library's last modification, **2026-09-03T23:29:40**, corresponds to adding the current website referrer, not changing DRM.
- Both `AppleFairPlayDrm.Enabled` and `GoogleWidevineDrm.Enabled` are false. Their certificate IDs, expiration dates, and providers are all null. No expired DRM certificate was found; there is no certificate configured on this library.
- Account `MonthlyChargesDrm=0`, `MonthlyDRMLicensesIssued=0`; library `MonthlyChargesEnterpriseDrm=0`. Library DRM statistics returned zero licenses for 1 January through 7 September 2026. Billing returned no transaction records.
- `DrmBaseMonthlyPrice=99` and library `DrmBasePriceOverride=99` are pricing values, not proof of an active entitlement or payment. No purchase or billing change was made.

**Entitlement conclusion:** no activated Enterprise DRM instance or provider provisioning was found in the accessible account's only library. Bunny's account response does not expose a separate account-wide commercial-entitlement boolean, so an agreement attached elsewhere cannot be ruled out. The earlier entitlement, if it exists, must be located with the correct account access or by Bunny.

This is supported by Bunny's [Enterprise DRM activation guide](https://bunny.net/docs/stream/quickstart-mediacage-enterprise), which requires Bunny to provision the feature and the FairPlay deployment material where FairPlay is used. Inspection of the current public dashboard code also confirms that a Basic-mode library receives a **Contact Sales** action; the ordinary `EnableDRM` toggle enables Basic DRM. Existing Widevine/FairPlay settings can be updated only after Enterprise DRM is set up, according to the [library update API](https://bunny.net/docs/api-reference/core/stream-video-library/update-video-library). No support ticket or other message was sent.

## Verified live state

The Stream list API returned exactly three videos. Supabase session records reference all three:

| Session | Bunny video ID | Uploaded | Encoding status | Delivered DRM |
| --- | --- | --- | --- | --- |
| 1: n8n Foundations — Getting Started | `26d3d809-b72c-486f-a28c-05ef5719aff8` | 2026-08-29 | Finished (4) | Disabled |
| 2: Building Your First Workflow | `028bedbd-4e16-4333-be07-c046383bc58b` | 2026-08-29 | Finished (4) | Disabled |
| 3: Nodes, Triggers and Testing | `8558fc24-b253-449f-a628-68cc62327060` | 2026-08-30 | Finished (4) | Disabled |

For every video, `GET https://video.bunnycdn.com/library/739542/videos/{videoId}/play` returned the following, reconfirmed after the account investigation:

```json
{
  "enableDRM": false,
  "drmVersion": 0,
  "enableMP4Fallback": true,
  "widevineMinClientSecurityLevel": null,
  "widevineEmeRobustness": null,
  "allowEarlyPlay": false,
  "tokenAuthEnabled": false,
  "isPlayable": true,
  "isPlaylistPlayable": true,
  "preferredPlaybackSource": "Playlist"
}
```

The three master HLS playlists and all **15 video rendition playlists** (240p, 360p, 480p, 720p, 1080p for each video) were fetched again. None contained encryption key declarations. Each rendition contained media segments. This establishes that current HLS playback is unencrypted, independently of the API flags. The library administration response independently confirms `EnableDRM=false`, `DrmVersion=0` (Basic selected, disabled), `EnableMP4Fallback=true`, `KeepOriginalFiles=true`, `ExposeOriginals=false`, and `AllowEarlyPlay=false`.

All **12 MP4 fallback URLs tested** (360p, 480p, 720p, 1080p for each video) again returned HTTP 200 and `video/mp4` to HEAD requests with the website referrer. The playback API's `fallbackUrl` is a prefix ending in `play_`; the complete files use `play_{resolution}.mp4`. Checking the prefix alone returns 404 and does not establish that fallback files are unavailable. Video metadata reports `hasMP4Fallback=true` and `hasOriginal=true` for all three. Playback responses do not expose an original URL. Clear HLS and MP4 playback therefore remain available; prevention of these bypasses has not been achieved.

Sanitized measurements are saved in [the evidence JSON](bunny-drm-evidence-2026-09-07.json). API credentials, signed URLs, and raw playback responses are excluded.

## Embed investigation

`components/course/BunnyPlayer.tsx` uses `https://iframe.mediadelivery.net/embed/{libraryId}/{videoId}` and already allows `encrypted-media`. Both main session videos and Bunny-backed supplemental videos use this component. No application Permissions Policy disabling encrypted media was found.

All three videos were requested from both Bunny player hosts:

- `iframe.mediadelivery.net`: `isEntDrm = false`, `isFairplay = false`.
- `player.mediadelivery.net`: `drm-version="0"`.

Changing the hostname alone would not enable protection. Bunny's hosted player supports its Enterprise DRM integration; the library and encrypted media must be configured on Bunny. There is no documented per-video DRM toggle in the [Update Video API](https://bunny.net/docs/api-reference/stream/manage-videos/update-video). DRM configuration is exposed through [Update Video Library](https://bunny.net/docs/api-reference/core/stream-video-library/update-video-library).

Two additional Session 1 resources have no Bunny video ID and use Supabase file URLs: **Main video General** (`video`) and **Supabase** (`credential_video`). `SessionVideoResourcesRow.tsx` renders these through ordinary HTML video elements. Enabling Bunny DRM will not protect these separate files; they also need migration to protected delivery if session-wide protection is required.

## Initial access limitation — resolved

The initial investigation had only `BUNNY_STREAM_API_KEY`, library ID 739542, and its CDN hostname. The September 3 deployment backup contains the same Stream credentials and library ID.

The initial library administration request with the Stream key returned **401**. The subsequently supplied account credential returned **200** and removed this access blocker. Bunny documents that the [Core API requires an account key, whereas Stream uses a library key](https://bunny.net/docs/api-reference/authentication).

The current blocker is Enterprise provisioning, not API authentication. The available account/library/audit data does not establish the identity or configuration of the previously working deployment. It does establish that this account and library are recent and provides no evidence of a billing lapse, certificate expiry, or DRM reset on this library.

## Reprocessing decision and irreversible-operation stop

The existing videos must acquire encrypted renditions under a provisioned Enterprise configuration before they can provide actual DRM playback. Setting an iframe parameter or reencoding under the current disabled DRM configuration cannot achieve that.

Bunny exposes these existing-video operations:

- `POST /library/739542/videos/{videoId}/reencode` on `video.bunnycdn.com`, for each of the three video IDs above, to regenerate encoded output from retained originals.
- `POST /library/739542/videos/{videoId}/repackage` on `video.bunnycdn.com`; whether this can convert these particular existing clear assets to Enterprise DRM needs confirmation before use.

Both operations are explicitly described as **non-cancelable once started** in Bunny's current dashboard confirmation dialogs. Neither was started, consistent with the user's instruction to stop before an irreversible operation. There is also no Enterprise configuration ready for these operations to use. No source deletion, rendition cleanup, forced `DrmVersion` switch, purchase, or destructive operation was attempted.

Once Enterprise is provisioned, the exact reprocessing operation and its impact must be reported for approval before it is started. Original files must remain retained. Previously generated clear renditions and cached URLs must be checked afterward; deleting outputs is not an acceptable default workaround. Bunny's [encoding/storage documentation](https://bunny.net/docs/stream/pricing) notes that disabling an encoding option does not automatically remove files already generated.

## Work still required to restore protection

1. Locate the previously working account/Enterprise entitlement, or have Bunny inspect that history and provision Enterprise DRM for library 739542. Account authentication is already working. A fresh purchase has not been established as the necessary solution.
2. Restore the Widevine/FairPlay provider configuration and appropriate device security policy through Bunny's supported provisioning process. Basic MediaCage does not provide the requested hardware capture protection. The current account is on an active trial, not an identified expired DRM subscription.
3. Obtain approval for the specific non-cancelable reprocessing operation described above once provisioning is ready. Disable MP4 fallback, keep original exposure disabled, and keep sources retained. Verify old clear URLs and caches are blocked without source deletion; escalate to Bunny if supported configuration cannot accomplish that.
4. Verify Enterprise configuration, encrypted manifests, successful DRM license acquisition, normal playback, and inheritance on a subsequent upload. Migrate the two Supabase video resources if they must share this protection. No application/player change is currently indicated; the existing iframe already permits encrypted media.
5. On real supported devices, open session pages and attempt screen recording. Check Safari/FairPlay and the intended Widevine device/browser combinations. Confirm both normal playback and black video in recordings. Hardware enforcement depends on the device, browser, and license policy; enabling DRM alone is not proof of blackout everywhere. Bunny's [Widevine security-level documentation](https://bunny.net/docs/stream/widevine-security-levels) explains the distinction between hardware protection and software-only L3.

Only this investigation report and its sanitized evidence were updated in the repository. No application build or tests were needed because application code was unchanged. No device playback, DRM license acquisition, or recorder-blackout test was performed. No claim of restored protection is made.
