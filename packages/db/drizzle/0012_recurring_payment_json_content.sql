-- Preserve the original JSON bytes: JSONB reserialization would change content fingerprints.
UPDATE "budgetbuddy_backend"."recurring_payment_execution"
SET "content" = convert_from(decode("content", 'base64'), 'UTF8'),
    "content_hash" = encode(sha256(decode("content", 'base64')), 'hex')
WHERE "content" IS NOT NULL;
