CREATE TABLE IF NOT EXISTS dealer_notebook_entries (
  month_key VARCHAR(7) PRIMARY KEY,
  comparison_mode TEXT NOT NULL DEFAULT 'previous-month'
    CHECK (comparison_mode IN ('previous-month', 'same-month-last-year', 'prior-three-months')),
  context_note TEXT NOT NULL DEFAULT '',
  report JSONB,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  generated_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
