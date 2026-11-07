import { mountWithPlugins } from '../../../helpers/mount';
import { fieldRows } from '../../../helpers/details-tables';
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

function mountCard(stats) {
    return mountWithPlugins(StatsCard, { props: { stats } });
}

const titleLines = wrapper => wrapper.findAll('.v-card-title h3, .v-card-title span').map(line => line.text());

describe('StatsCard', () => {
    it("heads a planting's stats with the planting, its plant and plot, and the type", () => {
        const wrapper = mountCard(plantingRow);

        expect(titleLines(wrapper)).toEqual(['Early beans', 'Provider bush bean', 'North bed', 'pounds']);
    });

    it("heads a plant's stats with the plant and the type", () => {
        const wrapper = mountCard(plantRow);

        expect(titleLines(wrapper)).toEqual(['Provider bush bean', 'count']);
    });

    it('names no type for unspecified harvests, and shows bare quantities', () => {
        const wrapper = mountCard({ ...plantRow, harvestTypeId: 1, harvestType: 'unspecified' });

        expect(titleLines(wrapper)).toEqual(['Provider bush bean']);
        expect(fieldRows(wrapper).slice(2)).toEqual([['Total Harvested', '40'], ['Average Harvest per Day', '4']]);
    });

    it('lists the first and last harvest, the total, and the average a day, in the type', () => {
        const wrapper = mountCard(plantRow);

        expect(fieldRows(wrapper).map(([header]) => header))
            .toEqual(['First Harvest', 'Last Harvest', 'Total Harvested', 'Average Harvest per Day']);
        expect(fieldRows(wrapper).slice(2)).toEqual([['Total Harvested', '40 count'], ['Average Harvest per Day', '4 count']]);
    });

    // The service divides without rounding
    it('shows the average as it comes, unrounded', () => {
        const wrapper = mountCard(plantingRow);

        expect(fieldRows(wrapper)[3]).toEqual(['Average Harvest per Day', '2.3333333333333335 pounds']);
    });

    it('shows --- for a missing date', () => {
        const wrapper = mountCard({ ...plantRow, firstHarvest: null, lastHarvest: undefined });

        expect(fieldRows(wrapper).slice(0, 2)).toEqual([['First Harvest', '---'], ['Last Harvest', '---']]);
    });

    // DocumentsCurrentBehavior: the service sends a harvest day as its UTC
    // midnight, and the card shows it in local time, so west of Greenwich
    // each date is the day before: July 2 shows as July 1 in New York
    // (backlog A28). Should show the UTC day
    it('shows each harvest date a day early in New York', () => {
        const wrapper = mountCard(plantingRow);

        expect(fieldRows(wrapper).slice(0, 2)).toEqual([['First Harvest', 'Wed Jul 01 2026'], ['Last Harvest', 'Fri Jul 03 2026']]);
    });
});
