import { expectText, expectThat } from './assertions';

/**
 * The breadcrumbs in the toolbar, as Playwright sees them: the banner's
 * list, one item per crumb (the dividers between them are hidden from it).
 * A crumb that leads somewhere is a link; the page's own is plain text, and
 * Vuetify disables the last crumb even when it's a link. The first crumb is
 * the page's section (Garden, Config...), which leads to that section's
 * first page. They're there only once someone is signed on, and not on a
 * phone, where the planting year has the toolbar.
 */
export function createBreadcrumbsDriver(page) {
    const crumbs = page.getByRole('banner').getByRole('list').getByRole('listitem');
    const links = crumbs.getByRole('link');
    const linkTo = name => crumbs.getByRole('link', { name, exact: true });

    return {
        async goTo(crumb) {
            await linkTo(crumb).click();
        },

        async leadsToPage(section, pageTitle) {
            const what = `the breadcrumbs leading from ${section} to ${pageTitle}`;

            await expectText(crumbs, [section, pageTitle], what);
            await expectText(links, [section], what);
        },

        async leadsToPlant({ friendlyName }) {
            const what = `the breadcrumbs leading to the plant ${friendlyName}`;

            await expectText(crumbs, ['Garden', 'Plants', friendlyName], what);
            await expectText(links, ['Garden', 'Plants'], what);
        },

        /**
         * Reads the toolbar once, without retrying: a retrying check would
         * pass while the page is still rendering. Call it after a step that
         * proves the page has settled.
         */
        async areAbsent() {
            const count = await crumbs.count();

            expectThat(count === 0, 'no breadcrumbs', `${count}`, 'checking the breadcrumbs');
        },
    };
}
