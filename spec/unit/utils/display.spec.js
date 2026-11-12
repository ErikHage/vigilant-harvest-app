import { heatMap, yesOrNo } from '@/utils/display';

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

describe('yesOrNo', () => {
    it.each([
        [true, 'Yes'],
        ['1', 'Yes'],
        [false, 'No'],
        ['0', 'No'],
    ])('reads %j as %s', (value, words) => {
        expect(yesOrNo(value)).toBe(words);
    });

    it.each([
        ['6 weeks before last frost'],
        [''],
        [null],
        [undefined],
    ])('leaves %j as it is', value => {
        expect(yesOrNo(value)).toBe(value);
    });
});
