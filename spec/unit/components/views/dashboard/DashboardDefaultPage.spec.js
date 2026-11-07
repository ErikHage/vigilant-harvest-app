import { createTestingPinia } from '@pinia/testing';
import { VSelect } from 'vuetify/components';
import DashboardDefaultPage from '@/components/views/dashboard/DashboardDefaultPage.vue';
import PlantingYearSelectCard from '@/components/PlantingYearSelectCard.vue';
import { useCommonStore } from '@/store';
import { mountWithPlugins } from '../../../../helpers/mount';
import { buttonLabelled } from '../../../../helpers/fields';

function mountPage() {
    const pinia = createTestingPinia({
        initialState: { common: { availableYears: ['2025', '2026'], plantingYear: '2026' } },
    });
    const wrapper = mountWithPlugins(DashboardDefaultPage, { global: { plugins: [pinia] } });
    return { wrapper, store: useCommonStore(pinia) };
}

describe('DashboardDefaultPage', () => {
    it('welcomes the user', () => {
        const { wrapper } = mountPage();

        expect(wrapper.find('.headline').text()).toBe('Dashboard');
        expect(wrapper.text()).toContain('You are logged in to the Vigilant Harvest Garden Tracker!');
    });

    it("gives the year card the store's years and selected year", () => {
        const { wrapper } = mountPage();

        const card = wrapper.findComponent(PlantingYearSelectCard);
        expect(card.props('availableYears')).toEqual(['2025', '2026']);
        expect(card.props('selectedYear')).toBe('2026');
    });

    it('selects the year chosen on the card', async () => {
        const { wrapper, store } = mountPage();

        await wrapper.findComponent(VSelect).setValue('2025');
        await buttonLabelled(wrapper, 'Set').trigger('click');

        expect(store.selectPlantingYear).toHaveBeenCalledWith('2025');
    });

    it('would clear the year, if the card offered a way to', async () => {
        const { wrapper, store } = mountPage();

        await wrapper.findComponent(PlantingYearSelectCard).props('onSelectYearClear')();

        expect(store.clearPlantingYear).toHaveBeenCalledTimes(1);
    });
});
