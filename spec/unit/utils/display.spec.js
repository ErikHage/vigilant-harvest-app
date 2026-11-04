import { heatMap } from '@/utils/display';

describe('heatMap', () => {
    it('has a colour for each score from 0 to 9', () => {
        expect(Object.keys(heatMap)).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
    });

    it('runs from dark red to dark green', () => {
        expect(heatMap[0]).toBe('#800000');
        expect(heatMap[5]).toBe('#FFFF00');
        expect(heatMap[9]).toBe('#006000');
    });
});
