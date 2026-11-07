import vuetify from '@/plugins/vuetify';

// The specs mount with their own plain Vuetify (spec/helpers/mount.js); this
// is the app's
describe('vuetify plugin', () => {
    it('starts on the dark theme', () => {
        expect(vuetify.theme.global.name.value).toBe('dark');
    });
});
