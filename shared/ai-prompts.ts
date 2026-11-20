export const DEFAULT_LISTING_TITLE_PROMPT = `Create a concise, searchable marketplace title for this watch.
Use a keyword-style title, not a sentence. Include the brand, model, reference, year, and condition when available. Include box or papers only when present. Do not include pricing or invent details.

Brand: {{brand}}
Model: {{model}}
Reference: {{referenceNumber}}
Year: {{year}}
Condition: {{condition}}
Original box: {{box}}
Papers/cards: {{papers}}`;
