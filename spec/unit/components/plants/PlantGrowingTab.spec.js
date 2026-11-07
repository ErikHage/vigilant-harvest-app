import { mountWithPlugins } from '../../../helpers/mount';
import { fieldRows } from '../../../helpers/details-tables';
import { aPlant } from '../../../helpers/plants';
import PlantGrowingTab from '@/components/plants/PlantGrowingTab.vue';

describe('PlantGrowingTab', () => {
    // Climbing is shown as the raw boolean, true or false
    it("shows the plant's growing details, without a climbing height for a plant that doesn't climb", () => {
        const wrapper = mountWithPlugins(PlantGrowingTab, { props: { plant: aPlant() } });

        expect(fieldRows(wrapper)).toEqual([
            ['Sun', 'Full'],
            ['Days to Maturity', '50'],
            ['Climbing', 'false'],
            ['Mature Size', '18 in'],
            ['Notes', 'Keep evenly moist.'],
        ]);
    });

    it('shows the climbing height for a plant that climbs', () => {
        const plant = aPlant({ growing: { ...aPlant().growing, isClimbing: true, climbingHeightFeet: 6 } });

        const wrapper = mountWithPlugins(PlantGrowingTab, { props: { plant } });

        expect(fieldRows(wrapper).slice(2, 4)).toEqual([
            ['Climbing', 'true'],
            ['Climbing Height', '6'],
        ]);
    });
});
