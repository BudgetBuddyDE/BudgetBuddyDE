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

## Import Data

Open **Settings > Profile** and select **Import data**. Choose a ZIP archive created by the application data export. The
import supports JSON and CSV archives containing categories, payment methods, transactions, recurring payments, and budgets.
Auth data and attachments cannot be imported.

BudgetBuddy first creates a preview without changing any data. Review the summary, then confirm the import. The summary
shows records that are ready to import, skipped, and failed, both as totals and per resource. Failed records include their
archive line, source ID when available, and the reason, for example a missing category or payment-method reference.

Imports keep the IDs from the export so transactions, recurring payments, and budgets can retain their relationships.
Existing records with the same ID that belong to your account are skipped and can still satisfy references. IDs that belong
to another account, duplicate IDs inside the archive, invalid records, and missing references fail individually. Valid,
independent records continue importing even when other records fail.
