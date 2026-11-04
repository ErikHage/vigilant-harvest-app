import sorting from '@/utils/sorting';

describe('sorting', () => {
    describe.each([
        ['sortByPlotFriendlyName', 'friendlyName'],
        ['sortByPlantFriendlyName', 'friendlyName'],
        ['sortByPlantingName', 'name'],
    ])('%s', (comparator, field) => {
        const item = value => ({ [field]: value });
        const values = list => list.map(entry => entry[field]);

        it(`sorts by ${field}, ignoring case`, () => {
            const list = [item('carrot'), item('Bean'), item('apple')];

            expect(values(list.sort(sorting[comparator]))).toEqual(['apple', 'Bean', 'carrot']);
        });

        it('treats names that differ only in case as equal', () => {
            expect(sorting[comparator](item('Bean'), item('bean'))).toBe(0);
        });
    });

    describe('sortPlantingHistoryByDateCreated', () => {
        it('sorts oldest first', () => {
            const history = [
                { action: 'PLANT', dateCreated: '2026-05-20T12:00:00.000Z' },
                { action: 'CREATE', dateCreated: '2026-03-01T12:00:00.000Z' },
                { action: 'START', dateCreated: '2026-03-15T12:00:00.000Z' },
            ];

            expect(history.sort(sorting.sortPlantingHistoryByDateCreated).map(h => h.action))
                .toEqual(['CREATE', 'START', 'PLANT']);
        });

        it('treats the same time as equal', () => {
            const a = { dateCreated: '2026-03-01T12:00:00.000Z' };

            expect(sorting.sortPlantingHistoryByDateCreated(a, { ...a })).toBe(0);
        });
    });
});
