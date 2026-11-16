import { mountWithPlugins } from '../../../helpers/mount';
import { filedOn } from '../../../helpers/harvests';
import StatsCard from '@/components/harvests/StatsCard.vue';

// A row of GET /harvests/stats?type=Planting: one per planting and harvest type
const plantingRow = {
    plantingId: 'planting-1',
    plantingName: 'Early beans',
    plantId: 'plant-1',
    plantName: 'Provider bush bean',
    plotName: 'North bed',
    harvestTypeId: 2,
    harvestType: 'pounds',
    totalQuantity: 7,
    averageHarvestPerDay: 7 / 3,
    firstHarvest: filedOn('2026-07-02'),
    lastHarvest: filedOn('2026-07-04'),
};

// A row of GET /harvests/stats?type=Plant: one per plant and harvest type
const plantRow = {
    plantId: 'plant-1',
    plantName: 'Provider bush bean',
    harvestTypeId: 3,
    harvestType: 'count',
    totalQuantity: 40,
    averageHarvestPerDay: 4,
    firstHarvest: filedOn('2026-07-02'),
    lastHarvest: filedOn('2026-07-11'),
};

// A planting's, or plant's, rows as HarvestStatsTab groups them: its names,
// and its rows in the columns' order
function groupOf(...rows) {
    const [{ plantingName, plantName, plotName }] = rows;
    return { key: rows[0].plantingId ?? rows[0].plantId, plantingName, plantName, plotName, rows };
}

function mountCard(...rows) {
    return mountWithPlugins(StatsCard, { props: { group: groupOf(...rows) } });
}

const titleLines = wrapper => wrapper.findAll('.v-card-title h3, .v-card-title span').map(line => line.text());
const columnHeaders = wrapper => wrapper.findAll('thead th').map(header => header.text());
// Each row of the body: its heading, then a value per column
const bodyRows = wrapper => wrapper.findAll('tbody tr')
    .map(row => [row.find('th').text(), ...row.findAll('td').map(cell => cell.text())]);

describe('StatsCard', () => {
    it("heads a planting's stats with the planting, its plant and its plot", () => {
        const wrapper = mountCard(plantingRow);

        expect(titleLines(wrapper)).toEqual(['Early beans', 'Provider bush bean', 'North bed']);
    });

    it("heads a plant's stats with the plant", () => {
        const wrapper = mountCard(plantRow);

        expect(titleLines(wrapper)).toEqual(['Provider bush bean']);
    });

    it('names the type over its column, even with only one', () => {
        const wrapper = mountCard(plantRow);

        expect(columnHeaders(wrapper)).toEqual(['', 'count']);
    });

    it('lists the first and last harvest, the total, and the average a day, in the type', () => {
        const wrapper = mountCard(plantRow);

        expect(bodyRows(wrapper)).toEqual([
            ['First Harvest', 'Thu Jul 02 2026'],
            ['Last Harvest', 'Sat Jul 11 2026'],
            ['Total Harvested', '40 count'],
            ['Average Harvest per Day', '4 count'],
        ]);
    });

    // They were a card each
    it('shows each harvest type as a column, in the order given', () => {
        const pounds = { ...plantRow, harvestTypeId: 2, harvestType: 'pounds', totalQuantity: 5, averageHarvestPerDay: 2.5,
            firstHarvest: filedOn('2026-07-03'), lastHarvest: filedOn('2026-07-04') };
        const wrapper = mountCard(plantRow, pounds);

        expect(wrapper.findAll('.v-card')).toHaveLength(1);
        expect(columnHeaders(wrapper)).toEqual(['', 'count', 'pounds']);
        expect(bodyRows(wrapper)).toEqual([
            ['First Harvest', 'Thu Jul 02 2026', 'Fri Jul 03 2026'],
            ['Last Harvest', 'Sat Jul 11 2026', 'Sat Jul 04 2026'],
            ['Total Harvested', '40 count', '5 pounds'],
            ['Average Harvest per Day', '4 count', '2.5 pounds'],
        ]);
    });

    it('names the unspecified column, and shows its quantities bare', () => {
        const wrapper = mountCard({ ...plantRow, harvestTypeId: 1, harvestType: 'unspecified' });

        expect(columnHeaders(wrapper)).toEqual(['', 'unspecified']);
        expect(bodyRows(wrapper).slice(2)).toEqual([['Total Harvested', '40'], ['Average Harvest per Day', '4']]);
    });

    // The service divides without rounding, and the card showed the average
    // so: 2.3333333333333335 pounds (backlog B31)
    it('shows the average to a tenth', () => {
        const wrapper = mountCard(plantingRow);

        expect(bodyRows(wrapper)[3]).toEqual(['Average Harvest per Day', '2.3 pounds']);
    });

    it.each([[2.25, '2.3'], [0.04, '0'], [12, '12']])('rounds an average of %d to %s', (average, shown) => {
        const wrapper = mountCard({ ...plantRow, averageHarvestPerDay: average, harvestType: 'unspecified' });

        expect(bodyRows(wrapper)[3]).toEqual(['Average Harvest per Day', shown]);
    });

    it('shows --- for a missing date', () => {
        const wrapper = mountCard({ ...plantRow, firstHarvest: null, lastHarvest: undefined });

        expect(bodyRows(wrapper).slice(0, 2)).toEqual([['First Harvest', '---'], ['Last Harvest', '---']]);
    });

    // The service sends a harvest day as YYYY-MM-DD, and the card reads it
    // as that local day: not UTC midnight, which is the evening before in
    // New York (backlog A28)
    it('shows each harvest date on the day filed', () => {
        const wrapper = mountCard(plantingRow);

        expect(bodyRows(wrapper).slice(0, 2)).toEqual([['First Harvest', 'Thu Jul 02 2026'], ['Last Harvest', 'Sat Jul 04 2026']]);
    });
});
