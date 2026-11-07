import { mountWithPlugins } from '../../../helpers/mount';
import { fieldRows } from '../../../helpers/details-tables';
import { aPlant } from '../../../helpers/plants';
import PlantHarvestingTab from '@/components/plants/PlantHarvestingTab.vue';

describe('PlantHarvestingTab', () => {
    it("shows the plant's default harvest type, fruit size, shelf stability and instructions", () => {
        const wrapper = mountWithPlugins(PlantHarvestingTab, { props: { plant: aPlant() } });

        expect(fieldRows(wrapper)).toEqual([
            ['Default Harvest Type', 'pounds'],
            ['Fruit Size', '5 in'],
            ['Shelf Stability', 'A week, refrigerated'],
            ['Instructions', 'Pick young.'],
        ]);
    });
});
