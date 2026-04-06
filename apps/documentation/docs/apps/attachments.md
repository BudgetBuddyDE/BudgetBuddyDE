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
- Scan physical documents using the device camera (no external SDK required)
- View attachments in a lightbox dialog
- Download attachments directly from signed S3 URLs
- Delete individual attachments with confirmation
- Browse all attachments across all transactions on a dedicated page, sorted newest-first

## Pages

### `/attachments`

A full-page view of every attachment associated with the authenticated user's transactions. Attachments are displayed as responsive image cards sorted chronologically (newest first). Each card provides View, Download, and Delete actions.

### Transactions table — Attachments dialog

An **Attachments** option in each transaction row's action menu opens a dialog containing:

- The **`TransactionAttachments`** component, which provides a drag-and-drop upload zone, a thumbnail grid, and per-attachment actions (View / Download / Delete)
- A **Scan** button that opens the `DocumentScanner` component — a camera dialog that captures a frame and submits it as an upload

## Components

### `TransactionAttachments`

`apps/webapp/src/components/Transaction/TransactionAttachments/`

| Prop            | Type     | Description                          |
|:----------------|:---------|:-------------------------------------|
| `transactionId` | `string` | ID of the transaction to manage      |

Internally uses:

- `apiClient.backend.transaction.getTransactionAttachments` to load existing attachments
- `apiClient.backend.transaction.uploadTransactionAttachments` for uploads
- `apiClient.backend.transaction.deleteTransactionAttachments` for deletion

### `DocumentScanner`

`apps/webapp/src/components/Transaction/DocumentScanner/`

Uses the browser **MediaDevices API** (`getUserMedia`) to open a camera feed in a dialog. When the user presses **Capture**, the current video frame is drawn to an off-screen canvas and exported as a JPEG `File`. Supports front/rear camera switching via the flip button.

| Prop        | Type                | Description                                           |
|:------------|:--------------------|:------------------------------------------------------|
| `onCapture` | `(file: File) => void` | Called with the captured JPEG file on successful capture |

No external dependencies are required. If camera access is unavailable (permission denied, unsupported browser), a descriptive error is shown with a Retry button.

## SDK methods

See the [API package documentation](../packages/api.md#transaction-attachment-methods) for the full list of SDK methods related to attachments.
