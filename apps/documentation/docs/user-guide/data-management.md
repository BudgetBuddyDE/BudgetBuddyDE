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

BudgetBuddy guides the import through five steps:

1. Upload the export archive.
2. Preview every archive file in a separate table for its resource type.
3. Review imported and skipped records in resource tables after confirming the import.
4. Review failed records and their reasons in resource tables.
5. Finish and correct failed records before trying again.

The preview does not change any data. Failed records include their archive line, source ID when available, and the reason,
for example a missing category or payment-method reference.

Imports keep the IDs from the export so transactions, recurring payments, and budgets can retain their relationships.
Existing records with the same ID that belong to your account are skipped and can still satisfy references. IDs that belong
to another account, duplicate IDs inside the archive, invalid records, and missing references fail individually. Valid,
independent records continue importing even when other records fail.

## Known Issues & Limitations

The following reflects the current import and export behavior. It may change in a future release, but no fix or timeline is
committed.

- Only unchanged Application data ZIP archives created by BudgetBuddy can be imported. Individual JSON or CSV files,
  manually modified archives, and normally compressed or repacked ZIP files are not supported.
- An import accepts one archive of up to 20 MiB, with at most six files, 5 MiB per file, and 10,000 records per resource.
- Only categories, payment methods, transactions, recurring payments, and budgets can be imported. Auth data and attachments
  cannot be restored.
- Imports add records only. Existing records with IDs owned by your account are skipped; records are not updated or deleted.
  Individual record errors can result in a partially completed import.
- Transactions and recurring payments require their categories and payment methods. Budgets require their categories. Include
  these dependencies when exporting a subset of data, unless they already exist in the destination account.
- Application data, auth data, and attachments are exported as separate downloads. Only the Application data archive can be
  used for import.
