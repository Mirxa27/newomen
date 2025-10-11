// Line 25: Fix null check for data.content
if (data && data.content) {
  setAffirmation(data.content); // Fixed: Null check
}