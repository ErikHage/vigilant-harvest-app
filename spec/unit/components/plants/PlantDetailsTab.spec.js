import { mountWithPlugins } from '../../../helpers/mount';
import { fieldRows } from '../../../helpers/details-tables';
import { aPlant } from '../../../helpers/plants';
import PlantDetailsTab from '@/components/plants/PlantDetailsTab.vue';

describe('PlantDetailsTab', () => {
    // The dates are shown in the browser's locale and timezone (New York here)
    it("shows the plant's id, dates, lifespan type, tags and description", () => {
        const wrapper = mountWithPlugins(PlantDetailsTab, { props: { plant: aPlant() } });

        expect(fieldRows(wrapper)).toEqual([
            ['Plant Id', 'plant-1'],
            ['Created At', new Date('2026-03-01T13:00:00.000Z').toLocaleString()],
            ['Last Modified At', new Date('2026-04-02T14:30:00.000Z').toLocaleString()],
            ['Lifespan Type', 'Annual'],
            ['Tags', 'Cold TolerantContainer Friendly'],
            ['Description', 'A reliable bush bean.\nGood for cool soil.'],
        ]);
        expect(wrapper.findAll('.v-chip').map(chip => chip.text())).toEqual(['Cold Tolerant', 'Container Friendly']);
    });

    it('keeps the line breaks in the description', () => {
        const wrapper = mountWithPlugins(PlantDetailsTab, { props: { plant: aPlant() } });

        expect(wrapper.find('td.multiline-cell').text()).toContain('\n');
    });

    it('shows no chips with no tags', () => {
        const wrapper = mountWithPlugins(PlantDetailsTab, { props: { plant: aPlant({ tags: [] }) } });

        expect(wrapper.findAll('.v-chip')).toHaveLength(0);
    });

    // The page shows its tabs only once the plant has loaded, so the tab
    // requires one. Its '--' for a missing plant could never show (backlog B22)
    it('needs a plant', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});

        expect(() => mountWithPlugins(PlantDetailsTab, { props: { plant: null } })).toThrow(TypeError);

        vi.restoreAllMocks();
    });
});
