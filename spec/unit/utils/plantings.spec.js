import plantingUtils from '@/utils/plantings';

describe('plantingUtils', () => {
    it('names the six planting actions', () => {
        expect(plantingUtils.plantingActions).toEqual({
            start: 'START',
            split: 'SPLIT',
            plant: 'PLANT',
            retire: 'RETIRE',
            comment: 'COMMENT',
            delete: 'DELETE',
        });
    });

    it('lists the four statuses in lifecycle order', () => {
        expect(plantingUtils.plantingStatusesList).toEqual(['CREATED', 'STARTED', 'PLANTED', 'RETIRED']);
    });

    describe('mapPlantingStatusToColor', () => {
        it.each([
            ['CREATED', 'info'],
            ['STARTED', 'secondary'],
            ['PLANTED', 'success'],
            ['RETIRED', 'error'],
        ])('maps %s to %s', (status, color) => {
            expect(plantingUtils.mapPlantingStatusToColor(status)).toBe(color);
        });

        it('maps an unknown status to default', () => {
            expect(plantingUtils.mapPlantingStatusToColor('UNKNOWN')).toBe('default');
            expect(plantingUtils.mapPlantingStatusToColor(undefined)).toBe('default');
        });
    });

    // The service files a creation and an update as JSON, which the history
    // showed as it came (backlog B34)
    describe('describeHistoryComment', () => {
        const describe_ = plantingUtils.describeHistoryComment;

        it('reads a creation, its fields in JSON, as created, with its name', () => {
            const filed = JSON.stringify({ plantingId: 'p-1', plantId: 'plant-1', plantingYear: 2026, name: 'Early beans', currentStatus: 'CREATED' });

            expect(describe_(filed)).toBe('Created as "Early beans"');
        });

        it('reads a creation with no name as created', () => {
            expect(describe_(JSON.stringify({ plantingId: 'p-1' }))).toBe('Created');
        });

        it('reads an update as the fields sent, with their values', () => {
            const filed = 'Updated: ' + JSON.stringify({
                name: 'Late beans', seedSource: "Johnny's", lotNumber: null, plotId: 'plot-1',
                transplantDate: '2026-05-18', numberTransplanted: 12, notes: 'A long note',
            });

            expect(describe_(filed)).toBe(
                'Updated: name "Late beans", seed source "Johnny\'s", lot number, plot, transplant date 2026-05-18, number planted 12, notes');
        });

        it('names a field it has no name for by its key', () => {
            expect(describe_('Updated: {"somethingNew":3}')).toBe('Updated: somethingNew 3');
        });

        it('reads an update of nothing as updated', () => {
            expect(describe_('Updated: {}')).toBe('Updated');
        });

        it.each([
            ['a comment', 'Into the north bed'],
            ["a split's", 'Split out 4 plants from planting Early beans'],
            ['one that only looks like an update', 'Updated: the bed, after the rain'],
            ['JSON that is no planting', '{"note":"kept"}'],
            ['a list', '[1,2]'],
            ['empty', ''],
        ])('leaves %s as written', (_, comment) => {
            expect(describe_(comment)).toBe(comment);
        });

        it('leaves no comment as none', () => {
            expect(describe_(null)).toBeNull();
        });
    });
});
