import { mountWithPlugins } from '../../../helpers/mount';
import { tableHeaders, tableRows } from '../../../helpers/tables';
import PlantingYearsTable from '@/components/years/PlantingYearsTable.vue';

// As the service sends them: each date is a day, YYYY-MM-DD
const plantingYears = [
    { plantingYear: 2025, lastFrostDate: '2025-05-12', targetPlantingDate: '2025-05-19' },
    { plantingYear: 2026, lastFrostDate: '2026-05-10', targetPlantingDate: '2026-05-17' },
];

function mountTable(props) {
    return mountWithPlugins(PlantingYearsTable, { props: { plantingYears, onViewClicked: vi.fn(), ...props } });
}

describe('PlantingYearsTable', () => {
    it('is named PlantingsYearsTable', () => {
        expect(PlantingYearsTable.name).toBe('PlantingsYearsTable');
    });

    it('lists each year with its target planting date and last frost date', () => {
        const wrapper = mountTable();

        expect(tableHeaders(wrapper)).toEqual(['Year', 'Target Planting Date', 'Last Frost Date', '']);
        // The last cell holds only the magnifier icon, which has no text
        expect(tableRows(wrapper)).toEqual([
            ['2025', 'May 19', 'May 12', ''],
            ['2026', 'May 17', 'May 10', ''],
        ]);
    });

    // Read as local days, so the first of the month stays the first in New
    // York, where the suite runs
    it('shows the days as sent', () => {
        const wrapper = mountTable({
            plantingYears: [{ plantingYear: 2026, lastFrostDate: '2026-05-01', targetPlantingDate: '2026-06-01' }],
        });

        expect(tableRows(wrapper)[0].slice(1, 3)).toEqual(['Jun 1', 'May 1']);
    });

    it('shows no rows when given no years', () => {
        const wrapper = mountWithPlugins(PlantingYearsTable, { props: { onViewClicked: vi.fn() } });

        expect(tableRows(wrapper)).toEqual([]);
    });

    it("calls onViewClicked with the row's year when its magnifier is clicked", async () => {
        const wrapper = mountTable();

        await wrapper.findAll('tbody tr')[1].find('.mdi-magnify').trigger('click');

        expect(wrapper.props('onViewClicked')).toHaveBeenCalledWith(plantingYears[1]);
    });
});
