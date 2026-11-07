import { optional, required } from '@feral-auth/ts-simple-dsl';

import { dashboardDestinations } from './drivers/dashboard-nav-driver';

/**
 * Parameter declarations shared across the page and component objects, so
 * every one asks the same question with the same word.
 */

/** Who signs on: the reserved `gardener`, from .env.ui. */
export const user = () => required();

/** A plot the test named, by its alias. */
export const plot = () => required();

/** A single sign-on token feral never issued. The only kind a spec can name. */
export const token = () => required().allowedValues('made-up');

/** Whether something is active, as the page shows it. */
export const active = () => optional().allowedValues('yes', 'no').withDefault('yes');

/** A path in the app, under its base, without a leading slash: `dashboard/plots`. */
export const path = () => required();

/** A planting year the test named, by its alias. */
export const year = () => required();

/** A dashboard page, as the menu leads to it: `plants`, `plantStats`, `activitySchedules`, ... */
export const destination = () => required().allowedValues(...dashboardDestinations);

/** A plant the test named, by its alias. */
export const plant = () => required();

/** A plant category the test named, by its alias. */
export const category = () => required();

/** A plant subcategory the test named, by its alias. */
export const subcategory = () => required();

/** An activity schedule the test named, by its alias. */
export const schedule = () => required();

/** Schedules the test named, by alias, repeated or comma-separated; none if left out. */
export const schedules = () => optional().multiple({ separator: ', ' });

/** A plant's tags as the page shows them, comma-separated: `Cold Tolerant, Heirloom`; none if left out. */
export const tags = () => optional().multiple({ separator: ', ' });

/** A tag as the tags dialog offers it. */
export const tag = () => required().allowedValues('Container Friendly', 'Cold Tolerant', 'Determinate', 'Indeterminate');

/** Whether something is offered, as an enabled button. */
export const offered = () => optional().allowedValues('yes', 'no').withDefault('yes');

/** What a name is typed as: `spaces`, a name of spaces only. */
export const name = () => required().allowedValues('spaces');

/** What a search or filter is given: the plant's own name, or its category's or subcategory's. */
export const by = () => optional().allowedValues('name', 'category', 'subcategory').withDefault('name');

/** What the categories filter is given: the category's own name, or a subcategory's. */
export const filterBy = () => optional().allowedValues('name', 'subcategory').withDefault('name');

/** Subcategories the test named, by alias, repeated or comma-separated; none if left out. */
export const subcategories = () => optional().multiple({ separator: ', ' });

/** What an alert says, word for word. */
export const message = () => required();
