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
    const MEMBERS_API_URL = 'http://localhost:5000/api/v1/members';

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
    let pendingMemberFormData = null;
    let pendingInvoiceMemberData = null;
    let pendingInvoiceEditTarget = null;
    let pendingInvoiceNeedsPersistence = false;
    let pendingInvoiceAssets = null;
    let memberCache = [];

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
                    { name: 'email', label: 'Email', type: 'email', required: false, placeholder: 'john@example.com' },
                    { name: 'dob', label: 'Date of Birth *', type: 'date', required: true },
                    { name: 'age', label: 'Age', type: 'number', readonly: true, placeholder: 'Auto-calculated' },
                    { name: 'gender', label: 'Gender *', type: 'select', required: true, options: [
                        { value: '', label: 'Select Gender' },
                        { value: 'male', label: 'Male' },
                        { value: 'female', label: 'Female' },
                        { value: 'other', label: 'Other' }
                    ]},
                    { name: 'bloodGroup', label: 'Blood Group', type: 'select', required: false, options: [
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
                    { name: 'address', label: 'Address', type: 'textarea', required: false, placeholder: '123 Main St, City, State 12345' },
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
                    { name: 'discount', label: 'Discount', type: 'number', placeholder: '0', min: 0, max: 100 },
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

    const DEFAULT_PACKAGE_CATALOG = [
        { id: 'basic-3m', name: 'Basic 3 Months', durationMonths: 3, price: 3000 },
        { id: 'premium-6m', name: 'Premium 6 Months', durationMonths: 6, price: 5400 }
    ];

    const getAvailablePackages = () => DEFAULT_PACKAGE_CATALOG;

    const getPackageConfigById = (packageId) => {
        return getAvailablePackages().find((pkg) => String(pkg.id) === String(packageId)) || null;
    };

    const normalizePackageLookupValue = (value = '') => {
        return String(value || '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ');
    };

    const getPackageConfigByName = (packageName) => {
        const normalizedPackageName = normalizePackageLookupValue(packageName);
        if (!normalizedPackageName) {
            return null;
        }

        return getAvailablePackages().find((pkg) => {
            const normalizedId = normalizePackageLookupValue(pkg.id);
            const normalizedName = normalizePackageLookupValue(pkg.name);
            return normalizedPackageName === normalizedId || normalizedPackageName === normalizedName;
        }) || null;
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
        const selectedPackage = getPackageConfigById(packageId);
        const durationDays = Math.max((Number(selectedPackage?.durationMonths) || 1) * 30, 30);
        const start = new Date(startDate);
        const end = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);
        return end.toISOString().split('T')[0];
    };

    const calculateDiscountAmount = (fees, discountValue, discountType = 'amount') => {
        const normalizedFees = Number(fees) || 0;
        const normalizedDiscount = Number(discountValue) || 0;
        let actualDiscount = 0;

        if (discountType === 'percent') {
            actualDiscount = (normalizedFees * normalizedDiscount) / 100;
        } else {
            actualDiscount = normalizedDiscount;
        }

        return Math.min(Math.max(actualDiscount, 0), normalizedFees);
    };

    const getTaxPercentage = () => {
        try {
            return Number(SettingsManager?.getTaxConfiguration?.()?.taxPercentage) || 0;
        } catch (error) {
            console.warn('[MemberModule] Unable to resolve tax configuration. Falling back to 0%.', error);
            return 0;
        }
    };

    const calculateInvoiceTotals = (fees, discountValue, paidAmount, discountType = 'amount', taxPercentage = getTaxPercentage()) => {
        const normalizedFees = Number(fees) || 0;
        const discountAmount = calculateDiscountAmount(normalizedFees, discountValue, discountType);
        const subtotal = Math.max(0, normalizedFees - discountAmount);
        const normalizedTaxPercentage = Number(taxPercentage) || 0;
        const taxAmount = (subtotal * normalizedTaxPercentage) / 100;
        const netTotal = subtotal + taxAmount;
        const normalizedPaidAmount = Number(paidAmount) || 0;
        const balance = Math.max(0, netTotal - normalizedPaidAmount);

        return {
            discountAmount,
            subtotal,
            taxAmount,
            netTotal,
            paidAmount: normalizedPaidAmount,
            balance
        };
    };

    /**
     * Calculate balance (fees after discount + tax - paid amount)
     */
    const calculateBalance = (fees, discountValue, paid, discountType = 'amount', taxPercentage = getTaxPercentage()) => {
        return calculateInvoiceTotals(fees, discountValue, paid, discountType, taxPercentage).balance;
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
                const price = getPackageConfigById(e.target.value)?.price;
                if (feesInput && price) feesInput.value = price;
                updateBalanceDisplay();
            });
        }

        // Balance calculation
        const discountValueInput = document.getElementById('discountValue');
        const discountTypeInput = document.getElementById('discountType');
        const paidInput = document.querySelector('[name="paidAmount"]');
        const balanceInput = document.querySelector('[name="balance"]');

        const updateBalance = () => {
            const fees = parseFloat(feesInput?.value || 0);
            const discountValue = parseFloat(discountValueInput?.value || 0);
            const discountType = discountTypeInput?.value || 'amount';
            const paid = parseFloat(paidInput?.value || 0);
            const totals = calculateInvoiceTotals(
                fees,
                discountValue,
                paid,
                discountType
            );
            if (balanceInput) balanceInput.value = totals.balance.toFixed(2);
        };

        if (discountValueInput) discountValueInput.addEventListener('input', updateBalance);
        if (discountTypeInput) discountTypeInput.addEventListener('change', updateBalance);
        if (paidInput) paidInput.addEventListener('input', updateBalance);
        if (feesInput) feesInput.addEventListener('input', updateBalance);
    };

    /**
     * Update balance display
     */
    const updateBalanceDisplay = () => {
        const feesInput = document.querySelector('[name="fees"]');
        const discountValueInput = document.getElementById('discountValue');
        const discountTypeInput = document.getElementById('discountType');
        const paidInput = document.querySelector('[name="paidAmount"]');
        const balanceInput = document.querySelector('[name="balance"]');

        const fees = parseFloat(feesInput?.value || 0);
        const discountValue = parseFloat(discountValueInput?.value || 0);
        const discountType = discountTypeInput?.value || 'amount';
        const paid = parseFloat(paidInput?.value || 0);
        const totals = calculateInvoiceTotals(
            fees,
            discountValue,
            paid,
            discountType
        );
        if (balanceInput) balanceInput.value = totals.balance.toFixed(2);
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

    };

    const bindDrawerControls = () => {
        if (drawerControlsBound) return;
        drawerControlsBound = true;

        document.body.addEventListener('click', (event) => {
            const target = event.target.closest('#btn-start-camera, #btn-snap-photo, #btn-edit-invoice, #btn-download-whatsapp, #btn-save-add-another');
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

            if (target.id === 'btn-edit-invoice') {
                event.preventDefault();
                closeInvoicePreviewModal();
                if (pendingMemberFormData || pendingInvoiceMemberData) {
                    openForm(pendingMemberFormData || pendingInvoiceMemberData, pendingInvoiceEditTarget);
                }
                return;
            }

            if (target.id === 'btn-download-whatsapp') {
                event.preventDefault();
                downloadAndSendInvoice();
                return;
            }

            if (target.id === 'btn-save-add-another') {
                event.preventDefault();
                saveMemberAndKeepFormOpen();
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

                if (typeof value === 'string' && value.trim().toUpperCase() === 'NA') {
                    value = '';
                }

                if (field.type === 'date') {
                    value = formatDateFieldValue(value);
                }
                
                // Generate member ID if needed
                if (field.name === 'memberId' && !value) {
                    value = generateMemberId();
                }

                if (field.name === 'discount') {
                    const discountType = editMember?.discountType === 'percent' ? 'percent' : 'amount';
                    const discountValue = editMember?.discountValue ?? editMember?.discount ?? '';
                    formHTML += `
                        <div class="form-group" style="display: flex; flex-direction: column; width: 100%;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; width: 100%;">
                                <label style="margin: 0;">Discount</label>
                                <select name="discountType" id="discountType" style="width: auto; min-width: 90px; height: 32px; padding: 0 8px; border-radius: 6px; background-color: var(--bg-soft, #f3f4f6); border: 1px solid var(--border-color, #e5e7eb); color: var(--text-primary); font-size: 0.85rem; outline: none;">
                                    <option value="amount" ${discountType === 'amount' ? 'selected' : ''}>₹ (Flat)</option>
                                    <option value="percent" ${discountType === 'percent' ? 'selected' : ''}>% (Percent)</option>
                                </select>
                            </div>
                            <input type="number" class="form-input" name="discountValue" id="discountValue" placeholder="0" min="0" value="${discountValue}" style="width: 100%;">
                            <div class="field-error" aria-live="polite"></div>
                        </div>
                    `;
                    return;
                }

                formHTML += '<div class="form-group">';
                formHTML += `<label class="form-label">${field.label}</label>`;

                if (field.type === 'textarea') {
                    formHTML += `<textarea class="form-input" name="${field.name}" 
                        placeholder="${field.placeholder || ''}" 
                        ${field.required ? 'required' : ''} 
                        ${field.readonly ? 'readonly' : ''}>${value}</textarea>`;
                } else if (field.type === 'select') {
                    const selectOptions = field.name === 'package'
                        ? [
                            { value: '', label: 'Choose a Package' },
                            ...getAvailablePackages().map((pkg) => ({
                                value: pkg.id,
                                label: `${pkg.name} - ${pkg.durationMonths} Months (${formatINR(pkg.price)})`
                            }))
                        ]
                        : field.options;
                    formHTML += `<select class="form-input" name="${field.name}" 
                        data-validation="${field.validation || ''}"
                        ${field.required ? 'required' : ''} 
                        ${field.readonly ? 'readonly' : ''}>`;
                    selectOptions.forEach(opt => {
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

        formHTML += `
            <div class="terms-section">
                <div class="form-section-title">
                    <span class="material-icons-round">gavel</span>
                    Terms & Conditions
                </div>
                <div class="terms-box">
                    <p>1. Membership fees are non-refundable once activated.</p>
                    <p>2. Members must carry or present their membership ID for entry and attendance check-in.</p>
                    <p>3. The gym is not responsible for loss of personal belongings left unattended.</p>
                    <p>4. Members must follow trainer instructions and use equipment responsibly.</p>
                    <p>5. Any medical condition or injury must be disclosed before participating in workouts.</p>
                    <p>6. Misconduct, unsafe behavior, or repeated rule violations may result in membership suspension.</p>
                    <p>7. Renewal reminders and invoices may be shared through WhatsApp, SMS, or email.</p>
                </div>
                <label class="terms-check">
                    <input type="checkbox" name="agreeTerms" id="agree-terms" ${editMember?.agreeTerms ? 'checked' : ''} required>
                    <span>I agree to the Terms and Conditions</span>
                </label>
                <div class="field-error" aria-live="polite"></div>
            </div>
        `;

        formHTML += '</div>';
        return formHTML;
    };

    /**
     * Open member form modal
     */
    const openForm = (editMember = null, editTarget = null) => {
        currentEditMember = editTarget || (editMember?.id ? editMember : null);
        const title = editMember ? `Edit Member - ${editMember.firstName} ${editMember.lastName}` : 'Add New Member';
        const formHTML = `
            <form id="add-member-form" novalidate>
                ${renderFormHTML(editMember)}
            </form>
        `;

        UIComponents.openModal(title, {
            content: formHTML,
            buttons: [
                ...(editMember ? [] : [{ id: 'btn-save-add-another', label: 'Save & Add Another', action: 'custom', type: 'secondary' }]),
                { id: 'btn-save-preview', label: 'Save & Preview Invoice', action: 'custom', type: 'primary', form: 'add-member-form' }
            ]
        });

        const modal = document.querySelector('.modal-drawer');
        modal?.classList.add('member-modal-mode');

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
                formData[input.name] = input.type === 'checkbox' ? input.checked : input.value;
            }
        });

        return formData;
    };

    const sanitizePhoneNumber = (value = '') => String(value).replace(/\D/g, '').slice(-10);

    const showMembersToast = (message, type = 'info', title = 'Members') => {
        if (window.UIComponents?.showToast) {
            UIComponents.showToast(message, type, title);
        } else {
            console[type === 'error' ? 'error' : 'log'](`[MemberModule] ${message}`);
        }
    };

    const getCachedMemberById = (memberId) => {
        return memberCache.find((member) => String(member.id) === String(memberId)) || null;
    };

    const getPackageDisplayName = (packageId) => {
        const selectedPackage = getPackageConfigById(packageId);
        return selectedPackage?.name || String(packageId || '').trim() || 'Membership';
    };

    const formatDateFieldValue = (value) => {
        if (value === null || value === undefined) {
            return '';
        }

        const rawValue = String(value).trim();
        if (!rawValue || rawValue.toUpperCase() === 'NA') {
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

    const extractMemberFromResponse = (payload) => {
        if (!payload?.success || !payload?.data) {
            return null;
        }

        return payload.data.member || payload.data;
    };

    const mapApiMemberToUi = (member = {}) => {
        const packageName = String(member.package_name || member.packageName || member.package || '').trim();
        const packageConfig = getPackageConfigByName(packageName) || getPackageConfigById(packageName);
        const totalPaid = Number(member.total_paid ?? member.totalPaid ?? 0);
        const balance = Number(member.balance) || 0;

        return {
            id: member.id || '',
            branchId: member.branch_id || member.branchId || '',
            memberId: String(member.member_code || member.memberId || ''),
            firstName: String(member.first_name || member.firstName || '').trim(),
            lastName: String(member.last_name || member.lastName || '').trim(),
            contact: String(member.contact_no || member.contact || '').trim(),
            email: String(member.email || '').trim(),
            dob: member.date_of_birth || member.dob || '',
            age: calculateAge(member.date_of_birth || member.dob),
            gender: String(member.gender || '').toLowerCase(),
            address: String(member.address || '').trim(),
            city: String(member.city || '').trim(),
            package: packageConfig?.id || packageName,
            packageLabel: packageConfig?.name || packageName || 'N/A',
            startDate: member.start_date || member.startDate || '',
            endDate: member.end_date || member.endDate || '',
            fees: totalPaid + balance,
            paidAmount: totalPaid,
            balance,
            totalPaid,
            status: String(member.status || '').toLowerCase() || getMemberStatus(member.end_date || member.endDate).text.toLowerCase(),
            notes: String(member.notes || '').trim(),
            memberPhoto: member.photo_url || member.memberPhoto || ''
        };
    };

    const loadMembersFromApi = async () => {
        try {
            const searchValue = String(document.querySelector('#member-search')?.value || '').trim();
            const requestUrl = new URL(MEMBERS_API_URL);

            if (searchValue) {
                requestUrl.searchParams.set('search', searchValue);
            }

            const response = await fetch(requestUrl.toString(), {
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

            const payload = await response.json();
            const members = Array.isArray(payload?.data?.members) ? payload.data.members : [];
            memberCache = members.map(mapApiMemberToUi);
            return memberCache;
        } catch (error) {
            console.error('[MemberModule] Failed to load members from API', error);
            throw error;
        }
    };

    const fetchMemberById = async (memberId) => {
        const cachedMember = getCachedMemberById(memberId);
        if (cachedMember) {
            return cachedMember;
        }

        try {
            const response = await fetch(`${MEMBERS_API_URL}/${encodeURIComponent(memberId)}`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

            const payload = await response.json();
            const member = extractMemberFromResponse(payload);
            if (!member) {
                return null;
            }

            const normalizedMember = mapApiMemberToUi(member);
            memberCache = memberCache.filter((item) => String(item.id) !== String(normalizedMember.id));
            memberCache.push(normalizedMember);
            return normalizedMember;
        } catch (error) {
            console.error('[MemberModule] Failed to fetch member by id', error);
            throw error;
        }
    };

    const resolveBranchId = async (editTarget = null) => {
        if (editTarget?.branchId) {
            return editTarget.branchId;
        }

        if (window.APP_DEFAULT_BRANCH_ID) {
            return String(window.APP_DEFAULT_BRANCH_ID).trim();
        }

        if (memberCache[0]?.branchId) {
            return memberCache[0].branchId;
        }

        if (window.DashboardAnalytics?.fetchDashboardData) {
            try {
                const dashboardData = await DashboardAnalytics.fetchDashboardData();
                if (dashboardData?.pulse?.branchId) {
                    return dashboardData.pulse.branchId;
                }
            } catch (error) {
                console.warn('[MemberModule] Unable to derive branch id from dashboard data', error);
            }
        }

        return '';
    };

    const buildMemberApiPayload = async (memberData, editTarget = null) => {
        const branchId = await resolveBranchId(editTarget);
        if (!branchId) {
            throw new Error('Branch id is required before saving a member');
        }

        const notes = [
            memberData.bloodGroup ? `Blood Group: ${memberData.bloodGroup}` : '',
            memberData.healthDetails ? `Health Details: ${memberData.healthDetails}` : ''
        ].filter(Boolean).join('\n');

        return {
            branch_id: branchId,
            member_code: memberData.memberId,
            first_name: memberData.firstName,
            last_name: memberData.lastName || null,
            gender: memberData.gender || null,
            date_of_birth: memberData.dob || null,
            email: String(memberData.email || '').trim() || null,
            contact_no: memberData.contact,
            address: String(memberData.address || '').trim() || null,
            city: String(memberData.city || '').trim() || null,
            package_name: getPackageDisplayName(memberData.package),
            start_date: memberData.startDate || null,
            end_date: memberData.endDate || null,
            status: memberData.status || 'active',
            balance: Number(memberData.balance) || 0,
            total_paid: Number(memberData.paidAmount) || 0,
            notes: notes || null
        };
    };

    const deleteMemberFromApi = async (memberId) => {
        try {
            const response = await fetch(`${MEMBERS_API_URL}/${encodeURIComponent(memberId)}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json'
                }
            });

            const payload = await response.json().catch(() => ({}));

            if (!response.ok || payload?.success === false) {
                throw new Error(payload?.message || `Request failed with status ${response.status}`);
            }

            memberCache = memberCache.filter((member) => String(member.id) !== String(memberId));
            await renderMembersTableSafe();

            if (window.DashboardAnalytics?.refresh) {
                DashboardAnalytics.refresh();
            }
            if (typeof window.renderReportsHub === 'function') {
                renderReportsHub();
            }

            showMembersToast('Member deleted successfully.', 'success', 'Member Deleted');
            return true;
        } catch (error) {
            console.error('[MemberModule] Failed to delete member via API', error);
            throw error;
        }
    };

    const normalizeMemberDraftData = (formData = {}, editTarget = null) => {
        const fees = Number(formData.fees) || 0;
        const discountValue = Number(formData.discountValue) || 0;
        const discountType = formData.discountType || 'amount';
        const paidAmount = Number(formData.paidAmount) || 0;
        const totals = calculateInvoiceTotals(fees, discountValue, paidAmount, discountType);

        return {
            ...formData,
            email: String(formData.email || '').trim(),
            address: String(formData.address || '').trim(),
            city: String(formData.city || '').trim(),
            age: Number(formData.age) || 0,
            fees,
            discountValue,
            discountType,
            discount: totals.discountAmount,
            paidAmount: totals.paidAmount,
            balance: totals.balance,
            netTotal: totals.netTotal,
            taxAmount: totals.taxAmount,
            subtotal: totals.subtotal,
            status: 'active',
            joinedDate: new Date().toISOString().split('T')[0],
            totalPaid: totals.paidAmount,
            memberId: editTarget?.memberId || formData.memberId || generateMemberId()
        };
    };

    const getBase64FromUrl = async (url) => {
        const fallbackImageDataUrl = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

        try {
            if (!url) {
                return fallbackImageDataUrl;
            }

            const data = await fetch(url, { mode: 'cors' });
            if (!data.ok) {
                throw new Error(`Asset request failed with status ${data.status}`);
            }

            const blob = await data.blob();
            return await new Promise((resolve) => {
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => resolve(reader.result || fallbackImageDataUrl);
                reader.onerror = () => resolve(fallbackImageDataUrl);
            });
        } catch (error) {
            console.warn('[MemberModule] Unable to convert image URL to base64, using fallback asset instead.', url, error);
            return fallbackImageDataUrl;
        }
    };

    const resolveInvoiceAssets = async () => {
        const settings = SettingsManager.getCompanyProfile();
        const logoUrl = typeof settings?.logoUrl === 'string' ? settings.logoUrl.trim() : '';
        const signatureUrl = typeof settings?.signatureUrl === 'string' ? settings.signatureUrl.trim() : '';

        const [logoSrc, signatureSrc] = await Promise.all([
            logoUrl ? getBase64FromUrl(logoUrl) : Promise.resolve(null),
            signatureUrl ? getBase64FromUrl(signatureUrl) : Promise.resolve(null)
        ]);

        return { logoSrc, signatureSrc };
    };

    const openInvoicePreviewModal = async (memberData) => {
        const previewModal = document.getElementById('invoice-preview-modal');
        const renderArea = document.getElementById('invoice-render-area');
        if (!previewModal || !renderArea) return;

        try {
            pendingInvoiceAssets = await resolveInvoiceAssets();
        } catch (error) {
            console.warn('[MemberModule] Invoice assets could not be resolved. Falling back to placeholder assets.', error);
            pendingInvoiceAssets = {
                logoSrc: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
                signatureSrc: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
            };
        }

        renderArea.innerHTML = generateInvoiceHTML(memberData, pendingInvoiceAssets);
        previewModal.classList.add('active');
        previewModal.setAttribute('aria-hidden', 'false');
    };

    const closeInvoicePreviewModal = () => {
        const previewModal = document.getElementById('invoice-preview-modal');
        const renderArea = document.getElementById('invoice-render-area');

        previewModal?.classList.remove('active');
        previewModal?.setAttribute('aria-hidden', 'true');
        if (renderArea) {
            renderArea.innerHTML = '';
        }
        pendingInvoiceAssets = null;
    };

    const persistMemberRecord = async (memberData, editTarget = null) => {
        try {
            const branchId = String(window.APP_DEFAULT_BRANCH_ID || '').trim();
            const normalizedGender = ['male', 'female', 'other', 'prefer_not_to_say'].includes(String(memberData.gender || '').toLowerCase())
                ? String(memberData.gender).toLowerCase()
                : 'prefer_not_to_say';

            const payload = {
                branch_id: branchId,
                first_name: String(memberData.firstName || memberData.name || '').trim(),
                last_name: String(memberData.lastName || '').trim() || null,
                contact_no: String(memberData.phone || memberData.contactNo || memberData.contact || '').trim(),
                gender: normalizedGender,
                member_code: String(
                    memberData.memberId ||
                    memberData.member_code ||
                    memberData.memberCode ||
                    `KA-${Date.now().toString().slice(-6)}`
                ).trim(),
                status: 'active',
                date_of_birth: memberData.dob || memberData.dateOfBirth || null,
                email: String(memberData.email || '').trim() || null,
                address: String(memberData.address || '').trim() || null,
                city: String(memberData.city || '').trim() || null,
                package_name: getPackageDisplayName(memberData.package),
                start_date: memberData.startDate || null,
                end_date: memberData.endDate || null,
                balance: Number(memberData.balance) || 0,
                total_paid: Number(memberData.paidAmount || memberData.totalPaid) || 0,
                notes: String(memberData.notes || '').trim() || null
            };

            if (!payload.branch_id) {
                throw new Error('window.APP_DEFAULT_BRANCH_ID is missing or empty');
            }

            if (!payload.first_name) {
                throw new Error('first_name is required before saving a member');
            }

            if (!payload.contact_no) {
                throw new Error('contact_no is required before saving a member');
            }

            const requestUrl = editTarget?.id
                ? `${MEMBERS_API_URL}/${encodeURIComponent(editTarget.id)}`
                : MEMBERS_API_URL;
            const requestMethod = editTarget?.id ? 'PUT' : 'POST';

            const response = await fetch(requestUrl, {
                method: requestMethod,
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                let errorData = {};

                try {
                    errorData = await response.json();
                } catch (parseError) {
                    console.warn('[MemberModule] Failed to parse error response JSON', parseError);
                }

                console.error('[MemberModule] Member API rejected payload', {
                    status: response.status,
                    errors: errorData?.errors || null,
                    message: errorData?.message || null,
                    payload
                });

                throw new Error(
                    errorData?.message ||
                    (Array.isArray(errorData?.errors) && errorData.errors.length > 0
                        ? errorData.errors.map((item) => item.message || item.msg).join(', ')
                        : `Request failed with status ${response.status}`)
                );
            }

            const responsePayload = await response.json().catch(() => ({}));
            const savedMember = extractMemberFromResponse(responsePayload);
            if (!savedMember) {
                throw new Error('Members API did not return the saved member');
            }

            const normalizedMember = mapApiMemberToUi(savedMember);
            memberCache = memberCache.filter((member) => String(member.id) !== String(normalizedMember.id));
            memberCache.unshift(normalizedMember);

            await renderMembersTableSafe();
            if (window.DashboardAnalytics?.refresh) {
                DashboardAnalytics.refresh();
            }
            if (typeof window.renderReportsHub === 'function') {
                renderReportsHub();
            }

            return normalizedMember;
        } catch (error) {
            console.error('[MemberModule] Failed to persist member via API', error);
            throw error;
        }
    };

    const validateMemberDraft = (formData) => {
        const fullName = `${formData.firstName || ''} ${formData.lastName || ''}`.trim();
        const phone = String(formData.contact || '').trim();

        if (!fullName || !phone) {
            UIComponents.showToast('Name and phone are required.', 'error', 'Validation Error');
            return false;
        }

        if (window.ValidationUtils) {
            const validationTarget = document.querySelector('.modal-drawer');
            if (!ValidationUtils.validateForm(validationTarget)) {
                UIComponents.showToast('Please correct the highlighted fields', 'error', 'Validation Error');
                return false;
            }
        }

        if (!formData.agreeTerms) {
            window.alert('Please agree to the Terms and Conditions before continuing.');
            return false;
        }

        return true;
    };

    const resetMemberFormForNextEntry = () => {
        const form = document.getElementById('add-member-form');
        if (!form) return;

        form.reset();
        const memberIdInput = form.querySelector('[name="memberId"]');
        if (memberIdInput) {
            memberIdInput.value = generateMemberId();
        }

        currentEditMember = null;
        pendingMemberFormData = null;
        pendingInvoiceEditTarget = null;
        pendingInvoiceMemberData = null;
        pendingInvoiceNeedsPersistence = false;
        resetMemberModalState();
        updateBalanceDisplay();
    };

    const saveMemberAndKeepFormOpen = async () => {
        if (memberSubmitInFlight) return;

        const formData = collectFormData();
        const triggerButton = document.getElementById('btn-save-add-another');

        try {
            memberSubmitInFlight = true;

            if (!validateMemberDraft(formData)) {
                return;
            }

            if (triggerButton) {
                triggerButton.disabled = true;
                triggerButton.textContent = 'Saving...';
            }

            const memberDraft = normalizeMemberDraftData(formData, null);
            const savedMember = await persistMemberRecord(memberDraft, null);
            UIComponents.showToast(`${savedMember.firstName || 'Member'} Saved!`, 'success', 'Member Added');
            resetMemberFormForNextEntry();
        } catch (error) {
            console.error('[MemberModule] Save & Add Another failed', error);
            UIComponents.showToast('Unable to save this member right now.', 'error', 'Save Failed');
        } finally {
            if (triggerButton) {
                triggerButton.disabled = false;
                triggerButton.textContent = 'Save & Add Another';
            }
            memberSubmitInFlight = false;
        }
    };

    const downloadAndSendInvoice = async () => {
        if (memberSubmitInFlight || !pendingInvoiceMemberData) {
            return;
        }

        const renderArea = document.getElementById('invoice-render-area');
        if (!renderArea) {
            return;
        }

        try {
            memberSubmitInFlight = true;
            const safeMemberId = String(pendingInvoiceMemberData.memberId || 'invoice').replace(/[^\w-]+/g, '-');
            pendingInvoiceAssets = await resolveInvoiceAssets();
            renderArea.innerHTML = generateInvoiceHTML(pendingInvoiceMemberData, pendingInvoiceAssets);
            await downloadInvoicePDF(`${safeMemberId}.pdf`, renderArea);

            const phoneNumber = sanitizePhoneNumber(pendingInvoiceMemberData.contact);
            if (!phoneNumber) {
                window.alert('A valid phone number is required to open WhatsApp.');
                return;
            }

            const companyProfile = SettingsManager.getCompanyProfile();
            const gymName = companyProfile.gymName || 'our Gym';
            const firstName = pendingInvoiceMemberData.firstName ? pendingInvoiceMemberData.firstName.trim() : 'there';
            const party = String.fromCodePoint(0x1F389);
            const flex = String.fromCodePoint(0x1F4AA);
            const fire = String.fromCodePoint(0x1F525);
            const rawMessage = `Welcome to the ${gymName} family, ${firstName}! ${party}\n\nWe are super excited to kickstart your fitness journey with us. Please find your membership invoice attached for your records.\n\nLet's crush those goals together! ${flex}${fire}`;
            const whatsappUrl = `https://web.whatsapp.com/send?phone=91${phoneNumber}&text=${encodeURIComponent(rawMessage)}`;
            console.log(rawMessage);
            console.log(whatsappUrl);
            window.open(whatsappUrl, '_blank');

            if (pendingInvoiceNeedsPersistence) {
                await persistMemberRecord(pendingInvoiceMemberData, pendingInvoiceEditTarget);
                UIComponents.showToast(
                    `Member ${(pendingInvoiceMemberData.firstName || '').trim()} saved successfully!`,
                    'success',
                    pendingInvoiceEditTarget?.id ? 'Member Updated' : 'Member Created'
                );
            }

            closeInvoicePreviewModal();
            pendingMemberFormData = null;
            pendingInvoiceNeedsPersistence = false;
            pendingInvoiceEditTarget = null;
            pendingInvoiceMemberData = null;
        } catch (error) {
            console.error('[MemberModule] Invoice download/WhatsApp failed', error);
            UIComponents.showToast('Unable to complete the invoice handoff.', 'error', 'Invoice Error');
        } finally {
            memberSubmitInFlight = false;
        }
    };

    /**
     * Submit member form
     */
    const handleMemberFormSubmit = async (event, editMember = null) => {
        event.preventDefault();
        if (memberSubmitInFlight) return;

        const modal = document.querySelector('.modal-drawer');
        const submitButton = modal?.querySelector('#btn-save-preview');
        const formData = collectFormData();

        try {
            memberSubmitInFlight = true;
            if (!validateMemberDraft(formData)) {
                return;
            }

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Preparing Preview...';
            }

            pendingMemberFormData = { ...formData };
            pendingInvoiceMemberData = normalizeMemberDraftData(formData, editMember);
            pendingInvoiceEditTarget = editMember?.id ? editMember : null;
            pendingInvoiceNeedsPersistence = true;

            closeModal('modal-drawer');
            await yieldToBrowser();
            await openInvoicePreviewModal(pendingInvoiceMemberData);
        } catch (error) {
            console.error('[MemberModule] Form submission failed', error);
            UIComponents.showToast('Unable to prepare the invoice preview right now.', 'error', 'Preview Failed');
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Save & Preview Invoice';
            }

            memberSubmitInFlight = false;
        }
    };

    /**
     * Show invoice preview modal
     */
    const showInvoicePreview = async (memberData, autoOpen = false) => {
        pendingMemberFormData = { ...memberData, agreeTerms: true };
        pendingInvoiceMemberData = normalizeMemberDraftData(memberData, memberData?.id ? memberData : null);
        pendingInvoiceEditTarget = memberData?.id ? memberData : null;
        pendingInvoiceNeedsPersistence = false;
        await openInvoicePreviewModal(pendingInvoiceMemberData);
    };

    /**
     * Generate invoice HTML
     */
    const generateInvoiceHTML = (memberData, invoiceAssets = {}) => {
        const totals = calculateInvoiceTotals(
            memberData.fees,
            memberData.discountValue ?? memberData.discount,
            memberData.paidAmount,
            memberData.discountType || 'amount'
        );
        const discountAmount = totals.discountAmount;
        const balance = totals.balance;
        const nextDueDate = memberData.endDate || new Date().toLocaleDateString();

        // Get company settings
        const settings = SettingsManager.getCompanyProfile();
        const tax = SettingsManager.getTaxConfiguration();
        const taxAmount = totals.taxAmount;
        const totalAmount = totals.netTotal;
        const subtotal = totals.subtotal;
        const status = getMemberStatus(memberData.endDate);
        const escapeInvoice = (value) => String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        const gymName = String(settings?.gymName || 'Gym CRM').trim();
        const finalLogoUrl = invoiceAssets.logoSrc || '';
        const finalSignatureUrl = invoiceAssets.signatureSrc || '';
        const logoMarkup = finalLogoUrl
            ? `<img src="${escapeInvoice(finalLogoUrl)}" alt="Gym Logo" style="max-height: 60px; object-fit: contain;" onerror="this.style.display='none'">`
            : `<h2 style="margin:0;">${escapeInvoice(gymName)}</h2>`;
        const signatureMarkup = finalSignatureUrl
            ? `<img src="${escapeInvoice(finalSignatureUrl)}" alt="Digital Signature" style="max-height: 50px; object-fit: contain;" onerror="this.style.display='none'">`
            : '';
        const brandMarkup = finalLogoUrl
            ? `${logoMarkup}<div style="font-size: 28px; font-weight: 700; margin: 6px 0 6px;">${escapeInvoice(gymName)}</div>`
            : logoMarkup;

        return `
            <div class="invoice-container" style="page-break-inside: avoid; background: #ffffff; color: #1c242f; padding: 24px; font-family: Arial, sans-serif; line-height: 1.45;">
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px;">
                    <tr>
                        <td style="vertical-align: top; width: 68%;">
                            ${brandMarkup}
                            <div style="font-size: 13px; color: #46515f;">${escapeInvoice(settings.fullAddress || 'NA')}</div>
                            <div style="font-size: 13px; color: #46515f; margin-top: 4px;">Phone: ${escapeInvoice(settings.phone || 'NA')}</div>
                            <div style="font-size: 13px; color: #46515f; margin-top: 2px;">Email: ${escapeInvoice(settings.email || 'NA')}</div>
                            <div style="font-size: 13px; color: #46515f; margin-top: 2px;">Tax ID: ${escapeInvoice(settings.gstNumber || 'NA')}</div>
                        </td>
                        <td style="vertical-align: top; width: 32%; text-align: right;">
                            <div style="font-size: 26px; font-weight: 700; margin-bottom: 6px;">INVOICE</div>
                            <div style="font-size: 14px; color: #46515f; margin-bottom: 4px;">Invoice No: ${escapeInvoice(memberData.memberId || 'N/A')}</div>
                            <div style="font-size: 14px; color: #46515f;">Date: ${escapeInvoice(formatMemberDate(new Date().toISOString().split('T')[0]))}</div>
                        </td>
                    </tr>
                </table>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px;">
                    <tr>
                        <td style="width: 49%; vertical-align: top; border: 1px solid #d9e0e7; padding: 12px; page-break-inside: avoid;">
                            <div style="font-size: 15px; font-weight: 700; margin-bottom: 10px;">Member Details</div>
                            <div style="font-size: 13px; margin-bottom: 6px;"><strong>Member ID:</strong> ${escapeInvoice(memberData.memberId || 'N/A')}</div>
                            <div style="font-size: 13px; margin-bottom: 6px;"><strong>Name:</strong> ${escapeInvoice(`${memberData.firstName || ''} ${memberData.lastName || ''}`.trim() || 'N/A')}</div>
                            <div style="font-size: 13px; margin-bottom: 6px;"><strong>Contact:</strong> ${escapeInvoice(memberData.contact || 'N/A')}</div>
                            <div style="font-size: 13px; margin-bottom: 6px;"><strong>Email:</strong> ${escapeInvoice(memberData.email || 'NA')}</div>
                            <div style="font-size: 13px; margin-bottom: 6px;"><strong>Address:</strong> ${escapeInvoice(memberData.address || 'NA')}</div>
                            <div style="font-size: 13px; margin-bottom: 6px;"><strong>DOB:</strong> ${escapeInvoice(formatMemberDate(memberData.dob))}</div>
                            <div style="font-size: 13px; margin-bottom: 6px;"><strong>Age:</strong> ${escapeInvoice(memberData.age || 'N/A')} years</div>
                            <div style="font-size: 13px;"><strong>Blood Group:</strong> ${escapeInvoice(memberData.bloodGroup || 'NA')}</div>
                        </td>
                        <td style="width: 2%;"></td>
                        <td style="width: 49%; vertical-align: top; border: 1px solid #d9e0e7; padding: 12px; page-break-inside: avoid;">
                            <div style="font-size: 15px; font-weight: 700; margin-bottom: 10px;">Membership Details</div>
                            <div style="font-size: 13px; margin-bottom: 6px;"><strong>Package:</strong> ${escapeInvoice(memberData.package || 'N/A')}</div>
                            <div style="font-size: 13px; margin-bottom: 6px;"><strong>Start Date:</strong> ${escapeInvoice(formatMemberDate(memberData.startDate))}</div>
                            <div style="font-size: 13px; margin-bottom: 6px;"><strong>End Date:</strong> ${escapeInvoice(formatMemberDate(memberData.endDate))}</div>
                            <div style="font-size: 13px; margin-bottom: 6px;"><strong>Status:</strong> ${escapeInvoice(status.text)}</div>
                            <div style="font-size: 13px; margin-bottom: 6px;"><strong>Next Due Date:</strong> ${escapeInvoice(formatMemberDate(nextDueDate))}</div>
                            <div style="font-size: 13px; margin-bottom: 6px;"><strong>Payment Mode:</strong> ${escapeInvoice(memberData.paymentMode || 'N/A')}</div>
                            <div style="font-size: 13px;"><strong>Health Notes:</strong> ${escapeInvoice(memberData.healthDetails || 'NA')}</div>
                        </td>
                    </tr>
                </table>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px; page-break-inside: avoid;">
                    <thead>
                        <tr>
                            <th style="text-align: left; padding: 10px; border: 1px solid #d9e0e7; background: #f5f7fa; font-size: 13px;">Description</th>
                            <th style="text-align: right; padding: 10px; border: 1px solid #d9e0e7; background: #f5f7fa; font-size: 13px;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #d9e0e7; font-size: 13px;">${escapeInvoice(memberData.package || 'Membership')} Membership</td>
                            <td style="padding: 10px; border: 1px solid #d9e0e7; text-align: right; font-size: 13px;">${escapeInvoice(formatINR(memberData.fees))}</td>
                        </tr>
                        ${memberData.discount > 0 ? `
                            <tr>
                                <td style="padding: 10px; border: 1px solid #d9e0e7; font-size: 13px;">Discount</td>
                                <td style="padding: 10px; border: 1px solid #d9e0e7; text-align: right; font-size: 13px;">-${escapeInvoice(formatINR(discountAmount))}</td>
                            </tr>
                        ` : ''}
                        <tr>
                            <td style="padding: 10px; border: 1px solid #d9e0e7; font-size: 13px;"><strong>Subtotal</strong></td>
                            <td style="padding: 10px; border: 1px solid #d9e0e7; text-align: right; font-size: 13px;"><strong>${escapeInvoice(formatINR(subtotal))}</strong></td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #d9e0e7; font-size: 13px;"><strong>${escapeInvoice(tax.taxLabel)} (${escapeInvoice(tax.taxPercentage)}%)</strong></td>
                            <td style="padding: 10px; border: 1px solid #d9e0e7; text-align: right; font-size: 13px;"><strong>${escapeInvoice(formatINR(taxAmount))}</strong></td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #d9e0e7; background: #f5f7fa; font-size: 13px;"><strong>Total Amount</strong></td>
                            <td style="padding: 10px; border: 1px solid #d9e0e7; background: #f5f7fa; text-align: right; font-size: 13px;"><strong>${escapeInvoice(formatINR(totalAmount))}</strong></td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #d9e0e7; font-size: 13px;">Amount Paid</td>
                            <td style="padding: 10px; border: 1px solid #d9e0e7; text-align: right; font-size: 13px;">${escapeInvoice(formatINR(memberData.paidAmount))}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #d9e0e7; font-size: 13px;">Outstanding Balance</td>
                            <td style="padding: 10px; border: 1px solid #d9e0e7; text-align: right; font-size: 13px;">${escapeInvoice(formatINR(balance))}</td>
                        </tr>
                    </tbody>
                </table>

                <table style="width: 100%; border-collapse: collapse; margin-top: 28px; page-break-inside: avoid;">
                    <tr>
                        <td style="width: 50%; vertical-align: bottom; padding-right: 20px;">
                            <div style="border-top: 1px solid #9aa6b2; padding-top: 8px; font-size: 12px; color: #46515f;">Member Signature</div>
                        </td>
                        <td style="width: 50%; vertical-align: bottom; text-align: right;">
                            ${signatureMarkup ? `<div style="margin-bottom: 8px;">${signatureMarkup}</div>` : '<div style="height: 58px;"></div>'}
                            <div style="border-top: 1px solid #9aa6b2; padding-top: 8px; font-size: 12px; color: #46515f; text-align: right;">Authorized Signature</div>
                        </td>
                    </tr>
                </table>

                <div style="margin-top: 18px; text-align: center; font-size: 12px; color: #61707f;">
                    Thank you for enrolling with ${escapeInvoice(settings.gymName || 'our gym')}! Invoice generated on ${escapeInvoice(new Date().toLocaleString('en-IN'))}
                </div>
            </div>
        `;

        const invoiceHTML = `
            <div class="invoice-container">
                <div class="invoice-header">
                    <div class="gym-info">
                        ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="Logo" style="max-height: 60px; margin-bottom: 1rem;" onerror="this.style.display='none'">` : ''}
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
                                    <td style="text-align: right;"><strong>₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                                </tr>
                                <tr>
                                    <td><strong>${tax.taxLabel} (${tax.taxPercentage}%)</strong></td>
                                    <td style="text-align: right;"><strong>₹${taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                                </tr>
                                <tr style="background: rgba(13, 28, 47, 0.02);">
                                    <td><strong>Total Amount</strong></td>
                                    <td style="text-align: right;"><strong>₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
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
            .replace(`â‚¹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, formatINR(subtotal))
            .replace(`â‚¹${taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, formatINR(taxAmount))
            .replace(`â‚¹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, formatINR(totalAmount))
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

    const getMemberStore = () => ({
        getAll: () => memberCache,
        getById: (id) => getCachedMemberById(id)
    });

    const formatMemberDate = (value) => {
        if (!value) return 'N/A';
        const parsedDate = parseMemberEndDate(value);
        return parsedDate ? parsedDate.toLocaleDateString('en-IN') : 'N/A';
    };

    function parseMemberEndDate(endDateString) {
        const rawValue = String(endDateString || '').trim();
        if (!rawValue || rawValue.toUpperCase() === 'NA') {
            return null;
        }

        if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawValue)) {
            const [day, month, year] = rawValue.split('/').map(Number);
            const parsed = new Date(year, month - 1, day);
            return Number.isNaN(parsed.getTime()) ? null : parsed;
        }

        if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
            const [year, month, day] = rawValue.split('-').map(Number);
            const parsed = new Date(year, month - 1, day);
            return Number.isNaN(parsed.getTime()) ? null : parsed;
        }

        const parsed = new Date(rawValue);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    function getMemberStatus(endDateString) {
        const parsedEndDate = parseMemberEndDate(endDateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!parsedEndDate) {
            return { text: 'Inactive', className: 'status-inactive' };
        }

        parsedEndDate.setHours(0, 0, 0, 0);

        if (parsedEndDate >= today) {
            return { text: 'Active', className: 'status-active' };
        }

        return { text: 'Inactive', className: 'status-inactive' };
    }

    const normalizeMember = (member = {}) => ({
        ...member,
        id: member.id || '',
        memberId: String(member.memberId || 'N/A'),
        firstName: String(member.firstName || '').trim(),
        lastName: String(member.lastName || '').trim(),
        contact: String(member.contact || ''),
        email: String(member.email || '').trim(),
        package: String(member.package || 'N/A'),
        packageLabel: String(member.packageLabel || member.packageName || member.package || 'N/A'),
        endDate: member.endDate || '',
        fees: Number(member.fees) || (Number(member.totalPaid) || 0) + (Number(member.balance) || 0),
        paidAmount: Number(member.paidAmount) || Number(member.totalPaid) || 0,
        balance: Number(member.balance) || 0,
        status: getMemberStatus(member.endDate).text.toLowerCase(),
        gender: String(member.gender || '').toLowerCase()
    });

    /**
     * Get filtered members
     */
    const getFilteredMembers = async () => {
        const rawMembers = await loadMembersFromApi();
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
    const renderMembersTable = () => renderMembersTableSafe();

    /**
     * View invoice for member
     */
    const viewInvoice = (memberId) => {
        const member = getCachedMemberById(memberId);
        if (member) {
            showInvoicePreview(member);
        }
    };

    const createMemberRow = (member) => {
        const status = getMemberStatus(member.endDate);
        const balanceText = member.balance > 0 ? formatINR(member.balance) : 'Paid';
        const whatsappContact = window.WhatsAppUtils
            ? WhatsAppUtils.createContactLink(member.contact, `Hello ${member.firstName || ''}, welcome to Kinetic Atelier.`)
            : (member.contact || 'N/A');

        return `
            <tr data-member-id="${member.id}">
                <td><strong>${member.memberId}</strong></td>
                <td>${member.firstName} ${member.lastName}</td>
                <td>${whatsappContact}</td>
                <td>${member.packageLabel || member.package}</td>
                <td>${formatMemberDate(member.endDate)}</td>
                <td>${balanceText}</td>
                <td><span class="status-pill ${status.className}">${status.text}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" type="button" data-action="edit" data-member-id="${member.id}">
                            <span class="material-icons-round">edit</span> Edit
                        </button>
                        <button class="btn-icon" type="button" data-action="whatsapp" data-member-id="${member.id}" aria-label="Send WhatsApp update">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="margin-right: 4px; vertical-align: middle;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg> WhatsApp
                        </button>
                        <button class="btn-icon" type="button" data-action="invoice" data-member-id="${member.id}">
                            <span class="material-icons-round">receipt</span>
                        </button>
                        <button class="btn-icon" type="button" data-action="delete" data-member-id="${member.id}">
                            <span class="material-icons-round">delete</span>
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
        const member = getCachedMemberById(memberId);
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
                    const member = getCachedMemberById(memberId);
                    if (member) {
                        openForm(member);
                    }
                    break;
                }
                case 'whatsapp': {
                    const member = getCachedMemberById(memberId);
                    if (member) {
                        openMemberWhatsApp(normalizeMember(member));
                    }
                    break;
                }
                case 'invoice':
                    viewInvoiceSafe(memberId);
                    break;
                case 'delete':
                    if (!window.confirm('Are you sure you want to delete this member?')) {
                        return;
                    }

                    deleteMemberFromApi(memberId).catch(() => {
                        showMembersToast('Unable to delete this member right now.', 'error', 'Delete Failed');
                    });
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

