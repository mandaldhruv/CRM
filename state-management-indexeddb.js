/**
 * ============================================================================
 * KINETIC ATELIER - INDEXEDDB MIGRATION TEMPLATE
 * Migration-ready async helpers powered by localForage.
 *
 * Usage strategy:
 * 1. Load localForage CDN before this file.
 * 2. Replace sync StateManager calls module-by-module with AsyncStateManager.
 * 3. Once all callers await async methods, swap the active implementation.
 * ============================================================================
 */

(function () {
    if (typeof localforage === 'undefined') {
        console.warn('[AsyncStateManager] localForage not detected. IndexedDB migration helpers are idle.');
        return;
    }

    localforage.config({
        name: 'KineticAtelierCRM',
        storeName: 'crm_records',
        description: 'Production-grade IndexedDB storage for Gym CRM'
    });

    const STORAGE_KEYS = {
        members: 'ka_members',
        attendance: 'ka_attendance',
        enquiries: 'ka_enquiries',
        staff: 'ka_staff',
        payroll: 'payroll',
        expenses: 'ka_expenses',
        packages: 'ka_packages',
        receipts: 'ka_receipts'
    };

    const saveData = async (key, data) => {
        try {
            await localforage.setItem(key, data);
            console.log(`[AsyncStateManager] Saved ${Array.isArray(data) ? data.length : 0} records to ${key}`);
            return true;
        } catch (error) {
            console.error(`[AsyncStateManager] Failed to save ${key}`, error);
            return false;
        }
    };

    const getData = async (key) => {
        try {
            const data = await localforage.getItem(key);
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error(`[AsyncStateManager] Failed to read ${key}`, error);
            return [];
        }
    };

    const removeData = async (key) => {
        try {
            await localforage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`[AsyncStateManager] Failed to remove ${key}`, error);
            return false;
        }
    };

    const initialize = async () => {
        await Promise.all(Object.values(STORAGE_KEYS).map(async (key) => {
            const existing = await localforage.getItem(key);
            if (existing === null) {
                await localforage.setItem(key, []);
            }
        }));

        console.log('[AsyncStateManager] IndexedDB stores initialized');
    };

    const getStats = async () => {
        const entries = await Promise.all(
            Object.entries(STORAGE_KEYS).map(async ([name, key]) => [name, (await getData(key)).length])
        );

        return Object.fromEntries(entries);
    };

    const createEntityStore = (storageKey) => ({
        async getAll() {
            return getData(storageKey);
        },

        async getById(id) {
            const records = await getData(storageKey);
            return records.find(record => record.id === id) || null;
        },

        async create(payload) {
            const records = await getData(storageKey);
            const nextRecord = {
                id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                ...payload,
                createdAt: new Date().toISOString()
            };

            records.push(nextRecord);
            await saveData(storageKey, records);
            return nextRecord;
        },

        async upsert(payload) {
            if (!payload || !payload.id) {
                return this.create(payload || {});
            }

            const records = await getData(storageKey);
            const index = records.findIndex(record => record.id === payload.id);

            if (index === -1) {
                const nextRecord = {
                    ...payload,
                    createdAt: payload.createdAt || new Date().toISOString()
                };

                records.push(nextRecord);
                await saveData(storageKey, records);
                return nextRecord;
            }

            records[index] = {
                ...records[index],
                ...payload,
                updatedAt: new Date().toISOString()
            };

            await saveData(storageKey, records);
            return records[index];
        },

        async update(id, updates) {
            const records = await getData(storageKey);
            const index = records.findIndex(record => record.id === id);
            if (index === -1) {
                return null;
            }

            records[index] = {
                ...records[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };

            await saveData(storageKey, records);
            return records[index];
        },

        async delete(id) {
            const records = await getData(storageKey);
            const filteredRecords = records.filter(record => record.id !== id);
            await saveData(storageKey, filteredRecords);
            return filteredRecords.length !== records.length;
        }
    });

    window.AsyncStateManager = {
        STORAGE_KEYS,
        initialize,
        saveData,
        getData,
        removeData,
        getStats,
        Members: createEntityStore(STORAGE_KEYS.members),
        Attendance: createEntityStore(STORAGE_KEYS.attendance),
        Enquiries: createEntityStore(STORAGE_KEYS.enquiries),
        Staff: createEntityStore(STORAGE_KEYS.staff),
        Payroll: createEntityStore(STORAGE_KEYS.payroll),
        Expenses: createEntityStore(STORAGE_KEYS.expenses),
        Packages: createEntityStore(STORAGE_KEYS.packages),
        Receipts: createEntityStore(STORAGE_KEYS.receipts)
    };
})();
