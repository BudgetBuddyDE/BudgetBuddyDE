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

Renders at most `PAGE_SIZE` (20) thumbnails at a time. A **"Load more"** button appends the next 20 items. All event handlers are memoised with `useCallback` so that the memoised `AttachmentThumbnail` children are not re-rendered unnecessarily.

## SDK methods

See the [API package documentation](../packages/api.md#transaction-attachment-methods) for the full list of SDK methods related to attachments.

## Performance

The following measures are in place to keep the `/attachments` page fast and bandwidth-efficient at scale.

### Next.js Image Optimisation (`next.config.mjs`)

`unoptimized` has been removed from thumbnail `<Image>` elements. Next.js now:

- Fetches the original signed URL server-side on first request
- Converts it to **AVIF** (preferred) or **WebP** and resizes it to the actual display dimensions (≈25 vw)
- Caches the result for **1 hour** (`minimumCacheTTL: 3600`) — safe because each page load receives fresh signed URLs whose unique query parameters act as natural cache-busters

Typical bandwidth saving: **~2–5 MB → ~20–80 KB per thumbnail** (25–100× reduction).

`remotePatterns` in `next.config.mjs` permits image optimisation for:

| Pattern | Purpose |
|:--------|:--------|
| `https://*.storageapi.dev` | Cloudflare R2 / S3-compatible production storage |
| `https://**` / `http://**` | Self-hosted MinIO and local development |

The `AttachmentLightbox` still uses `unoptimized` so the full-resolution original is always shown in the viewer.

### Client-Side Pagination

`AllAttachmentsClient` renders **20 items per page** (`PAGE_SIZE = 20`). A "Load more" button appends the next batch. This keeps the initial DOM small, reduces the number of concurrent image decode operations, and prevents the browser from allocating compositor layers for off-screen items.

### Per-Card Loading Shimmer

Each `AttachmentThumbnail` shows a **`Skeleton` shimmer** in the image area while the optimised image is downloading. The shimmer disappears and the image fades in (0.25 s ease) as soon as that specific card's image finishes loading — not when all images are ready. This gives immediate visual feedback and eliminates the "blank grid" effect.

The first four thumbnails (first row) are rendered with `priority={true}`, which:

1. Skips lazy loading (`loading="eager"`)
2. Injects a `<link rel="preload">` tag into the document `<head>` so the browser starts fetching those images as early as possible

### `React.memo` + `useCallback`

`AttachmentThumbnail` is wrapped in `React.memo`. All handler functions in `AllAttachmentsClient` are memoised with `useCallback`. Together these ensure that changing `deletingAttachmentId` or `viewedAttachment` state does not trigger a re-render of every card in the grid — only the affected components update.

### Removal of `backdrop-filter: blur`

The hover action overlay previously used `backdrop-filter: blur(10px)`. Browsers create an **individual GPU compositor layer** for every element that has a CSS transition *and* `backdrop-filter`, even when the element is invisible. With 30+ cards this caused significant GPU memory pressure and paint jank. The overlay now uses a plain semi-transparent background colour (`rgba(0,0,0,0.64)`) which achieves a visually equivalent result without the compositing overhead.

