---
title: Attachments
description: Attach receipts and other documents to financial data.
icon: lucide/paperclip
---

Attachments can be linked to supported entities such as transactions. The backend service uses S3-compatible object storage for storage.

## Operational Notes

- Object storage must be configured in the backend.
- Credentials must not be stored in the repository.
- Database backups do not automatically include objects in S3 storage.
- Bucket access must be restricted to the application.

See [Configure attachments](../administration/configuration.md) and [Backups](../administration/backups.md).
