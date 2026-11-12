import { mountWithPlugins } from '../../../helpers/mount';
import { tableHeaders, tableRows } from '../../../helpers/tables';
import { aPlant } from '../../../helpers/plants';
import PlantSchedulesTab from '@/components/plants/PlantSchedulesTab.vue';

describe('PlantSchedulesTab', () => {
    it("lists the plant's activity schedules", () => {
        const plant = aPlant({
            activitySchedules: [
                { activityScheduleId: 'schedule-1', name: 'Beans', description: 'Feed every two weeks' },
                { activityScheduleId: 'schedule-2', name: 'Pest watch', description: 'Neem weekly' },
            ],
        });

        const wrapper = mountWithPlugins(PlantSchedulesTab, { props: { plant } });

        expect(tableHeaders(wrapper)).toEqual(['Schedule', 'Description']);
        expect(tableRows(wrapper)).toEqual([
            ['Beans', 'Feed every two weeks'],
            ['Pest watch', 'Neem weekly'],
        ]);
    });

    // It showed only the headers (backlog B22)
    it('says so for a plant with no schedules', () => {
        const wrapper = mountWithPlugins(PlantSchedulesTab, { props: { plant: aPlant({ activitySchedules: [] }) } });

        expect(tableRows(wrapper)).toEqual([['No schedules']]);
    });

    it('says so for a plant whose schedules are missing', () => {
        const wrapper = mountWithPlugins(PlantSchedulesTab, { props: { plant: aPlant({ activitySchedules: undefined }) } });

        expect(tableRows(wrapper)).toEqual([['No schedules']]);
    });
});
