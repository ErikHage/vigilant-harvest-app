import { VAlert } from 'vuetify/components';
import { mountWithPlugins } from '../../../helpers/mount';
import FadeOutAlert from '@/components/utils/FadeOutAlert.vue';

describe('FadeOutAlert', () => {
    it('shows nothing by default', () => {
        const wrapper = mountWithPlugins(FadeOutAlert, { props: { alertType: 'error', message: 'error fetching plots' } });

        expect(wrapper.find('.v-alert').exists()).toBe(false);
    });

    it('shows the message as an alert of its type when visible', () => {
        const wrapper = mountWithPlugins(FadeOutAlert, {
            props: { isVisible: true, alertType: 'error', message: 'error fetching plots' },
        });

        expect(wrapper.find('.v-alert').text()).toBe('error fetching plots');
        expect(wrapper.findComponent(VAlert).props('type')).toBe('error');
    });

    it('hides when it stops being visible', async () => {
        const wrapper = mountWithPlugins(FadeOutAlert, {
            props: { isVisible: true, alertType: 'success', message: 'saved' },
        });

        await wrapper.setProps({ isVisible: false });

        expect(wrapper.find('.v-alert').exists()).toBe(false);
    });
});
