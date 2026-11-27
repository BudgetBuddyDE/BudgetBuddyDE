\set ON_ERROR_STOP on
BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;

WITH conflicts AS (
  SELECT 'transaction/category' AS relation, t.transaction_id AS record_id, t.owner_id AS record_owner,
         t.category_id AS reference_id, c.owner_id AS reference_owner
  FROM budgetbuddy_backend."transaction" t
  LEFT JOIN budgetbuddy_backend.category c USING (category_id)
  WHERE t.category_id IS NOT NULL AND t.owner_id IS DISTINCT FROM c.owner_id
  UNION ALL
  SELECT 'recurring_payment/category', r.recurring_payment_id, r.owner_id, r.category_id, c.owner_id
  FROM budgetbuddy_backend.recurring_payment r
  LEFT JOIN budgetbuddy_backend.category c USING (category_id)
  WHERE r.category_id IS NOT NULL AND r.owner_id IS DISTINCT FROM c.owner_id
  UNION ALL
  SELECT 'budget_category/category', b.budget_id, b.owner_id, l.category_id, c.owner_id
  FROM budgetbuddy_backend.budget_category l
  JOIN budgetbuddy_backend.budget b USING (budget_id)
  LEFT JOIN budgetbuddy_backend.category c USING (category_id)
  WHERE b.owner_id IS DISTINCT FROM c.owner_id
     OR (to_jsonb(l) ? 'owner_id' AND (to_jsonb(l)->>'owner_id') IS DISTINCT FROM b.owner_id)
  UNION ALL
  SELECT 'budget_category/missing_budget', l.budget_id, NULL, l.category_id, c.owner_id
  FROM budgetbuddy_backend.budget_category l
  LEFT JOIN budgetbuddy_backend.budget b USING (budget_id)
  LEFT JOIN budgetbuddy_backend.category c USING (category_id)
  WHERE b.budget_id IS NULL
  UNION ALL
  SELECT 'transaction/payment_method', t.transaction_id, t.owner_id, t.payment_method_id, p.owner_id
  FROM budgetbuddy_backend."transaction" t
  LEFT JOIN budgetbuddy_backend.payment_method p USING (payment_method_id)
  WHERE t.payment_method_id IS NOT NULL AND t.owner_id IS DISTINCT FROM p.owner_id
  UNION ALL
  SELECT 'recurring_payment/payment_method', r.recurring_payment_id, r.owner_id, r.payment_method_id, p.owner_id
  FROM budgetbuddy_backend.recurring_payment r
  LEFT JOIN budgetbuddy_backend.payment_method p USING (payment_method_id)
  WHERE r.payment_method_id IS NOT NULL AND r.owner_id IS DISTINCT FROM p.owner_id
)
SELECT * FROM conflicts ORDER BY relation, record_id, reference_id;
ROLLBACK;
