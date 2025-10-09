Context: Advanced Exploration Therapies Gallery implementation

Decisions and patterns learned
- Reused existing member Assessment flow at route `/assessment/:id` which loads from `assessments_enhanced`.
- Questions JSON shape required by UI: [{ id, question, type, options? }]; types supported in UI: `text`, `multiple-choice`.
- AI analysis is optional; if `ai_config_id` is unset and no default exists, the flow still completes and persists attempts/results (with graceful failure toast).

What was added
- New data showcase: `src/data/advancedTherapies.ts` listing 10 journeys (id, title, description, category, tier).
- UI: `src/pages/MemberAssessments.tsx` now renders an "Advanced Exploration Therapies Gallery" section above existing items, linking to `/assessment/:id`.
- DB seed: `supabase/migrations/20251009090000_add_advanced_therapies_assessments.sql` inserts/upserts 10 assessments into `assessments_enhanced` with stage-based prompts.
- Testing: Updated `TESTING_GUIDE.md` with steps to validate the gallery.

Follow-ups recommended
- If desired, assign a valid `ai_config_id` for richer AI analysis in production.
- Optionally surface the user’s “artifact” (e.g., Pearl of Wisdom) from the answers JSON in a dedicated journal UI.
- Consider enabling multi-select question type if needed by certain archetype/diagnostic prompts.

