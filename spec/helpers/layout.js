import { h } from 'vue';
import { VLayout } from 'vuetify/components';
import { mountWithPlugins } from './mount';

// Mounts a component that renders a v-app-bar, which must live inside a
// layout. Unlike feral-authentication's Vuetify 3.6, Vuetify 3.12 renders the
// bar straight away, so there's no need to wait for the layout
export function mountInLayout(component, options = {}) {
    const { props, ...rest } = options;

    return mountWithPlugins({
        render: () => h(VLayout, () => h(component, props)),
    }, rest);
}
