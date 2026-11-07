import { mountWithPlugins } from '../../../helpers/mount';
import PageTitle from '@/components/layout/PageTitle.vue';

describe('PageTitle', () => {
    it('shows the title', () => {
        const wrapper = mountWithPlugins(PageTitle, { props: { title: 'Plants' } });

        expect(wrapper.find('.page-title').text()).toBe('Plants');
    });
});
