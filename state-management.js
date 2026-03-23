/**
 * ============================================================================
 * KINETIC ATELIER - STATE MANAGEMENT
 * Robust Client-Side Database using localStorage
 * ============================================================================
 */

const StateManager = (() => {
    // -------- CONSTANTS --------
    const STORAGE_KEYS = {
        members: 'ka_members',
        enquiries: 'ka_enquiries',
        staff: 'ka_staff',
        payroll: 'payroll',
        expenses: 'ka_expenses',
        packages: 'ka_packages',
        receipts: 'ka_receipts'
    };

    // -------- INITIALIZATION --------
    const initialize = () => {
        console.log('%c[StateManager] 🚀 Initializing Kinetic Atelier Database', 'color: #3525cd; font-weight: bold');
        
        Object.values(STORAGE_KEYS).forEach(key => {
            if (!localStorage.getItem(key)) {
                localStorage.setItem(key, JSON.stringify([]));
                console.log(`  ✓ ${key} initialized (empty array)`);
            }
        });
    };

    // -------- UTILITY FUNCTIONS --------
    /**
     * Generates a unique ID using timestamp + random string
     * Format: YYYYMMDD_HHmmss_XXXX (e.g., 20250322_143052_a7f2)
     */
    const generateId = () => {
        const now = new Date();
        const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
        const randomStr = Math.random().toString(36).substring(2, 6);
        return `${timestamp}_${randomStr}`;
    };

    /**
     * Saves data to localStorage
     * @param {string} key - Storage key (from STORAGE_KEYS)
     * @param {array} data - Array of records to save
     */
    const saveData = (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            console.log(`[StateManager] ✓ Saved ${data.length} records to ${key}`);
            return true;
        } catch (error) {
            console.error(`[StateManager] ✗ Error saving to ${key}:`, error);
            return false;
        }
    };

    /**
     * Retrieves data from localStorage
     * @param {string} key - Storage key (from STORAGE_KEYS)
     * @returns {array} - Array of records or empty array if not found
     */
    const getData = (key) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error(`[StateManager] ✗ Error reading from ${key}:`, error);
            return [];
        }
    };

    /**
     * Clears all data from localStorage (for testing/reset)
     */
    const clearAll = () => {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        initialize();
        console.warn('[StateManager] ⚠️ All data cleared and reinitialized');
    };

    /**
     * Gets storage statistics
     */
    const getStats = () => {
        const stats = {};
        Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
            stats[name] = getData(key).length;
        });
        return stats;
    };

    // -------- MEMBERS CRUD --------
    const Members = {
        /**
         * Creates a new member record
         */
        create: (memberData) => {
            const members = getData(STORAGE_KEYS.members);
            const newMember = {
                id: generateId(),
                ...memberData,
                createdAt: new Date().toISOString(),
                status: memberData.status || 'active'
            };
            members.push(newMember);
            saveData(STORAGE_KEYS.members, members);
            console.log('[Members] ✓ Member created:', newMember.id);
            return newMember;
        },

        /**
         * Gets all members or a specific member by ID
         */
        getAll: () => getData(STORAGE_KEYS.members),
        
        getById: (id) => {
            const members = getData(STORAGE_KEYS.members);
            return members.find(m => m.id === id);
        },

        /**
         * Updates an existing member
         */
        update: (id, updates) => {
            const members = getData(STORAGE_KEYS.members);
            const index = members.findIndex(m => m.id === id);
            if (index !== -1) {
                members[index] = { ...members[index], ...updates, updatedAt: new Date().toISOString() };
                saveData(STORAGE_KEYS.members, members);
                console.log('[Members] ✓ Member updated:', id);
                return members[index];
            }
            console.warn('[Members] ⚠️ Member not found:', id);
            return null;
        },

        /**
         * Deletes a member
         */
        delete: (id) => {
            const members = getData(STORAGE_KEYS.members);
            const filtered = members.filter(m => m.id !== id);
            if (filtered.length < members.length) {
                saveData(STORAGE_KEYS.members, filtered);
                console.log('[Members] ✓ Member deleted:', id);
                return true;
            }
            console.warn('[Members] ⚠️ Member not found:', id);
            return false;
        },

        /**
         * Gets members by status
         */
        getByStatus: (status) => {
            const members = getData(STORAGE_KEYS.members);
            return members.filter(m => m.status === status);
        },

        /**
         * Gets active members count
         */
        getActiveCount: () => {
            return Members.getByStatus('active').length;
        }
    };

    // -------- ENQUIRIES CRUD --------
    const Enquiries = {
        create: (enquiryData) => {
            const enquiries = getData(STORAGE_KEYS.enquiries);
            const newEnquiry = {
                id: generateId(),
                ...enquiryData,
                createdAt: new Date().toISOString(),
                status: enquiryData.status || 'new',
                stage: enquiryData.stage || 'inquiry'
            };
            enquiries.push(newEnquiry);
            saveData(STORAGE_KEYS.enquiries, enquiries);
            console.log('[Enquiries] ✓ Enquiry created:', newEnquiry.id);
            return newEnquiry;
        },

        getAll: () => getData(STORAGE_KEYS.enquiries),
        
        getById: (id) => {
            const enquiries = getData(STORAGE_KEYS.enquiries);
            return enquiries.find(e => e.id === id);
        },

        update: (id, updates) => {
            const enquiries = getData(STORAGE_KEYS.enquiries);
            const index = enquiries.findIndex(e => e.id === id);
            if (index !== -1) {
                enquiries[index] = { ...enquiries[index], ...updates, updatedAt: new Date().toISOString() };
                saveData(STORAGE_KEYS.enquiries, enquiries);
                console.log('[Enquiries] ✓ Enquiry updated:', id);
                return enquiries[index];
            }
            return null;
        },

        delete: (id) => {
            const enquiries = getData(STORAGE_KEYS.enquiries);
            const filtered = enquiries.filter(e => e.id !== id);
            if (filtered.length < enquiries.length) {
                saveData(STORAGE_KEYS.enquiries, filtered);
                console.log('[Enquiries] ✓ Enquiry deleted:', id);
                return true;
            }
            return false;
        },

        getByStage: (stage) => {
            return getData(STORAGE_KEYS.enquiries).filter(e => e.stage === stage);
        }
    };

    // -------- STAFF CRUD --------
    const Staff = {
        create: (staffData) => {
            const staff = getData(STORAGE_KEYS.staff);
            const newStaff = {
                id: generateId(),
                ...staffData,
                createdAt: new Date().toISOString(),
                status: staffData.status || 'active'
            };
            staff.push(newStaff);
            saveData(STORAGE_KEYS.staff, staff);
            console.log('[Staff] ✓ Staff member created:', newStaff.id);
            return newStaff;
        },

        getAll: () => getData(STORAGE_KEYS.staff),
        
        getById: (id) => {
            const staff = getData(STORAGE_KEYS.staff);
            return staff.find(s => s.id === id);
        },

        update: (id, updates) => {
            const staff = getData(STORAGE_KEYS.staff);
            const index = staff.findIndex(s => s.id === id);
            if (index !== -1) {
                staff[index] = { ...staff[index], ...updates, updatedAt: new Date().toISOString() };
                saveData(STORAGE_KEYS.staff, staff);
                console.log('[Staff] ✓ Staff member updated:', id);
                return staff[index];
            }
            return null;
        },

        delete: (id) => {
            const staff = getData(STORAGE_KEYS.staff);
            const filtered = staff.filter(s => s.id !== id);
            if (filtered.length < staff.length) {
                saveData(STORAGE_KEYS.staff, filtered);
                console.log('[Staff] ✓ Staff member deleted:', id);
                return true;
            }
            return false;
        },

        getByRole: (role) => {
            return getData(STORAGE_KEYS.staff).filter(s => s.role === role);
        }
    };

    // -------- PAYROLL CRUD --------
    const Payroll = {
        create: (payrollData) => {
            const payroll = getData(STORAGE_KEYS.payroll);
            const newPayrollRecord = {
                id: generateId(),
                ...payrollData,
                createdAt: new Date().toISOString()
            };
            payroll.push(newPayrollRecord);
            saveData(STORAGE_KEYS.payroll, payroll);
            console.log('[Payroll] âœ“ Payroll record created:', newPayrollRecord.id);
            return newPayrollRecord;
        },

        getAll: () => getData(STORAGE_KEYS.payroll),

        getById: (id) => {
            const payroll = getData(STORAGE_KEYS.payroll);
            return payroll.find(record => record.id === id);
        },

        update: (id, updates) => {
            const payroll = getData(STORAGE_KEYS.payroll);
            const index = payroll.findIndex(record => record.id === id);
            if (index !== -1) {
                payroll[index] = { ...payroll[index], ...updates, updatedAt: new Date().toISOString() };
                saveData(STORAGE_KEYS.payroll, payroll);
                console.log('[Payroll] âœ“ Payroll record updated:', id);
                return payroll[index];
            }
            return null;
        },

        delete: (id) => {
            const payroll = getData(STORAGE_KEYS.payroll);
            const filtered = payroll.filter(record => record.id !== id);
            if (filtered.length < payroll.length) {
                saveData(STORAGE_KEYS.payroll, filtered);
                console.log('[Payroll] âœ“ Payroll record deleted:', id);
                return true;
            }
            return false;
        },

        getByStaffId: (staffId) => {
            return getData(STORAGE_KEYS.payroll).filter(record => record.staffId === staffId);
        }
    };

    // -------- PACKAGES CRUD --------
    const Packages = {
        create: (packageData) => {
            const packages = getData(STORAGE_KEYS.packages);
            const newPackage = {
                id: generateId(),
                ...packageData,
                createdAt: new Date().toISOString()
            };
            packages.push(newPackage);
            saveData(STORAGE_KEYS.packages, packages);
            console.log('[Packages] ✓ Package created:', newPackage.id);
            return newPackage;
        },

        getAll: () => getData(STORAGE_KEYS.packages),
        
        getById: (id) => {
            const packages = getData(STORAGE_KEYS.packages);
            return packages.find(p => p.id === id);
        },

        update: (id, updates) => {
            const packages = getData(STORAGE_KEYS.packages);
            const index = packages.findIndex(p => p.id === id);
            if (index !== -1) {
                packages[index] = { ...packages[index], ...updates, updatedAt: new Date().toISOString() };
                saveData(STORAGE_KEYS.packages, packages);
                console.log('[Packages] ✓ Package updated:', id);
                return packages[index];
            }
            return null;
        },

        delete: (id) => {
            const packages = getData(STORAGE_KEYS.packages);
            const filtered = packages.filter(p => p.id !== id);
            if (filtered.length < packages.length) {
                saveData(STORAGE_KEYS.packages, filtered);
                console.log('[Packages] ✓ Package deleted:', id);
                return true;
            }
            return false;
        }
    };

    // -------- EXPENSES CRUD --------
    const Expenses = {
        create: (expenseData) => {
            const expenses = getData(STORAGE_KEYS.expenses);
            const newExpense = {
                id: generateId(),
                ...expenseData,
                createdAt: new Date().toISOString(),
                status: expenseData.status || 'pending'
            };
            expenses.push(newExpense);
            saveData(STORAGE_KEYS.expenses, expenses);
            console.log('[Expenses] ✓ Expense created:', newExpense.id);
            return newExpense;
        },

        getAll: () => getData(STORAGE_KEYS.expenses),
        
        getById: (id) => {
            const expenses = getData(STORAGE_KEYS.expenses);
            return expenses.find(e => e.id === id);
        },

        update: (id, updates) => {
            const expenses = getData(STORAGE_KEYS.expenses);
            const index = expenses.findIndex(e => e.id === id);
            if (index !== -1) {
                expenses[index] = { ...expenses[index], ...updates, updatedAt: new Date().toISOString() };
                saveData(STORAGE_KEYS.expenses, expenses);
                console.log('[Expenses] ✓ Expense updated:', id);
                return expenses[index];
            }
            return null;
        },

        delete: (id) => {
            const expenses = getData(STORAGE_KEYS.expenses);
            const filtered = expenses.filter(e => e.id !== id);
            if (filtered.length < expenses.length) {
                saveData(STORAGE_KEYS.expenses, filtered);
                console.log('[Expenses] ✓ Expense deleted:', id);
                return true;
            }
            return false;
        },

        getTotalExpenses: () => {
            return getData(STORAGE_KEYS.expenses).reduce((sum, e) => sum + (e.amount || 0), 0);
        }
    };

    // -------- RECEIPTS CRUD --------
    const Receipts = {
        create: (receiptData) => {
            const receipts = getData(STORAGE_KEYS.receipts);
            const newReceipt = {
                id: generateId(),
                ...receiptData,
                createdAt: new Date().toISOString(),
                status: receiptData.status || 'issued'
            };
            receipts.push(newReceipt);
            saveData(STORAGE_KEYS.receipts, receipts);
            console.log('[Receipts] ✓ Receipt created:', newReceipt.id);
            return newReceipt;
        },

        getAll: () => getData(STORAGE_KEYS.receipts),
        
        getById: (id) => {
            const receipts = getData(STORAGE_KEYS.receipts);
            return receipts.find(r => r.id === id);
        },

        update: (id, updates) => {
            const receipts = getData(STORAGE_KEYS.receipts);
            const index = receipts.findIndex(r => r.id === id);
            if (index !== -1) {
                receipts[index] = { ...receipts[index], ...updates, updatedAt: new Date().toISOString() };
                saveData(STORAGE_KEYS.receipts, receipts);
                console.log('[Receipts] ✓ Receipt updated:', id);
                return receipts[index];
            }
            return null;
        },

        delete: (id) => {
            const receipts = getData(STORAGE_KEYS.receipts);
            const filtered = receipts.filter(r => r.id !== id);
            if (filtered.length < receipts.length) {
                saveData(STORAGE_KEYS.receipts, filtered);
                console.log('[Receipts] ✓ Receipt deleted:', id);
                return true;
            }
            return false;
        },

        getTotalAmount: () => {
            return getData(STORAGE_KEYS.receipts).reduce((sum, r) => sum + (r.amount || 0), 0);
        }
    };

    // -------- PUBLIC API --------
    return {
        initialize,
        generateId,
        saveData,
        getData,
        clearAll,
        getStats,
        Members,
        Enquiries,
        Staff,
        Payroll,
        Packages,
        Expenses,
        Receipts
    };
})();

// Auto-initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    StateManager.initialize();
});

// Alias for console access (e.g., StateManager.getStats() in DevTools)
window.StateManager = StateManager;
