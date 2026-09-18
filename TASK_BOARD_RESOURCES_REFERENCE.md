# Task Board — Resources & Submission Requirements Reference

Read-only investigation of the admin "New/Edit Task" form (`/admin/task-board`) — specifically the **Resources** and **Submission Requirements** sections. No application code was changed to produce this document.

## Source files

| Layer | File |
|---|---|
| Admin page route | `app/admin/task-board/page.tsx` → `components/admin/AdminTaskBoardClient.tsx` |
| Admin New/Edit Task form (both sections live here) | `components/admin/CreateTaskBoardTaskForm.tsx` |
| Shared constants (code-resource languages) | `lib/taskBoardConstants.ts` |
| Server-side validation, shared by POST + PATCH | `lib/taskBoardValidation.ts` |
| Create task API | `app/api/admin/task-board/tasks/route.ts` (`POST`) |
| Edit task API | `app/api/admin/task-board/tasks/[taskId]/route.ts` (`GET`, `PATCH`) |
| Resource file upload API (image/pdf resource files only) | `app/api/admin/task-board/resource-uploads/route.ts` |
| Row types / DB read helpers | `lib/data/taskBoard.ts` |
| Student-facing rendering + submission form | `components/dashboard/TaskBoardClient.tsx` |
| Student submission API (validates what the task *requires*) | `app/api/task-board/tasks/[taskId]/submission/route.ts` |
| DB migrations | `supabase/migrations/20260911_create_task_board.sql`, `20260911_add_task_board_level_content.sql`, `20260913_task_board_flexible_submissions_and_scheduling.sql`, `20260914_task_board_submission_type_flags.sql`, `20260914_task_board_task_resources.sql`, `20260916_task_board_custom_labels_and_completion_colors.sql` |

---

## 1. Resources

Resources are optional, admin-authored illustrative reference material (images, videos, PDFs, or example code) attached to a task and shown to students alongside a level's description/checklist. They are stored in their own table, **`task_board_task_resources`**, one row per resource, in any quantity (including several of the same type).

### Common fields (all resource types)

| DB column | API payload key (camelCase, sent by the form) | Required? | Notes |
|---|---|---|---|
| `type` | `type` | Yes | One of `image`, `video`, `pdf`, `code`. (The task brief calls the fourth type "code-block"; in the DB/API/UI it is simply `code`, labeled "Code" in the type dropdown.) |
| `label` | `label` | **No**, for every type, including code | Free text. Rendered as a small heading above the resource on the student side. If left blank, the student view falls back to `r.label ?? (type === "video" ? "Watch video" : "Download PDF")` for video/pdf, shows nothing for image, and shows nothing for code. |
| `scope` | `scope` | Yes | `general` or `levels`. See "Scope" below. |
| `levels` | `levels` | Conditionally required | Array subset of `["base","medium","hard"]`. Required (non-empty) only when `scope = "levels"`; forced to `[]` when `scope = "general"`. |
| `url` | `url` | Required for image/video/pdf; must be `null` for code | See per-type table below. |
| `code_content` | `codeContent` | Required for code; must be `null` for image/video/pdf | See code row below. |
| `code_language` | `codeLanguage` | Only meaningful for code | See code row below. |
| `sort_order` | *(not sent by client)* | — | Server sets this to the resource's array index at insert time. Determines display order. |
| `id`, `task_id`, `created_at` | — | — | Server-generated. |

**Scope storage:** `scope` is a plain text column constrained to `'general'` or `'levels'` (`task_board_task_resources` CHECK). When `general`, `levels` is stored as `NULL` (or empty array — both pass the CHECK). When `levels`, the DB CHECK `task_board_task_resources_levels_match_scope` requires `levels` to be non-empty and a subset of `{base, medium, hard}`. The form UI presents this as two pill buttons ("General" / "Specific levels") plus, when "Specific levels" is chosen, three checkboxes (Base/Medium/Hard).

### Per-type fields

#### Image

