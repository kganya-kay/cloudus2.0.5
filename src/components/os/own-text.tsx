"use client";

import { useState } from "react";

import { Button } from "./primitives";

export function OwnText({
  canManage,
  text,
  multiline,
  onSave,
  onDelete,
  busy,
}: {
  canManage?: boolean;
  text: string;
  multiline?: boolean;
  onSave: (value: string) => void;
  onDelete?: () => void;
  busy?: boolean;
}) {
  const [mode, setMode] = useState<"view" | "edit" | "sure">("view");
  const [draft, setDraft] = useState(text);

  if (!canManage) {
    return multiline ? (
      <p className="whitespace-pre-wrap text-sm leading-6">{text}</p>
    ) : (
      <p className="text-sm">{text}</p>
    );
  }

  if (mode === "edit") {
    return (
      <div className="space-y-2">
        {multiline ? (
          <textarea
            className="os-field"
            rows={4}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        ) : (
          <input
            className="os-field"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={busy || !draft.trim()}
            onClick={() => {
              onSave(draft.trim());
              setMode("view");
            }}
          >
            Save
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setDraft(text);
              setMode("view");
            }}
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {multiline ? (
        <p className="whitespace-pre-wrap text-sm leading-6">{text}</p>
      ) : (
        <p className="text-sm">{text}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => {
            setDraft(text);
            setMode("edit");
          }}
        >
          Edit
        </Button>
        {onDelete ? (
          mode === "sure" ? (
            <>
              <Button type="button" size="sm" variant="danger" disabled={busy} onClick={onDelete}>
                Sure
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setMode("view")}>
                Close
              </Button>
            </>
          ) : (
            <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => setMode("sure")}>
              Delete
            </Button>
          )
        ) : null}
      </div>
    </div>
  );
}

export function OwnBar({
  canManage,
  onEdit,
  onDelete,
  busy,
}: {
  canManage?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  busy?: boolean;
}) {
  const [sure, setSure] = useState(false);
  if (!canManage) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {onEdit ? (
        <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={onEdit}>
          Edit
        </Button>
      ) : null}
      {onDelete ? (
        sure ? (
          <>
            <Button type="button" size="sm" variant="danger" disabled={busy} onClick={onDelete}>
              Sure
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setSure(false)}>
              Close
            </Button>
          </>
        ) : (
          <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => setSure(true)}>
            Delete
          </Button>
        )
      ) : null}
    </div>
  );
}
