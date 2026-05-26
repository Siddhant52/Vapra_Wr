// Dev-friendly in-memory attendance store.
// Used as a fallback when Prisma attendance model is unavailable.

function getStore() {
  if (!globalThis.__vapraMechanicAttendance) {
    globalThis.__vapraMechanicAttendance = [];
  }
  return globalThis.__vapraMechanicAttendance;
}

function sameDayUTC(a, b) {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export function upsertAttendanceRecord(record) {
  const store = getStore();
  const targetDate = new Date(record.date);

  const idx = store.findIndex(
    (item) =>
      item.mechanicId === record.mechanicId &&
      sameDayUTC(new Date(item.date), targetDate)
  );

  if (idx >= 0) {
    store[idx] = {
      ...store[idx],
      ...record,
      updatedAt: new Date(),
    };
    return store[idx];
  }

  const next = {
    id: record.id || `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...record,
  };
  store.unshift(next);
  return next;
}

export function listAttendanceRecords({ startDate, endDate } = {}) {
  const store = getStore();
  return store
    .filter((item) => {
      const dt = new Date(item.date);
      if (startDate && dt < startDate) return false;
      if (endDate && dt > endDate) return false;
      return true;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}
