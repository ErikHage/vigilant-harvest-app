# UI tests

Playwright tests that drive the app in a real browser, against a running app, vigilant-harvest-service and feral-authentication-service. Specs read as prose: they call page objects with `"name: value"` strings, and drivers underneath own every locator and assertion.

## Rules

1. **Specs are prose.** A spec's only import is `ui-test`. Its steps take `"name: value"` strings and nothing else.
2. **Assertions and locators live in the drivers.** Page and component objects have neither.
3. **Only `drivers/assertions.js` imports `expect`. Only `support/service-client.js` calls `fetch`.** The browser makes the app's own calls.
4. **Nothing imports from `src/`.** A driver re-states any rule it checks, and `support/status-codes.js` re-declares the codes, so a change in the app breaks a test instead of silently agreeing with it.
5. **The database is shared, holds real dev data, and is never reset.** A test asserts only on what it named, and never relies on another test's data. Tests run one at a time by default, but must also pass with `--workers` above 1.

## Running them

```bash
../start-vigilant-harvest.sh   # the suite never starts anything itself; the services need MySQL
npm run test:ui
../stop-vigilant-harvest.sh
```

Before each commit, also run `npx playwright test --workers=4 --repeat-each=3`: races that one worker never shows turn up there.

The suite signs on as `vigilant-test-gardener`, the local-only user vigilant-harvest-service's acceptance suite logs in as (that suite's README says how to create it). Copy `spec/helpers/ui/.env.ui.example` to `spec/helpers/ui/.env.ui` (gitignored), and fill in `UI_GARDENER_PASSWORD`; the service's `test/acceptance/.env.acceptance` has the same one. Never use a real user's account: one that also exists on the live services would let a misdirected run sign on there.

