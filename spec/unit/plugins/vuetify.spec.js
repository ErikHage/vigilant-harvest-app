import vuetify from '@/plugins/vuetify';

// The specs mount with their own plain Vuetify (spec/helpers/mount.js); this
// is the app's, built from the component library's options
describe('vuetify plugin', () => {
    it('starts on the feral dark theme', () => {
        expect(vuetify.theme.global.name.value).toBe('feralDark');
        expect(vuetify.theme.current.value.dark).toBe(true);
    });
});
