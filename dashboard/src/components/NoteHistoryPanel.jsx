import React, { useMemo } from "react";
import { MessageSquareText } from "lucide-react";

const formatTimestamp = (timestamp) => {
  if (!timestamp) {
    return "Just now";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export default function NoteHistoryPanel({ notes = [], latestNote = null }) {
  const orderedNotes = useMemo(() => {
    const sourceNotes =
      notes.length > 0
        ? notes
        : latestNote?.message
          ? [latestNote]
          : [];

    return [...sourceNotes].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
    );
  }, [latestNote, notes]);

  return (
    <div className="bg-g-surface rounded-2xl shadow-g-card p-5 h-full">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-sm font-medium text-g-ink">Note history</p>
          <p className="text-xs text-g-muted mt-1">
            Recent ride updates shared with riders and monitors.
          </p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-g-blue-tint text-g-blue flex items-center justify-center">
          <MessageSquareText className="w-5 h-5" />
        </div>
      </div>

      {orderedNotes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-g-border bg-g-bg px-4 py-8 text-center text-sm text-g-muted">
          No notes have been sent yet.
        </div>
      ) : (
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {orderedNotes.map((note, index) => (
            <div
              key={`${note.author || "leader"}-${note.timestamp || index}-${index}`}
              className="rounded-2xl border border-g-bg bg-white px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-g-ink">
                  {note.author || "Ride leader"}
                </p>
                <p className="text-xs text-g-faint whitespace-nowrap">
                  {formatTimestamp(note.timestamp)}
                </p>
              </div>
              <p className="mt-2 text-sm leading-6 text-g-ink-2">{note.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
