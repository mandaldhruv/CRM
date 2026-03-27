/**
 * ============================================================================
 * SETTINGS MODULE - UI Management
 * Handles company profile, packages, and tax configuration UI
 * ============================================================================
 */

const SettingsModule = (() => {
    const PACKAGES_STORAGE_KEY = 'ka_packages';
    const DEFAULT_PACKAGES = [
        { id: 'basic-3m', name: 'Basic 3 Months', durationMonths: 3, price: 3000 },
        { id: 'premium-6m', name: 'Premium 6 Months', durationMonths: 6, price: 5400 }
    ];

    let currentTab = 'company';
    let eventsBound = false;
    let packages = [];

    const escapeHtml = (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const initializePackagesState = () => {
        const storedPackages = typeof StateManager !== 'undefined' && StateManager.Packages
            ? StateManager.Packages.getAll()
            : JSON.parse(localStorage.getItem(PACKAGES_STORAGE_KEY)) || [];
        packages = Array.isArray(storedPackages) ? storedPackages : [];

        if (packages.length === 0) {
            packages = [...DEFAULT_PACKAGES];
            persistPackages();
        }
    };

    const persistPackages = () => {
        localStorage.setItem(PACKAGES_STORAGE_KEY, JSON.stringify(packages));
    };

    const getPackageById = (packageId) => {
        return packages.find((pkg) => String(pkg.id) === String(packageId)) || null;
    };

    const openPackageModal = (packageId = '') => {
        const modal = document.getElementById('package-modal');
        const title = document.getElementById('package-modal-title');
        const hiddenId = document.getElementById('package-id');
        const nameInput = document.getElementById('package-name');
        const durationInput = document.getElementById('package-duration');
        const priceInput = document.getElementById('package-price');
        const descriptionInput = document.getElementById('package-description');

        if (!modal || !title || !hiddenId || !nameInput || !durationInput || !priceInput || !descriptionInput) return;

        const selectedPackage = packageId ? getPackageById(packageId) : null;
        title.textContent = selectedPackage ? 'Edit Package' : 'Add Package';
        hiddenId.value = selectedPackage?.id || '';
        nameInput.value = selectedPackage?.name || '';
        durationInput.value = selectedPackage?.durationMonths || '';
        priceInput.value = selectedPackage?.price ?? selectedPackage?.basePrice ?? '';
        descriptionInput.value = selectedPackage?.description || '';

        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        nameInput.focus();
    };

    const closePackageModal = () => {
        closeModal('package-modal');
    };

    const renderPackages = () => {
        const container = document.getElementById('packages-list-container');
        if (!container) return;

        if (packages.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem 1rem; color: var(--on-surface-variant);">
                    <span class="material-icons-round" style="font-size: 3rem; color: rgba(13, 28, 47, 0.3);">package2</span>
                    <p style="margin-top: 1rem;">No packages created yet</p>
                    <button type="button" class="btn-primary" data-package-action="add" style="margin-top: 1rem;">
                        Create Your First Package
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = packages.map((pkg) => `
            <div class="package-row" data-package-id="${pkg.id}">
                <div class="package-info">
                    <h4>${escapeHtml(pkg.name)}</h4>
                    <p>${pkg.durationMonths} month${pkg.durationMonths !== 1 ? 's' : ''} • Base: ${formatINR(pkg.price)}</p>
                </div>
                <div class="package-actions">
                    <button type="button" class="btn-secondary edit-btn" data-id="${pkg.id}" aria-label="Edit package" style="padding: 8px 16px; font-size: 0.85rem;">
                        <span class="material-icons-round" style="font-size: 1rem;">edit</span>
                    </button>
                    <button type="button" class="btn-danger delete-btn" data-id="${pkg.id}" aria-label="Delete package" style="padding: 8px 16px; font-size: 0.85rem;">
                        <span class="material-icons-round" style="font-size: 1rem;">delete</span>
                    </button>
                </div>
            </div>
        `).join('');
    };

    const bindPackageEvents = () => {
        if (eventsBound) return;
        eventsBound = true;

        const packagesContainer = document.getElementById('tab-packages');
        const packageForm = document.getElementById('package-form');

        packagesContainer?.addEventListener('click', (event) => {
            const addButton = event.target.closest('[data-package-action="add"]');
            if (addButton) {
                openPackageModal();
                return;
            }

            const editButton = event.target.closest('.edit-btn');
            if (editButton) {
                const packageId = editButton.dataset.id;
                if (!packageId) return;
                openPackageModal(packageId);
                return;
            }

            const deleteButton = event.target.closest('.delete-btn');
            if (deleteButton) {
                const packageId = deleteButton.dataset.id;
                if (!packageId) return;
                deletePackage(packageId, true);
            }
        });

        packageForm?.addEventListener('submit', (event) => {
            event.preventDefault();

            const hiddenId = document.getElementById('package-id');
            const nameInput = document.getElementById('package-name');
            const durationInput = document.getElementById('package-duration');
            const priceInput = document.getElementById('package-price');
            const descriptionInput = document.getElementById('package-description');

            if (!hiddenId || !nameInput || !durationInput || !priceInput || !descriptionInput) return;

            const name = nameInput.value.trim();
            const durationMonths = Number(durationInput.value);
            const price = Number(priceInput.value);
            const description = descriptionInput.value.trim();
            const existingId = hiddenId.value.trim();

            if (!name || durationMonths <= 0 || price < 0) {
                UIComponents.showToast('Please enter a valid package name, duration, and price.', 'error', 'Validation Error');
                return;
            }

            const duplicate = packages.some((pkg) =>
                String(pkg.id) !== String(existingId) &&
                pkg.name.trim().toLowerCase() === name.toLowerCase() &&
                Number(pkg.durationMonths) === durationMonths
            );

            if (duplicate) {
                UIComponents.showToast('A package with the same name and duration already exists.', 'error', 'Duplicate Package');
                return;
            }

            if (existingId) {
                packages = packages.map((pkg) => (
                    String(pkg.id) === String(existingId)
                        ? { ...pkg, name, durationMonths, price, description }
                        : pkg
                ));
            } else {
                packages.push({
                    id: Date.now(),
                    name,
                    durationMonths,
                    price,
                    description
                });
            }

            persistPackages();
            renderPackages();
            closePackageModal();
            UIComponents.showToast(
                existingId ? 'Package updated successfully!' : 'Package added successfully!',
                'success',
                existingId ? 'Package Updated' : 'Package Created'
            );
        });
    };

    /**
     * Initialize settings UI on page load
     */
    const initialize = () => {
        initializePackagesState();
        loadSettings();
        setupTabListeners();
        bindPackageEvents();
        switchTab('company');
        console.log('[SettingsModule] Initialized');
    };

    /**
     * Setup tab click listeners
     */
    const setupTabListeners = () => {
        const tabButtons = document.querySelectorAll('.settings-tab-btn');
        tabButtons.forEach((button) => {
            if (button.dataset.bound === 'true') return;
            button.dataset.bound = 'true';
            button.addEventListener('click', () => {
                const tabName = button.getAttribute('data-tab');
                switchTab(tabName);
            });
        });
    };

    /**
     * Switch between settings tabs
     */
    const switchTab = (tabName) => {
        currentTab = tabName;

        document.querySelectorAll('.settings-tab-panel').forEach((panel) => {
            panel.classList.remove('active');
        });

        document.querySelectorAll('.settings-tab-btn').forEach((button) => {
            button.classList.remove('active');
        });

        const panel = document.getElementById(`tab-${tabName}`);
        if (panel) {
            panel.classList.add('active');
        }

        const activeButton = document.querySelector(`.settings-tab-btn[data-tab="${tabName}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }

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
        console.log('[SettingsModule] Loaded settings:', { profile, tax, packages });
    };

    /**
     * Render Company Profile Tab
     */
    const renderCompanyProfileTab = () => {
        const profile = SettingsManager.getCompanyProfile();
        const container = document.getElementById('tab-company');
        if (!container) return;

        container.innerHTML = `
            <form id="company-profile-form" onsubmit="SettingsModule.saveCompanyProfile(event)">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                    <div>
                        <div class="form-group">
                            <label>Gym Name *</label>
                            <input type="text" name="gymName" value="${escapeHtml(profile.gymName)}" required placeholder="Enter gym name" class="form-input">
                        </div>
                        <div class="form-group">
                            <label>Phone *</label>
                            <input type="tel" name="phone" value="${escapeHtml(profile.phone)}" required placeholder="Enter phone number" class="form-input">
                        </div>
                        <div class="form-group">
                            <label>Email *</label>
                            <input type="email" name="email" value="${escapeHtml(profile.email)}" required placeholder="Enter email address" class="form-input">
                        </div>
                        <div class="form-group">
                            <label>GST/SAC Number *</label>
                            <input type="text" name="gstNumber" value="${escapeHtml(profile.gstNumber)}" required placeholder="e.g., GST-XXXX123456" class="form-input">
                        </div>
                    </div>

                    <div>
                        <div class="form-group">
                            <label>Logo URL</label>
                            <input type="url" name="logoUrl" value="${escapeHtml(profile.logoUrl)}" placeholder="Image URL (optional)" class="form-input">
                            <small style="color: var(--on-surface-variant);">Full URL to gym logo (160x160 recommended)</small>
                        </div>

                        <div class="form-group">
                            <label for="company-signature-url">Digital Signature Image URL</label>
                            <input type="url" id="company-signature-url" name="signatureUrl" value="${escapeHtml(profile.signatureUrl || '')}" placeholder="Signature image URL (optional)" class="form-input">
                            <small style="color: var(--on-surface-variant);">Full URL to the signature image used on invoices.</small>
                        </div>

                        <div class="form-group">
                            <label>Logo Preview</label>
                            <div style="width: 160px; height: 160px; background: rgba(13, 28, 47, 0.05); border-radius: 12px; overflow: hidden; display: flex; align-items: center; justify-content: center; border: 2px dashed rgba(13, 28, 47, 0.2);">
                                <img src="${escapeHtml(profile.logoUrl)}" alt="Logo" style="max-width: 100%; max-height: 100%; object-fit: contain;" onerror="this.style.display='none'">
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Signature Preview</label>
                            <div style="width: 220px; height: 100px; background: rgba(13, 28, 47, 0.05); border-radius: 12px; overflow: hidden; display: flex; align-items: center; justify-content: center; border: 2px dashed rgba(13, 28, 47, 0.2); padding: 0.75rem;">
                                ${profile.signatureUrl
                                    ? `<img src="${escapeHtml(profile.signatureUrl)}" alt="Signature" style="max-width: 100%; max-height: 100%; object-fit: contain;" onerror="this.style.display='none'">`
                                    : '<span style="color: var(--on-surface-variant); font-size: 0.85rem;">No signature added</span>'}
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Full Address *</label>
                            <textarea name="fullAddress" required placeholder="Enter complete address" class="form-input" style="grid-column: 1 / -1; resize: vertical; min-height: 100px;">${escapeHtml(profile.fullAddress)}</textarea>
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
    };

    /**
     * Render Packages & Courses Tab
     */
    const renderPackagesTab = () => {
        const container = document.getElementById('tab-packages');
        if (!container) return;

        container.innerHTML = `
            <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h3>Manage Packages & Courses</h3>
                    <button type="button" class="btn-primary" data-package-action="add">
                        <span class="material-icons-round">add_circle</span> Add Package
                    </button>
                </div>
                <div id="packages-list-container" style="display: flex; flex-direction: column; gap: 1rem;"></div>
            </div>
        `;

        renderPackages();
    };

    /**
     * Render Tax Configuration Tab
     */
    const renderTaxTab = () => {
        const tax = SettingsManager.getTaxConfiguration();
        const container = document.getElementById('tab-tax');
        if (!container) return;

        container.innerHTML = `
            <form id="tax-config-form" onsubmit="SettingsModule.saveTaxConfiguration(event)">
                <div style="max-width: 500px;">
                    <div class="form-group">
                        <label>Tax Type Label *</label>
                        <input type="text" name="taxLabel" value="${escapeHtml(tax.taxLabel)}" required placeholder="e.g., GST, VAT, or Tax" class="form-input">
                        <small style="color: var(--on-surface-variant);">Name of tax applied</small>
                    </div>

                    <div class="form-group">
                        <label>Tax Percentage * (${tax.taxPercentage}%)</label>
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <input type="range" id="tax-slider" name="taxPercentage" value="${tax.taxPercentage}" min="0" max="50" style="flex-grow: 1;" oninput="SettingsModule.updateTaxPreview()">
                            <div style="min-width: 80px; padding: 0.75rem 1rem; background: rgba(53, 37, 205, 0.1); border-radius: 8px; text-align: center; font-weight: 700; color: var(--primary);">
                                <span id="tax-display">${tax.taxPercentage}</span>%
                            </div>
                        </div>
                        <div style="margin-top: 1.5rem; padding: 1rem; background: rgba(13, 28, 47, 0.05); border-radius: 12px; border-left: 4px solid var(--primary);">
                            <small style="color: var(--on-surface-variant);">
                                Example: If package is ${formatINR(1000)}, tax will be ${formatINR(1000 * tax.taxPercentage / 100)}
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
    };

    const openAddPackageForm = () => {
        openPackageModal();
    };

    const closePackageForm = () => {
        closePackageModal();
    };

    const savePackage = () => {
        document.getElementById('package-form')?.requestSubmit();
    };
    const editPackage = (packageId) => {
        openPackageModal(packageId);
    };

    const deletePackage = (packageId, confirmDelete = false) => {
        const selectedPackage = getPackageById(packageId);
        if (!selectedPackage) {
            UIComponents.showToast('Package not found.', 'error', 'Delete Failed');
            return;
        }

        if (confirmDelete) {
            const confirmed = window.confirm('Are you sure you want to delete this package?');
            if (!confirmed) return;
        }

        packages = packages.filter((pkg) => String(pkg.id) !== String(packageId));
        persistPackages();
        renderPackages();
        UIComponents.showToast('Package deleted successfully!', 'success', 'Package Removed');
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
            signatureUrl: formData.get('signatureUrl'),
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
        renderTaxTab();
    };

    const updateTaxPreview = () => {
        const slider = document.getElementById('tax-slider');
        const display = document.getElementById('tax-display');
        if (slider && display) {
            display.textContent = slider.value;
        }
    };

    const showPreview = () => {
        const profile = SettingsManager.getCompanyProfile();
        const previewHTML = `
            <div style="padding: 2rem; background: white;">
                <div style="max-width: 600px; margin: 0 auto; border: 1px solid rgba(13, 28, 47, 0.1); border-radius: 12px; padding: 2rem;">
                    <div style="text-align: center; margin-bottom: 2rem;">
                        ${profile.logoUrl ? `<img src="${escapeHtml(profile.logoUrl)}" alt="Logo" style="max-height: 80px; margin-bottom: 1rem;" onerror="this.style.display='none'">` : ''}
                        <h2 style="margin: 0; color: var(--on-surface);">${escapeHtml(profile.gymName)}</h2>
                        <p style="margin: 0.5rem 0 0 0; color: var(--on-surface-variant); font-size: 0.9rem;">${escapeHtml(profile.fullAddress)}</p>
                        <p style="margin: 0.25rem 0 0 0; color: var(--on-surface-variant); font-size: 0.85rem;">Phone: ${escapeHtml(profile.phone)} | Email: ${escapeHtml(profile.email)}</p>
                        <p style="margin: 0.25rem 0 0 0; color: var(--on-surface-variant); font-size: 0.85rem;">Tax ID: ${escapeHtml(profile.gstNumber)}</p>
                    </div>
                    ${profile.signatureUrl ? `
                        <div style="text-align: right; margin-top: 2rem;">
                            <img src="${escapeHtml(profile.signatureUrl)}" alt="Digital Signature" style="max-height: 72px; max-width: 220px; object-fit: contain;" onerror="this.style.display='none'">
                        </div>
                    ` : ''}
                </div>
                <p style="text-align: center; margin-top: 1.5rem; color: var(--on-surface-variant); font-size: 0.85rem;">This information will appear on all invoices</p>
            </div>
        `;

        UIComponents.openModal('Invoice Preview', { content: previewHTML });
    };

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

window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof SettingsModule !== 'undefined') {
            SettingsModule.initialize();
        }
    }, 100);
});
