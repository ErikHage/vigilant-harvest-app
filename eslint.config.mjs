import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';

// Each part of the repo runs somewhere different, so each gets that place's
// globals: the app in the browser, the unit suite in Vitest's jsdom, the UI
// suite and the configs in Node, with the UI suite's page.evaluate callbacks
// in the browser
export default [
    {
        ignores: ['dist/', 'coverage/', 'test-results/', 'playwright-report/'],
    },
    js.configs.recommended,
    ...pluginVue.configs['flat/essential'],
    {
        rules: {
            // `const { left, ...rest } = thing` leaves `left` out on purpose
            'no-unused-vars': ['error', { ignoreRestSiblings: true }],
            // Vuetify's data tables name their slots after columns, as in
            // v-slot:item.actions; the dot isn't a modifier
            'vue/valid-v-slot': ['error', { allowModifiers: true }],
        },
    },
    {
        files: ['src/**'],
        languageOptions: {
            globals: { ...globals.browser },
        },
    },
    {
        files: ['spec/unit/**', 'spec/helpers/*.js', 'spec/setup.js'],
        languageOptions: {
            globals: { ...globals.browser, ...globals.node, ...globals.vitest },
        },
    },
    {
        files: ['spec/ui/**', 'spec/helpers/ui/**', '*.config.js', '*.config.mjs'],
        languageOptions: {
            globals: { ...globals.node, ...globals.browser },
        },
    },

    // Findings in src/ whose fix could change what the app does, so they wait
    // for a fix of their own. Each is off only in the files that have it, so
    // new code elsewhere is still checked. Backlog rows are in
    // ai-changelogs/projects/vigilant-harvest-app/2026-11-03-2-pinned-behaviour.md
    {
        // PlantingDetailsTab binds its fields' v-models straight to the
        // `planting` prop, so the page's copy is edited in place; the page
        // relies on it
        files: ['src/components/plantings/PlantingDetailsTab.vue'],
        rules: { 'vue/no-mutating-props': 'off' },
    },
    {
        // A list rendered without a key: adding one changes how Vue reuses
        // its elements
        files: [
            'src/components/plantings/PlantingHistoryTab.vue',
            'src/components/plantings/PlantingsTable.vue',
            'src/components/plants/PlantDetailsTab.vue',
            'src/components/plants/PlantsTable.vue',
            'src/components/views/dashboard/garden/GardenPage.vue',
            'src/components/views/dashboard/plants/PlantEditPage.vue',
            'src/components/years/PlantingYearsTable.vue',
        ],
        rules: {
            'vue/require-v-for-key': 'off',
            'vue/valid-v-for': 'off',
        },
    },
    {
        // v-if beside v-for on the harvest dialog's rows
        files: ['src/components/views/dashboard/garden/GardenPage.vue'],
        rules: { 'vue/no-use-v-if-with-v-for': 'off' },
    },
    {
        // An empty template: the page renders nothing while it signs on
        files: ['src/components/views/LandingPage.vue'],
        rules: { 'vue/valid-template-root': 'off' },
    },
];
