/**
 * Safe wrappers around localStorage access.
 *
 * In some environments (privacy modes, disabled storage, strict policies),
 * touching localStorage can throw a SecurityError and crash the UI.
 */

export function safeLocalStorageGetItem(key) {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

export function safeLocalStorageSetItem(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch {
        return false;
    }
}

export function safeLocalStorageRemoveItem(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch {
        return false;
    }
}

export function safeLocalStorageLength() {
    try {
        return localStorage.length;
    } catch {
        return 0;
    }
}

export function safeLocalStorageKey(index) {
    try {
        return localStorage.key(index);
    } catch {
        return null;
    }
}

