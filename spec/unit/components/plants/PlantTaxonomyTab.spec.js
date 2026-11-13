import { mountWithPlugins } from '../../../helpers/mount';
import { fieldRows } from '../../../helpers/details-tables';
import { aPlant } from '../../../helpers/plants';
import PlantTaxonomyTab from '@/components/plants/PlantTaxonomyTab.vue';

describe('PlantTaxonomyTab', () => {
    it("shows the plant's family, genus, species and cultivar", () => {
        const wrapper = mountWithPlugins(PlantTaxonomyTab, { props: { plant: aPlant() } });

        expect(fieldRows(wrapper)).toEqual([
            ['Family', 'Fabaceae'],
            ['Genus', 'Phaseolus'],
            ['Species', 'vulgaris'],
            ['Cultivar', 'Black Valentine'],
        ]);
    });
});
