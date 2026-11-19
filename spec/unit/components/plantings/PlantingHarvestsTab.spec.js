import { VSelect } from 'vuetify/components';
import { mountWithPlugins } from '../../../helpers/mount';
import { aHarvest } from '../../../helpers/harvests';
import PlantingHarvestsTab from '@/components/plantings/PlantingHarvestsTab.vue';

const harvests = [
    aHarvest({ harvestId: 'h-1', harvestDate: '2026-07-10', quantity: 2, harvestTypeId: 2, harvestType: 'pounds' }),
    aHarvest({ harvestId: 'h-2', harvestDate: '2026-08-02', quantity: 12, harvestTypeId: 3, harvestType: 'count' }),
    aHarvest({ harvestId: 'h-3', harvestDate: '2026-07-24', quantity: 3, harvestTypeId: 2, harvestType: 'pounds' }),
    aHarvest({ harvestId: 'h-4', harvestDate: '2026-06-30', quantity: 1, harvestTypeId: 1, harvestType: 'unspecified' }),
];

function mountTab(props = {}) {
    return mountWithPlugins(PlantingHarvestsTab, {
        props: { harvests, years: [2026, 2025], year: 2026, loaded: true, ...props },
    });
}

const rows = wrapper => wrapper.findAll('tbody tr').map(row => row.findAll('td').map(cell => cell.text()));
const totals = wrapper => wrapper.findAll('.totals .v-chip').map(chip => chip.text());

describe('PlantingHarvestsTab', () => {
    it('shows each harvest, newest first, with its quantity and type', () => {
        expect(rows(mountTab())).toEqual([
            ['2026-08-02', '12 count'],
            ['2026-07-24', '3 pounds'],
            ['2026-07-10', '2 pounds'],
            ['2026-06-30', '1'],
        ]);
    });

    // pounds can't be added to a count
    it('totals each harvest type apart, largest first', () => {
        expect(totals(mountTab())).toEqual(['12 count', '5 pounds', '1']);
    });

    it('offers the years given, with the one given chosen', () => {
        const select = mountTab().findComponent(VSelect);

        expect(select.props('items')).toEqual([2026, 2025]);
        expect(select.props('modelValue')).toBe(2026);
    });

    it('tells the page when another year is chosen', async () => {
        const wrapper = mountTab();

        await wrapper.findComponent(VSelect).vm.$emit('update:modelValue', 2025);

        expect(wrapper.emitted('update:year')).toEqual([[2025]]);
    });

    it('says so when the year has no harvests', () => {
        const wrapper = mountTab({ harvests: [] });

        expect(wrapper.find('table').exists()).toBe(false);
        expect(wrapper.text()).toContain('No harvests in 2026.');
    });

    it("doesn't say the year is empty while its harvests are on their way", () => {
        expect(mountTab({ harvests: [], loaded: false }).text()).not.toContain('No harvests');
    });

    it("leaves the harvests given in the order they're in", () => {
        const given = [...harvests];

        mountTab({ harvests: given });

        expect(given.map(harvest => harvest.harvestId)).toEqual(['h-1', 'h-2', 'h-3', 'h-4']);
    });
});
