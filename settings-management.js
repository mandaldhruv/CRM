/**
 * ============================================================================
 * SETTINGS MANAGEMENT MODULE
 * Master Configuration for Gym CRM (Company Profile, Packages, Tax)
 * ============================================================================
 */

const SettingsManager = (() => {
    const STORAGE_KEY = 'ka_settings';
    const SAFE_IMAGE_FALLBACK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    const sanitizeImageUrl = (value = '') => {
        const normalizedValue = String(value || '').trim();

        if (!normalizedValue) {
            return '';
        }

        if (normalizedValue.includes('via.placeholder.com')) {
            return SAFE_IMAGE_FALLBACK;
        }

        return normalizedValue;
    };

    // Default settings structure
    const DEFAULT_SETTINGS = {
        companyProfile: {
            gymName: 'Kinetic Atelier',
            logoUrl: SAFE_IMAGE_FALLBACK,
            signatureUrl: '',
            fullAddress: '123 Fitness Street, Gym City, State 12345',
            phone: '+91 9876543210',
            email: 'info@kineticatelier.com',
            gstNumber: 'GST-XXXX123456'
        },
        taxConfiguration: {
            taxPercentage: 18,
            taxLabel: 'GST'
        },
        packages: [
            {
                id: 'pkg_standard',
                name: 'Standard',
                durationMonths: 1,
                basePrice: 2500
            },
            {
                id: 'pkg_quarterly',
                name: 'Quarterly',
                durationMonths: 3,
                basePrice: 7000
            },
            {
                id: 'pkg_halfyear',
                name: 'Half Yearly',
                durationMonths: 6,
                basePrice: 13000
            },
            {
                id: 'pkg_annual',
                name: 'Annual',
                durationMonths: 12,
                basePrice: 24000
            }
        ]
    };

    /**
     * Initialize settings - create if not exists
     */
    const initialize = () => {
        if (!localStorage.getItem(STORAGE_KEY)) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
            console.log('[SettingsManager] ✓ Initialized with default settings');
        }
    };

    /**
     * Get all settings
     */
    const getAll = () => {
        try {
            const settings = localStorage.getItem(STORAGE_KEY);
            return settings ? JSON.parse(settings) : DEFAULT_SETTINGS;
        } catch (error) {
            console.error('[SettingsManager] Error reading settings:', error);
            return DEFAULT_SETTINGS;
        }
    };

    /**
     * Get company profile
     */
    const getCompanyProfile = () => {
        const profile = getAll().companyProfile;
        return {
            ...profile,
            logoUrl: sanitizeImageUrl(profile.logoUrl),
            signatureUrl: sanitizeImageUrl(profile.signatureUrl)
        };
    };

    /**
     * Get tax configuration
     */
    const getTaxConfiguration = () => {
        return getAll().taxConfiguration;
    };

    /**
     * Get all packages
     */
    const getPackages = () => {
        return getAll().packages || [];
    };

    /**
     * Get single package by ID
     */
    const getPackageById = (packageId) => {
        const packages = getPackages();
        return packages.find(p => p.id === packageId);
    };

    /**
     * Save company profile
     */
    const saveCompanyProfile = (profileData) => {
        try {
            const settings = getAll();
            settings.companyProfile = {
                gymName: profileData.gymName || settings.companyProfile.gymName,
                logoUrl: sanitizeImageUrl(profileData.logoUrl || settings.companyProfile.logoUrl),
                signatureUrl: sanitizeImageUrl(profileData.signatureUrl || settings.companyProfile.signatureUrl || ''),
                fullAddress: profileData.fullAddress || settings.companyProfile.fullAddress,
                phone: profileData.phone || settings.companyProfile.phone,
                email: profileData.email || settings.companyProfile.email,
                gstNumber: profileData.gstNumber || settings.companyProfile.gstNumber
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
            console.log('[SettingsManager] ✓ Company profile saved');
            return true;
        } catch (error) {
            console.error('[SettingsManager] Error saving company profile:', error);
            return false;
        }
    };

    /**
     * Save tax configuration
     */
    const saveTaxConfiguration = (taxData) => {
        try {
            const settings = getAll();
            settings.taxConfiguration = {
                taxPercentage: parseFloat(taxData.taxPercentage) || 18,
                taxLabel: taxData.taxLabel || 'GST'
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
            console.log('[SettingsManager] ✓ Tax configuration saved');
            return true;
        } catch (error) {
            console.error('[SettingsManager] Error saving tax configuration:', error);
            return false;
        }
    };

    /**
     * Add new package
     */
    const addPackage = (packageData) => {
        try {
            const settings = getAll();
            const newPackage = {
                id: 'pkg_' + Date.now(),
                name: packageData.name,
                durationMonths: parseInt(packageData.durationMonths),
                basePrice: parseFloat(packageData.basePrice)
            };
            settings.packages.push(newPackage);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
            console.log('[SettingsManager] ✓ Package added:', newPackage.id);
            return newPackage;
        } catch (error) {
            console.error('[SettingsManager] Error adding package:', error);
            return null;
        }
    };

    /**
     * Update package
     */
    const updatePackage = (packageId, packageData) => {
        try {
            const settings = getAll();
            const packageIndex = settings.packages.findIndex(p => p.id === packageId);
            if (packageIndex !== -1) {
                settings.packages[packageIndex] = {
                    id: packageId,
                    name: packageData.name,
                    durationMonths: parseInt(packageData.durationMonths),
                    basePrice: parseFloat(packageData.basePrice)
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
                console.log('[SettingsManager] ✓ Package updated:', packageId);
                return true;
            }
            return false;
        } catch (error) {
            console.error('[SettingsManager] Error updating package:', error);
            return false;
        }
    };

    /**
     * Delete package
     */
    const deletePackage = (packageId) => {
        try {
            const settings = getAll();
            settings.packages = settings.packages.filter(p => p.id !== packageId);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
            console.log('[SettingsManager] ✓ Package deleted:', packageId);
            return true;
        } catch (error) {
            console.error('[SettingsManager] Error deleting package:', error);
            return false;
        }
    };

    /**
     * Reset to default settings
     */
    const resetToDefaults = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
        console.log('[SettingsManager] ✓ Reset to default settings');
        return true;
    };

    /**
     * Export settings as JSON
     */
    const exportSettings = () => {
        const settings = getAll();
        return JSON.stringify(settings, null, 2);
    };

    /**
     * Import settings from JSON
     */
    const importSettings = (jsonString) => {
        try {
            const importedSettings = JSON.parse(jsonString);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(importedSettings));
            console.log('[SettingsManager] ✓ Settings imported');
            return true;
        } catch (error) {
            console.error('[SettingsManager] Error importing settings:', error);
            return false;
        }
    };

    // -------- PUBLIC API --------
    return {
        initialize,
        getAll,
        getCompanyProfile,
        getTaxConfiguration,
        getPackages,
        getPackageById,
        saveCompanyProfile,
        saveTaxConfiguration,
        addPackage,
        updatePackage,
        deletePackage,
        resetToDefaults,
        exportSettings,
        importSettings
    };
})();

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    SettingsManager.initialize();
    console.log('[SettingsManager] %cInitialization complete', 'color: #2e7d32; font-weight: bold');
});
