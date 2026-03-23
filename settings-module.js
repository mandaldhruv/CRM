/**
 * ============================================================================
 * SETTINGS MODULE - UI Management
 * Handles company profile, packages, and tax configuration UI
 * ============================================================================
 */

const SettingsModule = (() => {
    let currentTab = 'company';

    /**
     * Initialize settings UI on page load
     */
    const initialize = () => {
        loadSettings();
        setupTabListeners();
        switchTab('company');
        console.log('[SettingsModule] ✓ Initialized');
    };

    /**
     * Setup tab click listeners
     */
    const setupTabListeners = () => {
        const tabButtons = document.querySelectorAll('.settings-tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.getAttribute('data-tab');
                switchTab(tabName);
            });
        });
    };

    /**
     * Switch between settings tabs
     */
    const switchTab = (tabName) => {
        currentTab = tabName;

        // Hide all panels
        document.querySelectorAll('.settings-tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });

        // Remove active class from all buttons
        document.querySelectorAll('.settings-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected panel
        const panel = document.getElementById(`tab-${tabName}`);
        if (panel) {
            panel.classList.add('active');
        }

        // Mark button as active
        const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        // Render tab content
        if (tabName === 'company') {
            renderCompanyProfileTab();
        } else if (tabName === 'packages') {
            renderPackagesTab();
        } else if (tabName === 'tax') {
            renderTaxTab();
        }
    };

    /**
     * Load and display current settings
     */
    const loadSettings = () => {
        const profile = SettingsManager.getCompanyProfile();
        const tax = SettingsManager.getTaxConfiguration();
        const packages = SettingsManager.getPackages();
        
        console.log('[SettingsModule] Loaded settings:', { profile, tax, packages });
    };

    /**
     * Render Company Profile Tab
     */
    const renderCompanyProfileTab = () => {
        const profile = SettingsManager.getCompanyProfile();
        const container = document.getElementById('tab-company');
        if (!container) return;

        const html = `
            <form id="company-profile-form" onsubmit="SettingsModule.saveCompanyProfile(event)">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                    <!-- Left Column -->
                    <div>
                        <div class="form-group">
                            <label>Gym Name *</label>
                            <input type="text" name="gymName" value="${profile.gymName}" required 
                                   placeholder="Enter gym name" class="form-input">
                        </div>

                        <div class="form-group">
                            <label>Phone *</label>
                            <input type="tel" name="phone" value="${profile.phone}" required 
                                   placeholder="Enter phone number" class="form-input">
                        </div>

                        <div class="form-group">
                            <label>Email *</label>
                            <input type="email" name="email" value="${profile.email}" required 
                                   placeholder="Enter email address" class="form-input">
                        </div>

                        <div class="form-group">
                            <label>GST/SAC Number *</label>
                            <input type="text" name="gstNumber" value="${profile.gstNumber}" required 
                                   placeholder="e.g., GST-XXXX123456" class="form-input">
                        </div>
                    </div>

                    <!-- Right Column -->
                    <div>
                        <div class="form-group">
                            <label>Logo URL</label>
                            <input type="url" name="logoUrl" value="${profile.logoUrl}" 
                                   placeholder="Image URL (optional)" class="form-input">
                            <small style="color: var(--on-surface-variant);">Full URL to gym logo (160x160 recommended)</small>
                        </div>

                        <div class="form-group">
                            <label>Logo Preview</label>
                            <div style="width: 160px; height: 160px; background: rgba(13, 28, 47, 0.05); 
                                        border-radius: 12px; overflow: hidden; display: flex; align-items: center; 
                                        justify-content: center; border: 2px dashed rgba(13, 28, 47, 0.2);">
                                <img src="${profile.logoUrl}" alt="Logo" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Full Address *</label>
                            <textarea name="fullAddress" required placeholder="Enter complete address" 
                                      class="form-input" style="grid-column: 1 / -1; resize: vertical; min-height: 100px;">${profile.fullAddress}</textarea>
                        </div>
                    </div>
                </div>

                <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                    <button type="submit" class="btn-primary">
                        <span class="material-icons-round">save</span> Save Company Profile
                    </button>
                    <button type="button" class="btn-secondary" onclick="SettingsModule.showPreview()">
                        <span class="material-icons-round">preview</span> Preview Invoice
                    </button>
                </div>
            </form>
        `;

        container.innerHTML = html;
    };

    /**
     * Render Tax Configuration Tab
     */
    const renderTaxTab = () => {
        const tax = SettingsManager.getTaxConfiguration();
        const container = document.getElementById('tab-tax');
        if (!container) return;

        const html = `
            <form id="tax-config-form" onsubmit="SettingsModule.saveTaxConfiguration(event)">
                <div style="max-width: 500px;">
                    <div class="form-group">
                        <label>Tax Type Label *</label>
                        <input type="text" name="taxLabel" value="${tax.taxLabel}" required 
                               placeholder="e.g., GST, VAT, or Tax" class="form-input">
                        <small style="color: var(--on-surface-variant);">Name of tax applied</small>
                    </div>

                    <div class="form-group">
                        <label>Tax Percentage * (${tax.taxPercentage}%)</label>
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <input type="range" id="tax-slider" name="taxPercentage" 
                                   value="${tax.taxPercentage}" min="0" max="50" 
                                   style="flex-grow: 1;" oninput="SettingsModule.updateTaxPreview()">
                            <div style="min-width: 80px; padding: 0.75rem 1rem; background: rgba(53, 37, 205, 0.1); 
                                        border-radius: 8px; text-align: center; font-weight: 700; color: var(--primary);">
                                <span id="tax-display">${tax.taxPercentage}</span>%
                            </div>
                        </div>
                        <div style="margin-top: 1.5rem; padding: 1rem; background: rgba(13, 28, 47, 0.05); 
                                    border-radius: 12px; border-left: 4px solid var(--primary);">
                            <small style="color: var(--on-surface-variant);">
                                💡 Example: If package is ₹1,000, tax will be ₹${(1000 * tax.taxPercentage / 100).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                            </small>
                        </div>
                    </div>

                    <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                        <button type="submit" class="btn-primary">
                            <span class="material-icons-round">save</span> Save Tax Configuration
                        </button>
                    </div>
                </div>
            </form>
        `;

        container.innerHTML = html;
    };

    /**
     * Render Packages & Courses Tab
     */
    const renderPackagesTab = () => {
        const packages = SettingsManager.getPackages();
        const container = document.getElementById('tab-packages');
        if (!container) return;

        const packageRows = packages.map((pkg, index) => `
            <div class="package-row" data-package-id="${pkg.id}">
                <div class="package-info">
                    <h4>${pkg.name}</h4>
                    <p>${pkg.durationMonths} month${pkg.durationMonths !== 1 ? 's' : ''} • Base: ₹${pkg.basePrice.toLocaleString('en-IN')}</p>
                </div>
                <div class="package-actions">
                    <button type="button" class="btn-secondary" style="padding: 8px 16px; font-size: 0.85rem;"
                            onclick="SettingsModule.editPackage('${pkg.id}')">
                        <span class="material-icons-round" style="font-size: 1rem;">edit</span>
                    </button>
                    <button type="button" class="btn-danger" style="padding: 8px 16px; font-size: 0.85rem; background: #ba1a1a; color: white;"
                            onclick="SettingsModule.deletePackage('${pkg.id}')">
                        <span class="material-icons-round" style="font-size: 1rem;">delete</span>
                    </button>
                </div>
            </div>
        `).join('');

        const html = `
            <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h3>Manage Packages & Courses</h3>
                    <button type="button" class="btn-primary" onclick="SettingsModule.openAddPackageForm()">
                        <span class="material-icons-round">add_circle</span> Add Package
                    </button>
                </div>

                <div id="packages-list" style="display: flex; flex-direction: column; gap: 1rem;">
                    ${packageRows}
                </div>

                ${packages.length === 0 ? `
                    <div style="text-align: center; padding: 3rem 1rem; color: var(--on-surface-variant);">
                        <span class="material-icons-round" style="font-size: 3rem; color: rgba(13, 28, 47, 0.3);">package2</span>
                        <p style="margin-top: 1rem;">No packages created yet</p>
                        <button type="button" class="btn-primary" style="margin-top: 1rem;" onclick="SettingsModule.openAddPackageForm()">
                            Create Your First Package
                        </button>
                    </div>
                ` : ''}

                <div id="package-form-container" style="display: none; margin-top: 2rem; padding: 2rem; 
                                                        background: rgba(13, 28, 47, 0.02); border-radius: 12px;">
                </div>
            </div>
        `;

        container.innerHTML = html;
    };

    /**
     * Open add package form
     */
    const openAddPackageForm = () => {
        const container = document.getElementById('package-form-container');
        if (!container) return;

        const html = `
            <div>
                <h4 style="margin-bottom: 1.5rem;">Add New Package</h4>
                <form id="add-package-form" onsubmit="SettingsModule.savePackage(event)">
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                        <div class="form-group">
                            <label>Package Name *</label>
                            <input type="text" name="name" placeholder="e.g., Annual Pass" required class="form-input">
                        </div>
                        <div class="form-group">
                            <label>Duration (Months) *</label>
                            <input type="number" name="durationMonths" placeholder="1 to 12" min="1" max="12" required class="form-input">
                        </div>
                        <div class="form-group">
                            <label>Base Price (₹) *</label>
                            <input type="number" name="basePrice" placeholder="0.00" min="0" step="0.01" required class="form-input">
                        </div>
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        <button type="submit" class="btn-primary">
                            <span class="material-icons-round">add</span> Add Package
                        </button>
                        <button type="button" class="btn-secondary" onclick="SettingsModule.closePackageForm()">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        `;

        container.innerHTML = html;
        container.style.display = 'block';
    };

    /**
     * Close package form
     */
    const closePackageForm = () => {
        const container = document.getElementById('package-form-container');
        if (container) {
            container.innerHTML = '';
            container.style.display = 'none';
        }
    };

    /**
     * Save new package
     */
    const savePackage = (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const packageData = {
            name: formData.get('name'),
            durationMonths: formData.get('durationMonths'),
            basePrice: formData.get('basePrice')
        };

        SettingsManager.addPackage(packageData);
        UIComponents.showToast('Package added successfully!', 'success', 'Package Created');
        closePackageForm();
        renderPackagesTab();
    };

    /**
     * Edit package
     */
    const editPackage = (packageId) => {
        // Placeholder for edit functionality
        UIComponents.showToast('Edit functionality coming soon', 'info', 'WIP');
    };

    /**
     * Delete package
     */
    const deletePackage = (packageId) => {
        if (confirm('Are you sure you want to delete this package? This action cannot be undone.')) {
            SettingsManager.deletePackage(packageId);
            UIComponents.showToast('Package deleted!', 'success', 'Package Removed');
            renderPackagesTab();
        }
    };

    /**
     * Save company profile
     */
    const saveCompanyProfile = (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const profileData = {
            gymName: formData.get('gymName'),
            logoUrl: formData.get('logoUrl'),
            fullAddress: formData.get('fullAddress'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            gstNumber: formData.get('gstNumber')
        };

        SettingsManager.saveCompanyProfile(profileData);
        UIComponents.showToast('Company profile saved!', 'success', 'Settings Updated');
        loadSettings();
    };

    /**
     * Save tax configuration
     */
    const saveTaxConfiguration = (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const taxData = {
            taxPercentage: formData.get('taxPercentage'),
            taxLabel: formData.get('taxLabel')
        };

        SettingsManager.saveTaxConfiguration(taxData);
        UIComponents.showToast('Tax configuration saved!', 'success', 'Settings Updated');
        loadSettings();
    };

    /**
     * Update tax preview on slider change
     */
    const updateTaxPreview = () => {
        const slider = document.getElementById('tax-slider');
        const display = document.getElementById('tax-display');
        if (slider && display) {
            const value = slider.value;
            display.textContent = value;
        }
    };

    /**
     * Show invoice preview (with current settings)
     */
    const showPreview = () => {
        const profile = SettingsManager.getCompanyProfile();
        const previewHTML = `
            <div style="padding: 2rem; background: white;">
                <div style="max-width: 600px; margin: 0 auto; border: 1px solid rgba(13, 28, 47, 0.1); 
                            border-radius: 12px; padding: 2rem;">
                    <div style="text-align: center; margin-bottom: 2rem;">
                        ${profile.logoUrl ? `<img src="${profile.logoUrl}" alt="Logo" style="max-height: 80px; margin-bottom: 1rem;">` : ''}
                        <h2 style="margin: 0; color: var(--on-surface);">${profile.gymName}</h2>
                        <p style="margin: 0.5rem 0 0 0; color: var(--on-surface-variant); font-size: 0.9rem;">
                            ${profile.fullAddress}
                        </p>
                        <p style="margin: 0.25rem 0 0 0; color: var(--on-surface-variant); font-size: 0.85rem;">
                            📞 ${profile.phone} | 📧 ${profile.email}
                        </p>
                        <p style="margin: 0.25rem 0 0 0; color: var(--on-surface-variant); font-size: 0.85rem;">
                            Tax ID: ${profile.gstNumber}
                        </p>
                    </div>
                </div>
                <p style="text-align: center; margin-top: 1.5rem; color: var(--on-surface-variant); font-size: 0.85rem;">
                    ✓ This information will appear on all invoices
                </p>
            </div>
        `;

        UIComponents.openModal('Invoice Preview', { content: previewHTML });
    };

    // -------- PUBLIC API --------
    return {
        initialize,
        switchTab,
        openAddPackageForm,
        closePackageForm,
        savePackage,
        editPackage,
        deletePackage,
        saveCompanyProfile,
        saveTaxConfiguration,
        updateTaxPreview,
        showPreview,
        loadSettings,
        renderCompanyProfileTab,
        renderPackagesTab,
        renderTaxTab
    };
})();

// Initialize on DOM ready
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof SettingsModule !== 'undefined') {
            SettingsModule.initialize();
        }
    }, 100);
});
