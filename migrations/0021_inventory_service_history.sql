ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS service_history JSONB NOT NULL DEFAULT '[]'::JSONB;

-- Keep the existing single-record service details as the first history entry.
UPDATE inventory
SET service_history = jsonb_build_array(jsonb_build_object(
  'startDate', to_char(
    (COALESCE(service_start_date, date_sent_to_service) AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Amsterdam')::date,
    'YYYY-MM-DD'
  ),
  'completedDate', to_char(
    (date_returned_from_service AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Amsterdam')::date,
    'YYYY-MM-DD'
  ),
  'costCents', COALESCE(service_fee, 0),
  'notes', COALESCE(service_notes, '')
))
WHERE service_start_date IS NOT NULL
   OR date_sent_to_service IS NOT NULL
   OR date_returned_from_service IS NOT NULL
   OR COALESCE(service_fee, 0) <> 0
   OR service_notes IS NOT NULL;
