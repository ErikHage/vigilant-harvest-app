import { mountWithPlugins } from '../../../helpers/mount';
import { fieldRows } from '../../../helpers/details-tables';
import { aPlant } from '../../../helpers/plants';
import PlantPlantingTab from '@/components/plants/PlantPlantingTab.vue';

describe('PlantPlantingTab', () => {
    // The depth's header once had no unit (backlog B22)
    it("shows the plant's depth, spacings and instructions, each with its unit", () => {
        const wrapper = mountWithPlugins(PlantPlantingTab, { props: { plant: aPlant() } });

        expect(fieldRows(wrapper)).toEqual([
            ['Planting Depth (in)', '1'],
            ['Plant Spacing (in)', '3'],
            ['Row Spacing (in)', '18'],
            ['Instructions', 'Rows north to south.'],
        ]);
    });
});
