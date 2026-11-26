import { parseDslArgs, required } from '@feral-auth/ts-simple-dsl';

import { plant } from '../params';

// The drawer's section headings, which head the trail
const section = () => required().allowedValues('Planning', 'Garden', 'Recordkeeping', 'Config');

// The crumbs a step can follow: a section, or the list a page is under
const crumb = () => required().allowedValues('Planning', 'Garden', 'Recordkeeping', 'Config',
    'Plants', 'Plantings', 'Years', 'Activity Schedules');

/**
 * The breadcrumbs in the toolbar, in words. Every page object exposes them
 * as `breadcrumbs`. Where a step leads is checked by the destination page.
 */
export function createBreadcrumbs(world, driver) {
    return {
        /** Follows the `crumb` named: a section, to its first page, or a list, back to it. */
        async goTo(...args) {
            const params = parseDslArgs(args, { crumb: crumb() });

            await driver.goTo(params.crumb);
        },

        /**
         * `section`, `page`: the trail reads the section, as a link, then the
         * page by its name in the drawer.
         */
        async checkLeadsToPage(...args) {
            const params = parseDslArgs(args, { section: section(), page: required() });

            await driver.leadsToPage(params.section, params.page);
        },

        /** `plant`: the trail reads Garden and Plants, as links, then the plant. */
        async checkLeadsToPlant(...args) {
            const params = parseDslArgs(args, { plant: plant() });

            await driver.leadsToPlant(world.plantNamed(params.plant));
        },

        /**
         * There are no breadcrumbs, as on a phone. Check where the browser is
         * first, so the page has settled. No parameters.
         */
        async checkAreAbsent(...args) {
            parseDslArgs(args, {});

            await driver.areAbsent();
        },
    };
}
