import { mountWithPlugins } from '../../../helpers/mount';
import { tableHeaders, tableRows } from '../../../helpers/tables';
import PlanningTable from '@/components/planning/PlanningTable.vue';

// Planning items as GET /planning/:year sends them. plannedActionDay is a day
// of the year; an indoor sowing with no lead time has neither field. Today is
// March 6, 2026, day 65, so day 60 (March 1) was 5 days ago
const TODAY_NUMBER = 65;
const items = [
    { plantingId: 'planting-1', plantingName: 'Early beans', plantId: 'plant-1', plantName: 'Provider bush bean', plannedActionDay: 60, daysUntilAction: -5 },
    { plantingId: 'planting-2', plantingName: 'Sungold', plantId: 'plant-2', plantName: 'Sungold tomato', plannedActionDay: undefined, daysUntilAction: undefined },
];

function mountTable(props = {}) {
    const $router = { push: vi.fn() };
    const wrapper = mountWithPlugins(PlanningTable, {
        props: { items, year: 2026, ...props },
        global: { mocks: { $router } },
    });
    return { wrapper, $router };
}

// The days-until cell of a row with `days` to go, or with no action day
const daysUntil = days => mountTable({
    items: [{ ...items[0], plannedActionDay: days === undefined ? undefined : TODAY_NUMBER + days }],
}).wrapper.find('tbody td:nth-child(4) span');

describe('PlanningTable', () => {
    beforeEach(() => {
        vi.useFakeTimers({ now: new Date('2026-03-06T09:00:00'), toFake: ['Date'] });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('heads the date column with the action', () => {
        expect(tableHeaders(mountTable().wrapper)).toEqual(['Planting Name', 'Plant Name', 'Action Day', 'Days Until', '']);
        expect(tableHeaders(mountTable({ actionDayTitle: 'Sowing Day' }).wrapper)[2]).toBe('Sowing Day');
    });

    it("lists each planting, its action's date in the year, and the days until it", () => {
        const { wrapper } = mountTable();

        expect(tableRows(wrapper)).toEqual([
            ['Early beans', 'Provider bush bean', 'Mar 1', '-5', ''],
            ['Sungold', 'Sungold tomato', '—', '—', ''],
        ]);
    });

    it('counts the days in a leap year', () => {
        const { wrapper } = mountTable({ year: 2028 });

        expect(tableRows(wrapper)[0][2]).toBe('Feb 29');
    });

    // The service's daysUntilAction, -5, counts from today's number in 2026
    it('counts the days until from today, in another year', () => {
        const { wrapper } = mountTable({ year: 2027 });

        expect(tableRows(wrapper)[0].slice(2, 4)).toEqual(['Mar 1', '360']);
    });

    it.each([
        [undefined, 'text-grey'],
        [-5, 'text-error'],
        [0, 'text-error'],
        [7, 'text-warning'],
        [30, 'text-primary'],
        [31, 'text-success'],
    ])('colours %s days until as %s', (days, colour) => {
        expect(daysUntil(days).classes()).toEqual([colour]);
    });

    it("goes to a planting's details from its magnifier", async () => {
        const { wrapper, $router } = mountTable();

        await wrapper.findAll('.mdi-magnify')[1].trigger('click');

        expect($router.push).toHaveBeenCalledWith({ name: 'PlantingDetailsPage', params: { plantingId: 'planting-2' } });
    });

    // The common store's year, which PlanningPage passes, is a number
    it('takes the year as a number, without a warning', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const { wrapper } = mountTable({ year: 2026 });

        expect(warn).not.toHaveBeenCalled();
        expect(tableRows(wrapper)[0][2]).toBe('Mar 1');
        warn.mockRestore();
    });
});
