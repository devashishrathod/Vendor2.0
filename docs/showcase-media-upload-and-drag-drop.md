# Showcase Details — Media Upload, Preview Modal & Drag-and-Drop

Reference doc for porting VenderPanel's "Showcase Details" media flow (upload
staging modal, click-to-preview modal, drag-and-drop reordering for both
sections and media) into another codebase (e.g. the Admin panel) **as-is**.

This is documentation only — no behavior here has been changed as part of
writing this doc.

---

## 1. Where this lives in VenderPanel

```
src/features/brand/
  pages/ShowcasePage.jsx            — page: loads data, owns all handlers, wires everything together
  components/ShowcaseSection.jsx    — outer list: page header + DragDropProvider for SECTION reordering
  components/ShowcaseGroup.jsx      — one section: header, Add Media button, Order panel, UploadMediaModal
  components/ShowcaseMediaRow.jsx   — the media grid: MediaTile cards, click-vs-drag detection, preview modals
  components/AddShowcaseSectionModal.jsx — "Add/Edit Showcase Section" modal (create section + optional first batch of media)
  hooks/useBrandShowcase.js         — GET-all hook: { data, loading, error, reload }
  services/brandApi.js              — all showcase API calls (section CRUD/reorder, media CRUD/reorder)
  utils/BrandHelpers.js             — mergeRefs, noDragRef (drag/click helpers used across the grid)
```

## 2. Dependencies

```json
"@dnd-kit/react": "^0.5.0",
"@dnd-kit/helpers": "^0.5.0"
```

