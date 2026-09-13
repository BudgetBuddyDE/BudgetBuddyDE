---
title: Payment methods
description: Track which account or card a transaction belongs to.
icon: CreditCard
---

Payment methods describe where money comes from or goes to, for example a bank account, cash, or a credit card. Every transaction and recurring payment is assigned exactly one payment method.

## Manage payment methods

Open **Payment methods** to list, create, edit, and delete them. Each entry has:

| Field       | Description                                                                        |
| ----------- | ---------------------------------------------------------------------------------- |
| Name        | Required, up to 40 characters, for example _Checking account_.                     |
| Provider    | Required, up to 32 characters, for example the bank name.                          |
| Address     | Required, up to 32 characters, for example a short identifier like an IBAN suffix. |
| Description | Optional free-text note.                                                           |

## Deleting a payment method

> **Warning:** Deleting a payment method also deletes **all transactions and recurring payments** that use it. Unlike categories, there is no merge action for payment methods.

Before deleting, reassign the affected transactions and recurring payments to another payment method by editing them individually, or keep the payment method and rename it instead.

## Related pages

- [Transactions](/users/transactions)
- [Recurring payments](/users/recurring-payments)
