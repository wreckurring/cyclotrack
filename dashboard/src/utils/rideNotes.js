export const appendRideNote = (ride, payload, limit = 20) => {
  if (!ride || !payload?.message) {
    return ride;
  }

  const timestamp = payload.timestamp
    ? new Date(payload.timestamp).toISOString()
    : new Date().toISOString();

  const incomingNote = {
    message: payload.message,
    author: payload.author || "Ride leader",
    timestamp,
  };

  const existingNotes = Array.isArray(ride.notes) ? ride.notes : [];
  const alreadyPresent = existingNotes.some((note) => {
    const existingTimestamp = note?.timestamp
      ? new Date(note.timestamp).toISOString()
      : "";

    return (
      note?.message === incomingNote.message &&
      (note?.author || "Ride leader") === incomingNote.author &&
      existingTimestamp === incomingNote.timestamp
    );
  });

  return {
    ...ride,
    note: incomingNote.message,
    noteAuthor: incomingNote.author,
    noteUpdatedAt: incomingNote.timestamp,
    notes: alreadyPresent
      ? existingNotes
      : [...existingNotes, incomingNote].slice(-limit),
  };
};
