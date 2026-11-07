import { mountWithPlugins } from '../../../helpers/mount';
import { tableHeaders, tableRows } from '../../../helpers/tables';
import PlotsTable from '@/components/plots/PlotsTable.vue';

const plots = () => [
    { plotId: 'plot-1', friendlyName: 'south bed', lengthInInches: 96, widthInInches: 48, plotType: 'Raised Bed', isActive: true },
    { plotId: 'plot-2', friendlyName: 'North bed', lengthInInches: 120, widthInInches: 36, plotType: 'Bed', isActive: false },
    { plotId: 'plot-3', friendlyName: 'Apple tree', lengthInInches: 0, widthInInches: 0, plotType: 'Tree', isActive: true },
];

function mountTable(props) {
    return mountWithPlugins(PlotsTable, { props: { plots: plots(), onEditClicked: vi.fn(), ...props } });
}

describe('PlotsTable', () => {
    it('lists each plot with its size, type and whether it is active, sorted by name ignoring case', () => {
        const wrapper = mountTable();

        expect(tableHeaders(wrapper)).toEqual(['Name', 'Length', 'Width', 'Type', 'Active', 'Actions']);
        expect(tableRows(wrapper)).toEqual([
            ['Apple tree', '0', '0', 'Tree', 'Y', ''],
            ['North bed', '120', '36', 'Bed', 'N', ''],
            ['south bed', '96', '48', 'Raised Bed', 'Y', ''],
        ]);
    });

    // It sorts the array it was given, not a copy, as PlantsTable does (B21)
    it('sorts the array it was given in place', () => {
        const given = plots();

        mountTable({ plots: given });

        expect(given.map(plot => plot.plotId)).toEqual(['plot-3', 'plot-2', 'plot-1']);
    });

    it('filters by name, ignoring case', () => {
        const wrapper = mountTable({ searchFilter: 'BED' });

        expect(tableRows(wrapper).map(([name]) => name)).toEqual(['North bed', 'south bed']);
        expect(wrapper.text()).toContain('2 of 3 plots');
    });

    it("doesn't filter by type", () => {
        const wrapper = mountTable({ searchFilter: 'raised' });

        expect(tableRows(wrapper)).toEqual([]);
        expect(wrapper.text()).toContain('0 of 3 plots');
    });

    it('lists them all with an empty search', () => {
        expect(mountTable({ searchFilter: '' }).text()).toContain('3 of 3 plots');
    });

    it("calls onEditClicked with the row's plot", async () => {
        const wrapper = mountTable();

        await wrapper.findAll('tbody tr')[1].find('.mdi-pencil').trigger('click');

        expect(wrapper.props('onEditClicked')).toHaveBeenCalledWith(expect.objectContaining({ plotId: 'plot-2' }));
    });
});
