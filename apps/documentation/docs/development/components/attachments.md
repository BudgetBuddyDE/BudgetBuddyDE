---
title: Attachments
icon: lucide/paperclip
tags: [development, components]
---

## Overview

Generic, presentational building blocks for working with file attachments. All components live in `@/components/Attachments` and are usable in any context.

| Component | Description |
|---|---|
| `AttachmentThumbnail` | Card thumbnail with hover action bar (view / download / delete) |
| `AttachmentLightbox` | Full-screen image dialog with a download button |
| `FileDropZone` | Drag-and-drop / click-to-upload zone |

---

## `<AttachmentThumbnail />`

Displays a single attachment as a thumbnail card. On hover, a translucent action bar fades in over the image with **View**, **Download**, and **Delete** buttons. Falls back to a placeholder icon when the image fails to load.

```tsx
import {AttachmentThumbnail} from '@/components/Attachments';

<AttachmentThumbnail
  attachment={attachment}
  onView={a => setViewed(a)}
  onDownload={handleDownload}
  onDelete={a => setDeletingId(a.id)}
/>
```

### Props

| Prop | Type | Description |
|---|---|---|
| `attachment` | `TAttachmentWithUrl` | The attachment to render |
| `onView` | `(a: TAttachmentWithUrl) => void` | Called when the user clicks the view action |
| `onDownload` | `(a: TAttachmentWithUrl) => void` | Called when the user clicks the download action |
| `onDelete` | `(a: TAttachmentWithUrl) => void` | Called when the user clicks the delete action |

---

## `<AttachmentLightbox />`

Full-screen `Dialog` that displays one attachment image at a time. The dialog opens whenever `attachment` is non-null. Uses a `ZoomTransition` for the entrance animation.

```tsx
import {AttachmentLightbox} from '@/components/Attachments';

<AttachmentLightbox
  attachment={viewedAttachment}
  onClose={() => setViewed(null)}
  onDownload={handleDownload}
/>
```

### Props

| Prop | Type | Description |
|---|---|---|
| `attachment` | `TAttachmentWithUrl \| null` | Attachment to show, or `null` to keep the dialog closed |
| `onClose` | `() => void` | Called when the dialog should be closed |
| `onDownload` | `(a: TAttachmentWithUrl) => void` | Called when the user clicks the Download button |

---

## `<FileDropZone />`

Generic drag-and-drop / click-to-upload zone. Renders a dashed border area that accepts files via drag-and-drop or via a native file picker (opened on click). Interaction is disabled while `isUploading` is `true`.

```tsx
import {FileDropZone} from '@/components/Attachments';

const [isDragging, setIsDragging] = useState(false);

<FileDropZone
  isUploading={isUploading}
  isDragging={isDragging}
  onUpload={handleUpload}
  onDraggingChange={setIsDragging}
/>
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `isUploading` | `boolean` | — | Disables interaction and shows a spinner while `true` |
| `isDragging` | `boolean` | — | Highlights the border in the primary colour when `true` |
| `onUpload` | `(files: File[]) => void` | — | Called with the selected or dropped files |
| `onDraggingChange` | `(dragging: boolean) => void` | — | Called whenever the drag-over state changes |
| `accept` | `string` | Image MIME types | Forwarded to the hidden `<input accept>` attribute |
| `sx` | `SxProps` | — | Additional MUI `sx` styles |

The default accepted file types come from `ATTACHMENT_CONTENT_TYPES` (`@budgetbuddyde/api/attachment`), which covers PNG, JPEG, WebP, HEIC, and HEIF.

