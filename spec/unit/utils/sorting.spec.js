import sorting from '@/utils/sorting';

describe('sorting', () => {
    describe.each([
        ['sortByFriendlyName', 'friendlyName'],
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

        // Array.sort decides which way round it compares, so call the comparator directly
        it('orders an earlier name before a later one, either way round', () => {
            expect(sorting[comparator](item('apple'), item('Bean'))).toBe(-1);
            expect(sorting[comparator](item('Bean'), item('apple'))).toBe(1);
        });
    });

    // For the tables whose headers choose the sort (backlog B21)
    describe('byProperty', () => {
        const list = () => [{ name: 'zucchini' }, { name: 'Zinnia' }, { name: 'arugula' }, { name: null }];

        it('sorts by the property, ignoring case, a missing value first', () => {
            expect(list().sort(sorting.byProperty('name')).map(item => item.name))
                .toEqual([null, 'arugula', 'Zinnia', 'zucchini']);
        });

        it('sorts descending for -property', () => {
            expect(list().sort(sorting.byProperty('-name')).map(item => item.name))
                .toEqual(['zucchini', 'Zinnia', 'arugula', null]);
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
