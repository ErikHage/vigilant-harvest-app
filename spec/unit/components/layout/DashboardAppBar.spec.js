import { flushPromises } from '@vue/test-utils';
import { DOMWrapper } from '@vue/test-utils';
import DashboardAppBar from '@/components/layout/DashboardAppBar.vue';
import { mountInLayout } from '../../../helpers/layout';
import { buttonLabelled } from '../../../helpers/fields';
import { linkRouter } from '../../../helpers/routers';
import { onADesktop, onAPhone } from '../../../helpers/display';

function mountDashboardAppBar(isPlantingYearSelected) {
    return mountInLayout(DashboardAppBar, {
        props: { isPlantingYearSelected },
        attachTo: document.body,
        global: { plugins: [linkRouter()] },
    });
}

// The text and path of each link in the bar itself
function barLinks(wrapper) {
    return wrapper.findAll('.v-app-bar a[href]').map(link => [link.text(), link.attributes('href')]);
}

// The text and path of each link in the open menu
function menuLinks() {
    const menu = new DOMWrapper(document.querySelector('.v-overlay--active .v-list'));
    return menu.findAll('a[href]').map(link => [link.text(), link.attributes('href')]);
}

const desktopLinks = [
    ['Planning', '/dashboard/planning'],
    ['Garden', '/dashboard/garden'],
    ['Plants', '/dashboard/plants'],
    ['Plots', '/dashboard/plots'],
    ['Years', '/dashboard/planting-years'],
    ['Plantings', '/dashboard/plantings'],
    ['Harvests', '/dashboard/harvests'],
    ['Stats', '/dashboard/stats'],
];

const phoneLinks = [
    ['Planning', '/dashboard/planning'],
    ['Garden', '/dashboard/garden'],
    ['Years', '/dashboard/planting-years'],
    ['Plants', '/dashboard/plants'],
    ['Plots', '/dashboard/plots'],
    ['Plantings', '/dashboard/plantings'],
    ['Harvests', '/dashboard/harvests'],
    ['Stats', '/dashboard/stats'],
    ['Categories', '/dashboard/categories'],
    ['Activity Schedules', '/dashboard/activity-schedules'],
];

describe('DashboardAppBar', () => {
    afterEach(() => {
        onADesktop();
    });

    describe('on a desktop', () => {
        it('links to each page, with a menu for the admin pages', () => {
            const wrapper = mountDashboardAppBar(true);

            expect(barLinks(wrapper)).toEqual(desktopLinks);
            expect(buttonLabelled(wrapper, 'Admin').exists()).toBe(true);
        });

        it('opens the admin menu', async () => {
            const wrapper = mountDashboardAppBar(true);

            await buttonLabelled(wrapper, 'Admin').trigger('click');
            await flushPromises();

            expect(menuLinks()).toEqual([
                ['Categories', '/dashboard/categories'],
                ['Activity Schedules', '/dashboard/activity-schedules'],
            ]);
        });

        // Planning, Garden, Plantings, Harvests and Stats need one (backlog A11)
        it('hides the year-specific pages with no planting year selected', () => {
            const wrapper = mountDashboardAppBar(false);

            expect(barLinks(wrapper)).toEqual([
                ['Plants', '/dashboard/plants'],
                ['Plots', '/dashboard/plots'],
                ['Years', '/dashboard/planting-years'],
            ]);
            expect(wrapper.findAll('.v-btn').map(button => button.text())).not.toContain('Stats');
            expect(buttonLabelled(wrapper, 'Admin').exists()).toBe(true);
        });
    });

    describe('on a phone', () => {
        beforeEach(() => {
            onAPhone();
        });

        it('puts every page in one menu', async () => {
            const wrapper = mountDashboardAppBar(true);

            expect(barLinks(wrapper)).toEqual([]);
            await wrapper.find('.v-app-bar .v-btn').trigger('click');
            await flushPromises();

            expect(menuLinks()).toEqual(phoneLinks);
        });

        // As on a desktop (backlog A11)
        it('leaves out the year-specific pages with no planting year selected', async () => {
            const wrapper = mountDashboardAppBar(false);

            await wrapper.find('.v-app-bar .v-btn').trigger('click');
            await flushPromises();

            expect(menuLinks()).toEqual([
                ['Years', '/dashboard/planting-years'],
                ['Plants', '/dashboard/plants'],
                ['Plots', '/dashboard/plots'],
                ['Categories', '/dashboard/categories'],
                ['Activity Schedules', '/dashboard/activity-schedules'],
            ]);
        });
    });
});
