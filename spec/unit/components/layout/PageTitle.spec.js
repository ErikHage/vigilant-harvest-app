import { h } from 'vue';
import { mountWithPlugins } from '../../../helpers/mount';
import PageTitle from '@/components/layout/PageTitle.vue';

describe('PageTitle', () => {
    it('shows the title', () => {
        const wrapper = mountWithPlugins(PageTitle, { props: { title: 'Plants' } });

        expect(wrapper.find('.page-title').text()).toBe('Plants');
    });

    it('shows a page\'s actions after the title', () => {
        const wrapper = mountWithPlugins(PageTitle, {
            props: { title: 'Garden Overview' },
            slots: { actions: () => [h('button', 'Add Harvests'), h('button', 'Show Retired')] },
        });

        const actions = wrapper.find('.page-actions');
        expect(actions.findAll('button').map(button => button.text())).toEqual(['Add Harvests', 'Show Retired']);
        const title = wrapper.find('.page-title').element;
        expect(title.compareDocumentPosition(actions.element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('has no actions area without actions', () => {
        const wrapper = mountWithPlugins(PageTitle, { props: { title: 'Plants' } });

        expect(wrapper.find('.page-actions').exists()).toBe(false);
    });
});
