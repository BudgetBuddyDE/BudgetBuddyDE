---
title: Recurring Payments
description: Manage subscriptions, regular bills, and scheduled payments.
icon: lucide/calendar-clock
---

Recurring payments describe regularly occurring income or expenses, such as rent, subscriptions, or salary payments.

The backend application has a scheduled process that handles recurring payments. The schedule and time zone are controlled through the service configuration.

## Recommended Workflow

1. Create the payment with an amount, interval, start date, and category.
2. Check the next execution.
3. Regularly review generated transactions.
4. Pause or change entries when the contract changes.

With self-hosting, the scheduled job must be enabled and monitored. See [Backend operations](../administration/configuration.md).
