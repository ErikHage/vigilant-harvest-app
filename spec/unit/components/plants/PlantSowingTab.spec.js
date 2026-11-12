import { mountWithPlugins } from '../../../helpers/mount';
import { fieldRows } from '../../../helpers/details-tables';
import { aPlant } from '../../../helpers/plants';
import PlantSowingTab from '@/components/plants/PlantSowingTab.vue';

describe('PlantSowingTab', () => {
    // The service stores a sowing yes or no as "1" or "0" (its own pinned
    // behaviour), which the tab showed as it came (backlog B22)
    it("shows the plant's sowing details, with a yes or no in words", () => {
        const wrapper = mountWithPlugins(PlantSowingTab, { props: { plant: aPlant() } });

        expect(fieldRows(wrapper)).toEqual([
            ['Indoors', 'No'],
            ['Direct', 'Yes'],
            ['Germination Time', '7-10'],
            ['Germination Temperature', '70-85F'],
            ['Notes', 'Sow after the last frost.'],
        ]);
    });

    it('shows free text as it was entered', () => {
        const plant = aPlant({ sowing: { ...aPlant().sowing, indoor: '6 weeks before last frost' } });

        const wrapper = mountWithPlugins(PlantSowingTab, { props: { plant } });

        expect(fieldRows(wrapper)[0]).toEqual(['Indoors', '6 weeks before last frost']);
    });
});
