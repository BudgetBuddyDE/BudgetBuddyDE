---
title: Export and import data
description: Download a copy of your data or restore it from an archive.
icon: Database
---

Data management lives in **Settings → Profile** and has two parts: export and import.

## Export

Open **Settings → Profile → Export data** and choose what to download:

- **Format** — JSON or CSV.
- **Auth data** — profile, sessions, linked accounts, and API-key metadata. Secrets such as passwords or actual key values are never exported.
- **Application data** — categories, payment methods, transactions, recurring payments, and budgets; you can select individual resources.
- **Attachments** — uploaded files plus their metadata and transaction assignments.

Each selected main category downloads as its own ZIP archive. An archive contains one file per selected resource and a `manifest.json` describing schema version, export time, and row counts. Exports are rate limited on the server.

## Import

**Settings → Profile → Import** restores application data from a ZIP archive created by the application export.

1. Select the archive.
2. Review the preview: how many records were found and which would be imported.
3. Confirm the import and check the result: successful and failed records are listed separately, so you can correct problems and retry.

Notes:

- Only **application data** can be imported. Auth data and attachments are not part of an import.
- The upload limit is 20 MB.
- Imported records keep their IDs, so importing the same archive twice does not create duplicates; existing records are handled according to the preview.
- After a successful import the affected views are refreshed automatically.

## Related pages

- [Account](/users/account)
- [Attachments](/users/attachments)
