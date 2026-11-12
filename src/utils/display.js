export const heatMap = {
    [0]: '#800000', // dark red
    [1]: '#C00000', // red
    [2]: '#FF0000', // bright red
    [3]: '#FF4000', // dark orange
    [4]: '#FF8000', // orange
    [5]: '#FFFF00', // yellow
    [6]: '#BFFF00', // yellow-green
    [7]: '#80FF00', // light green
    [8]: '#00C000', // green
    [9]: '#006000', // dark green
};

/**
 * A yes or no as words. The service stores a sowing yes or no as "1" or "0",
 * and climbing as a boolean; anything else, such as a sowing's free text
 * ("6 weeks before last frost"), is shown as it is.
 */
export function yesOrNo(value) {
    if (value === true || value === '1') return 'Yes';
    if (value === false || value === '0') return 'No';
    return value;
}