/**
 * MEMBER MODULE - Add Member Workflow
 * 
 * Comprehensive member management system with:
 * • Tabbed data table with search, filters (status, gender)
 * • Advanced 2-column form for member registration
 * • Course/package registration with auto-calculated end date
 * • Payment tracking (Fees, Discount, Paid Amount, Balance)
 * • Invoice generation & printing
 * • Receipt & receipt creation
 */

const MemberModule = (() => {
    // State management
    let currentFilters = {
        status: 'all',
        gender: 'all',
        search: ''
    };
    let renderCycle = 0;
    let eventsBound = false;
    let memberCameraStream = null;
    let modalLifecycleBound = false;
    let drawerControlsBound = false;
    let currentEditMember = null;
    let memberSubmitInFlight = false;

    /**
     * MEMBER FORM CONFIGURATION
     * 13+ fields organized in 2-column grid
     */
    const memberFormConfig = {
        sections: [
            {
                title: 'Basic Information',
                icon: 'person',
                fields: [
                    { name: 'memberId', label: 'Member ID', type: 'text', readonly: true, placeholder: 'Auto-generated' },
                    { name: 'firstName', label: 'First Name *', type: 'text', required: true, placeholder: 'John' },
                    { name: 'lastName', label: 'Last Name *', type: 'text', required: true, placeholder: 'Doe' },
                    { name: 'contact', label: 'Contact Number *', type: 'tel', required: true, placeholder: '+91 98765 43210' },
                    { name: 'email', label: 'Email *', type: 'email', required: true, placeholder: 'john@example.com' },
                    { name: 'dob', label: 'Date of Birth *', type: 'date', required: true },
                    { name: 'age', label: 'Age', type: 'number', readonly: true, placeholder: 'Auto-calculated' },
                    { name: 'gender', label: 'Gender *', type: 'select', required: true, options: [
                        { value: '', label: 'Select Gender' },
                        { value: 'male', label: 'Male' },
                        { value: 'female', label: 'Female' },
                        { value: 'other', label: 'Other' }
                    ]},
                    { name: 'bloodGroup', label: 'Blood Group *', type: 'select', required: true, options: [
                        { value: '', label: 'Select Blood Group' },
                        { value: 'O+', label: 'O+' },
                        { value: 'O-', label: 'O-' },
                        { value: 'A+', label: 'A+' },
                        { value: 'A-', label: 'A-' },
                        { value: 'B+', label: 'B+' },
                        { value: 'B-', label: 'B-' },
                        { value: 'AB+', label: 'AB+' },
                        { value: 'AB-', label: 'AB-' }
                    ]},
                    { name: 'address', label: 'Address *', type: 'textarea', required: true, placeholder: '123 Main St, City, State 12345' },
                    { name: 'healthDetails', label: 'Health Details / Medical Conditions', type: 'textarea', placeholder: 'Any allergies, injuries, or medical conditions...' }
                ]
            },
            {
                title: 'Course Registration',
                icon: 'card_membership',
                fields: [
                    { name: 'package', label: 'Select Package *', type: 'select', required: true, options: [
                        { value: '', label: 'Choose a Package' },
                        { value: 'basic-3m', label: 'Basic 3 Months (₹3,000)' },
                        { value: 'basic-6m', label: 'Basic 6 Months (₹5,400)' },
                        { value: 'basic-12m', label: 'Basic 12 Months (₹9,600)' },
                        { value: 'premium-3m', label: 'Premium 3 Months (₹5,000)' },
                        { value: 'premium-6m', label: 'Premium 6 Months (₹9,000)' },
                        { value: 'premium-12m', label: 'Premium 12 Months (₹16,000)' },
                        { value: 'elite-3m', label: 'Elite 3 Months (₹8,000)' },
                        { value: 'elite-6m', label: 'Elite 6 Months (₹14,400)' },
                        { value: 'elite-12m', label: 'Elite 12 Months (₹25,600)' },
                        { value: 'pt-session', label: 'Personal Training (per session - ₹500)' }
                    ]},
                    { name: 'startDate', label: 'Start Date *', type: 'date', required: true },
                    { name: 'endDate', label: 'End Date', type: 'date', readonly: true, placeholder: 'Auto-calculated' },
                    { name: 'fees', label: 'Membership Fees *', type: 'number', required: true, placeholder: '0.00' },
                    { name: 'discount', label: 'Discount (%)', type: 'number', placeholder: '0', min: 0, max: 100 },
                    { name: 'paidAmount', label: 'Amount Paid *', type: 'number', required: true, placeholder: '0.00' },
                    { name: 'balance', label: 'Balance', type: 'number', readonly: true, placeholder: '0.00' },
                    { name: 'paymentMode', label: 'Payment Mode *', type: 'select', required: true, options: [
                        { value: '', label: 'Select Payment Mode' },
                        { value: 'cash', label: 'Cash' },
                        { value: 'card', label: 'Card' },
                        { value: 'online', label: 'Online Transfer' },
                        { value: 'upi', label: 'UPI' },
                        { value: 'cheque', label: 'Cheque' }
                    ]}
                ]
            }
        ]
    };

    /**
     * PACKAGE DURATION CONFIGURATION
     * Defines duration in days for each package
     */
    const packageDurations = {
        'basic-3m': 90,
        'basic-6m': 180,
        'basic-12m': 365,
        'premium-3m': 90,
        'premium-6m': 180,
        'premium-12m': 365,
        'elite-3m': 90,
        'elite-6m': 180,
        'elite-12m': 365,
        'pt-session': 30
    };

    /**
     * PACKAGE PRICING CONFIGURATION
     */
    const packagePrices = {
        'basic-3m': 3000,
        'basic-6m': 5400,
        'basic-12m': 9600,
        'premium-3m': 5000,
        'premium-6m': 9000,
        'premium-12m': 16000,
        'elite-3m': 8000,
        'elite-6m': 14400,
        'elite-12m': 25600,
        'pt-session': 500
    };

    /**
     * Calculate age from DOB
     */
    const calculateAge = (dob) => {
        if (!dob) return null;
        const today = new Date();
        const birthDate = new Date(dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    /**
     * Calculate end date from start date and package duration
     */
    const calculateEndDate = (startDate, packageId) => {
        if (!startDate || !packageId) return null;
        const durationDays = packageDurations[packageId] || 30;
        const start = new Date(startDate);
        const end = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);
        return end.toISOString().split('T')[0];
    };

    /**
     * Calculate balance (fees after discount - paid amount)
     */
    const calculateBalance = (fees, discount, paid) => {
        const discountAmount = (fees * (discount || 0)) / 100;
        const finalAmount = fees - discountAmount;
        const balance = finalAmount - (paid || 0);
        return Math.max(0, balance);
    };

    /**
     * Generate unique member ID
     */
    const generateMemberId = () => {
        const date = new Date();
        const timestamp = date.getTime();
        const random = Math.random().toString(36).substr(2, 5).toUpperCase();
        return `MEM-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${random}`;
    };

    /**
     * Set up form field listeners for auto-calculations
     */
    const setupFormListeners = () => {
        // Age calculation from DOB
        const dobInput = document.querySelector('[name="dob"]');
        if (dobInput) {
            dobInput.addEventListener('change', (e) => {
                const age = calculateAge(e.target.value);
                const ageInput = document.querySelector('[name="age"]');
                if (ageInput) ageInput.value = age || '';
            });
        }

        // End date calculation from package & start date
        const packageSelect = document.querySelector('[name="package"]');
        const startDateInput = document.querySelector('[name="startDate"]');
        const endDateInput = document.querySelector('[name="endDate"]');

        const updateEndDate = () => {
            const startDate = startDateInput?.value;
            const packageId = packageSelect?.value;
            if (startDate && packageId) {
                const endDate = calculateEndDate(startDate, packageId);
                if (endDateInput) endDateInput.value = endDate || '';
            }
        };

        if (packageSelect) packageSelect.addEventListener('change', updateEndDate);
        if (startDateInput) startDateInput.addEventListener('change', updateEndDate);

        // Fees auto-fill from package
        const feesInput = document.querySelector('[name="fees"]');
        if (packageSelect) {
            packageSelect.addEventListener('change', (e) => {
                const price = packagePrices[e.target.value];
                if (feesInput && price) feesInput.value = price;
                updateBalanceDisplay();
            });
        }

        // Balance calculation
        const discountInput = document.querySelector('[name="discount"]');
        const paidInput = document.querySelector('[name="paidAmount"]');
        const balanceInput = document.querySelector('[name="balance"]');

        const updateBalance = () => {
            const fees = parseFloat(feesInput?.value || 0);
            const discount = parseFloat(discountInput?.value || 0);
            const paid = parseFloat(paidInput?.value || 0);
            const balance = calculateBalance(fees, discount, paid);
            if (balanceInput) balanceInput.value = balance.toFixed(2);
        };

        if (discountInput) discountInput.addEventListener('input', updateBalance);
        if (paidInput) paidInput.addEventListener('input', updateBalance);
        if (feesInput) feesInput.addEventListener('input', updateBalance);
    };

    /**
     * Update balance display
     */
    const updateBalanceDisplay = () => {
        const feesInput = document.querySelector('[name="fees"]');
        const discountInput = document.querySelector('[name="discount"]');
        const paidInput = document.querySelector('[name="paidAmount"]');
        const balanceInput = document.querySelector('[name="balance"]');

        const fees = parseFloat(feesInput?.value || 0);
        const discount = parseFloat(discountInput?.value || 0);
        const paid = parseFloat(paidInput?.value || 0);
        const balance = calculateBalance(fees, discount, paid);
        if (balanceInput) balanceInput.value = balance.toFixed(2);
    };

    const stopMemberCamera = () => {
        const video = document.getElementById('webcam-stream');
        if (memberCameraStream) {
            memberCameraStream.getTracks().forEach(track => track.stop());
            memberCameraStream = null;
        }
        if (video) {
            video.srcObject = null;
        }
    };

    const resetMemberModalState = () => {
        const form = document.getElementById('add-member-form') || document.getElementById('member-form');
        const canvas = document.getElementById('member-photo-canvas');
        const hiddenInput = document.getElementById('member-photo-data');
        const preview = document.getElementById('member-photo-preview');
        const video = document.getElementById('webcam-stream');

        form?.reset();
        stopMemberCamera();

        if (canvas) {
            const context = canvas.getContext('2d');
            context?.clearRect(0, 0, canvas.width, canvas.height);
        }

        if (hiddenInput) {
            hiddenInput.value = '';
        }

        if (preview) {
            preview.src = '';
            preview.style.display = 'none';
        }

        if (video) {
            video.style.display = 'block';
        }
    };

    const yieldToBrowser = () => new Promise((resolve) => {
        requestAnimationFrame(() => {
            setTimeout(resolve, 0);
        });
    });

    const closeMemberDrawer = () => {
        memberSubmitInFlight = false;
        resetMemberModalState();
        closeModal('modal-drawer');
    };

    const syncPhotoPreview = (imageData) => {
        const video = document.getElementById('webcam-stream');
        const hiddenInput = document.getElementById('member-photo-data');
        let preview = document.getElementById('member-photo-preview');

        if (hiddenInput) {
            hiddenInput.value = imageData || '';
        }

        if (!preview && video?.parentElement) {
            preview = document.createElement('img');
            preview.id = 'member-photo-preview';
            preview.alt = 'Member photo preview';
            video.parentElement.insertBefore(preview, video);
        }

        if (preview) {
            preview.src = imageData || '';
            preview.style.display = imageData ? 'block' : 'none';
        }

        if (video) {
            video.style.display = imageData ? 'none' : 'block';
        }
    };

    const startMemberCamera = async () => {
        const video = document.getElementById('webcam-stream');
        if (!video) {
            return;
        }

        try {
            stopMemberCamera();
            memberCameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = memberCameraStream;
            video.style.display = 'block';
            const preview = document.getElementById('member-photo-preview');
            if (preview) {
                preview.style.display = 'none';
            }
        } catch (error) {
            console.error('[MemberModule] Camera access failed', error);
            UIComponents.showToast('Camera permission was denied. You can still save the member without a photo.', 'info', 'Camera Unavailable');
        }
    };

    const captureMemberPhoto = () => {
        const video = document.getElementById('webcam-stream');
        const canvas = document.getElementById('member-photo-canvas');
        if (!video || !canvas || !memberCameraStream) {
            UIComponents.showToast('Start the camera before taking a photo.', 'info', 'Camera Required');
            return;
        }

        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/png');
        syncPhotoPreview(imageData);
        stopMemberCamera();
    };

    const bindMemberCameraActions = () => {
        const startCameraButton = document.getElementById('btn-start-camera');
        const snapPhotoButton = document.getElementById('btn-snap-photo');

        if (startCameraButton && startCameraButton.dataset.bound !== 'true') {
            startCameraButton.dataset.bound = 'true';
            startCameraButton.addEventListener('click', () => {
                startMemberCamera();
            });
        }

        if (snapPhotoButton && snapPhotoButton.dataset.bound !== 'true') {
            snapPhotoButton.dataset.bound = 'true';
            snapPhotoButton.addEventListener('click', () => {
                captureMemberPhoto();
            });
        }
    };

    const bindMemberEntryPoints = () => {
        const openDrawerButton = document.getElementById('open-member-drawer-btn');
        const emptyStateButton = document.getElementById('empty-members-open-btn');

        if (openDrawerButton && openDrawerButton.dataset.bound !== 'true') {
            openDrawerButton.dataset.bound = 'true';
            openDrawerButton.addEventListener('click', () => {
                openForm();
            });
        }

        if (emptyStateButton && emptyStateButton.dataset.bound !== 'true') {
            emptyStateButton.dataset.bound = 'true';
            emptyStateButton.addEventListener('click', () => {
                openForm();
            });
        }
    };

    const bindModalLifecycle = () => {
        if (modalLifecycleBound) return;
        modalLifecycleBound = true;

        const drawer = document.getElementById('modal-drawer');
        if (!drawer) return;

        document.addEventListener('app:modal-closed', (event) => {
            if (event.detail?.modalId !== 'modal-drawer') {
                return;
            }

            currentEditMember = null;
            memberSubmitInFlight = false;
            drawer.classList.remove('member-modal-mode');
        });

        const observer = new MutationObserver(() => {
            if (!drawer.classList.contains('active')) {
                resetMemberModalState();
                drawer.classList.remove('member-modal-mode');
            }
        });

        observer.observe(drawer, { attributes: true, attributeFilter: ['class'] });
    };

    const bindDrawerControls = () => {
        if (drawerControlsBound) return;
        drawerControlsBound = true;

        document.body.addEventListener('click', (event) => {
            const target = event.target.closest('#btn-start-camera, #btn-snap-photo, #btn-save-download');
            if (!target) return;

            if (target.id === 'btn-start-camera') {
                event.preventDefault();
                startMemberCamera();
                return;
            }

            if (target.id === 'btn-snap-photo') {
                event.preventDefault();
                captureMemberPhoto();
                return;
            }

            if (target.id === 'btn-save-download') {
                event.preventDefault();
                if (memberSubmitInFlight) return;
                console.log('Save Clicked');
                document.getElementById('add-member-form')?.requestSubmit();
                return;
            }
        });

        document.body.addEventListener('submit', (event) => {
            const form = event.target.closest('#add-member-form');
            if (!form) return;
            handleMemberFormSubmit(event, currentEditMember);
        });
    };

    const getDaysUntilDate = (value) => {
        if (!value) return null;
        const targetDate = new Date(value);
        if (Number.isNaN(targetDate.getTime())) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        targetDate.setHours(0, 0, 0, 0);
        return Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
    };

    const getMemberWhatsAppContext = (member) => {
        const balance = Number(member?.balance) || 0;
        const daysUntilExpiry = getDaysUntilDate(member?.endDate);

        if (balance > 0) {
            return 'payment-pending';
        }

        if (daysUntilExpiry !== null && daysUntilExpiry <= 7) {
            return 'expiring-soon';
        }

        return 'active';
    };

    const buildMemberWhatsAppMessage = (member, mode = 'status') => {
        const fullName = [member.firstName, member.lastName].filter(Boolean).join(' ') || 'Member';
        const gymName = SettingsManager.getCompanyProfile()?.gymName || 'Kinetic Atelier';

        if (mode === 'welcome') {
            return `Hi ${fullName}, Welcome to ${gymName} 💪 Your membership has been successfully activated. Plan: ${member.package} | Start: ${member.startDate} | End: ${member.endDate}. Please find your invoice attached. Looking forward to seeing you!`;
        }

        switch (getMemberWhatsAppContext(member)) {
            case 'payment-pending':
                return `Hi ${fullName}, This is a reminder that ${formatINR(member.balance)} is pending for your membership. Kindly clear your dues to continue enjoying gym services 💪`;
            case 'expiring-soon': {
                const daysLeft = Math.max(getDaysUntilDate(member.endDate) || 0, 0);
                return `Hi ${fullName}, Your membership is expiring on ${member.endDate}. Only ${daysLeft} days left — renew soon to continue your fitness journey! 🔥`;
            }
            case 'active':
            default:
                return `Hi ${fullName}, Hope you're doing great 💪 Your membership is active till ${member.endDate}. Keep pushing towards your goals!`;
        }
    };

    const openMemberWhatsApp = (member, mode = 'status') => {
        if (!member || !window.WhatsAppUtils) {
            return;
        }

        WhatsAppUtils.openLink(member.contact, buildMemberWhatsAppMessage(member, mode));
    };

    const showWelcomeWhatsAppPrompt = (member) => {
        UIComponents.openModal('Member Saved!', {
            content: `
                <div class="member-post-save">
                    <h3>Member Saved! Send Welcome WhatsApp?</h3>
                    <p>The invoice has been downloaded. You can now send the activation message directly to the member’s WhatsApp.</p>
                </div>
            `,
            buttons: [
                { label: 'Send via WhatsApp', action: 'custom', type: 'primary' }
            ]
        });

        const modal = document.querySelector('.modal-drawer');
        modal?.querySelector('#modal-footer button:last-child')?.addEventListener('click', () => {
            openMemberWhatsApp(member, 'welcome');
            closeModal('modal-drawer');
        }, { once: true });
    };

    const downloadMemberInvoice = async (memberData) => {
        const tempWrapper = document.createElement('div');
        tempWrapper.style.position = 'fixed';
        tempWrapper.style.left = '-9999px';
        tempWrapper.style.top = '0';
        tempWrapper.style.width = '794px';
        tempWrapper.style.pointerEvents = 'none';
        tempWrapper.style.opacity = '0';
        tempWrapper.innerHTML = generateInvoiceHTML(memberData);
        document.body.appendChild(tempWrapper);

        try {
            await yieldToBrowser();

            const qrContainer = tempWrapper.querySelector('#member-qr-code');
            if (qrContainer && typeof QRCode !== 'undefined') {
                qrContainer.innerHTML = '';
                new QRCode(qrContainer, {
                    text: String(memberData.memberId || ''),
                    width: 132,
                    height: 132,
                    colorDark: '#1F2722',
                    colorLight: '#FFFFFF',
                    correctLevel: QRCode.CorrectLevel.M
                });
            }

            await yieldToBrowser();
            const safeMemberId = String(memberData.memberId || 'invoice').replace(/[^\w-]+/g, '-');
            await downloadInvoicePDF(`${safeMemberId}.pdf`, tempWrapper.querySelector('.invoice-container'));
        } finally {
            tempWrapper.remove();
        }
    };

    /**
     * Render form HTML
     */
    const renderFormHTML = (editMember = null) => {
        const existingPhoto = editMember?.memberPhoto || '';
        let formHTML = `
            <div class="member-form-container">
                <div class="member-photo-shell">
                    <div>
                        <video id="webcam-stream" autoplay playsinline muted style="${existingPhoto ? 'display:none;' : ''}"></video>
                        <img id="member-photo-preview" src="${existingPhoto}" alt="Member photo preview" style="${existingPhoto ? 'display:block;' : 'display:none;'}">
                        <canvas id="member-photo-canvas" width="320" height="320"></canvas>
                        <input type="hidden" name="memberPhoto" id="member-photo-data" value="${existingPhoto}">
                    </div>
                    <div class="member-photo-meta">
                        <h4>ID Photo Capture</h4>
                        <p>Capture a clean member profile photo for the directory, invoice, and front-desk verification.</p>
                        <div class="member-photo-actions">
                            <button type="button" id="btn-start-camera" class="btn-camera">Start Camera</button>
                            <button type="button" id="btn-snap-photo" class="btn-camera">Snap Photo</button>
                        </div>
                    </div>
                </div>
        `;

        memberFormConfig.sections.forEach((section, sectionIndex) => {
            formHTML += `
                <div class="form-section">
                    <div class="form-section-title">
                        <span class="material-icons-round">${section.icon}</span>
                        ${section.title}
                    </div>
            `;

            section.fields.forEach((field, fieldIndex) => {
                let value = editMember?.[field.name] || '';
                
                // Generate member ID if needed
                if (field.name === 'memberId' && !value) {
                    value = generateMemberId();
                }

                formHTML += '<div class="form-group">';
                formHTML += `<label class="form-label">${field.label}</label>`;

                if (field.type === 'textarea') {
                    formHTML += `<textarea class="form-input" name="${field.name}" 
                        placeholder="${field.placeholder || ''}" 
                        ${field.required ? 'required' : ''} 
                        ${field.readonly ? 'readonly' : ''}>${value}</textarea>`;
                } else if (field.type === 'select') {
                    formHTML += `<select class="form-input" name="${field.name}" 
                        data-validation="${field.validation || ''}"
                        ${field.required ? 'required' : ''} 
                        ${field.readonly ? 'readonly' : ''}>`;
                    field.options.forEach(opt => {
                        formHTML += `<option value="${opt.value}" ${opt.value === value ? 'selected' : ''}>${opt.label}</option>`;
                    });
                    formHTML += '</select>';
                } else {
                    formHTML += `<input type="${field.type}" class="form-input" name="${field.name}" 
                        data-validation="${field.validation || ((field.name || '').toLowerCase().includes('email') ? 'email' : ((field.name || '').toLowerCase().includes('contact') ? 'phone' : ''))}"
                        value="${value}" 
                        placeholder="${field.placeholder || ''}" 
                        ${field.required ? 'required' : ''} 
                        ${field.readonly ? 'readonly' : ''}
                        ${field.min !== undefined ? `min="${field.min}"` : ''}
                        ${field.max !== undefined ? `max="${field.max}"` : ''}>`;
                }

                formHTML += '<div class="field-error" aria-live="polite"></div>';
                formHTML += '</div>';
            });

            formHTML += '</div>';
        });

        formHTML += '</div>';
        return formHTML;
    };

    /**
     * Open member form modal
     */
    const openForm = (editMember = null) => {
        currentEditMember = editMember;
        const title = editMember ? `Edit Member - ${editMember.firstName} ${editMember.lastName}` : 'Add New Member';
        const formHTML = `
            <form id="add-member-form" novalidate>
                ${renderFormHTML(editMember)}
            </form>
        `;

        UIComponents.openModal(title, {
            content: formHTML,
            buttons: [
                { id: 'btn-save-download', label: 'Save & Download Invoice', action: 'custom', type: 'primary' }
            ]
        });

        const modal = document.querySelector('.modal-drawer');
        const form = modal?.querySelector('#add-member-form');
        const submitBtn = modal?.querySelector('#modal-footer #btn-save-download');
        modal?.classList.add('member-modal-mode');

        if (submitBtn) {
            submitBtn.setAttribute('data-member-submit', 'true');
            submitBtn.type = 'submit';
            submitBtn.form = 'add-member-form';
        }

        if (window.ValidationUtils) {
            ValidationUtils.attachLiveValidation(modal);
        }

        bindDrawerControls();
        setTimeout(setupFormListeners, 100);
    };

    /**
     * Validate form
     */
    const validateForm = () => {
        const form = document.querySelector('.modal-drawer form') || document.querySelector('.modal-drawer');
        if (window.ValidationUtils) {
            return ValidationUtils.validateForm(form);
        }

        return form?.checkValidity() ?? true;
    };

    /**
     * Collect form data
     */
    const collectFormData = () => {
        const formData = {};
        const inputs = document.querySelector('.modal-drawer')?.querySelectorAll('input, select, textarea');

        inputs?.forEach(input => {
            if (input.name) {
                formData[input.name] = input.value;
            }
        });

        return formData;
    };

    /**
     * Submit member form
     */
    const handleMemberFormSubmit = async (event, editMember = null) => {
        event.preventDefault();
        if (memberSubmitInFlight) return;

        const modal = document.querySelector('.modal-drawer');
        const form = modal?.querySelector('#add-member-form');
        const submitButton = modal?.querySelector('[data-member-submit]');
        const formData = collectFormData();
        const fullName = `${formData.firstName || ''} ${formData.lastName || ''}`.trim();
        const phone = String(formData.contact || '').trim();
        let didPersist = false;
        let savedMember = null;

        try {
            memberSubmitInFlight = true;
            if (!fullName || !phone) {
                UIComponents.showToast('Name and phone are required.', 'error', 'Validation Error');
                return;
            }

            if (window.ValidationUtils) {
                const validationTarget = document.querySelector('.modal-drawer');
                if (!ValidationUtils.validateForm(validationTarget)) {
                    UIComponents.showToast('Please correct the highlighted fields', 'error', 'Validation Error');
                    return;
                }
            }

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Processing...';
            }

            const memberData = {
                ...formData,
                age: Number(formData.age) || 0,
                fees: Number(formData.fees) || 0,
                discount: Number(formData.discount) || 0,
                paidAmount: Number(formData.paidAmount) || 0,
                balance: Number(formData.balance) || 0,
                status: 'active',
                joinedDate: new Date().toISOString().split('T')[0],
                memberId: editMember?.memberId || formData.memberId || generateMemberId()
            };

            const member = editMember
                ? StateManager.Members.update(editMember.id, memberData)
                : StateManager.Members.create(memberData);
            savedMember = { ...memberData, id: member.id };

            if (window.AsyncStateManager?.Members?.upsert) {
                await AsyncStateManager.Members.upsert({
                    ...memberData,
                    id: member.id,
                    memberId: member.memberId || memberData.memberId
                });
            }

            StateManager.Receipts.create({
                memberId: member.id,
                memberName: fullName,
                amount: memberData.paidAmount,
                discount: memberData.discount,
                totalAmount: memberData.fees,
                package: formData.package,
                paymentMode: formData.paymentMode,
                note: `${editMember ? 'Member Updated' : 'New Member Registration'} - ${formData.package}`,
                receiptDate: new Date().toISOString().split('T')[0]
            });

            renderMembersTableSafe();
            if (window.DashboardAnalytics?.refresh) {
                DashboardAnalytics.refresh();
            }
            if (typeof window.renderReportsHub === 'function') {
                renderReportsHub();
            }

            await yieldToBrowser();
            await downloadMemberInvoice(savedMember);
            didPersist = true;
        } catch (error) {
            console.error('[MemberModule] Form submission failed', error);
            UIComponents.showToast('Unable to save member right now.', 'error', 'Save Failed');
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Save & Download Invoice';
            }

            memberSubmitInFlight = false;

            if (didPersist) {
                closeMemberDrawer();
                UIComponents.showToast(
                    `Member ${fullName} ${editMember ? 'updated' : 'added'} successfully!`,
                    'success',
                    editMember ? 'Member Updated' : 'Member Created'
                );
            }
        }
    };

    /**
     * Show invoice preview modal
     */
    const showInvoicePreview = (memberData, autoOpen = false) => {
        const invoiceHTML = generateInvoiceHTML(memberData);
        
        UIComponents.openModal('Member Invoice', {
            content: invoiceHTML,
            buttons: [
                { label: 'Close', action: 'close', type: 'secondary' },
                { label: 'Save & Download PDF', action: 'custom', type: 'primary' }
            ]
        });

        const modal = document.querySelector('.modal-drawer');
        const printBtn = modal?.querySelector('#modal-footer button:last-child');

        if (printBtn) {
            printBtn.onclick = async () => {
                const safeMemberId = String(memberData.memberId || 'invoice').replace(/[^\w-]+/g, '-');
                await downloadInvoicePDF(`${safeMemberId}.pdf`);
            };
        }

        requestAnimationFrame(() => {
            const qrContainer = document.getElementById('member-qr-code');
            if (!qrContainer || typeof QRCode === 'undefined') {
                return;
            }

            qrContainer.innerHTML = '';
            new QRCode(qrContainer, {
                text: String(memberData.memberId || ''),
                width: 132,
                height: 132,
                colorDark: '#1F2722',
                colorLight: '#FFFFFF',
                correctLevel: QRCode.CorrectLevel.M
            });
        });
    };

    /**
     * Generate invoice HTML
     */
    const generateInvoiceHTML = (memberData) => {
        const discountAmount = (memberData.fees * (memberData.discount || 0)) / 100;
        const balance = calculateBalance(memberData.fees, memberData.discount, memberData.paidAmount);
        const nextDueDate = memberData.endDate || new Date().toLocaleDateString();

        // Get company settings
        const settings = SettingsManager.getCompanyProfile();
        const tax = SettingsManager.getTaxConfiguration();

        const invoiceHTML = `
            <div class="invoice-container">
                <div class="invoice-header">
                    <div class="gym-info">
                        ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="Logo" style="max-height: 60px; margin-bottom: 1rem;">` : ''}
                        <h2>${settings.gymName}</h2>
                        <div class="gym-address">
                            <p>${settings.fullAddress}</p>
                            <p>Phone: ${settings.phone}</p>
                            <p>Email: ${settings.email}</p>
                            <p>Tax ID: ${settings.gstNumber}</p>
                        </div>
                    </div>
                    <div class="invoice-number">
                        <h3>Invoice</h3>
                        <p>#${memberData.memberId || 'N/A'}</p>
                        <p style="font-size: 0.85rem; color: var(--on-surface-variant);">${new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                <div class="invoice-content">
                    <div class="invoice-section">
                        <h4>Member Details</h4>
                        <p><strong>Member ID:</strong> ${memberData.memberId || 'N/A'}</p>
                        <p><strong>Name:</strong> ${memberData.firstName} ${memberData.lastName}</p>
                        <p><strong>Contact:</strong> ${memberData.contact}</p>
                        <p><strong>Email:</strong> ${memberData.email}</p>
                        <p><strong>DOB:</strong> ${new Date(memberData.dob).toLocaleDateString()}</p>
                        <p><strong>Age:</strong> ${memberData.age} years</p>
                        <p><strong>Blood Group:</strong> ${memberData.bloodGroup}</p>
                    </div>

                    <div class="invoice-section">
                        <h4>Membership Details</h4>
                        <p><strong>Package:</strong> ${memberData.package}</p>
                        <p><strong>Start Date:</strong> ${new Date(memberData.startDate).toLocaleDateString()}</p>
                        <p><strong>End Date:</strong> ${new Date(memberData.endDate).toLocaleDateString()}</p>
                        <p><strong>Status:</strong> <span style="color: var(--success); font-weight: 600;">Active</span></p>
                        <p><strong>Next Due Date:</strong> ${new Date(memberData.endDate).toLocaleDateString()}</p>
                    </div>

                    <div class="invoice-section">
                        <h4>Gym QR Check-In</h4>
                        <div id="member-qr-code" style="display:flex; justify-content:center; padding: 0.75rem; background: rgba(13, 28, 47, 0.04); border-radius: 20px; min-height: 148px;"></div>
                        <p style="margin-top: 0.85rem;"><strong>Encoded Member ID:</strong> ${memberData.memberId || 'N/A'}</p>
                        <p style="font-size: 0.84rem; color: var(--on-surface-variant);">Scan this QR at the front desk for a fast attendance check-in.</p>
                    </div>

                    <div class="invoice-details">
                        <table>
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th style="text-align: right;">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>${memberData.package} Membership</td>
                                    <td style="text-align: right;">₹${parseFloat(memberData.fees).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                                ${memberData.discount > 0 ? `
                                    <tr>
                                        <td>Discount (${memberData.discount}%)</td>
                                        <td style="text-align: right;">-₹${discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    </tr>
                                ` : ''}
                                <tr>
                                    <td><strong>Subtotal</strong></td>
                                    <td style="text-align: right;"><strong>₹${(memberData.fees - discountAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                                </tr>
                                <tr>
                                    <td><strong>${tax.taxLabel} (${tax.taxPercentage}%)</strong></td>
                                    <td style="text-align: right;"><strong>₹${((memberData.fees - discountAmount) * tax.taxPercentage / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                                </tr>
                                <tr style="background: rgba(13, 28, 47, 0.02);">
                                    <td><strong>Total Amount</strong></td>
                                    <td style="text-align: right;"><strong>₹${((memberData.fees - discountAmount) * (1 + tax.taxPercentage / 100)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                                </tr>
                            </tbody>
                        </table>

                        <div class="summary-row">
                            <span>Amount Paid:</span>
                            <span>₹${parseFloat(memberData.paidAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>

                        <div class="summary-row total">
                            <span>Outstanding Balance:</span>
                            <span>₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>

                <div class="signature-section">
                    <div class="signature-block">
                        <div class="signature-line"></div>
                        <div class="signature-label">Member Signature</div>
                    </div>
                    <div class="signature-block">
                        <div class="signature-line"></div>
                        <div class="signature-label">Gym Manager</div>
                    </div>
                </div>

                <p style="text-align: center; font-size: 0.85rem; color: var(--on-surface-variant); margin-top: 2rem;">
                    Thank you for enrolling with ${settings.gymName}! | Invoice generated on ${new Date().toLocaleString()}
                </p>
            </div>
        `;

        return invoiceHTML
            .replace(`â‚¹${parseFloat(memberData.fees).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, formatINR(memberData.fees))
            .replace(`-â‚¹${discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, `-${formatINR(discountAmount)}`)
            .replace(`â‚¹${(memberData.fees - discountAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, formatINR(memberData.fees - discountAmount))
            .replace(`â‚¹${((memberData.fees - discountAmount) * tax.taxPercentage / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, formatINR(((memberData.fees - discountAmount) * tax.taxPercentage / 100)))
            .replace(`â‚¹${((memberData.fees - discountAmount) * (1 + tax.taxPercentage / 100)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, formatINR(((memberData.fees - discountAmount) * (1 + tax.taxPercentage / 100))))
            .replace(`â‚¹${parseFloat(memberData.paidAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, formatINR(memberData.paidAmount))
            .replace(`â‚¹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, formatINR(balance));
    };

    /**
     * Set status filter
     */
    const filterStatus = (status) => {
        currentFilters.status = status;
        
        // Update UI
        document.querySelectorAll('.filter-tab').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-status') === status) {
                btn.classList.add('active');
            }
        });
    };

    const getMemberStore = () => {
        if (window.MemberRepository && typeof window.MemberRepository.getAll === 'function') {
            return window.MemberRepository;
        }

        return {
            getAll: () => StateManager?.Members?.getAll?.() || [],
            getById: (id) => StateManager?.Members?.getById?.(id) || null
        };
    };

    const formatMemberDate = (value) => {
        if (!value) return 'N/A';
        const parsedDate = new Date(value);
        return Number.isNaN(parsedDate.getTime()) ? 'N/A' : parsedDate.toLocaleDateString();
    };

    const normalizeMember = (member = {}) => ({
        ...member,
        id: member.id || '',
        memberId: String(member.memberId || 'N/A'),
        firstName: String(member.firstName || '').trim(),
        lastName: String(member.lastName || '').trim(),
        contact: String(member.contact || ''),
        email: String(member.email || '').trim(),
        package: String(member.package || 'N/A'),
        endDate: member.endDate || '',
        balance: Number(member.balance) || 0,
        status: String(member.status || 'inactive').toLowerCase(),
        gender: String(member.gender || '').toLowerCase()
    });

    /**
     * Get filtered members
     */
    const getFilteredMembers = async () => {
        const memberStore = getMemberStore();
        const rawMembers = await Promise.resolve(memberStore.getAll());
        let members = Array.isArray(rawMembers) ? rawMembers.map(normalizeMember) : [];
        const search = String(document.querySelector('#member-search')?.value || '').trim().toLowerCase();
        const genderFilter = String(document.querySelector('#gender-filter')?.value || 'all').toLowerCase();

        if (currentFilters.status !== 'all') {
            members = members.filter(member => member.status === currentFilters.status);
        }

        if (genderFilter !== 'all') {
            members = members.filter(member => member.gender === genderFilter);
        }

        if (search) {
            members = members.filter(member =>
                `${member.firstName} ${member.lastName}`.trim().toLowerCase().includes(search) ||
                member.email.toLowerCase().includes(search) ||
                member.contact.toLowerCase().includes(search) ||
                member.memberId.toLowerCase().includes(search)
            );
        }

        return members;
    };

    /**
     * Render members table
     */
    const renderMembersTable = () => {
        const tbody = document.querySelector('#members-table-body');
        const emptyState = document.querySelector('#members-empty-state');

        if (!tbody) return;

        const members = getFilteredMembers();

        if (members.length === 0) {
            tbody.innerHTML = '';
            if (emptyState) emptyState.style.display = 'flex';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        tbody.innerHTML = members.map(member => {
            const endDate = new Date(member.endDate);
            const daysLeft = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
            const statusClass = member.status === 'active' ? 'status-active' : 'status-due';
            const statusText = member.status === 'active' ? 'Active' : 'Inactive';
            const balanceText = member.balance > 0 ? `₹${member.balance.toFixed(2)}` : 'Paid';

            return `
                <tr>
                    <td><strong>${member.memberId}</strong></td>
                    <td>${member.firstName} ${member.lastName}</td>
                    <td>${window.WhatsAppUtils ? WhatsAppUtils.createContactLink(member.contact, `Hello ${member.firstName || ''}, welcome to Kinetic Atelier.`) : member.contact}</td>
                    <td>${member.package}</td>
                    <td>${endDate.toLocaleDateString()}</td>
                    <td>${balanceText}</td>
                    <td><span class="status-chip ${statusClass}">${statusText}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-icon" onclick="MemberModule.openForm(StateManager.Members.getById('${member.id}'))">
                                <span class="material-icons-round">edit</span> Edit
                            </button>
                            <button class="btn-icon" onclick="WhatsAppUtils.openMemberPaymentReminder('${member.id}')">
                                <span class="material-icons-round">chat</span> Reminder
                            </button>
                            <button class="btn-icon" onclick="MemberModule.viewInvoice('${member.id}')">
                                <span class="material-icons-round">receipt</span>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    };

    /**
     * View invoice for member
     */
    const viewInvoice = (memberId) => {
        const member = StateManager.Members.getById(memberId);
        if (member) {
            showInvoicePreview(member);
        }
    };

    const createMemberRow = (member) => {
        const statusClass = member.status === 'active' ? 'status-active' : 'status-due';
        const statusText = member.status === 'active' ? 'Active' : 'Inactive';
        const balanceText = member.balance > 0 ? formatINR(member.balance) : 'Paid';
        const whatsappContact = window.WhatsAppUtils
            ? WhatsAppUtils.createContactLink(member.contact, `Hello ${member.firstName || ''}, welcome to Kinetic Atelier.`)
            : (member.contact || 'N/A');

        return `
            <tr data-member-id="${member.id}">
                <td><strong>${member.memberId}</strong></td>
                <td>${member.firstName} ${member.lastName}</td>
                <td>${whatsappContact}</td>
                <td>${member.package}</td>
                <td>${formatMemberDate(member.endDate)}</td>
                <td>${balanceText}</td>
                <td><span class="status-chip ${statusClass}">${statusText}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" type="button" data-action="edit" data-member-id="${member.id}">
                            <span class="material-icons-round">edit</span> Edit
                        </button>
                        <button class="btn-icon" type="button" data-action="whatsapp" data-member-id="${member.id}" aria-label="Send WhatsApp update">
                            <span class="material-icons-round">forum</span> WhatsApp
                        </button>
                        <button class="btn-icon" type="button" data-action="invoice" data-member-id="${member.id}">
                            <span class="material-icons-round">receipt</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    };

    const renderMembersTableSafe = async () => {
        const tbody = document.querySelector('#members-table-body');
        const emptyState = document.querySelector('#members-empty-state');
        const currentRenderId = ++renderCycle;

        if (!tbody) return;

        try {
            const members = await getFilteredMembers();

            if (currentRenderId !== renderCycle) return;

            if (members.length === 0) {
                tbody.innerHTML = '';
                if (emptyState) {
                    emptyState.style.display = 'flex';
                    const emptyMessage = emptyState.querySelector('p');
                    if (emptyMessage) {
                        emptyMessage.textContent = 'No members match the current filters.';
                    }
                }
                return;
            }

            if (emptyState) emptyState.style.display = 'none';
            tbody.innerHTML = members.map(createMemberRow).join('');
        } catch (error) {
            console.error('[MemberModule] Failed to render members table', error);
            tbody.innerHTML = '';

            if (emptyState) {
                emptyState.style.display = 'flex';
                const emptyMessage = emptyState.querySelector('p');
                if (emptyMessage) {
                    emptyMessage.textContent = 'Unable to load members right now.';
                }
            }

            if (typeof UIComponents !== 'undefined') {
                UIComponents.showToast('Members data could not be loaded.', 'error', 'Members Error');
            }
        }
    };

    const viewInvoiceSafe = (memberId) => {
        const member = getMemberStore().getById(memberId);
        if (member) {
            showInvoicePreview(normalizeMember(member));
        }
    };

    const bindEvents = () => {
        if (eventsBound) return;
        eventsBound = true;

        const searchInput = document.querySelector('#member-search');
        const genderFilter = document.querySelector('#gender-filter');
        const filterTabsContainer = document.querySelector('.filter-tabs');
        const membersTableBody = document.querySelector('#members-table-body');

        searchInput?.addEventListener('input', () => {
            renderMembersTableSafe();
        });

        genderFilter?.addEventListener('change', () => {
            renderMembersTableSafe();
        });

        filterTabsContainer?.addEventListener('click', (event) => {
            const button = event.target.closest('.filter-tab');
            if (!button) return;

            filterStatus(button.dataset.status || 'all');
            renderMembersTableSafe();
        });

        membersTableBody?.addEventListener('click', (event) => {
            const actionButton = event.target.closest('[data-action]');
            if (!actionButton) return;

            const memberId = actionButton.dataset.memberId;
            if (!memberId) return;

            switch (actionButton.dataset.action) {
                case 'edit': {
                    const member = getMemberStore().getById(memberId);
                    if (member) {
                        openForm(member);
                    }
                    break;
                }
                case 'whatsapp': {
                    const member = getMemberStore().getById(memberId);
                    if (member) {
                        openMemberWhatsApp(normalizeMember(member));
                    }
                    break;
                }
                case 'invoice':
                    viewInvoiceSafe(memberId);
                    break;
                default:
                    break;
            }
        });
    };

    /**
     * Initialize module on page load
     */
    const initialize = () => {
        bindModalLifecycle();
        bindMemberEntryPoints();
        bindEvents();
        renderMembersTableSafe();
        console.log('[MemberModule] ✓ Initialized - Ready for member management');
    };

    /**
     * Public API
     */
    return {
        openForm,
        renderMembersTable: renderMembersTableSafe,
        filterStatus,
        viewInvoice: viewInvoiceSafe,
        calculateAge,
        calculateEndDate,
        calculateBalance,
        initialize
    };
})();

// Initialize on DOM ready
window.addEventListener('DOMContentLoaded', () => {
    if (typeof MemberModule !== 'undefined') {
        MemberModule.initialize();
    }
});
