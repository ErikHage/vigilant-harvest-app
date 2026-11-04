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
});
