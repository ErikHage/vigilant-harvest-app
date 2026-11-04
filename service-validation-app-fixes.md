# App fixes from the service's input validation

vigilant-harvest-service now checks every request body, path and query before it acts, and answers
a bad one with a 400 that names the field. That was finding H5 of its code review, done in six
parts: commits `a186cb2` to `6648976` on 2026-11-02. The full record is in
`ai-changelogs/projects/vigilant-harvest-service/2026-11-02-2-code-review.md`.

Each part surveyed what this app sends first, so nothing the app sends in normal use is rejected.
Along the way, these app-side fixes turned up. Line numbers are as of `91f07a1`.

## How the service answers now

Every error, from every route, has one shape:

```json
{ "errors": [ { "name": "FeralError", "message": "plantingYear must be an integer", "status": 400 } ] }
```

- `message` names the field, nested by path: `harvests[0].quantity must be greater than 0`, or
  `planting.depthInInches must be at most 999.99`.
- In prod, nginx still replaces 404 and 500–504 bodies with HTML. 400 and 409 come through as JSON.
- `harvestUtils.upsertErrorMessage` (`src/utils/harvest-utils.js:23`) already reads
  `errors[0].message` for a 400. It is the pattern for the fixes below.

## Fixes

### 1. The plant store shows a generic alert for a rejected plant

- **Where:** `src/store/index.js:288`, in `upsertPlant`:
  `err.data?.message || 'error upserting plant'`.
- **Why:** `PUT /plants` used to answer its two 400s as `{ message }`. They now use the standard
  body, so `err.data?.message` is always undefined. The alert says "error upserting plant" instead
  of why. The two 400s were "Subcategory is required", now `subcategoryId is required`, and
  "Friendly name already in use".
- **Fix:** read `err.data?.errors?.[0]?.message`, or reuse `harvestUtils.upsertErrorMessage(err,
  'error upserting plant')`, which also limits it to 400s.

### 2. The add-planting dialog saves without a name, then closes anyway

- **Where:**
  - `src/components/plantings/AddPlantingDialog.vue:62` and `:84` start `name` as `''`. The field
    has `required`, but nothing stops the save.
  - `src/components/views/dashboard/plantings/PlantingsPage.vue:186`, in `savePlanting`, calls
    `closeDialog()` whether or not the create worked.
- **Why:** the service now rejects a blank name: `name is required`. It used to store a nameless
  planting. The store shows "error creating planting", and the dialog closes, losing what was typed.
- **Fix:** disable Save until a name and a plant are chosen. Optionally, keep the dialog open when
  the create fails.

### 3. The split dialog sends blank names

- **Where:** `src/components/plantings/SplitPlantingActionDialog.vue:95-96`. Each split starts as
  `{ name: '', count: 0 }`.
- **Why:** the service now rejects a split with a blank name: `splits[0].name is required`. A count
  of 0 is still accepted, as before.
- **Fix:** require a name on each split before submitting. A count of at least 1 would also make
  sense, since a 0-plant split makes an empty planting. The service still checks the total against
  what was sown.

### 4. The activity-log dialog crashes with no activity type picked

- **Where:** `src/components/views/dashboard/garden/AddActivityLogEntryDialog.vue:126`:
  `activityType: this.activityType.name`, while `activityType` is still `null`.
- **Why:** it throws a `TypeError` before anything is sent. If it did send, the service would now
  answer `activityType is required`.
- **Fix:** disable Confirm until an activity type is picked.

### 5. The plant-out dialog allows no plot

- **Where:** `src/components/plantings/PlantPlantingActionDialog.vue:91` starts `plotId: null`, with
  no rule on the plot select.
- **Why:** the service accepts a PLANT with no plot, as it always has, so the planting is PLANTED
  nowhere. That's an app-level choice, not a validation error.
- **Fix:** require a plot, unless planting without one is wanted.

## Worth doing while there

- **Both garden dialogs close before the save succeeds.** See the `TODO`s at
  `AddActivityLogEntryDialog.vue:130` and `AddJournalEntryDialog.vue:95`. A 400 now carries a useful
  message, so keeping the dialog open and showing it is more worthwhile than before.
- **Harvest quantities in the edit dialog are only checked by the service.**
  - Where: `src/components/harvests/EditHarvestsDialog.vue:33`.
  - A blank, zero or negative quantity is now a 400: `harvests[0].quantity must be greater than 0`.
    The dialog shows it and stays open.
  - A blank box used to save 0. A check in the form would avoid the round trip.
- **The add-year page can submit before both dates are picked.**
  - `src/components/views/dashboard/years/AddPlantingYearPage.vue:123` starts them `null`, and Save
    isn't disabled.
  - The service now answers `lastFrostDate is required`. The page stays put and the store alerts
    "error adding planting year", so nothing breaks, but disabling Save until both dates are set is
    clearer.
- **Requests made after the year is cleared.**
  - After `clearPlantingYear()` (`src/store/index.js:46`), a page can request `/journal/null` or
    similar. That is now a 400 (`plantingYear must be an integer`), and was a 500. The app alerts
    either way.
  - Skipping the fetch while `plantingYear` is `null` would avoid the alert.
- **A comment in `harvest-utils.js` is out of date.**
  - Line 22 says a 400 from `PUT /harvests` "means an unknown harvest type id". It can now be any
    field's check, such as a quantity or a date.
  - The function itself still does the right thing.
- **Fractional harvest quantities are rounded by the service.**
  - The harvest types include pounds, ounces and kilograms, and the quantity boxes allow 1.5.
  - The service accepts it, but its `quantity` column is an `INT`, so 1.5 is stored as 2, and 0.4 as
    0.
  - That's a service-side finding: the column should become a `DECIMAL`. Until then, the app could
    note that weights are rounded, or limit those boxes to whole numbers.

## Already fixed on the service side

No app change is needed for these. They are listed so they aren't chased again.

- **A cleared number box sends `''`** (`v-model.number`). The service now reads it as "not given"
  wherever the field is optional. Two saves that used to fail with a 500 now work:
  - creating a planting after clearing its lead time;
  - saving a plant from the edit page after clearing a depth, spacing, days or height box.
- **A new plot is sent as `plotId: ''`** (`UpsertPlotDialog.vue`). It was always created, but
  answered 200. It now answers 201.
- **Years sent as strings,** from `localStorage` or the year picker, are accepted everywhere: `"2026"`
  is the same as `2026`.
