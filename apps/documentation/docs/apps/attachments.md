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

A full-page view of every attachment associated with the authenticated user's transactions. Attachments are displayed as responsive image cards sorted chronologically (newest first). Each card provides View, Download, and Delete actions.

### Transactions table — Attachments dialog

An **Attachments** option in each transaction row's action menu opens a dialog containing:

- The **`TransactionAttachments`** component, which provides a drag-and-drop upload zone, a thumbnail grid, and per-attachment actions (View / Download / Delete)

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

## SDK methods

See the [API package documentation](../packages/api.md#transaction-attachment-methods) for the full list of SDK methods related to attachments.
