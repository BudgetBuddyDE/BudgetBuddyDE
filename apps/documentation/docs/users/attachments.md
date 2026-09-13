---
title: Attachments
description: Store receipts and other images with your transactions.
icon: Paperclip
---

Attachments let you keep receipts and other images together with a transaction. They are stored in S3-compatible object storage configured by the operator of your instance.

## Supported files

| Property         | Value                                                                     |
| ---------------- | ------------------------------------------------------------------------- |
| Content types    | PNG, JPG/JPEG, WEBP, HEIC, HEIF                                           |
| Maximum size     | 20 MB per file                                                            |
| Files per upload | 10                                                                        |
| Optimization     | JPEG, PNG, and WEBP images larger than 1920 px are downscaled for preview |

## Upload and manage

Open a transaction and add one or more images. Each attachment shows a preview; clicking it opens the full image. The attachment list of a transaction shows up to three previews. Images can be deleted individually; deleting a transaction also removes its attachments.

When you export your data, attachments can be included as files in the export archive. See [Export and import data](/users/data-management).

## Related pages

- [Transactions](/users/transactions)
- [Export and import data](/users/data-management)
