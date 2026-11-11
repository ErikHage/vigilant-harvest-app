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

    // The service sends a harvest day as YYYY-MM-DD, and the card reads it
    // as that local day: not UTC midnight, which is the evening before in
    // New York (backlog A28)
    it('shows the first and last harvest on the days filed', () => {
        const wrapper = mountCard(harvestStats);

        expect(fieldRows(wrapper).slice(0, 2)).toEqual([['First Harvest', 'Thu Jul 02 2026'], ['Last Harvest', 'Sat Jul 11 2026']]);
    });
});
