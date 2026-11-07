import { expectThat } from './assertions';
import { asGardener } from '../support/sessions';
import { insertPlantingYear, upsertPlot } from '../support/service-client';
import { status } from '../support/status-codes';

const describe = reply => reply.error ?? `${reply.status} ${JSON.stringify(reply.body)}`;

/**
 * Arranges, through the service's API, what a test needs but isn't about,
 * as the gardener. Each method asserts its call succeeded, so a test can't
 * go on over a garden that isn't as it says.
 */
export function createGardenDriver() {
    return {
        async createPlot(plot) {
            const what = `arranging the plot ${plot.friendlyName}`;

            const reply = await asGardener(token => upsertPlot(token, plot));
            expectThat(reply.error === undefined && reply.status === status.created, 'the service to create it (201)',
                describe(reply), what);
        },

        async createPlantingYear(year) {
            const what = `arranging the planting year ${year.plantingYear}`;

            const reply = await asGardener(token => insertPlantingYear(token, year));
            expectThat(reply.error === undefined && reply.status === status.created, 'the service to create it (201)',
                describe(reply), what);
        },
    };
}
