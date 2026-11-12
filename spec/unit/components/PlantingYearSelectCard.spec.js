import { VSelect } from 'vuetify/components';
import { mountWithPlugins } from '../../helpers/mount';
import { buttonLabelled } from '../../helpers/fields';
import PlantingYearSelectCard from '@/components/PlantingYearSelectCard.vue';

// The years arrive as numbers (the common store's availableYears)
function mountCard(props) {
    return mountWithPlugins(PlantingYearSelectCard, {
        props: {
            availableYears: [2025, 2026],
            onSelectYearChange: vi.fn(),
            selectedYear: 2026,
            ...props,
        },
    });
}

describe('PlantingYearSelectCard', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('shows the selected year', () => {
        const wrapper = mountCard();

        expect(wrapper.text()).toContain('Currently Selected: 2026');
    });

    it('hides the selected year when there is none', () => {
        const wrapper = mountCard({ selectedYear: null });

        expect(wrapper.text()).not.toContain('Currently Selected');
    });

    it('offers the available years', () => {
        const wrapper = mountCard();

        expect(wrapper.findComponent(VSelect).props('items')).toEqual([2025, 2026]);
        expect(wrapper.findComponent(VSelect).props('label')).toBe('Select Planting Year');
    });

    it('disables Set until another year is chosen', async () => {
        const wrapper = mountCard();
        expect(buttonLabelled(wrapper, 'Set').attributes('disabled')).toBeDefined();

        await wrapper.findComponent(VSelect).setValue(2025);

        expect(buttonLabelled(wrapper, 'Set').attributes('disabled')).toBeUndefined();
    });

    it('selects the chosen year on Set', async () => {
        const wrapper = mountCard();

        await wrapper.findComponent(VSelect).setValue(2025);
        await buttonLabelled(wrapper, 'Set').trigger('click');

        expect(wrapper.props('onSelectYearChange')).toHaveBeenCalledWith(2025);
    });

    // Years compare as numbers, however they arrive
    it('keeps Set disabled for the same year, given as a string', async () => {
        const wrapper = mountCard({ selectedYear: 2026 });

        await wrapper.findComponent(VSelect).setValue('2026');

        expect(buttonLabelled(wrapper, 'Set').attributes('disabled')).toBeDefined();
    });

    it('flashes green for half a second when the selected year changes', async () => {
        vi.useFakeTimers();
        const wrapper = mountCard();

        await wrapper.setProps({ selectedYear: 2025 });
        expect(wrapper.find('.flash-green').exists()).toBe(true);

        await vi.advanceTimersByTimeAsync(500);
        expect(wrapper.find('.flash-green').exists()).toBe(false);
    });

    // A cleared year would bring back the requests with no year, so the card
    // offers none; its unused onSelectYearClear prop is gone (backlog B12)
    it('has no way to clear the year', () => {
        const wrapper = mountCard();

        expect(wrapper.findAll('.v-btn').map(button => button.text())).toEqual(['Set']);
        expect(wrapper.findComponent(VSelect).props('clearable')).toBe(false);
    });
});
