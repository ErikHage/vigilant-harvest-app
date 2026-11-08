import { group, optional, required } from '@feral-auth/ts-simple-dsl';

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

/** A planting the test named, by its alias. */
export const planting = () => required();

/** How far an arranged planting has got: `created` (the default), `started` or `planted`. */
export const arrangedStatus = () => optional().allowedValues('created', 'started', 'planted').withDefault('created');

/** A day: `MM-DD` for the browser's clock in a named year, `YYYY-MM-DD` for an entry or a harvest. */
export const on = () => required();

/** A plot the test named, by its alias, or none if left out. */
export const optionalPlot = () => optional();

/** A journal or activity-log entry the test named, by its alias. */
export const entry = () => required();

/** Entries the test named, by alias, repeated or comma-separated. */
export const entries = () => optional().multiple({ separator: ', ' });

/** A harvest's quantity, a whole number. */
export const quantity = () => required().asInteger();

/** A day of the month, as the date picker shows it. */
export const day = () => required().asInteger();

/** Plantings the test named, by alias, repeated or comma-separated; none if left out. */
export const plantings = () => optional().multiple({ separator: ', ' });

/** How many of a year's plantings have a status; 0 if left out. */
export const tally = () => optional().asInteger().withDefault(0);

/** A planting's status, as the page shows it. */
export const status = () => required().allowedValues('CREATED', 'STARTED', 'PLANTED', 'RETIRED');

/** A count of seeds or seedlings, a whole number. */
export const count = () => required().asInteger();

/** The planting actions offered, by their buttons' names, comma-separated, in order. */
export const actions = () => optional().multiple({ separator: ', ' });

/** A split of a planting: its alias, then `count`, the seedlings it takes. Repeats. */
export const splitInto = () => group({ split: required(), count: count() }).identifiedBy('split');

/** A moment, as ISO 8601 with its offset: `2026-07-01T23:30:00-04:00`. */
export const time = () => required();

/** What an alert says, word for word. */
export const message = () => required();

/** Whether an arranged planting year is a leap year; either if left out. */
export const leap = () => optional().allowedValues('yes', 'no');

/** Days as a timeline lists them, `YYYY-MM-DD`, comma-separated, in order, with `...` where it marks a gap. */
export const days = () => optional().multiple({ separator: ', ' });

/** An activity schedule's item the test named, by its alias. */
export const item = () => required();

/** A schedule item's interval as typed: any whole number, below 1 included. */
export const interval = () => required().asInteger();

/** What a filter is given: `name`, the schedule's name, or `both`, the end of its name and the start of its description. */
export const scheduleFilter = () => optional().allowedValues('name', 'both').withDefault('name');

/** An average as the page writes it, word for word: `2.3333333333333335`. */
export const average = () => required();