Any value can also be set from the shell, which wins over the file:
- `UI_APP_URL` (default `http://localhost:5174/apps/vigilant-harvest/`)
- `UI_SERVICE_URL` (default `http://localhost:8002/api/vigilant-harvest-service/v0`)
- `UI_AUTH_SERVICE_URL` (default `http://localhost:8003/api/feral-authentication-service/v0`)
- `UI_AUTH_APP_URL` (default `http://localhost:5173/auth/`): feral's app, for the spec that signs on through its login page
- `UI_APPLICATION_ID` (default: the app's own `VITE_APPLICATION_ID`)

A preflight runs before any test. It checks that both services answer, that the gardener can log in and read the garden with feral's token, and that the app answers. Then it signs on through the page and checks where the app's calls went, and that the browser could read the answers (a CORS refusal hides them). If any of that fails, it stops with one message naming the fix.

### Safety: local services only

The suite adds and deletes garden data. It must never run against the live services. Signing on as a local-only user means a stray run fails at login, and three guards stop it before then:

1. **Local URLs only.** `setup/config.js` refuses any `UI_*_URL` whose host isn't `localhost`, `127.0.0.1` or `[::1]`.
2. **The preflight checks where the app signs on and reads the garden.** The app in the browser calls whichever services it was built with, not the ones in the config. A production build (`vite build`, `vite preview`, `npm run serve`) reads `.env.production`, which names the live ones. So the preflight signs on through the page and stops the run unless the token went to `UI_AUTH_SERVICE_URL` and the dashboard read from `UI_SERVICE_URL`.
3. **Every browser context reaches only the local app, services and feral's app.** `support/network-guard.js` aborts any other request before it leaves the machine, and fails the test that made it, naming the request. Google Fonts requests are answered empty. `ui-test.js` applies the guard to each test's context.

Run the suite against the dev server, as `../start-vigilant-harvest.sh` starts it. feral-authentication's UI suite once wrote test data to the live service from `vite preview`; these guards come from there.

Failures save a screenshot and a trace under `test-results/`. Open a trace with `npx playwright show-trace <path>/trace.zip`, or the HTML report with `npx playwright show-report`. Both folders are gitignored, and the dev server ignores them, so writing them doesn't reload a page under test.

## How it hangs together

```
spec/ui/**/*.spec.js             what the app should do, in "name: value" strings
   |
helpers/ui/ui-test.js            the one import: Playwright's test, with a fixture per page object
   |
helpers/ui/pages/*.js            a page and the actions on it; parses the strings and delegates
helpers/ui/components/*.js       reusable parts of a page, exposed as page properties
   |
helpers/ui/drivers/*-driver.js   locators and every assertion, as typed methods
   |
helpers/ui/drivers/assertions.js the only importer of expect
```

- `helpers/ui/world.js` holds what a spec has named, shared by every page object in a test, and the drivers.
- `helpers/ui/params.js` holds shared parameter declarations.
- `helpers/ui/setup/` holds the config and the preflight.
- `helpers/ui/support/service-client.js` is the only place that calls `fetch`: the preflight, signing on, arranging and cleanup use it. `support/sessions.js` wraps a call in a session of its own, and ends it after.
- Steps are parsed with [`@feral-auth/ts-simple-dsl`](https://github.com/ErikHage/ts-simple-dsl).

**Every page has `open`, `reload`, `checkIsShown` and `checkIsShownAfterReload`.** `pages/routed-page.js` supplies them. Every page has `appBar`. Every dashboard page also has `dashboardNav`, its own bar: `dashboardNav.goTo('page: plantStats')` follows the link through its menu, or through the one menu on a phone. `drivers/routed-page-driver.js` checks a page by its URL and by something only that page shows; for the dashboard's pages, their title.

A dashboard page with nothing else to do yet is a one-liner, listed in `pages/dashboard-pages.js` and `drivers/dashboard-pages-drivers.js`. It moves to its own files once it has steps of its own, as the plots, plants, categories, plantings and planting years pages have.

**A page with an id in its URL has no `open`.** It's reached the way a person reaches it, from its list: `plantsPage.viewPlant('plant: sungold')` or `editPlant(...)`. The next step checks where that landed, for that thing: `plantDetailsPage.checkIsShownFor('plant: sungold')`.

**A page's alert fades after three seconds,** so a step checking it comes straight after the step that caused it. `drivers/page-alert.js` finds it by its class: Vuetify gives each form field an empty `alert` of its own.

**Phones.** A spec that needs the phone layout sets a narrow viewport (`test.use({ viewport: { width: 390, height: 844 } })`), below Vuetify's md breakpoint. The drivers read the viewport to know which layout they're in.

**`garden` isn't a page.** It arranges, through the API, what a test needs but isn't about: `garden.hasPlot('plot: bed')`, `garden.hasPlantingYear('year: spring')`. What a test *is* about is made through the page: `plotsPage.addPlot('plot: bed')`. A plant needs a subcategory, and a subcategory a category, so a plant's test arranges all three:

```js
await garden.hasCategory('category: tomatoes');
await garden.hasSubcategory('subcategory: cherry', 'category: tomatoes');
await garden.hasPlant('plant: sungold', 'subcategory: cherry', 'tags: Cold Tolerant, Heirloom', 'schedule: feeding');
```

`hasPlant` makes up every field; its `tags` and `schedule` (each a schedule from `garden.hasSchedule`) are optional.

A planting needs a plant and a year, and the plantings page lists only the chosen year's, so a planting's test chooses its year on the dashboard first:

```js
await garden.hasPlantingYear('year: spring');
await garden.hasPlanting('planting: early', 'plant: sungold', 'year: spring', 'status: started');
// ...sign on, then
await dashboardPage.chooseYear('year: spring');
```

`status: started` has six sown; without it the planting is as created. The world keeps up with what each step does to a planting (its status, counts, dates and plot), so `plantingDetailsPage.checkShowsPlanting('planting: early')` checks the lot.

**`browserClock` isn't a page either.** `browserClock.setTo('time: 2026-07-01T23:30:00-04:00')` fixes the browser's `new Date()`, for the dialogs that default to now. Timers still run. It checks first that the browser isn't on UTC, where a date pin shows nothing.

**A driver can hold or fail one of the app's calls.** `drivers/service-call-control.js` holds a call until released, or answers it with an error, for pins on how a page takes a slow or failed load. It matches only calls to the service, by their path under its base: the app's own pages have paths like the service's (`dashboard/planting-years`), and failing one of those fails the page itself, so a check that nothing's shown would pass on nothing at all. Such a check also checks the page is there.

**Adding a planting year needs the clock.** The add page proposes the year after the browser's calendar year, so a spec fixes the clock in a year it named first: `browserClock.setToNoonIn('year: last', 'on: 04-10')`. The year it adds is the one after, also from 8000 to 8999: `garden.hasPlantingYear` never picks 8999.

**Uncaught errors are recorded.** `drivers/page-errors.js` keeps every error the page throws and nothing catches, unhandled rejections included, for pins on code that throws. Nothing fails a test for them on its own.

**Absence is checked once, after a sync point.** A page that shows nothing looks the same before it reacts as after. A driver checking for absence first waits for the service call it depends on to be answered (`drivers/service-calls.js` records the page's calls from the start of each test), or for the page that follows, then reads the page once.

**Navigation is checked at the destination.** A step that leads elsewhere (`loginPage.logIn(...)`) asserts nothing about where. The next step checks that, by URL and a marker (`dashboardPage.checkIsShown()`).

## Names and callers

`user: gardener` is the one caller, and a reserved name: it resolves to the account in `.env.ui`. The service has no roles, so there's no one else to be.

Everything else a spec names is an alias: `plot: bed` is a handle, and the real name is `ui-bed-<random>`, unique to the run. A later step resolves the alias through the world. A name used before it's given fails, naming the step that gives it.

## Getting a token

Signing on is a step, `loginPage.logIn('user: gardener')`. It does what feral's login page would:
1. it logs in to feral as the gardener, for the Vigilant Harvest application;
2. it asks feral to log that session in to the app (`GET /login/:applicationId`), which answers with the app's URL and a single sign-on token as `?sso=`;
3. it ends the session from step 1, and brings the token to the app's own `landing?sso=<token>`.

From there the app does the rest: it exchanges the token, keeps the session token in `localStorage`, and goes to the dashboard. So every test runs the app's own sign-on code, and only feral's pages are skipped. Step 2's URL host isn't used, so the test doesn't depend on the URL feral has registered for the app.

One spec, `sign-on/round-trip.spec.js`, signs on as a person does instead: the SSO button, feral's own login page (`feralLoginPage`), and back. It needs feral's app running too, and the URL feral has registered for the app to be its landing page.

The app restores a session from `localStorage`, so a reload stays signed on. Nothing is shared between tests: each signs on for itself.

## Cleanup

What a test names is made up, and deleted afterwards.
- `plotsPage.addPlot('plot: bed')` and `garden.hasPlot('plot: bed')` make a plot named `ui-bed-<random>`.
- `garden.hasPlantingYear('year: spring')` makes a planting year from 8000 to 8999, picked at random so parallel workers rarely meet.
- Categories, subcategories, plants and schedules are named `ui-<alias>-<random>` the same way, whether made on the page or through `garden`.
- The world remembers each one under its alias *before* the step creates it, so a step that fails halfway is still cleaned up.
- When the test ends, pass or fail, the world deletes everything it named, newest first, over the API, as the gardener, finding each by its unique name. It's best effort: what's gone is skipped, and a failure is a warning.
- Newest first deletes a plant before its subcategory, and a subcategory before its category, which the service requires: it refuses to delete a category that has subcategories (409).
- What the service refuses with 409 is tried once more after the rest. Newest first is wrong only for what the service ties together on the side: a planting carried forward into a year the test added is older than that year, and holds it.
- A plant, plot or planting renamed on the page is remembered by its new name, and cleanup finds it by its old one too, in case the new one was never saved.
- Plantings a step makes on the service's side are named too, before the step: each split, and the remainder the service splits off when fewer are planted out than were sown, `<name>(2 Remaining)`, as `planting: <alias>-remainder`.
- It also ends the browser's own session in feral, since the app's Logout doesn't (backlog A2).

**After the last test, a residue check fails the run** if anything with a `ui-` name, or a planting year from 8000 to 8999, is still there: plots, plants, plantings, categories and subcategories, schedules, years. Harvests, journal and activity-log entries and schedule items hang off those. It throws from global teardown, which Playwright reports outside any test, and exits 1. (Setting `process.exitCode` there exits 0: Playwright sets its own.)

The service's acceptance suite uses `acc-` and 9000–9999, so neither suite's check flags the other's data.

To clear a leftover by hand, children first, in MySQL:

```sql
SET SQL_SAFE_UPDATES = 0;
START TRANSACTION;

DELETE h FROM harvests h JOIN plantings p ON p.planting_id = h.planting_id
 WHERE p.planting_name LIKE 'ui-%' OR p.current_planting_year BETWEEN 8000 AND 8999;
DELETE FROM plantings WHERE planting_name LIKE 'ui-%' OR current_planting_year BETWEEN 8000 AND 8999;
DELETE FROM garden_journal WHERE planting_year BETWEEN 8000 AND 8999;
DELETE FROM garden_activity_log WHERE planting_year BETWEEN 8000 AND 8999;
DELETE FROM planting_years WHERE planting_year BETWEEN 8000 AND 8999;
DELETE FROM plants WHERE friendly_name LIKE 'ui-%';
DELETE FROM plots WHERE friendly_name LIKE 'ui-%';
DELETE FROM activity_schedules WHERE name LIKE 'ui-%';
DELETE FROM plant_subcategories WHERE subcategory_name LIKE 'ui-%';
DELETE FROM plant_categories WHERE category_name LIKE 'ui-%';

-- check what's left, then COMMIT, or ROLLBACK if anything looks wrong
COMMIT;
SET SQL_SAFE_UPDATES = 1;
```

## Known-broken behaviour

Known-wrong behaviour is pinned, not skipped. A `// DocumentsCurrentBehavior:` comment above the test says what happens today and what should happen. The test title and the step name the intent. The driver method names today's behaviour, so it's the one thing a fix renames. Every pin has a row in the project's pinned-behaviour backlog, shared with the unit suite.

## The DSL dependency

`@feral-auth/ts-simple-dsl` is pinned to an exact version (`0.0.1`). It's pre-1.0, and ships breaking changes in patch releases, so upgrade it on purpose, and run the suite.

## Adding a test

1. Write the spec first, in the steps you wish existed: `await plotsPage.addPlot('plot: bed')`.
2. Add the step to the page or component object. Declare its parameters with `parseDslArgs` (`parseDslArgs(args, {})` for none), then delegate to the driver.
3. Add the driver method, with its locators and assertions. Read the page's accessibility tree in a real browser first (`page.locator('body').ariaSnapshot()`): Vuetify's roles aren't what its markup suggests. A new kind of check becomes a primitive in `assertions.js`.
4. For a new page, add a driver in `drivers/drivers.js` and a fixture in `ui-test.js`. For a new component, add a driver too, and expose it as a property of each page that has it. For a new kind of thing a test names, add it to the world, to cleanup's `kinds`, and to the residue check.
5. Run it. A misspelled parameter fails only at runtime.
6. Check the layering:
   ```bash
   grep -rnE --include=*.js "\bexpect\(|import \{[^}]*\bexpect\b" spec/ui spec/helpers/ui   # assertions.js only
   grep -rn --include=*.js "getBy\|locator(" spec/ui spec/helpers/ui/pages spec/helpers/ui/components  # nothing
   grep -rn --include=*.js "^import" spec/ui                                  # ui-test only
   grep -rn --include=*.js "fetch(" spec/ui spec/helpers/ui                   # service-client only
   grep -rn --include=*.js "from '@/\|/src/" spec/ui spec/helpers/ui          # nothing
   ```
