---
title: Data Management
description: Data quality, export, deletion, and privacy in everyday use.
icon: lucide/database
---

BudgetBuddy stores personal financial data. Review entries regularly, keep categories consistent, and back up your production instance.

## Responsible Use

- Use strong, unique credentials.
- Never share API keys publicly.
- Upload only necessary documents as attachments.
- Before deleting, check whether dependent analytics are affected.
- Create a backup before migrations and major changes.

Specific export and deletion features depend on the deployed release. The legal basis is described in [Privacy](../project/privacy.md).

## Export Data

Open **Settings > Profile** and select **Export data**. Choose either JSON or CSV, then select the data to include:

- **Auth data** exports your profile, session metadata, linked accounts, and API-key metadata.
- **Application data** lets you select categories, payment methods, transactions, recurring payments, and budgets.
- **Attachments** exports uploaded files, their metadata, and transaction assignments.

Each selected main category downloads as a separate ZIP archive. Every archive contains one file per selected resource and a
`manifest.json` with its format, creation time, and record counts. Keep exported archives secure because they contain
personal and financial data. Attachment exports can be substantially larger than the metadata-only application export.
