/**
 * ============================================================================
 * KINETIC ATELIER - UI COMPONENTS
 * Glassmorphism Modal/Drawer + Toast Notification System
 * ============================================================================
 */

const UIComponents = (() => {
    let currentForm = null;
    let currentEntity = null;

    const formatDateInputValue = (value) => {
        if (value === null || value === undefined) {
            return '';
        }

        const rawValue = String(value).trim();
        if (!rawValue) {
            return '';
        }

        if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
            return rawValue;
        }

        if (rawValue.includes('T')) {
            return rawValue.split('T')[0];
        }

        const parsed = new Date(rawValue);
        if (Number.isNaN(parsed.getTime())) {
            return '';
        }

        const year = parsed.getFullYear();
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const day = String(parsed.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const setSafeInputValue = (input, value) => {
        if (!input) {
            return;
        }

        if (input.type === 'date') {
            input.value = formatDateInputValue(value);
            return;
        }

        input.value = value ?? '';
    };

    const ValidationUtils = {
        emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
        phoneRegex: /^\d{10}$/,

        normalizePhone(value = '') {
            return String(value).replace(/\D/g, '');
        },

        getValidationType(input) {
            if (!input) return '';
            if (input.dataset.validation) return input.dataset.validation;

            const fieldName = (input.name || '').toLowerCase();
            if (input.type === 'email' || fieldName.includes('email')) {
                return 'email';
            }

            if (fieldName.includes('phone') || fieldName.includes('contact')) {
                return 'phone';
            }

            return '';
        },

        getErrorElement(input) {
            if (!input || !input.parentElement) return null;

            let errorElement = input.parentElement.querySelector('.field-error');
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.className = 'field-error';
                errorElement.setAttribute('aria-live', 'polite');
                input.insertAdjacentElement('afterend', errorElement);
            }

            return errorElement;
        },

        showError(input, message) {
            const errorElement = this.getErrorElement(input);
            if (errorElement) {
                errorElement.textContent = message;
            }

            input.classList.add('input-invalid');
            input.setAttribute('aria-invalid', 'true');
        },

        clearError(input) {
            const errorElement = this.getErrorElement(input);
            if (errorElement) {
                errorElement.textContent = '';
            }

            input.classList.remove('input-invalid');
            input.removeAttribute('aria-invalid');
        },

        validateField(input) {
            if (!input || input.disabled || input.type === 'hidden') {
                return true;
            }

            const value = input.value.trim();
            const validationType = this.getValidationType(input);

            if (input.hasAttribute('required') && !value) {
                this.showError(input, 'This field is required.');
                return false;
            }

            if (!value) {
                this.clearError(input);
                return true;
            }

            if (validationType === 'phone' && !this.phoneRegex.test(this.normalizePhone(value))) {
                this.showError(input, 'Enter exactly 10 digits.');
                return false;
            }

            if (validationType === 'email' && !this.emailRegex.test(value)) {
                this.showError(input, 'Enter a valid email address.');
                return false;
            }

            this.clearError(input);
            return true;
        },

        validateForm(form) {
            if (!form) return true;

            const fields = form.querySelectorAll('input, select, textarea');
            let isValid = true;

            fields.forEach(field => {
                if (!this.validateField(field)) {
                    isValid = false;
                }
            });

            return isValid;
        },

        attachLiveValidation(container) {
            if (!container || container.dataset.validationBound === 'true') {
                return;
            }

            container.dataset.validationBound = 'true';
            container.addEventListener('input', (event) => {
                if (event.target.matches('input, textarea')) {
                    this.validateField(event.target);
                }
            });

            container.addEventListener('change', (event) => {
                if (event.target.matches('input, select, textarea')) {
                    this.validateField(event.target);
                }
            });
        }
    };

    window.ValidationUtils = ValidationUtils;

    // -------- DOM REFERENCES --------
    const DOM = {
        overlay: () => document.getElementById('modal-overlay'),
        drawer: () => document.getElementById('modal-drawer'),
        title: () => document.getElementById('modal-title'),
        body: () => document.getElementById('modal-body'),
        footer: () => document.getElementById('modal-footer'),
        container: () => document.getElementById('toast-container')
    };

    // -------- MODAL/DRAWER SYSTEM --------
    
    /**
     * Opens modal drawer with form and title
     * Supports both old format (fields) and new format (content + buttons)
     * @param {string} title - Modal title
     * @param {object} formConfig - Form configuration (with fields OR content/buttons)
     * @param {string} entity - Entity type (members, enquiries, etc)
     * @param {function} onSubmit - Callback on form submission
     */
    const resolveModalElement = (modalRef = 'modal-drawer') => {
        if (typeof modalRef === 'string') {
            return document.getElementById(modalRef);
        }

        if (!(modalRef instanceof Element)) {
            return null;
        }

        const modalRootId = modalRef.dataset?.modalRoot;
        if (modalRootId) {
            return document.getElementById(modalRootId);
        }

        return modalRef;
    };

    const closeModalById = (modalRef = 'modal-drawer') => {
        const modal = resolveModalElement(modalRef);
        if (!modal) return;

        modal.querySelectorAll('video').forEach((video) => {
            const stream = video.srcObject;
            if (stream && typeof stream.getTracks === 'function') {
                stream.getTracks().forEach((track) => track.stop());
            }
            video.srcObject = null;
        });

        modal.querySelectorAll('form').forEach((form) => {
            form.reset();
            form.querySelectorAll('input[type="date"]').forEach((input) => {
                setSafeInputValue(input, input.value);
            });
        });

        modal.classList.remove('active');

        if (modal.id === 'modal-drawer') {
            DOM.overlay()?.classList.remove('active');
            currentForm = null;
            currentEntity = null;
        }

        if (modal.id === 'package-modal') {
            modal.setAttribute('aria-hidden', 'true');
            const hiddenId = document.getElementById('package-id');
            if (hiddenId) hiddenId.value = '';
        }

        if (modal.id === 'payroll-modal-overlay') {
            modal.setAttribute('aria-hidden', 'true');
        }

        if (modal.hasAttribute('aria-hidden')) {
            modal.setAttribute('aria-hidden', 'true');
        }

        document.dispatchEvent(new CustomEvent('app:modal-closed', {
            detail: { modalId: modal.id || '' }
        }));
    };

    window.closeModal = closeModalById;

    document.addEventListener('DOMContentLoaded', () => {
        document.body.addEventListener('click', async (e) => {
            if (e.target.closest('.premium-close-btn') || e.target.closest('.btn-cancel')) {
                e.preventDefault();
                console.log('Close/Cancel clicked!');

                const container = e.target.closest('.modal-container, .drawer-container, .modal, .drawer-content, .details-drawer');
                const overlay = e.target.closest('.payroll-modal-overlay, .modal-overlay, .package-modal, .details-drawer-overlay, .invoice-preview-modal');

                if (container) {
                    const modalRootId = container.dataset?.modalRoot || container.id;
                    if (modalRootId && typeof window.closeModal === 'function') {
                        window.closeModal(modalRootId);
                    } else {
                        container.classList.remove('active');
                        container.style.display = 'none';
                        const form = container.querySelector('form');
                        if (form) form.reset();
                    }

                    if (container.classList.contains('details-drawer')) {
                        document.getElementById('details-drawer-overlay')?.classList.remove('active');
                    }
                } else if (overlay && overlay.dataset?.closeTarget && typeof window.closeModal === 'function') {
                    window.closeModal(overlay.dataset.closeTarget);
                } else {
                    console.error('Could not find parent modal container to close.');
                }

                return;
            }

            if (e.target.closest('#btn-download-pdf')) {
                e.preventDefault();
                console.log('PDF Download clicked!');
                await window.exportToPDF?.();
                return;
            }

            const sendWishAllTrigger = e.target.closest('[data-action="send-wish-all"]');
            if (sendWishAllTrigger) {
                e.preventDefault();
                let members = [];

                try {
                    members = JSON.parse(decodeURIComponent(sendWishAllTrigger.dataset.members || '[]'));
                } catch (error) {
                    console.error('Unable to parse birthday bulk-send payload.', error);
                    return;
                }

                const validMembers = members
                    .map((member) => ({
                        phone: String(member.phone || '').replace(/\D/g, '').slice(-10),
                        name: String(member.name || 'there').trim() || 'there'
                    }))
                    .filter((member) => member.phone);

                if (validMembers.length === 0) {
                    console.error('Send Wish All action is missing valid phone numbers.');
                    return;
                }

                const companyProfile = SettingsManager.getCompanyProfile();
                const gymName = companyProfile.gymName || 'our Gym';
                const cake = String.fromCodePoint(0x1F382);
                const party = String.fromCodePoint(0x1F389);

                validMembers.forEach((member) => {
                    const rawMessage = `Happy Birthday ${member.name}! ${cake} Wishing you a fantastic day and a great year of fitness ahead from all of us at ${gymName}! ${party}`;
                    const whatsappUrl = `https://web.whatsapp.com/send?phone=91${member.phone}&text=${encodeURIComponent(rawMessage)}`;
                    console.log(rawMessage);
                    console.log(whatsappUrl);
                    window.open(whatsappUrl, '_blank');
                });
                return;
            }

            const safeBirthdayWishTrigger = e.target.closest('[data-action="wish-birthday"]');
            if (safeBirthdayWishTrigger) {
                e.preventDefault();
                const phone = String(safeBirthdayWishTrigger.dataset.phone || '').replace(/\D/g, '').slice(-10);
                const name = String(safeBirthdayWishTrigger.dataset.name || 'there').trim() || 'there';

                if (!phone) {
                    console.error('Birthday wish action is missing a valid phone number.');
                    return;
                }

                const companyProfile = SettingsManager.getCompanyProfile();
                const gymName = companyProfile.gymName || 'our Gym';
                const cake = String.fromCodePoint(0x1F382);
                const party = String.fromCodePoint(0x1F389);
                const rawMessage = `Happy Birthday ${name}! ${cake} Wishing you a fantastic day and a great year of fitness ahead from all of us at ${gymName}! ${party}`;
                const whatsappUrl = `https://web.whatsapp.com/send?phone=91${phone}&text=${encodeURIComponent(rawMessage)}`;
                console.log(rawMessage);
                console.log(whatsappUrl);
                window.open(whatsappUrl, '_blank');
                return;
            }

            const renewalTrigger = e.target.closest('[data-action="send-renewal"]');
            if (renewalTrigger) {
                e.preventDefault();
                const phone = String(renewalTrigger.dataset.phone || '').replace(/\D/g, '').slice(-10);
                const name = String(renewalTrigger.dataset.name || 'there').trim() || 'there';
                const date = String(renewalTrigger.dataset.date || '').trim();

                if (!phone) {
                    console.error('Renewal reminder action is missing a valid phone number.');
                    return;
                }

                const companyProfile = SettingsManager.getCompanyProfile();
                const gymName = companyProfile.gymName || 'our Gym';
                const parsedDate = /^\d{2}\/\d{2}\/\d{4}$/.test(date)
                    ? (() => {
                        const [day, month, year] = date.split('/').map(Number);
                        return new Date(year, month - 1, day);
                    })()
                    : new Date(date);
                const formattedDate = Number.isNaN(parsedDate.getTime())
                    ? date
                    : parsedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                const wave = String.fromCodePoint(0x1F44B);
                const flex = String.fromCodePoint(0x1F4AA);
                const rawMessage = `Hi ${name}! ${wave} Hope you're having a great week.\n\nJust a gentle reminder from ${gymName} that your membership is expiring on ${formattedDate}. Let us know if you'd like to renew and keep crushing your fitness goals with us! ${flex}`;
                const whatsappUrl = `https://web.whatsapp.com/send?phone=91${phone}&text=${encodeURIComponent(rawMessage)}`;
                console.log(rawMessage);
                console.log(whatsappUrl);
                window.open(whatsappUrl, '_blank');
                return;
            }
            const financeCardTrigger = e.target.closest('[data-action="view-revenue-details"], [data-action="view-expense-details"], [data-action="view-profit-details"]');
            if (financeCardTrigger) {
                e.preventDefault();
                const action = financeCardTrigger.dataset.action;
                
                if (action === 'view-revenue-details') {
                    window.FinanceAnalytics?.openTransactionDetails?.('revenue');
                } else if (action === 'view-expense-details') {
                    window.FinanceAnalytics?.openTransactionDetails?.('expenses');
                } else if (action === 'view-profit-details') {
                    window.FinanceAnalytics?.openTransactionDetails?.('profit');
                }
                return;
            }

            const overlay = e.target.closest('.modal-overlay, .package-modal, .payroll-modal-overlay, .details-drawer-overlay, .invoice-preview-modal');
            if (!overlay || overlay !== e.target) {
                return;
            }

            if (overlay.id === 'details-drawer-overlay') {
                document.getElementById('details-drawer')?.classList.remove('active');
                overlay.classList.remove('active');
                return;
            }

            const modalTarget = overlay.dataset.closeTarget;
            if (modalTarget && typeof window.closeModal === 'function') {
                window.closeModal(modalTarget);
            }
        });

        document.body.addEventListener('submit', (e) => {
            if (e.target.tagName !== 'FORM') {
                return;
            }

            console.log('Form submitted:', e.target.id);

            if (e.target.id === 'modal-form') {
                e.preventDefault();
                submitForm();
            }
        });
    }, { once: true });

    const openModal = (title, formConfig, entity, onSubmit) => {
        currentEntity = entity;
        currentForm = { config: formConfig, onSubmit, entity };

        DOM.title().textContent = title;
        DOM.footer().style.display = 'flex';
        
        // Support new format with content and buttons
        if (formConfig.content) {
            DOM.body().innerHTML = formConfig.content;

            const actionButtons = (formConfig.buttons || []).filter((btn) => !['close', 'cancel'].includes(String(btn.action || '').toLowerCase()));

            DOM.footer().innerHTML = `
                <button type="button" class="btn-secondary btn-cancel" id="modal-cancel-btn">Cancel</button>
                ${actionButtons.map((btn, idx) => `
                    <button type="${btn.form ? 'submit' : 'button'}" class="btn-${btn.type || 'secondary'}" id="${btn.id || `modal-btn-${idx}`}" ${btn.form ? `form="${btn.form}"` : ''}>
                        ${btn.label}
                    </button>
                `).join('')}
            `;
        } else {
            // Old format with fields
            DOM.body().innerHTML = renderForm(formConfig);
            DOM.footer().innerHTML = `
                <button type="button" class="btn-secondary btn-cancel" id="modal-cancel-btn">Cancel</button>
                <button type="submit" class="btn-primary" id="modal-submit-btn" form="modal-form">Save Record</button>
            `;
        }

        DOM.drawer().classList.add('active');
        DOM.overlay().classList.add('active');
        ValidationUtils.attachLiveValidation(DOM.body());
    };

    /**
     * Closes modal drawer
     */
    const closeModal = () => {
        closeModalById('modal-drawer');
    };

    // -------- FORM RENDERING --------

    /**
     * Renders form fields from configuration
     * @param {object} config - Form field configuration
     * @returns {string} - HTML form
     */
    const renderForm = (config) => {
        let html = '<form id="modal-form">';

        config.fields.forEach(field => {
            html += `
                <div class="form-group">
                    <label class="form-label" for="${field.name}">${field.label}</label>
            `;

            switch (field.type) {
                case 'text':
                case 'email':
                case 'number':
                case 'date':
                    html += `<input type="${field.type}" class="form-input" id="${field.name}" name="${field.name}" 
                        data-validation="${field.validation || (field.type === 'email' ? 'email' : ((field.name || '').toLowerCase().includes('phone') || (field.name || '').toLowerCase().includes('contact') ? 'phone' : ''))}"
                        placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}>`;
                    break;

                case 'select':
                    html += `<select class="form-select" id="${field.name}" name="${field.name}" data-validation="${field.validation || ''}" ${field.required ? 'required' : ''}>
                        <option value="">-- Select ${field.label} --</option>`;
                    field.options.forEach(opt => {
                        html += `<option value="${opt.value}">${opt.label}</option>`;
                    });
                    html += `</select>`;
                    break;

                case 'textarea':
                    html += `<textarea class="form-textarea" id="${field.name}" name="${field.name}" data-validation="${field.validation || ''}" 
                        placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}></textarea>`;
                    break;

                case 'checkbox':
                    html += `<label style="display: flex; align-items: center; font-weight: normal; gap: 8px;">
                        <input type="checkbox" id="${field.name}" name="${field.name}" ${field.defaultValue ? 'checked' : ''}>
                        <span>${field.label}</span>
                    </label>`;
                    break;
            }

            if (field.type !== 'checkbox') {
                html += `<div class="field-error" aria-live="polite"></div>`;
            }

            html += '</div>';
        });

        html += '</form>';
        return html;
    };

    /**
     * Submits form and saves to state
     */
    const submitForm = () => {
        if (!currentForm) return;

        const form = document.getElementById('modal-form');
        if (!form.checkValidity() || !ValidationUtils.validateForm(form)) {
            showToast('Please correct the highlighted fields', 'error', 'Validation Error');
            return;
        }

        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        // Convert data types
        currentForm.config.fields.forEach(field => {
            if (field.type === 'number' && data[field.name]) {
                data[field.name] = parseFloat(data[field.name]);
            }
            if (field.type === 'checkbox') {
                data[field.name] = formData.has(field.name);
            }
        });

        if (currentForm.onSubmit) {
            currentForm.onSubmit(data);
        }

        closeModalById('modal-drawer');
    };

    // -------- TOAST NOTIFICATION SYSTEM --------

    /**
     * Shows toast notification
     * @param {string} message - Toast message
     * @param {string} type - 'success', 'error', 'info'
     * @param {string} title - Toast title
     * @param {number} duration - Duration in ms (default: 4000)
     */
    const showToast = (message, type = 'info', title = 'Notification', duration = 4000) => {
        const toast = createToastElement(message, type, title);
        DOM.container().appendChild(toast);

        // Auto-remove after duration
        setTimeout(() => {
            removeToast(toast);
        }, duration);
    };

    /**
     * Creates toast DOM element
     */
    const createToastElement = (message, type, title) => {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: 'check_circle',
            error: 'error',
            info: 'info'
        };

        toast.innerHTML = `
            <span class="material-icons-round toast-icon">${icons[type]}</span>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;

        // Close on click
        toast.addEventListener('click', () => removeToast(toast));

        return toast;
    };

    /**
     * Removes toast with animation
     */
    const removeToast = (toast) => {
        toast.classList.add('removing');
        setTimeout(() => {
            toast.remove();
        }, 300);
    };

    // -------- PRE-BUILT FORMS --------

    /**
     * Member form configuration
     */
    const memberFormConfig = {
        fields: [
            { name: 'firstName', label: 'First Name', type: 'text', required: true, placeholder: 'e.g., Sarah' },
            { name: 'lastName', label: 'Last Name', type: 'text', required: true, placeholder: 'e.g., Jenkins' },
            { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'sarah@example.com' },
            { name: 'phone', label: 'Phone', type: 'text', required: false, placeholder: '9876543210', validation: 'phone' },
            { name: 'membershipPlan', label: 'Membership Plan', type: 'select', required: true,
                options: [
                    { value: 'elite', label: 'Elite Performance' },
                    { value: 'pro', label: 'Pro Athlete' },
                    { value: 'standard', label: 'Standard' },
                    { value: 'basic', label: 'Basic' }
                ]
            },
            { name: 'joinDate', label: 'Join Date', type: 'date', required: true },
            { name: 'renewalDate', label: 'Renewal Date', type: 'date', required: true },
            { name: 'notes', label: 'Notes', type: 'textarea', required: false, placeholder: 'Additional notes...' }
        ]
    };

    /**
     * Enquiry form configuration
     */
    const enquiryFormConfig = {
        fields: [
            { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'e.g., John Doe' },
            { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'john@example.com' },
            { name: 'phone', label: 'Phone', type: 'text', required: true, placeholder: '9876543210', validation: 'phone' },
            { name: 'source', label: 'Lead Source', type: 'select', required: true,
                options: [
                    { value: 'website', label: 'Website' },
                    { value: 'referral', label: 'Referral' },
                    { value: 'social', label: 'Social Media' },
                    { value: 'walkIn', label: 'Walk-In' }
                ]
            },
            { name: 'goal', label: 'Fitness Goal', type: 'select', required: true,
                options: [
                    { value: 'weightLoss', label: 'Weight Loss' },
                    { value: 'muscleGain', label: 'Muscle Gain' },
                    { value: 'endurance', label: 'Endurance' },
                    { value: 'general', label: 'General Fitness' }
                ]
            },
            { name: 'notes', label: 'Notes', type: 'textarea', required: false, placeholder: 'Enquiry details...' }
        ]
    };

    /**
     * Staff form configuration
     */
    const staffFormConfig = {
        fields: [
            { name: 'firstName', label: 'First Name', type: 'text', required: true, placeholder: 'e.g., Marcus' },
            { name: 'lastName', label: 'Last Name', type: 'text', required: true, placeholder: 'e.g., Thorne' },
            { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'marcus@kinetic.com' },
            { name: 'phone', label: 'Phone', type: 'text', required: true, placeholder: '9876543210', validation: 'phone' },
            { name: 'role', label: 'Role', type: 'select', required: true,
                options: [
                    { value: 'trainer', label: 'Trainer' },
                    { value: 'frontDesk', label: 'Front Desk' },
                    { value: 'manager', label: 'Manager' },
                    { value: 'nutritionist', label: 'Nutritionist' }
                ]
            },
            { name: 'hireDate', label: 'Hire Date', type: 'date', required: true },
            { name: 'salary', label: 'Monthly Salary', type: 'number', required: true, placeholder: '0.00' }
        ]
    };

    /**
     * Expense form configuration
     */
    const expenseFormConfig = {
        fields: [
            { name: 'category', label: 'Category', type: 'select', required: true,
                options: [
                    { value: 'equipment', label: 'Equipment' },
                    { value: 'maintenance', label: 'Maintenance' },
                    { value: 'utilities', label: 'Utilities' },
                    { value: 'staffing', label: 'Staffing' },
                    { value: 'other', label: 'Other' }
                ]
            },
            { name: 'description', label: 'Description', type: 'text', required: true, placeholder: 'e.g., Treadmill repair' },
            { name: 'amount', label: 'Amount (â‚¹)', type: 'number', required: true, placeholder: '0' },
            { name: 'date', label: 'Date', type: 'date', required: true },
            { name: 'vendor', label: 'Vendor', type: 'text', required: false, placeholder: 'Vendor name' },
            { name: 'notes', label: 'Notes', type: 'textarea', required: false, placeholder: 'Additional details...' }
        ]
    };

    /**
     * Package form configuration
     */
    const packageFormConfig = {
        fields: [
            { name: 'name', label: 'Package Name', type: 'text', required: true, placeholder: 'e.g., 3-Month Elite' },
            { name: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Package details...' },
            { name: 'price', label: 'Price (â‚¹)', type: 'number', required: true, placeholder: '0' },
            { name: 'durationMonths', label: 'Duration (months)', type: 'number', required: true, placeholder: '3' },
            { name: 'capacity', label: 'Max Sessions/Week', type: 'number', required: false, placeholder: '5' }
        ]
    };

    /**
     * Receipt form configuration
     */
    const equipmentFormConfig = {
        fields: [
            { name: 'assetName', label: 'Asset Name', type: 'text', required: true, placeholder: 'e.g., Assault Bike' },
            { name: 'serialNumber', label: 'Serial Number', type: 'text', required: true, placeholder: 'e.g., AB-1009' },
            { name: 'category', label: 'Category', type: 'select', required: true,
                options: [
                    { value: 'cardio', label: 'Cardio' },
                    { value: 'strength', label: 'Strength' },
                    { value: 'free-weights', label: 'Free Weights' }
                ]
            },
            { name: 'status', label: 'Status', type: 'select', required: true,
                options: [
                    { value: 'active', label: 'Active' },
                    { value: 'maintenance', label: 'Maintenance' },
                    { value: 'broken', label: 'Broken' }
                ]
            },
            { name: 'purchaseDate', label: 'Purchase Date', type: 'date', required: true },
            { name: 'price', label: 'Price (Ã¢â€šÂ¹)', type: 'number', required: true, placeholder: '0' }
        ]
    };

    /**
     * Receipt form configuration
     */
    const receiptFormConfig = {
        fields: [
            { name: 'memberId', label: 'Member ID', type: 'text', required: true, placeholder: 'Member ID' },
            { name: 'memberName', label: 'Member Name', type: 'text', required: true, placeholder: 'Full name' },
            { name: 'description', label: 'Description', type: 'text', required: true, placeholder: 'Payment for...' },
            { name: 'amount', label: 'Amount (â‚¹)', type: 'number', required: true, placeholder: '0' },
            { name: 'paymentMethod', label: 'Payment Method', type: 'select', required: true,
                options: [
                    { value: 'cash', label: 'Cash' },
                    { value: 'card', label: 'Card' },
                    { value: 'check', label: 'Check' },
                    { value: 'online', label: 'Online' }
                ]
            },
            { name: 'date', label: 'Date', type: 'date', required: true }
        ]
    };

    /**
     * Opens member form modal
     */
    const openMemberForm = (onSave) => {
        openModal('Add New Member', memberFormConfig, 'members', onSave);
    };

    /**
     * Opens enquiry form modal
     */
    const openEnquiryForm = (onSave) => {
        openModal('Add New Lead', enquiryFormConfig, 'enquiries', onSave);
    };

    /**
     * Opens staff form modal
     */
    const openStaffForm = (onSave) => {
        openModal('Add Staff Member', staffFormConfig, 'staff', onSave);
    };

    /**
     * Opens expense form modal
     */
    const openExpenseForm = (onSave) => {
        openModal('Record Expense', expenseFormConfig, 'expenses', onSave);
    };

    /**
     * Opens package form modal
     */
    const openPackageForm = (onSave) => {
        openModal('Create Package', packageFormConfig, 'packages', onSave);
    };

    const openEquipmentForm = (onSave) => {
        openModal('Add Equipment Asset', equipmentFormConfig, 'equipment', onSave);
    };

    /**
     * Opens receipt form modal
     */
    const openReceiptForm = (onSave) => {
        openModal('Issue Receipt', receiptFormConfig, 'receipts', onSave);
    };

    // -------- PUBLIC API --------
    return {
        // Modal
        openModal,
        closeModal,
        submitForm,

        // Toast
        showToast,

        // Forms
        openMemberForm,
        openEnquiryForm,
        openStaffForm,
        openExpenseForm,
        openPackageForm,
        openEquipmentForm,
        openReceiptForm,

        // Form configs (for custom use)
        memberFormConfig,
        enquiryFormConfig,
        staffFormConfig,
        expenseFormConfig,
        packageFormConfig,
        equipmentFormConfig,
        receiptFormConfig
    };
})();

// Expose to window for console access
window.UIComponents = UIComponents;
