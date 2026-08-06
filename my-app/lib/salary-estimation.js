export function getAttendanceWeight(status) {
  switch (status) {
    case "PRESENT":
      return 1;
    case "HALF_DAY":
      return 0.5;
    case "ABSENT":
    default:
      return 0;
  }
}

export function calculateSalaryEstimates({
  mechanics = [],
  records = [],
  dailyWage = 0,
  startDate,
  endDate,
}) {
  const numericDailyWage = Number(dailyWage) || 0;
  const normalizedRecords = records.filter((record) => {
    if (!record?.date) return false;
    const recordDate = new Date(record.date);
    if (Number.isNaN(recordDate.getTime())) return false;

    if (startDate) {
      const start = new Date(`${startDate}T00:00:00.000Z`);
      if (recordDate < start) return false;
    }

    if (endDate) {
      const end = new Date(`${endDate}T23:59:59.999Z`);
      if (recordDate > end) return false;
    }

    return true;
  });

  const recordsByMechanic = new Map();
  for (const record of normalizedRecords) {
    const key = record.mechanicId;
    if (!recordsByMechanic.has(key)) {
      recordsByMechanic.set(key, []);
    }
    recordsByMechanic.get(key).push(record);
  }

  return mechanics.map((mechanic) => {
    const mechanicRecords = recordsByMechanic.get(mechanic.id) || [];
    const fullDays = mechanicRecords.filter((record) => record.status === "PRESENT").length;
    const halfDays = mechanicRecords.filter((record) => record.status === "HALF_DAY").length;
    const absentDays = mechanicRecords.filter((record) => record.status === "ABSENT").length;
    const workingDays = fullDays + halfDays;
    const estimatedSalary = numericDailyWage * (fullDays + halfDays * 0.5);

    return {
      mechanicId: mechanic.id,
      name: mechanic.name || "Unnamed mechanic",
      specialty: mechanic.specialty || "N/A",
      fullDays,
      halfDays,
      absentDays,
      workingDays,
      estimatedSalary,
      dailyWage: numericDailyWage,
    };
  });
}
