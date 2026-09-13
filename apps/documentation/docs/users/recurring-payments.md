---
title: Recurring payments
description: Track subscriptions and regular bills, with automatic transaction creation.
icon: Repeat
---

Recurring payments describe things that happen again and again: rent, insurance, streaming subscriptions, or your salary. BudgetBuddy uses them to create transactions automatically and to show upcoming payments in the dashboard.

## Create a recurring payment

Open **Recurring payments** and create an entry with the following fields:

| Field           | Description                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------------- |
| Receiver        | Who receives or sends the money.                                                                |
| Amount          | Positive for income, negative for expenses, same as transactions.                               |
| Execution plan  | How often it repeats: daily, weekly, biweekly (every two weeks), monthly, quarterly, or yearly. |
| First execution | The date of the first occurrence.                                                               |
| Category        | Required. See [Categories](/users/categories).                                                  |
| Payment method  | Required. See [Payment methods](/users/payment-methods).                                        |
| Paused          | Stops transaction creation for this entry while enabled.                                        |
| Information     | Optional free-text note.                                                                        |

## Automatic transaction creation

The backend processes due recurring payments once per day (by default at 01:30 in the instance timezone). For every occurrence that is due, it creates a transaction with the same receiver, amount, category, and payment method. Paused entries are skipped.

Because processing happens on the server, a self-hosted instance must keep the backend service running. See [Self-hosting: overview](/self-hosting/overview).

## Occurrences

The **Occurrences** view shows the individual execution dates of your recurring payments: past occurrences with their generated transactions, and future ones that are planned. This makes it easy to check whether everything happened as expected and what is still coming up this month.

## Pausing and deleting

- **Pause** an entry to stop future transactions without losing its history. Unpause to continue from the schedule.
- **Delete** an entry to remove it. Transactions that were already created from it remain in your history.

## Related pages

- [Transactions](/users/transactions)
- [Budgets](/users/budgets)
- [Dashboard and insights](/users/dashboard)
