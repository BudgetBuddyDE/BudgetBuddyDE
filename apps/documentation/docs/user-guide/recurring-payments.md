---
title: Recurring Payments
description: Manage subscriptions, regular bills, and scheduled payments.
icon: lucide/calendar-clock
---

Recurring payments describe regularly occurring income or expenses, such as rent, subscriptions, or salary payments.

Choose one of six execution plans: daily, weekly, biweekly, monthly, quarterly, or yearly. The first execution date anchors the schedule. Month-based plans retain the anchor day where possible and clamp to the end of shorter months; for example, a monthly plan starting on January 31 runs on February 28 (or 29 in a leap year), then March 31.

The backend application has a scheduled process that creates transactions due on each occurrence date. Paused payments are not processed. The job schedule and time zone are controlled through the service configuration.

## Upcoming Occurrences

The typed API client can project scheduled dates with `recurringPayment.getOccurrences({$dateFrom, $dateTo, $includePaused})`, using an inclusive date range plus optional pagination. Paused payments are excluded by default; enable `$includePaused` to include their projected dates. The corresponding endpoint is `GET /api/recurringPayment/occurrences`; projection does not create transactions.

## Recommended Workflow

1. Create the payment with an amount, execution plan, first execution date, and category.
2. Check the next execution.
3. Regularly review generated transactions.
4. Pause or change entries when the contract changes.

With self-hosting, the scheduled job must be enabled and monitored. See [Backend operations](../administration/configuration.md).