| Field | Required? | Validation / notes |
|---|---|---|
| Label | No | Free text |
| Image file | **Yes** | Uploaded immediately via a separate endpoint, `POST /api/admin/task-board/resource-uploads` (multipart, `type=image`), **before** the task form is submitted. The main create/edit request never carries the file itself — only the resulting public URL. |
| — allowed MIME types | — | `image/jpeg`, `image/png`, `image/webp` only (checked against the browser-reported `file.type`, not the extension). Rejected with "Image must be JPG, PNG, or WEBP." |
| — max file size | — | 50 MB (`MAX_SIZE_BYTES` in `resource-uploads/route.ts`). Rejected with "File must be 50 MB or smaller." |
| Scope / levels | Yes / conditional | As above |
| Alt text | **Does not exist** | There is no dedicated alt-text field. The `<img>` tag's `alt` attribute is auto-derived as `r.label ?? "Resource image"` — i.e. the Label field silently doubles as alt text if filled in. |

#### Video

| Field | Required? | Validation / notes |
|---|---|---|
| Label | No | Free text |
| Video URL | **Yes** | Plain text input, placeholder `https://youtube.com/watch?v=...`. |
| — host restriction | **None enforced.** | Despite the UI copy ("Video (YouTube/Vimeo link)" in the type dropdown, "Video URL (YouTube/Vimeo)" as the field label), the actual validation (`parseResource` in `lib/taskBoardValidation.ts`) only checks that the string parses via `new URL(...)`. Any well-formed URL (any host, any protocol `new URL` accepts) is accepted and stored. |
| — no upload path | — | Confirmed by a migration comment: video resources are deliberately URL-only, no file upload, no video hosting integration. |
| — no title field | — | No separate "Title" field beyond the shared Label field above — the task brief's suspicion that video might need something extra beyond URL does not hold; Label is the only additional field, and it's optional. |
| Scope / levels | Yes / conditional | As above |
| Rendering | — | Displayed to students as a plain outbound link/button — `label ?? "Watch video"` with an arrow icon, opening in a new tab. **Not embedded** as an iframe/player. |

#### PDF

| Field | Required? | Validation / notes |
|---|---|---|
| Label | No | Free text |
| PDF file | **Yes** | Uploaded via the same `POST /api/admin/task-board/resource-uploads` endpoint (`type=pdf`), before the task form submits. |
| — allowed MIME type | — | `application/pdf` only. Rejected with "File must be a PDF." |
| — max file size | — | 50 MB, same shared limit/endpoint as image. |
| Scope / levels | Yes / conditional | As above |
| Rendering | — | Plain outbound link/button — `label ?? "Download PDF"`. |

#### Code (the brief's "code-block")

| Field | Required? | Validation / notes |
|---|---|---|
| Label | No | Free text; shown as a small heading above the code block if set, otherwise nothing. |
| Language | **Yes, but always has a value** | `<select>` dropdown, not free text. Allowed values (`ALLOWED_CODE_LANGUAGES` in `lib/taskBoardConstants.ts`): `javascript`, `typescript`, `json`, `python`, `bash` — exactly these 5, no others. Defaults to `javascript` (first in the list) and cannot be left blank; server also silently falls back to `javascript` if an invalid value is somehow sent. |
| Code content | **Yes** | Plain `<textarea>`, no syntax checking. Rendered to students via `react-syntax-highlighter` using the chosen language. |
| — max length | — | Silently truncated server-side to **20,000 characters** (`code_content: r.codeContent.trim().slice(0, 20_000)` in `parseResource`). No client-side warning if you paste more — it just gets cut off on save. |
| URL | N/A | Must be absent — DB CHECK `task_board_task_resources_content_matches_type` requires `url IS NULL` when `type = 'code'`; the form always sends `url: null` for code resources. |
| Scope / levels | Yes / conditional | As above |

### Resources — exact API payload shape

Sent as part of the task create/edit JSON body's `resources` array (camelCase; converted to the snake_case DB columns below server-side):

```jsonc
{
  "resources": [
    {
      "type": "image" | "video" | "pdf" | "code",
      "label": "string or null",
      "scope": "general" | "levels",
      "levels": ["base", "medium", "hard"],   // only non-empty when scope === "levels"; [] otherwise
      "url": "string or null",                // required (non-null) for image/video/pdf; null for code
      "codeContent": "string or null",        // required (non-null) for code; null otherwise
      "codeLanguage": "string or null"        // one of ALLOWED_CODE_LANGUAGES; only meaningful for code
    }
  ]
}
```

