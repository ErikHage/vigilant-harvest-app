import { enableAutoUnmount } from '@vue/test-utils';

// Vuetify components observe their size, which jsdom doesn't implement
class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
}

globalThis.ResizeObserver = globalThis.ResizeObserver || ResizeObserverStub;

// Vuetify's menus call visualViewport?.addEventListener, which throws on a
// global that was never declared. jsdom has no visualViewport, and Vuetify
// falls back to the window when it's null
globalThis.visualViewport = globalThis.visualViewport ?? null;

// Dialogs render into document.body, so a wrapper left mounted would leave
// its dialogs behind for the next test
enableAutoUnmount(afterEach);
