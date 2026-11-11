import { VChip } from 'vuetify/components';
import { mountWithPlugins } from '../../../helpers/mount';
import { aPlanting } from '../../../helpers/plantings';
import PlantingHistoryTab from '@/components/plantings/PlantingHistoryTab.vue';

function mountTab(history = aPlanting().statusHistory) {
    return mountWithPlugins(PlantingHistoryTab, { props: { history } });
}

// Each card's date, status chip (if any) and comment
function cards(wrapper) {
    return wrapper.findAll('.v-card').map(card => [
        card.find('p.mr-4').text(),
        card.find('.v-chip').exists() ? card.find('.v-chip').text() : null,
        card.find('p.multiline').exists() ? card.find('p.multiline').text() : null,
    ]);
}

describe('PlantingHistoryTab', () => {
    it('shows a card per entry, in the order given, with its date, status and comment', () => {
        const wrapper = mountTab();

        expect(cards(wrapper)).toEqual([
            [new Date('2026-05-18T13:30:00Z').toLocaleDateString(), 'PLANTED', 'Into the north bed'],
            [new Date('2026-03-01T18:00:00Z').toLocaleDateString(), 'CREATED', null],
            [new Date('2026-04-20T12:00:00Z').toLocaleDateString(), 'STARTED', 'Heat mat'],
            [new Date('2026-06-01T22:00:00Z').toLocaleDateString(), null, 'First beans\nin a week'],
        ]);
    });

    it('colours each status chip', () => {
        const wrapper = mountTab();

        expect(wrapper.findAllComponents(VChip).map(chip => chip.props('color'))).toEqual(['success', 'info', 'secondary']);
    });

    it('shows nothing with no history', () => {
        expect(mountTab([]).findAll('.v-card')).toHaveLength(0);
    });
});
