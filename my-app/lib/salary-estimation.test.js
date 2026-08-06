const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateSalaryEstimates } = require('./salary-estimation');

test('calculates half-day salary correctly', () => {
  const estimates = calculateSalaryEstimates({
    mechanics: [{ id: 'm1', name: 'Ravi', specialty: 'Engine' }],
    records: [
      { mechanicId: 'm1', date: '2026-08-01T00:00:00.000Z', status: 'PRESENT' },
      { mechanicId: 'm1', date: '2026-08-02T00:00:00.000Z', status: 'HALF_DAY' },
      { mechanicId: 'm1', date: '2026-08-03T00:00:00.000Z', status: 'ABSENT' },
    ],
    dailyWage: 800,
    startDate: '2026-08-01',
    endDate: '2026-08-03',
  });

  assert.equal(estimates[0].fullDays, 1);
  assert.equal(estimates[0].halfDays, 1);
  assert.equal(estimates[0].absentDays, 1);
  assert.equal(estimates[0].estimatedSalary, 1200);
});
