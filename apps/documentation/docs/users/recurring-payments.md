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

The backend processes recurring payments once per day (by default at 01:30 in the configured instance timezone). It creates transactions only for occurrences scheduled for **today**, using the same receiver, amount, category, and payment method. Paused entries are skipped. Missed days, including days when the backend was offline, are not caught up.

Each recurring payment can create **at most one automatic transaction per distinct payment content and scheduled date**. Repeated or concurrent job runs, including runs in multiple updated backend instances sharing the database, skip payment contents that were already executed for that occurrence. Two separate recurring payments with identical details are still processed independently.

Changing the amount, receiver, category, payment method, or information after execution allows an additional full booking on a later job run on the same scheduled date. It does not replace the old transaction or book only the difference. Returning to any content already booked on that date is skipped. Schedule metadata such as the execution plan is not payment content. Editing or deleting the generated transaction does not reset its execution record. Historical records without a content snapshot continue to block that occurrence because their original payment details are unknown.

Failed bookings leave no execution record and can be attempted again by another job run on the same day. No additional automatic retries are scheduled, and the next day's job does not retry the missed date. The guarantee is at most one automatic booking per distinct payment content and occurrence, not guaranteed execution of every occurrence.

The protection starts with the idempotency update; older transactions are not matched retrospectively. Self-hosted instances must follow the [coordinated rollout](/self-hosting/updating#recurring-payment-idempotency-cutover).

Because processing happens on the server, a self-hosted instance must keep the backend service running. See [Self-hosting: overview](/self-hosting/overview).

## Manual extra bookings

**Execute payment** creates an additional transaction independently of the schedule. Every successful manual request creates another transaction, even if today's automatic occurrence has already been booked. Manual bookings do not mark a scheduled occurrence as executed and do not stop its automatic booking.

Manual execution has no duplicate protection. Clicking repeatedly or retrying after an uncertain network response can create multiple extra bookings; check your transactions before retrying.

## Occurrences

The **Occurrences** view calculates past and future dates from your recurring payments' current schedules. It is a schedule projection, not an execution history: it does not show whether an occurrence was actually booked or link to generated transactions. Check **Transactions** for actual bookings. Changing a schedule can also change the projected past dates without changing existing transactions or execution records.

## Pausing and deleting

- **Pause** an entry to stop future transactions without losing its history. Unpause to continue from the schedule.
- **Delete** an entry to remove it. Transactions that were already created from it remain in your history.
- Internal execution records remain even after deleting an entry or its generated transaction. Restoring the same payment ID for the same account in the same database retains duplicate protection. A newly created payment with a new ID is independent.
- Execution records are removed when the user account is deleted. They are not included in application-data exports; a full database backup preserves them. See [Export and import data](/users/data-management).

## Related pages

- [Transactions](/users/transactions)
- [Budgets](/users/budgets)
- [Dashboard and insights](/users/dashboard)
