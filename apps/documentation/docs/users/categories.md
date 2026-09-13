---
title: Categories
description: Group transactions and recurring payments, and merge duplicates.
icon: Tags
---

Categories group transactions and recurring payments, for example _Groceries_, _Rent_, _Salary_, or _Subscriptions_. Every transaction and recurring payment is assigned exactly one category.

## Manage categories

Open **Categories** to list, create, edit, and delete categories. Each category has:

| Field       | Description                    |
| ----------- | ------------------------------ |
| Name        | Required, up to 40 characters. |
| Description | Optional free-text note.       |

## Merge categories

If you collected duplicates or want to restructure, use the merge action: select one or more source categories and one target category. BudgetBuddy then moves everything in one step:

- Transactions of the source categories are reassigned to the target.
- Recurring payments of the source categories are reassigned to the target.
- Budget assignments are moved to the target as well. If a budget already includes the target category, no duplicate is created.
- The source categories are deleted afterwards.

Merging is atomic: either everything moves, or nothing changes.

## Deleting a category

> **Warning:** Deleting a category also deletes **all transactions and recurring payments assigned to it**, and removes it from budgets. Because every transaction requires a category, there is no "uncategorized" fallback.

If you want to keep the data, do not delete the category directly. Instead, use **Merge** to move all entries to another category first, or edit the affected transactions manually.

## Related pages

- [Transactions](/users/transactions)
- [Recurring payments](/users/recurring-payments)
- [Budgets](/users/budgets)
