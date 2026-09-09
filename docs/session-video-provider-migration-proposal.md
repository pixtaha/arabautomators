# Session video providers: migration proposal

Status: inspection complete; implementation paused at the user's migration gate. No migration, database write, application change, or deployment has been performed for this task.

## Schema found

Read-only inspection of the configured Supabase project's live REST schema confirmed:

- `session_resources`: `id uuid`, nullable `session_id uuid`, `type text`, `title text`, nullable `file_url text`, nullable `bunny_video_id text`, `order_index integer`, `created_at timestamptz`, nullable `file_size_bytes bigint`, nullable `page_count integer`.
- `sessions`: the dedicated main recording uses nullable `main_video_bunny_id text`.
- Neither table has a provider column or a VdoCipher ID column.

The application recognizes two video resource types: `video` (general/supplemental recordings) and `credential_video`. The dedicated main recording is stored separately on `sessions`; adding columns only to `session_resources` would leave that path Bunny-only.

The current VdoCipher test ID, `5b775e705e8c43278ff60092a17c680a`, is stored in `lib/video-provider-config.ts`, in a server-only map for Session 1's main recording and two resource IDs. It is not stored in provider-aware database fields. The resolver currently enables this playlist only for sessions in that map.

Admin GET/POST/PATCH routes and the form currently read or write only `bunny_video_id`. Both create and relink validate Bunny IDs and query Bunny processing status. Non-video uploads use the existing Supabase Storage flow.

## Smallest safe schema change

Add four nullable text columns, with no database defaults and no data backfill:

```sql
-- Proposal only. Do not execute this fragment independently of the constraint review below.
alter table public.session_resources
  add column video_provider text,
  add column vdocipher_video_id text;

alter table public.sessions
  add column main_video_provider text,
  add column main_video_vdocipher_id text;
```

Nullable providers preserve legacy rows without changing their interpretation. The admin form and API must explicitly submit `vdocipher` for new VdoCipher links; a database-wide VdoCipher default would incorrectly reinterpret existing Bunny records and non-video resources.

The final forward migration must run in one transaction and include these checks:

1. Providers are null (legacy), `bunny`, or `vdocipher`. Resource provider fields are used only for `video` and `credential_video`.
2. A VdoCipher ID, when present, is exactly 32 hexadecimal characters. An explicitly selected VdoCipher provider requires that ID. Validate and normalize IDs in the API as well.
3. Explicit Bunny links require a valid Bunny UUID; retained alternate-provider IDs remain allowed. Selecting VdoCipher must not clear an existing Bunny ID, and selecting Bunny must not clear an existing VdoCipher ID.
4. Preserve the prohibition on clear video `file_url` values. Do not archive, clear, delete, or rewrite existing URLs as part of this change.
5. Preserve unlinked legacy rows using `NOT VALID` where an existing-data constraint would otherwise reject them. PostgreSQL still enforces such checks on new or updated rows. Do not bulk-update or automatically relink these legacy rows.

The local `supabase/migrations/20260907_protected_session_videos.sql` defines `session_resources_video_requires_bunny`, which would reject VdoCipher-only resources. Its live installation status is not exposed by the REST schema metadata. Before applying a migration, inspect live constraints:

```sql
select conrelid::regclass as table_name, conname, convalidated,
       pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid in ('public.session_resources'::regclass, 'public.sessions'::regclass)
order by conrelid::regclass::text, conname;
```

If the Bunny-only constraint is installed, replace it with the equivalent provider-aware source requirement in the same transaction: legacy/Bunny resources require their Bunny ID; VdoCipher resources require their VdoCipher ID. Keep the clear-video-URL guard and all RLS policies. Do not apply the earlier protected-video migration as a prerequisite: it also changes existing source URLs.

No existing columns, IDs, rows, storage objects, policies, or provider settings need to be deleted. No enrollment or authorization schema change is proposed.

## Implementation after the migration gate

- Add an accessible VdoCipher/Bunny selector to video creation and relinking. Default new video links to VdoCipher; existing links open with their current provider. Use `VdoCipher Video ID` and the exact helper: `Upload the video to VdoCipher, wait until processing is complete, then paste the Video ID.` Retain the current Bunny label and helper only when Bunny is selected.
- Store general, supplemental, and credential links in the new resource fields; store the dedicated main recording in the corresponding session fields. Expose provider selection for that main recording as well.
- Preserve non-video form controls, API behavior, storage, and data.
- Extend the shared server-side resolver and database selects to support every session. An explicit stored provider takes precedence over the Session 1 test map. Rows without a stored provider retain the existing override/Bunny behavior.
- Use the existing VdoCipher part-playback POST route for stored VdoCipher links, with the current authenticated active-device check, session existence and resource ownership checks, server-only OTP secret, and dynamic forensic watermark. Preserve the current course access policy; there is no separate enrollment model in the inspected flow.
- Keep the existing Bunny components, routes, IDs, and configuration available for rollback. Any global rollback behavior must resolve retained Bunny IDs without changing stored provider selections. A newly created VdoCipher-only record has no Bunny media to play during rollback until an admin supplies a Bunny ID.
- Do not automatically move the test ID into database rows or overwrite existing resources.

## Validation and deployment

Only this proposal document was added. Application implementation and its requested lint, TypeScript, security/public-access/VdoCipher tests, and Docker build remain pending; results from the earlier Safari task are not validation of this change.

After implementation and successful validation, the deployment command from `/opt/arabautomators/platform` is:

```bash
docker compose -f docker-compose.prod.yml up -d --no-deps --no-build arab-automators-web
```

It has not been executed. Schema migration approval/application is a separate prerequisite, not part of that deployment command.
