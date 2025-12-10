// src/services/storage.ts

export class StorageService {
  private static PREFIX = 'code_interview_';
  private static CUSTOM_EVENT_NAME = 'storage-update';

  static set<T>(key: string, value: T): void {
    try {
      const fullKey = `${this.PREFIX}${key}`;
      const serialized = JSON.stringify(value);
      localStorage.setItem(fullKey, serialized);

      // Dispatch a custom event for same-tab updates
      // (storage events only fire on other tabs)
      window.dispatchEvent(new CustomEvent(this.CUSTOM_EVENT_NAME, {
        detail: { key: fullKey, newValue: serialized }
      }));
    } catch (error) {
      console.error('Error saving to localStorage', error);
    }
  }

  static get<T>(key: string): T | null {
    try {
      const serialized = localStorage.getItem(`${this.PREFIX}${key}`);
      return serialized ? JSON.parse(serialized) : null;
    } catch (error) {
      console.error('Error reading from localStorage', error);
      return null;
    }
  }

  static remove(key: string): void {
    localStorage.removeItem(`${this.PREFIX}${key}`);
  }

  // Helper to subscribe to updates (both cross-tab and same-tab)
  static subscribe<T>(key: string, callback: (newValue: T | null) => void): () => void {
    const fullKey = `${this.PREFIX}${key}`;

    // Handler for cross-tab updates (StorageEvent)
    const storageHandler = (event: StorageEvent) => {
      if (event.key === fullKey) {
        try {
          const newValue = event.newValue ? JSON.parse(event.newValue) : null;
          callback(newValue);
        } catch (e) {
          callback(null);
        }
      }
    };

    // Handler for same-tab updates (CustomEvent)
    const customHandler = (event: Event) => {
      const customEvent = event as CustomEvent<{ key: string; newValue: string }>;
      if (customEvent.detail.key === fullKey) {
        try {
          const newValue = customEvent.detail.newValue
            ? JSON.parse(customEvent.detail.newValue)
            : null;
          callback(newValue);
        } catch (e) {
          callback(null);
        }
      }
    };

    window.addEventListener('storage', storageHandler);
    window.addEventListener(this.CUSTOM_EVENT_NAME, customHandler);

    return () => {
      window.removeEventListener('storage', storageHandler);
      window.removeEventListener(this.CUSTOM_EVENT_NAME, customHandler);
    };
  }
}
