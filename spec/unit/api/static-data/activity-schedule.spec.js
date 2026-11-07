import scheduleConstants from '@/api/static-data/activity-schedule';

const { activityTypes } = scheduleConstants;

describe('the static activity types', () => {
    it('are the five types, in order', () => {
        expect(activityTypes.map(type => [type.id, type.name])).toEqual([
            [1, 'Fertilize'],
            [2, 'Treatment'],
            [3, 'Soil Amendment'],
            [4, 'Action'],
            [5, 'Test'],
        ]);
    });

    it('each have their subtypes', () => {
        const subTypeNames = Object.fromEntries(
            activityTypes.map(type => [type.name, type.subTypes.map(subType => subType.name)]));

        expect(subTypeNames).toEqual({
            'Fertilize': [
                'Bone Meal',
                'Blood Meal',
                'Fish Emulsion',
                'Worm Castings',
                'Calcium/Magnesium Supplement',
                'Water Soluble All Purpose',
                'Granular Slow Release',
            ],
            'Treatment': ['Fungicide', 'BT Thuricide', 'Neem Oil'],
            'Soil Amendment': ['Compost', 'Sulphur', 'Mulch'],
            'Action': ['Prune'],
            'Test': ['Soil pH'],
        });
    });

    it('number their subtypes from 1 within each type, so a subtype id is unique only with its type', () => {
        for (const type of activityTypes) {
            expect(type.subTypes.map(subType => subType.id)).toEqual(type.subTypes.map((_, i) => i + 1));
        }
    });
});
