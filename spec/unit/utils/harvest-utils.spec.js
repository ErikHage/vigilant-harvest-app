import harvestUtils from '@/utils/harvest-utils';

describe('harvestUtils', () => {
    it('knows the unspecified harvest type as id 1', () => {
        expect(harvestUtils.unspecifiedHarvestTypeId).toBe(1);
        expect(harvestUtils.unspecifiedHarvestTypeName).toBe('unspecified');
    });

    describe('harvestTypeLabel', () => {
        it('is the harvest type itself', () => {
            expect(harvestUtils.harvestTypeLabel('pounds')).toBe('pounds');
        });

        it.each([
            ['unspecified', 'unspecified'],
            ['null', null],
            ['undefined', undefined],
            ['empty', ''],
        ])('is empty for an %s harvest type', (_, harvestType) => {
            expect(harvestUtils.harvestTypeLabel(harvestType)).toBe('');
        });
    });

    describe('formatQuantity', () => {
        it('appends the harvest type', () => {
            expect(harvestUtils.formatQuantity(3, 'pounds')).toBe('3 pounds');
        });

        it('shows the quantity alone for the unspecified type', () => {
            expect(harvestUtils.formatQuantity(3, 'unspecified')).toBe('3');
        });

        it('shows the quantity alone with no type', () => {
            expect(harvestUtils.formatQuantity(0, undefined)).toBe('0');
        });
    });

    describe('harvestTypeNameById', () => {
        const harvestTypes = [
            { harvestTypeId: 1, harvestTypeName: 'unspecified' },
            { harvestTypeId: 2, harvestTypeName: 'pounds' },
        ];

        it('finds the name for an id', () => {
            expect(harvestUtils.harvestTypeNameById(harvestTypes, 2)).toBe('pounds');
        });

        it('is empty for an unknown id', () => {
            expect(harvestUtils.harvestTypeNameById(harvestTypes, 99)).toBe('');
        });

        it('matches the id strictly, so a string id is unknown', () => {
            expect(harvestUtils.harvestTypeNameById(harvestTypes, '2')).toBe('');
        });
    });

    describe('upsertErrorMessage', () => {
        const rejected = (status, message) => ({
            status,
            data: { errors: [{ name: 'FeralError', message, status }] },
        });

        it("shows the service's message for a 400", () => {
            const err = rejected(400, 'harvests[0].quantity must be greater than 0');

            expect(harvestUtils.upsertErrorMessage(err, 'error saving harvests'))
                .toBe('harvests[0].quantity must be greater than 0');
        });

        it('falls back for any other status, even with a message', () => {
            expect(harvestUtils.upsertErrorMessage(rejected(500, 'boom'), 'error saving harvests'))
                .toBe('error saving harvests');
        });

        it('falls back for a 400 with no message', () => {
            expect(harvestUtils.upsertErrorMessage({ status: 400, data: '<html>' }, 'error saving harvests'))
                .toBe('error saving harvests');
        });

        it('falls back with no error', () => {
            expect(harvestUtils.upsertErrorMessage(undefined, 'error saving harvests'))
                .toBe('error saving harvests');
        });
    });

    it('sorts by quantity, largest first', () => {
        const totals = [{ quantity: 2 }, { quantity: 10 }, { quantity: 5 }];

        expect(totals.sort(harvestUtils.sortByQuantityDescending).map(t => t.quantity)).toEqual([10, 5, 2]);
    });
});
