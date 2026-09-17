---
title: Budgets
description: Set monthly income and expense goals across categories.
icon: Target
---

Budgets are monthly goals. Each budget pairs a target amount with one or more categories and a type, so BudgetBuddy can compare your recorded transactions against it.

## Create a budget

Open the **Budget** page in the dashboard and create an entry with:

| Field       | Description                                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------- |
| Name        | Required, up to 32 characters.                                                                                   |
| Type        | **Expense** tracks money you want to spend at most; **Income** tracks money you want to earn.                    |
| Amount      | The target for one month.                                                                                        |
| Categories  | One or more categories whose transactions count towards this budget. A category can be part of multiple budgets. |
| Description | Optional free-text note.                                                                                         |

## How budgets are evaluated

BudgetBuddy evaluates budgets for the current calendar month in the instance timezone:

- Transactions that already happened count as paid.
- Transactions dated in the future count as upcoming.
- Active recurring payments count with every occurrence between today and the end of the month.
- Paused recurring payments are ignored.

The Budget page shows each budget with its progress, a radar chart of your spending goals, and how much of your monthly income is still free after paid and upcoming expenses.

## Managing budgets

Budgets can be edited and deleted at any time. Deleting a budget only removes the goal; transactions and categories are not affected. Assigning or removing categories changes what is counted, so existing progress updates immediately.

## Related pages

- [Categories](/users/categories)
- [Recurring payments](/users/recurring-payments)
- [Dashboard and insights](/users/dashboard)
