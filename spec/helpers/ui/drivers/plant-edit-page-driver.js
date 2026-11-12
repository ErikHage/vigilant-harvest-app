import { expectDisabled, expectEnabled, expectHidden, expectText, expectUrl, expectValue, expectVisible } from './assertions';
import { chooseOption } from './select';
import { escaped, urlOf } from './urls';

const editPageUrl = new RegExp(`^${escaped(urlOf('dashboard/plants/'))}[0-9a-f-]{36}/edit$`);

/** A plant's edit page, and its dialogs, as Playwright sees them. */
export function createPlantEditPageDriver(page) {
    const main = page.getByRole('main');
    const dialog = page.getByRole('dialog');
    const field = name => main.getByRole('textbox', { name, exact: true });
    const card = title => main.locator('.v-card').filter({
        has: page.locator('.v-card-title', { hasText: new RegExp(`^${title}`) }),
    });
    // A select's chosen option is shown beside its input, not in it
    const chosenIn = name => main.getByRole('combobox', { name, exact: true }).locator('xpath=..')
        .locator('.v-select__selection-text');
    const update = main.getByRole('button', { name: 'Update' });
    const reset = main.getByRole('button', { name: 'Reset' });
    const snackbar = page.getByText('Updated successfully!', { exact: true });

    // Each dialog opens from a pencil with no name, just after its label: the
    // tags, the description, and each section's notes
    const pencilAfter = label => main.locator('label', { hasText: new RegExp(`^${label}$`) })
        .locator('xpath=following-sibling::button[1]');
    // The plant's tags, as chips under the Tags label, in the Details card
    const tagChips = card('Details').locator('.v-chip');
    // The description is shown under its label in the first card, as the first
    // of the page's formatted paragraphs
    const description = main.locator('p.respect-formatting').first();

    return {
        /** On the edit page, titled with the plant's name, its form filled in from the service. */
        async isShownFor({ friendlyName }) {
            const what = `showing the edit page of the plant ${friendlyName}`;

            await expectUrl(page, editPageUrl, what);
            await expectText(main.locator('.page-title'), friendlyName, what);
            await expectValue(field('Name'), friendlyName, what);
        },

        /** The form holds the plant's name, category, subcategory, tags, description and taxonomy. */
        async showsPlant(plant) {
            const what = `the edit page's form, for the plant ${plant.friendlyName}`;

            await expectValue(field('Name'), plant.friendlyName, what);
            await expectText(chosenIn('Category'), plant.categoryName, what);
            await expectText(chosenIn('Subcategory'), plant.subcategoryName, what);
            await expectText(chosenIn('Lifespan Type'), plant.lifespanType, what);
            await expectText(tagChips, plant.tags, what);
            await expectText(description, plant.description, what);
            await expectValue(field('Family'), plant.taxonomy.family ?? '', what);
            await expectValue(field('Genus'), plant.taxonomy.genus ?? '', what);
            await expectValue(field('Species'), plant.taxonomy.species ?? '', what);
        },

        /** Update and Reset are both offered, or neither. */
        async updateOffered(offered) {
            const what = 'the edit page, offering to save';

            await (offered ? expectEnabled : expectDisabled)(update, what);
            await (offered ? expectEnabled : expectDisabled)(reset, what);
        },

        /** Types the plant's new name and family, and its new description through its dialog. */
        async edit({ friendlyName, taxonomy, description }) {
            await field('Name').fill(friendlyName);
            await field('Family').fill(taxonomy.family);
            await pencilAfter('Description').click();
            await expectVisible(dialog.getByText('describe the plant', { exact: true }), 'opening the description');
            await dialog.getByRole('textbox').fill(description);
            await dialog.getByRole('button', { name: 'Confirm' }).click();
            await expectHidden(dialog, 'confirming the description');
        },

        async reload() {
            await page.reload();
        },

        async typeName(name) {
            await field('Name').fill(name);
        },

        /** Clicks Update, and waits for the page to say it saved. */
        async update() {
            await update.click();
            await expectVisible(snackbar, 'updating the plant');
        },

        async reset() {
            await reset.click();
        },

        /** Toggles `tag` in the tags dialog, then confirms. */
        async toggleTag(tag) {
            const what = `toggling the tag ${tag}`;

            await pencilAfter('Tags').click();
            await expectVisible(dialog.getByText('Plant Tags', { exact: true }), what);
            // The chips have no role, and show their state only by a class
            await dialog.locator('.v-chip', { hasText: new RegExp(`^\\s*${escaped(tag)}\\s*$`) }).click();
            await dialog.getByRole('button', { name: 'Confirm' }).click();
            await expectHidden(dialog, what);
        },

        /** The Tags under Details show these, in order. */
        async showsTags(tags) {
            await expectText(tagChips, tags, 'the plant\'s tags on the edit page');
        },

        /**
         * After `tag` was toggled on, the form shows all the plant's tags, then
         * `tag`. Those the dialog didn't offer were once dropped (backlog A18).
         */
        async keepsOwnTagsWith(plant, tag) {
            await expectText(tagChips, [...plant.tags, tag], `the tags of ${plant.friendlyName}, after toggling ${tag}`);
        },

        /** The Name field still holds `name`, typed and not saved. */
        async unsavedNameKept(name) {
            await expectValue(field('Name'), name, 'the Name field, after the schedules were saved');
        },

        /** Adds the schedule in the Manage Schedules dialog, saves, and waits for it to close. */
        async assignSchedule({ name }) {
            const what = `assigning the schedule ${name}`;

            await card('Schedules').getByRole('button').click();
            await expectVisible(dialog.getByText('Manage Schedules', { exact: true }), what);
            await chooseOption(page, dialog.getByRole('combobox', { name: 'Select schedule' }), name);
            await dialog.getByRole('button', { name: 'Add' }).click();
            await dialog.getByRole('button', { name: 'Save' }).click();
            await expectHidden(dialog, what);
        },

        /** The Schedules card lists these schedules, by name, in order, and no others. */
        async listsSchedules(names) {
            await expectText(card('Schedules').getByRole('heading'), names, 'the schedules on the edit page');
        },

    };
}
