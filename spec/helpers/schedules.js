// A short version of api/static-data's activity types. As there, subtype ids
// restart in each type (B5): Bone Meal and Neem Oil are both 1
export const activityTypes = [
    {
        id: 1,
        name: 'Fertilize',
        subTypes: [{ id: 1, name: 'Bone Meal' }, { id: 2, name: 'Blood Meal' }],
    },
    {
        id: 2,
        name: 'Treatment',
        subTypes: [{ id: 1, name: 'Neem Oil' }],
    },
];

// A schedule item as the service sends it, with any fields overridden. Its
// dates are a month and day, MM-DD, with a year offset each
export function aScheduleItem(overrides = {}) {
    return {
        activityScheduleId: 'schedule-1',
        entryId: 'item-1',
        activityType: 'Fertilize',
        subType: 'Blood Meal',
        recurrenceRule: 'RRULE:FREQ=WEEKLY;INTERVAL=2',
        startDate: '05-01',
        startDateYearOffset: 0,
        endDate: '09-30',
        endDateYearOffset: 0,
        notes: 'Side-dress the tomatoes',
        ...overrides,
    };
}

// A schedule as GET /activity-schedules/:id sends it, with any fields overridden
export function aSchedule(overrides = {}) {
    return {
        activityScheduleId: 'schedule-1',
        name: 'Tomatoes',
        description: 'Feed every two weeks',
        items: [aScheduleItem()],
        ...overrides,
    };
}