### Resources — exact DB table/columns

`public.task_board_task_resources`:

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK, generated |
| `task_id` | `uuid` | FK → `task_board_tasks(id)`, `on delete cascade` |
| `type` | `text` | CHECK `in ('image','video','pdf','code')` |
| `label` | `text`, nullable | |
| `scope` | `text` | CHECK `in ('general','levels')` |
| `levels` | `text[]`, nullable | CHECK: matches `scope` (see above) and, when present, `<@ array['base','medium','hard']` |
| `url` | `text`, nullable | CHECK (via `task_board_task_resources_content_matches_type`): non-null iff `type in ('image','video','pdf')` |
| `code_content` | `text`, nullable | CHECK: non-null iff `type = 'code'` |
| `code_language` | `text`, nullable | Free text column at the DB level (no CHECK constraint on the value) — the 5-language allow-list is enforced only in application code (`parseResource`), not the database. |
| `sort_order` | `integer` | Default 0; set by the API to array index on insert |
| `created_at` | `timestamptz` | Default `now()` |

Storage: image/pdf resource files live in the **public** `task-board-resources` Supabase Storage bucket (separate from the private `task-board-submissions` bucket used for student work).

### Resources — save/edit behavior (a genuine quirk, not a field)

Editing a task's resources is **delete-all-and-reinsert**, not a diff. On every `PATCH`, the API deletes every existing `task_board_task_resources` row for that task and re-inserts whatever the form currently holds (see `app/api/admin/task-board/tasks/[taskId]/route.ts`). Any old image/pdf storage object whose URL doesn't appear in the new set is deleted from storage too. Practically: resource `id`s are never stable across edits, and if editing a task ever hard-fails partway (e.g. a resources-insert error), the old resources are already gone — the API surfaces this as a soft warning (`resourcesError`) alongside a still-successful task save, not a blocking error.

---

## 2. Submission Requirements

Submission requirements configure what a **student** must attach when submitting a task. There are 7 types. Unlike Resources, there is no separate table for the *requirements themselves* — they are boolean flag columns (plus optional label/placeholder columns) directly on `task_board_tasks`.

### Type-by-type

