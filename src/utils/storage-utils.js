const tokenKey = 'vigilant-token';

function setLocalStorageEntry(key, value) {
    localStorage.setItem(key, value);
}

function getLocalStorageEntry(key) {
    return localStorage.getItem(key) || null;
}

function clearLocalStorageEntry(key) {
    localStorage.removeItem(key);
}

function setTokenInLocalStorage(token) {
    setLocalStorageEntry(tokenKey, token);
}

function tryToLoadTokenFromStorage() {
    return getLocalStorageEntry(tokenKey) || null;
}

function clearTokenFromStorage() {
    clearLocalStorageEntry(tokenKey);
}

export default {
    setLocalStorageEntry,
    getLocalStorageEntry,
    clearLocalStorageEntry,
    setTokenInLocalStorage,
    tryToLoadTokenFromStorage,
    clearTokenFromStorage,
};