# ChalkAI memory schema notes

## Tables

- `public.user_memory_items` stores explicit and derived per-user memory. App code should hide rows where `deleted_at is not null` by default, and delete by setting `deleted_at` so undo, audit, and retention cleanup remain possible.
- `public.memory_summaries` stores bounded, prompt-ready summaries derived from memory items. Summaries should be regenerated after memory edits, deletes, or retention cleanup.

## PII and retention

- Do not write severe PII, pupil-identifiable data, raw chat transcripts, or full generated resources into either table.
- Memory writes should pass through the app PII scanner before insertion.
- Automated cleanup can purge rows after the chosen school retention window by filtering on `deleted_at`, `updated_at`, and `source`.
- Users should be able to soft delete individual memory rows and clear all active memory from settings.

## Manual RLS check

Run the schema in Supabase SQL editor, then verify with two authenticated users:

1. As user A, insert one `user_memory_items` row and one `memory_summaries` row with `user_id = auth.uid()`.
2. As user B, select from both tables and confirm user A's rows are not returned.
3. As user B, try to update or delete user A's row by ID and confirm no row is changed.
4. As user B, try to insert a row using user A's `user_id` and confirm RLS rejects it.
5. As user A, update `deleted_at` on the row and confirm user A can still audit it directly by ID while app queries can filter it out.