This is the newer **React-first** dnd-kit package (`@dnd-kit/react` +
`@dnd-kit/helpers`'s `move()`), **not** the older `@dnd-kit/core` +
`@dnd-kit/sortable` combo. The hooks/imports below are specific to this
version:

```js
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { move } from "@dnd-kit/helpers";
```

## 3. Data shape

One brand's showcase is fetched in a single call and normalized into
sections, each carrying its own combined media array:

```js
// GET /showcase/get-brand-showcase/:brandId
// response.data: { brandId, sections: [...] }
{
  _id, title, description,
  isVisible: boolean,          // defaults to true if absent
  photoCount, videoCount,      // used to build a fallback subtitle
  medias: [
    {
      _id,
      type: "PHOTO" | "VIDEO",
      url,
      thumbnail,                // optional poster/cover image
      isShowInVideoClips: boolean,
      altText,
      // sortOrder is implicit — it's the array's own order, one shared
      // sequence across BOTH photos and videos in the section (not two
      // separate sequences).
    },
  ],
}
```

Photos and videos are **never** split into separate lists/grids — they're
one combined array, sorted by one shared `sortOrder`, rendered in a single
grid. This matters for the reorder endpoint's contract (§6).

## 4. Media upload flow (staged, not instant)

Selecting files does **not** upload immediately. It stages them and opens a
confirmation modal first, so the vendor can mark the batch for "video
clips" and (only then) attach a custom thumbnail before anything is sent.

**Flow:**
1. Vendor clicks "Add Media" → triggers a hidden `<input type="file" multiple>`.
2. `onChange` reads `e.target.files`, stores them in local state
   (`pendingFiles`), and immediately resets `e.target.value = ""` (so
   picking the *same* file again later still fires `onChange`).
3. Because `pendingFiles` is now non-null, `UploadMediaModal` renders.
4. Inside the modal: a checkbox ("Show in video clips"); if checked, a
   *second* file input appears for an optional single thumbnail image.
5. Confirming calls the parent's upload handler with
   `{ isShowInVideoClips, thumbnail }`, then closes the modal.
6. The parent handler calls the API, then reloads the section list.

```jsx
// ShowcaseGroup.jsx — staging state + handlers
const [pendingFiles, setPendingFiles] = useState(null);

const handleFilesSelected = (e) => {
  const files = Array.from(e.target.files || []);
  if (files.length) setPendingFiles(files);
  e.target.value = "";
};

const handleConfirmUpload = async ({ isShowInVideoClips, thumbnail }) => {
  if (!pendingFiles?.length || !onAddMedia) return;
  await onAddMedia(group.id, pendingFiles, { isShowInVideoClips, thumbnail });
};

// ...
{pendingFiles && (
  <UploadMediaModal
    files={pendingFiles}
    onClose={() => setPendingFiles(null)}
    onConfirm={handleConfirmUpload}
  />
)}
```

**The staging modal itself** (trimmed to the essential logic — see
`ShowcaseGroup.jsx` for full JSX/styling):

```jsx
function UploadMediaModal({ files, onClose, onConfirm }) {
  const [isShowInVideoClips, setIsShowInVideoClips] = useState(false);
  const [thumbnail, setThumbnail] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm({ isShowInVideoClips, thumbnail: isShowInVideoClips ? thumbnail : null });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell onClose={onClose} title="Add Media">
      <p>{files.length} file{files.length > 1 ? "s" : ""} ready to upload.</p>

      <Checkbox
        checked={isShowInVideoClips}
        onChange={(e) => setIsShowInVideoClips(e.target.checked)}
        label="Show in video clips"
      />

      {isShowInVideoClips && (
        <FileInput
          accept="image/*"
          onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
          label="Thumbnail for clips (optional)"
        />
      )}

      <Actions onCancel={onClose} onConfirm={handleConfirm} busy={submitting} />
    </ModalShell>
  );
}
```

**The actual upload call** builds `multipart/form-data`:

```js
// services/brandApi.js
export async function addShowcaseMedia(
  sectionId,
  files,
  { isShowInVideoClips = false, thumbnail = null, extraFields = {} } = {},
  onUploadProgress
) {
  const formData = new FormData();
  formData.append('isShowInVideoClips', String(isShowInVideoClips));
  if (thumbnail) formData.append('thumbnail', thumbnail);
  Object.entries(extraFields).forEach(([key, value]) => formData.append(key, value));
  files.forEach((file) => formData.append('files', file));

  // No explicit Content-Type header — let the browser set the multipart
  // boundary itself; axios/fetch do this automatically for FormData.
  const { data } = await api.post(`/showcase/section/${sectionId}/add-media`, formData, {
    onUploadProgress: onUploadProgress
      ? (evt) => onUploadProgress(Math.round((evt.loaded * 100) / (evt.total || 1)))
      : undefined,
  });
  return data;
}
```

`POST /showcase/section/:sectionId/add-media` (multipart/form-data):
- `isShowInVideoClips`: `"true" | "false"` (text field)
- `files`: repeated file field, one per upload
- `thumbnail`: single file field (⚠️ not independently confirmed against a
  real Postman sample in this codebase — verify before relying on it)

Creating a brand-new section with its *first* batch of media in one step
(`AddShowcaseSectionModal.jsx`, mode="add") is a thin convenience wrapper:
call `POST /showcase/section/add` to create the section, then immediately
call `addShowcaseMedia` with the returned section's id. If the section
succeeds but the media call fails, the section is **not** rolled back —
both the created section and the media error are returned so the caller
can show "section created, but upload failed" instead of silently losing
the section.

## 5. Click-to-preview modal (and why "click" is detected manually)

Clicking a media tile in the grid opens a full preview modal
(`ImageModal` for photos, `VideoModal` for videos) with **Replace / Delete
/ (video only) Show in Video Clips** actions right in its header — the
same actions the grid tile's own context menu would have, just always
visible since the modal has room.

The tricky part: **every tile is also a full drag handle** (the whole card
can be dragged to reorder — see §6), and dnd-kit's `PointerSensor`
captures the pointer on `<body>` and installs its own `click`-
`preventDefault()` listener the moment it decides a drag has started. That
means the browser's native `click` event **never fires** on the tile once
dnd-kit is involved — no combination of "activation constraint" options
changes this reliably.

**The fix**: don't rely on `click` at all. Track raw `pointerdown` /
`pointerup` coordinates yourself; if the pointer released within a small
tolerance of where it was pressed, treat that as a click.

```js
const CLICK_MOVE_TOLERANCE = 6; // px

function useClickWithoutDrag(onClickLike) {
  const startRef = useRef(null);

  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    startRef.current = { x: e.clientX, y: e.clientY };
  };

  useEffect(() => {
    const handlePointerUp = (e) => {
      const start = startRef.current;
      startRef.current = null;
      if (!start) return;
      const dx = Math.abs(e.clientX - start.x);
      const dy = Math.abs(e.clientY - start.y);
      if (dx <= CLICK_MOVE_TOLERANCE && dy <= CLICK_MOVE_TOLERANCE) onClickLike();
    };
    document.addEventListener("pointerup", handlePointerUp);
    return () => document.removeEventListener("pointerup", handlePointerUp);
  }, [onClickLike]);

  return onPointerDown; // attach this to the tile's onPointerDown
}
```

Usage on the tile:

```jsx
function MediaTile({ media, index, onPlay, onPreview }) {
  const { ref, handleRef, isDragging } = useSortable({ id: media._id, index });
  const handleOpen = () => (media.type === "VIDEO" ? onPlay(media) : onPreview(media));
  const onPointerDown = useClickWithoutDrag(handleOpen);

  return (
    <div
      ref={mergeRefs(ref, handleRef)}   // whole card is BOTH the drag handle and the sortable root
      onPointerDown={onPointerDown}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      className="cursor-grab touch-none active:cursor-grabbing ..."
    >
      {/* thumbnail content */}
    </div>
  );
}
```

`previewing`/`playing` are **snapshots** of the clicked media object taken
at click time — a Replace/Delete performed from inside the modal closes
the modal right away rather than trying to reflect a mutated/deleted item
it can no longer see once the parent list reloads.

## 6. Drag-and-drop reordering

Two independent drag contexts exist, nested inside each other, both using
the exact same pattern:

- **Sections**, inside `ShowcaseSection.jsx` — reorders the section cards themselves.
- **Media within a section**, inside `ShowcaseGroup.jsx` (the "Order" panel) and `ShowcaseMediaRow.jsx` (the main grid) — reorders photos+videos as one combined sequence.

### 6.1 The pattern (same shape every time)

1. Wrap the sortable list in `<DragDropProvider onDragEnd={handler}>`.
2. Give every item a stable `id` (its real DB `_id`) via
   `useSortable({ id, index })`, which returns `{ ref, handleRef, isDragging }`.
   - `ref` marks the element as the sortable root.
   - `handleRef` marks the element that starts a drag when pressed (can be
     the *same* node as `ref` — merge them with `mergeRefs`, see §6.3 — or a
     separate small grip icon).
3. On drop, `move(idItems, event)` (from `@dnd-kit/helpers`) computes the
   new order of a plain `{ id }` array. Find the dragged id's new index in
   that result, add 1 (API positions are 1-based), and hand `(id,
   newPosition)` off to a single "set order" callback that calls the
   reorder API and reloads.

```js
const handleDragEnd = (event) => {
  if (event.canceled || !onReorder) return;
  const draggedId = event.operation.source?.id;
  if (draggedId == null) return;
  const idItems = items.map((item) => ({ id: item._id }));
  const moved = move(idItems, event);
  const newIndex = moved.findIndex((item) => item.id === draggedId);
  if (newIndex === -1) return;
  onReorder(draggedId, newIndex + 1); // 1-based position
};
```

### 6.2 Section reordering (`ShowcaseSection.jsx`)

```jsx
<DragDropProvider onDragEnd={handleSectionDragEnd}>
  <div className="mt-5 space-y-5">
    {showcase.groups.map((group, index) => (
      <ShowcaseGroup key={group.id} group={group} index={index} /* ...handlers */ />
    ))}
  </div>
</DragDropProvider>
```

Inside `ShowcaseGroup`, the section's **header row** (title/subtitle area)
is the drag handle for the *whole card* — you can grab anywhere on the
header, not just a small icon:

```jsx
const { ref, handleRef, isDragging } = useSortable({ id: group.id, index });

<div ref={ref} style={{ opacity: isDragging ? 0.5 : 1 }}>
  <div ref={handleRef} className="cursor-grab touch-none active:cursor-grabbing">
    {/* title, subtitle, visibility toggle */}
  </div>
  {/* Add Media / Order / Delete buttons live OUTSIDE handleRef, wrapped in noDragRef — see §6.4 */}
</div>
```

Section order is persisted via:

```
PUT /showcase/section/:brandId/reorder     (brandId in the URL, NOT a section id)
body: { sections: [{ id, sortOrder }, ...] }   // every section, in its new order
```

### 6.3 Media reordering — two UIs, one callback shape

**(a) Direct drag on the grid** (`ShowcaseMediaRow.jsx`) — every
`MediaTile` is simultaneously the sortable root, the drag handle, *and*
the click target (see §5's `mergeRefs(ref, handleRef)`).

**(b) The "Order" panel** (`ShowcaseGroup.jsx`) — an alternate, simpler
list view (small thumbnail + type label + a small drag-handle icon) opened
via an "Order" toggle button, for when dragging tiny grid tiles is fiddly:

```jsx
function OrderRow({ media, index }) {
  const { ref, handleRef, isDragging } = useSortable({ id: media._id, index });
  return (
    <div ref={ref} style={{ opacity: isDragging ? 0.4 : 1 }}>
      <button ref={handleRef} className="cursor-grab touch-none active:cursor-grabbing">
        <GripVertical size={14} />
      </button>
      {/* thumbnail + label */}
    </div>
  );
}
```

Both UIs funnel into the exact same `onSetMediaOrder(sectionId, mediaId,
newPosition)` callback and the same reorder request:

```
PUT /showcase/section/:sectionId/media/reorder
body: { medias: [{ id, sortOrder }, ...] }
```

Because photos and videos share one `sortOrder` sequence, this call always
includes **every** media item in the section (not just one type) in its
new combined order.

### 6.4 `mergeRefs` and `noDragRef` (`utils/BrandHelpers.js`)

`mergeRefs` lets one DOM node serve two independent ref callbacks at once
(dnd-kit's `ref` and `handleRef`) so a single element can be both the
sortable boundary and the drag handle:

```js
export function mergeRefs(...refs) {
  return (node) => {
    refs.forEach((r) => {
      if (typeof r === "function") r(node);
      else if (r) r.current = node;
    });
  };
}
```

`noDragRef` protects buttons that sit *inside* a drag-handle area (e.g.
"Add Media" / "Order" / "Delete" buttons inside a section's draggable
header row) from having their clicks swallowed by dnd-kit's own
`pointerdown` listener:

```js
export function noDragRef(node) {
  if (!node) return undefined;
  const stop = (e) => e.stopPropagation();
  node.addEventListener("pointerdown", stop, { capture: true });
  return () => node.removeEventListener("pointerdown", stop, { capture: true });
}
```

**Why capture-phase, and why `onPointerDown={(e) => e.stopPropagation()}`
does NOT work here**: dnd-kit's own `pointerdown` listener is a real
`addEventListener` sitting directly on the drag handle's DOM node, firing
during the native **bubble** phase, and it activates a drag immediately on
press with **no movement threshold**. A React `onPointerDown` handler that
calls `stopPropagation()` is *also* a bubble-phase listener — it races
against dnd-kit's own listener rather than reliably preceding it. A
capture-phase listener is the one thing guaranteed to run before dnd-kit
ever sees the event, since capture (root → target) fully completes before
bubble (target → root) begins. Usage: wrap the button cluster in a plain
`<div ref={noDragRef}>` instead of trying to stop propagation from the
buttons themselves.

## 7. Full endpoint reference (Showcase)

| Action | Method & Path | Body / Notes |
|---|---|---|
| Get full showcase (sections+media) | `GET /showcase/get-brand-showcase/:brandId` | one call, hydrates everything |
| Create section | `POST /showcase/section/add` | `{ title, description, sortOrder, sectionType }` |
| Update section | `PUT /showcase/section/update/:id` | partial patch, e.g. `{ title, description }` or `{ isVisible }` |
| Delete section | `DELETE /showcase/section/delete/:id` | — |
| Reorder sections | `PUT /showcase/section/:brandId/reorder` | `{ sections: [{ id, sortOrder }] }` — path id is the **brand's** id |
| Add media | `POST /showcase/section/:sectionId/add-media` | multipart: `isShowInVideoClips`, repeated `files`, optional `thumbnail` (⚠️ unconfirmed field name) |
| Replace media file / flag | `PUT /showcase/section/:sectionId/media/replace/:mediaId` | multipart: `file` and/or `isShowInVideoClips` |
| Delete media | `DELETE /showcase/section/:sectionId/media/delete/:mediaId` | — |
| Reorder media | `PUT /showcase/section/:sectionId/media/reorder` | `{ medias: [{ id, sortOrder }] }` — full combined photo+video sequence |

## 8. Porting checklist for the Admin panel

1. Install `@dnd-kit/react` + `@dnd-kit/helpers` (same versions, `^0.5.0`).
2. Copy `mergeRefs` / `noDragRef` from `BrandHelpers.js` verbatim.
3. Rebuild the three-layer component split (list → group/section →
   media-row) so each layer owns exactly one `DragDropProvider` — don't
   nest two `DragDropProvider`s for the *same* draggable set, only for
   genuinely separate ones (sections vs. media-within-a-section).
4. Reuse the `useClickWithoutDrag` hook verbatim for any tile that must be
   both draggable and clickable — don't try to solve this with `onClick`
   + `stopPropagation`, it doesn't work once dnd-kit's PointerSensor is
   attached to the same element.
5. Keep the "stage first, upload on confirm" pattern for file pickers
   feeding a checkbox-gated optional field (thumbnail) — don't upload
   directly from the raw `<input type="file">`'s `onChange`.
6. Match the reorder payload shapes exactly (`sections: [{id, sortOrder}]`
   / `medias: [{id, sortOrder}]`, 1-based `sortOrder`, path id nuances)
   against whatever the Admin backend's actual reorder endpoints expect —
   don't assume they're identical without checking a real request/response
   first.
