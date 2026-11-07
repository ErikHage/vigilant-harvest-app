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
