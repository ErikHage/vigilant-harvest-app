import storageUtils from '@/utils/storage-utils';

describe('storageUtils', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('local storage entries', () => {
        it('stores, reads and clears an entry', () => {
            storageUtils.setLocalStorageEntry('planting-year', 2026);

            // localStorage keeps strings, so a number comes back as one
            expect(storageUtils.getLocalStorageEntry('planting-year')).toBe('2026');

            storageUtils.clearLocalStorageEntry('planting-year');

            expect(storageUtils.getLocalStorageEntry('planting-year')).toBeNull();
        });

        it('reads a missing entry as null', () => {
            expect(storageUtils.getLocalStorageEntry('missing')).toBeNull();
        });

        it('reads an empty entry as null', () => {
            localStorage.setItem('empty', '');

            expect(storageUtils.getLocalStorageEntry('empty')).toBeNull();
        });
    });

    describe('the token', () => {
        it('is stored under vigilant-token', () => {
            storageUtils.setTokenInLocalStorage('a-token');

            expect(localStorage.getItem('vigilant-token')).toBe('a-token');
            expect(storageUtils.tryToLoadTokenFromStorage()).toBe('a-token');
        });

        it('loads as null when none is stored', () => {
            expect(storageUtils.tryToLoadTokenFromStorage()).toBeNull();
        });

        it('is cleared', () => {
            storageUtils.setTokenInLocalStorage('a-token');

            storageUtils.clearTokenFromStorage();

            expect(storageUtils.tryToLoadTokenFromStorage()).toBeNull();
        });
    });
});
