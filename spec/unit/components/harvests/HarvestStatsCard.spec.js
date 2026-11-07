import { mountWithPlugins } from '../../../helpers/mount';
import { fieldRows } from '../../../helpers/details-tables';
import { filedOn } from '../../../helpers/harvests';
import HarvestStatsCard from '@/components/harvests/HarvestStatsCard.vue';

// The year's totals, from GET /harvests/stats. numberOfHarvests counts the
// days with a harvest; numberOfDays spans the first to the last
const harvestStats = {
    firstHarvestDate: filedOn('2026-07-02'),
    lastHarvestDate: filedOn('2026-07-11'),
    numberOfHarvests: 6,
    numberOfDays: 10,
    statsType: 'Planting',
    stats: [],
};

function mountCard(stats) {
    return mountWithPlugins(HarvestStatsCard, { props: { harvestStats: stats } });
}

describe('HarvestStatsCard', () => {
    it('lists the number of days, and of harvest days', () => {
        const wrapper = mountCard(harvestStats);

        expect(fieldRows(wrapper).slice(2)).toEqual([['Number of Days', '10'], ['Number of Harvest Days', '6']]);
    });

    // The stats pages give it the store's empty stats until they load
    it('shows --- for the dates, and nothing else, with no stats', () => {
        const wrapper = mountCard({});

        expect(fieldRows(wrapper)).toEqual([
            ['First Harvest', '---'],
            ['Last Harvest', '---'],
            ['Number of Days', ''],
            ['Number of Harvest Days', ''],
        ]);
    });

    // DocumentsCurrentBehavior: the service sends a harvest day as its UTC
    // midnight, and the card shows it in local time, so west of Greenwich
    // each date is the day before (backlog A28). Should show the UTC day
    it('shows the first and last harvest a day early in New York', () => {
        const wrapper = mountCard(harvestStats);

        expect(fieldRows(wrapper).slice(0, 2)).toEqual([['First Harvest', 'Wed Jul 01 2026'], ['Last Harvest', 'Fri Jul 10 2026']]);
    });
});