| Type | Toggle column | Simple boolean or extra config? | Custom label field? | Default fallback label if blank | Quirks |
|---|---|---|---|---|---|
| **Link** | `requires_link` | Boolean + optional label | Yes — `submission_link_label` | `"Submission link"` | Student enters a plain URL, validated with `new URL()` (any protocol/host it accepts). No separate "Title" requirement — the Link Field Label *is* the only extra field, and it's optional. |
| **PDF** | `requires_pdf` | Boolean + optional label | Yes — `submission_pdf_label` | `"Choose a pdf to upload"` | Student uploads an actual PDF file (not a URL). Accepted MIME: `application/pdf`, with a filename-extension fallback check (`.pdf`) server-side. Max 300 MB. |
| **Image** | `requires_image` | Boolean + optional label | Yes — `submission_image_label` | `"Choose a image to upload"` (fallback string is built from the lowercased type name, not specially cased — see gotcha below) | JPG/PNG/WEBP only. Max 300 MB. |
| **Video** | `requires_video` | Boolean + optional label | Yes — `submission_video_label` | `"Choose a video to upload"` | **This is an uploaded video FILE** (`video/*`, max 300 MB) — a completely different mechanism from the Resources section's "Video" type, which is a URL-only link. Same English word, different underlying behavior; see Quirks below. |
| **File (generic)** | `requires_file` | Boolean + optional label | Yes — `submission_file_label` | `"Choose a file to upload"` | No MIME-type restriction at all, client or server — any file type is accepted. Max 300 MB. This is the only submission type checked **on by default** when opening the blank "New task" form. |
| **Code** | `requires_code` | Boolean + optional placeholder | Placeholder only (not a "label") — `submission_code_placeholder` | `"Paste your code here"` | Plain `<textarea>`, no language selector on the student side (unlike the admin's Code *resource*, which does have a language dropdown). Max 50,000 characters (truncated silently). |
| **Screenshots** | `requires_screenshots` | Boolean only | **No custom label exists** | N/A — section header is the hardcoded literal text `"Screenshots"` | The only one of the 7 types with **no label/placeholder customization column at all**. Supports multiple files (0–10), unlike every other type which is single-value. Each ≤ 10 MB, JPG/PNG/WEBP only, combined total ≤ 50 MB across all screenshots in one submission. |

At least one of **Link / PDF / Image / Video / File** must be checked to create or save a task (DB CHECK `task_board_tasks_has_a_submission_type`; also enforced client- and server-side with the same error message). **Code** and **Screenshots** are always-optional extras layered on top — a task can have zero, one, or both, independent of the "at least one" rule above, and neither counts toward satisfying it.

### Submission Requirements — exact API payload shape

Sent as top-level camelCase keys in the same task create/edit JSON body as Resources:

```jsonc
{
  "requiresLink": true,
  "requiresPdf": false,
  "requiresImage": false,
  "requiresVideo": false,
  "requiresFile": true,
  "submissionLinkLabel": "string or null",
  "submissionPdfLabel": "string or null",
  "submissionImageLabel": "string or null",
  "submissionVideoLabel": "string or null",
  "submissionFileLabel": "string or null",
  "requiresCode": false,
  "submissionCodePlaceholder": "string or null",
  "requiresScreenshots": false
}
```

A label/placeholder is only persisted (non-null) if its matching `requires*` flag is also true in that same request — the form clears it to `null` client-side otherwise (`requiresLink && submissionLinkLabel.trim() ? ... : null`), though the server does not independently re-enforce that pairing (it stores whatever string is sent regardless of the flag's value).

### Submission Requirements — exact DB columns (all on `public.task_board_tasks`)

| Column | Type | Notes |
|---|---|---|
| `requires_link` | `boolean not null default false` | |
| `requires_pdf` | `boolean not null default false` | |
| `requires_image` | `boolean not null default false` | |
| `requires_video` | `boolean not null default false` | |
| `requires_file` | `boolean not null default false` | |
| `submission_link_label` | `text`, nullable | |
| `submission_pdf_label` | `text`, nullable | |
| `submission_image_label` | `text`, nullable | |
| `submission_video_label` | `text`, nullable | |
| `submission_file_label` | `text`, nullable | |
| `requires_code` | `boolean not null default false` | |
| `submission_code_placeholder` | `text`, nullable | |
| `requires_screenshots` | `boolean not null default false` | No matching label/placeholder column exists |
| — CHECK `task_board_tasks_has_a_submission_type` | | `requires_link OR requires_pdf OR requires_image OR requires_video OR requires_file` |

What a *student's* submission ends up storing (for reference, not part of the admin form): `public.task_board_submissions` has independent `submission_link`, plus path/name/size triplets for `pdf`/`image`/`video`/`file` (e.g. `submission_pdf_path`, `submission_pdf_name`, `submission_pdf_size_bytes`), a `submission_code` text column, and a separate one-row-per-screenshot table `public.task_board_submission_files` (since screenshots are multi-valued, everything else is single-valued).

---

## 3. Quirks & gotchas

These are things an instructor would only discover by using the form, not from a spec:

1. **"Video" means two different things depending on section.** In **Resources**, "Video" is a URL-only link (no upload, no host restriction actually enforced despite the "YouTube/Vimeo" copy). In **Submission Requirements**, "Video" is an uploaded video *file* (max 300 MB, any `video/*` MIME type). An instructor skimming both sections could easily assume they behave the same way — they don't.

2. **The "YouTube/Vimeo" hint on video resources is purely cosmetic.** Both the resource-type dropdown option ("Video (YouTube/Vimeo link)") and the field label ("Video URL (YouTube/Vimeo)") suggest a host restriction. There is none — `new URL(...)` is the only check, so any syntactically valid URL is accepted and saved (e.g. a Google Drive link, a Loom link, or even a non-video page).

3. **Video resources are never embedded — always an outbound link.** Even a genuine YouTube URL just renders as a "Watch video ↗" button opening a new tab, not an inline player/iframe.

4. **Image resources have no dedicated alt-text field.** The optional "Label" field silently doubles as the `<img alt="">` value (falling back to the generic string `"Resource image"` if Label is blank). There's nothing warning the instructor that Label affects accessibility text, not just the visible caption.

5. **Code resources silently truncate at 20,000 characters** with no client-side length counter or warning — paste a longer file and the tail is quietly cut off on save. (Student-submitted code, by contrast, is allowed up to 50,000 characters — a different, higher limit for a different field.)

6. **Resource edits are delete-and-reinsert, not a diff.** Saving an edited task deletes every existing resource row for that task and reinserts the form's current state from scratch. There's no resource-level undo, and resource `id`s are never stable across edits — anything that referenced an old resource row's id would break silently (nothing in this codebase currently does, but it's a trap for future work).

7. **"File (generic)" is the only submission type pre-checked by default** when opening a blank "New task" form; every other requirement (Link/PDF/Image/Video/Code/Screenshots) starts unchecked. An instructor who wants only a Link submission must remember to uncheck File as well as check Link.

8. **Screenshots is the only submission type with zero label customization.** Link/PDF/Image/Video/File each get a custom label field, and Code gets a custom placeholder field — but Screenshots is permanently the plain word "Screenshots" with no way to rename or add a hint, even though it's the most complex type functionally (multi-file, its own size ceiling).

9. **A required label doesn't actually require anything.** Every "field label" and the "code placeholder" input is optional even when its parent requirement is checked — leaving it blank just falls back to generic copy (e.g. "Choose a pdf to upload"). There is no way to force students to see a *specific* custom instruction; blank is always a silently accepted, working choice.

10. **Two different 300 MB vs 50 MB file-size worlds.** Student submission files (PDF/Image/Video/File) cap at 300 MB each. Admin *resource* image/pdf uploads cap at a much smaller 50 MB, via a completely separate upload endpoint (`/api/admin/task-board/resource-uploads`) and a separate, public storage bucket (`task-board-resources`, vs. the private `task-board-submissions` bucket for student work).

11. **Removing a level after it has approved submissions is blocked**, but only at the DB/API layer, not obviously from the form itself: unchecking e.g. "Medium" on an edit and saving fails with `"Can't remove Medium (N approved submissions) — already has approved submissions."` if any student was already approved at that level. Points already awarded are otherwise frozen regardless of later edits (`points_awarded` is written once, at approval time, and never recomputed from the live task row).

12. **"General" scope resources still get a `levels` value in the payload — just always empty.** The client always sends `levels: []` for general-scope resources (never omits the key), even though the server independently derives `levels: null` for those in `parseResource`. Harmless in practice (the DB CHECK accepts both `NULL` and `'{}'`), but the client and server briefly disagree on the in-memory representation of "no specific levels."

13. **`code_language` has no DB-level allow-list.** The 5 allowed languages (`javascript`, `typescript`, `json`, `python`, `bash`) are enforced only in `lib/taskBoardValidation.ts`'s `parseResource()`, not by a CHECK constraint on the `code_language` column itself — a direct DB write (or a future code path that bypasses this validator) could store any string there without error.

14. **Base level is pre-enabled by default; Medium/Hard are not**, when opening a blank "New task" form — mirroring the File-requirement default in quirk #7. At least one level must stay enabled to save, but nothing stops an instructor from unchecking Base and leaving only Medium/Hard, or all three, etc.

15. **"Completed card color" only exists for Base and Medium, never Hard.** Hard's completed-state color is hardcoded client-side (solid green, white text) and has no DB column (`completed_color_base` / `completed_color_medium` exist; there is no `completed_color_hard`). An instructor cannot customize Hard's completed color no matter what they try in the UI, because there is no control for it at all — not a bug, just an absent field that might be assumed to exist by symmetry with Base/Medium.

16. **Minor grammar bug in the Image submission fallback copy.** The generic fallback string is built as `` `Choose a ${type} to upload` `` for every file-based requirement. For pdf/video/file this reads fine ("Choose a pdf to upload"), but for image it reads **"Choose a image to upload"** (missing the "n" in "an") whenever the instructor leaves the Image field label blank — a cosmetic copy bug visible to every student on any task that requires an image without a custom label.
