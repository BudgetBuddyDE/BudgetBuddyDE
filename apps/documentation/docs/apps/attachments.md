---
title: Attachments
icon: lucide/paperclip
tags:
    - app
    - feature
---

# Attachments

## Overview

The **Attachments** feature allows users to associate image files with their transactions (receipts, invoices, documents, etc.) and manage them from both the Transactions table and a dedicated Attachments page.

## Features

- Upload images (PNG, JPG, JPEG, WebP) to individual transactions
- View attachments in a lightbox dialog
- Download attachments directly from signed S3 URLs
- Delete individual attachments with confirmation
- Browse all attachments across all transactions on a dedicated page, sorted newest-first

## Pages

### `/attachments`

A full-page view of every attachment associated with the authenticated user's transactions. The page is an **async server component** — attachments are fetched server-side (with forwarded auth headers) and passed as `initialAttachments` to the `AllAttachmentsClient` shell. Attachments are displayed as responsive image cards sorted chronologically (newest first). Each card provides View, Download, and Delete actions.

### Transactions table — Attachments dialog

An **Attachments** option in each transaction row's action menu opens a dialog containing:

- The **`TransactionAttachments`** component, which provides a drag-and-drop upload zone, a thumbnail grid, and per-attachment actions (View / Download / Delete)

## Components

### Shared attachment components

`apps/webapp/src/components/Attachments/`

These components are general-purpose and reusable across the app:

| Component             | Description                                                                                                          |
|:----------------------|:---------------------------------------------------------------------------------------------------------------------|
| `AttachmentThumbnail` | Displays a single attachment as a thumbnail card with a hover action bar (View / Download / Delete)                  |
| `AttachmentLightbox`  | Full-screen lightbox dialog that displays a single attachment image                                                  |
| `FileDropZone`        | Drag-and-drop / click-to-browse upload zone; accepts a configurable `accept` prop (defaults to PNG, JPG, JPEG, WebP) |

### `TransactionAttachments`

`apps/webapp/src/components/Transaction/Attachments/`

| Prop            | Type     | Description                          |
|:----------------|:---------|:-------------------------------------|
| `transactionId` | `string` | ID of the transaction to manage      |

Internally uses:

- `useTransactionAttachments` hook — manages all state and side effects via `useReducer`
- `FileDropZone` for uploading
- `AttachmentThumbnail` for the thumbnail grid
- `AttachmentLightbox` for the full-screen viewer
- `apiClient.backend.transaction.getTransactionAttachments` to load existing attachments
- `apiClient.backend.transaction.uploadTransactionAttachments` for uploads
- `apiClient.backend.transaction.deleteTransactionAttachments` for deletion

### `AllAttachmentsClient`

`apps/webapp/src/app/(dashboard)/attachments/AllAttachmentsClient.tsx`

Client shell for the `/attachments` page. Receives `initialAttachments` from the server component as a prop and handles view/download/delete interactions client-side using `AttachmentThumbnail` and `AttachmentLightbox`.

## SDK methods

See the [API package documentation](../packages/api.md#transaction-attachment-methods) for the full list of SDK methods related to attachments.
