import { createApp } from 'vue';
import { pinia } from '@/plugins/pinia';
import { useCommonStore } from '@/store';

describe('pinia plugin', () => {
    it('is one shared instance, the one the stores use once the app installs it', () => {
        const app = createApp({ render: () => null });
        app.use(pinia);

        const store = app.runWithContext(() => useCommonStore());
        store.plantingYear = 2031;

        expect(pinia.state.value.common.plantingYear).toBe(2031);
    });
});
