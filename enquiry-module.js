/**
 * ============================================================================
 * ENQUIRY & CRM MODULE
 * Kanban board + Advanced enquiry form with BMI calculator
 * ============================================================================
 */

const EnquiryModule = (() => {
    // Configuration for enquiry form fields
    const enquiryFormConfig = {
        fields: [
            // Row 1: Contact & Date
            { name: 'contactNo', label: 'Contact No', type: 'text', required: true, placeholder: '9876543210', grid: 'half', validation: 'phone' },
            { name: 'date', label: 'Date', type: 'date', required: true, grid: 'half' },

            // Row 2: Name & Gender
            { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Full Name', grid: 'half' },
            { name: 'gender', label: 'Gender', type: 'select', required: true, grid: 'half',
                options: [
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'other', label: 'Other' }
                ]
            },

            // Row 3: DOB & Address
            { name: 'dob', label: 'Date of Birth', type: 'date', required: true, grid: 'half' },
            { name: 'address', label: 'Address', type: 'textarea', required: false, placeholder: 'Street address, city, state...' },

            // Row 4: Heard About & Referral
            { name: 'heardAbout', label: 'How Did You Hear About Us?', type: 'select', required: true, grid: 'half',
                options: [
                    { value: 'google', label: 'Google Search' },
                    { value: 'socialmedia', label: 'Social Media' },
                    { value: 'referral', label: 'Referral' },
                    { value: 'newspaper', label: 'Newspaper/Magazine' },
                    { value: 'billboard', label: 'Billboard' },
                    { value: 'walkIn', label: 'Walk-In' },
                    { value: 'other', label: 'Other' }
                ]
            },
            { name: 'referral', label: 'Referred By (Name)', type: 'text', required: false, placeholder: 'Member name if referral', grid: 'half' },

            // Row 5: Enquiry For & Rating
            { name: 'enquiryFor', label: 'Enquiry For', type: 'select', required: true, grid: 'half',
                options: [
                    { value: 'membership', label: 'Membership' },
                    { value: 'personalTraining', label: 'Personal Training' },
                    { value: 'groupClass', label: 'Group Class' },
                    { value: 'nutrition', label: 'Nutrition Counseling' },
                    { value: 'other', label: 'Other' }
                ]
            },
            { name: 'rating', label: 'Interest Level (1-5)', type: 'select', required: true, grid: 'half',
                options: [
                    { value: '5', label: '5 - Very Interested' },
                    { value: '4', label: '4 - Interested' },
                    { value: '3', label: '3 - Neutral' },
                    { value: '2', label: '2 - Low Interest' },
                    { value: '1', label: '1 - Not Interested' }
                ]
            },

            // Row 6: Follow-Up & Executive
            { name: 'followUpDate', label: 'Follow-up Date', type: 'date', required: true, grid: 'half' },
            { name: 'executive', label: 'Assigned To', type: 'select', required: true, grid: 'half',
                options: [
                    { value: 'marcus', label: 'Marcus Thorne' },
                    { value: 'riley', label: 'Riley King' },
                    { value: 'sarah', label: 'Sarah Jenkins' },
                    { value: 'unassigned', label: 'Unassigned' }
                ]
            },

            // Comment
            { name: 'comment', label: 'Comments / Notes', type: 'textarea', required: false, placeholder: 'Any additional notes about the enquiry...' }
        ]
    };

    // -------- KANBAN RENDERING --------

    /**
     * Renders the Kanban board with enquiries grouped by stage
     */
    const renderKanbanBoard = () => {
        const enquiries = StateManager.Enquiries.getAll();
        const stages = ['new', 'contacted', 'converted'];

        stages.forEach(stage => {
            const stageEnquiries = enquiries.filter(e => e.stage === stage);
            const container = document.getElementById(`cards-${stage}`);
            const countElement = document.getElementById(`count-${stage}`);

            // Update count
            countElement.textContent = stageEnquiries.length;

            // Clear and render cards
            container.innerHTML = '';

            if (stageEnquiries.length === 0) {
                container.innerHTML = '<div class="kanban-empty">No enquiries in this stage</div>';
                return;
            }

            stageEnquiries.forEach(enquiry => {
                const card = createKanbanCard(enquiry);
                container.appendChild(card);
            });
        });

        console.log('[EnquiryModule] ✓ Kanban board rendered');
    };

    /**
     * Creates a kanban card DOM element
     */
    const createKanbanCard = (enquiry) => {
        const card = document.createElement('div');
        card.className = 'kanban-card';
        const whatsappLink = window.WhatsAppUtils
            ? WhatsAppUtils.buildLink(enquiry.contactNo, `Hello ${enquiry.name || ''}, thanks for your interest in Kinetic Atelier.`)
            : '#';
        card.innerHTML = `
            <div class="kanban-card-name">${enquiry.name || 'N/A'}</div>
            <div class="kanban-card-meta">
                <span class="kanban-card-tag kanban-card-goal">${enquiry.enquiryFor || 'Membership'}</span>
                <span class="kanban-card-tag">⭐ ${enquiry.rating || '?'}/5</span>
            </div>
            <div class="kanban-card-date">
                📅 ${formatDate(enquiry.date) || 'No date'}
            </div>
            <div class="kanban-card-date" style="margin-top: 0.5rem; color: #666;">
                Contact: ${window.WhatsAppUtils ? `<a class="whatsapp-link" href="${whatsappLink}" target="_blank" rel="noopener noreferrer">WhatsApp ${enquiry.contactNo || 'N/A'}</a>` : (enquiry.contactNo || 'N/A')}
            </div>
        `;
        const whatsappAnchor = card.querySelector('.whatsapp-link');
        whatsappAnchor?.addEventListener('click', (event) => event.stopPropagation());
        card.addEventListener('click', () => viewEnquiryDetails(enquiry));
        return card;
    };

    /**
     * Formats date for display
     */
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
    };

    /**
     * View enquiry details (future enhancement)
     */
    const viewEnquiryDetails = (enquiry) => {
        console.log('[EnquiryModule] Viewing enquiry details:', enquiry);
        // Could expand to show detailed view with edit/delete options
    };

    // -------- BMI CALCULATOR --------

    /**
     * Calculates BMI and returns result with status
     */
    const calculateBMI = () => {
        const height = parseFloat(document.getElementById('bmi-height').value);
        const weight = parseFloat(document.getElementById('bmi-weight').value);

        if (!height || !weight || height <= 0 || weight <= 0) {
            UIComponents.showToast(
                'Please enter valid height and weight values',
                'error',
                'Invalid Input'
            );
            return;
        }

        // Calculate BMI: weight (kg) / (height (m))^2
        const heightInMeters = height / 100;
        const bmi = weight / (heightInMeters * heightInMeters);

        // Determine category
        let category, status, color;
        if (bmi < 18.5) {
            category = 'underweight';
            status = 'Underweight - Needs nutrition support';
        } else if (bmi < 24.9) {
            category = 'normal';
            status = 'Great in shape! - Keep up the fitness';
        } else if (bmi < 29.9) {
            category = 'overweight';
            status = 'Overweight - Consider fitness program';
        } else {
            category = 'obese';
            status = 'Obese - Weight management recommended';
        }

        // Calculate ideal weight range (18.5 - 24.9 BMI)
        const minWeight = Math.round(18.5 * heightInMeters * heightInMeters);
        const maxWeight = Math.round(24.9 * heightInMeters * heightInMeters);

        // Display result
        displayBMIResult(bmi, category, status, minWeight, maxWeight);
    };

    /**
     * Displays BMI result with color-coded status
     */
    const displayBMIResult = (bmi, category, status, minWeight, maxWeight) => {
        const resultDiv = document.getElementById('bmi-result');
        const valueElement = document.getElementById('bmi-value');
        const statusElement = document.getElementById('bmi-status');
        const infoElement = document.getElementById('bmi-info');

        // Update colors
        valueElement.className = `bmi-value ${category}`;
        statusElement.className = `bmi-status ${category}`;

        // Update content
        valueElement.textContent = bmi.toFixed(1);
        statusElement.textContent = status;
        infoElement.innerHTML = `
            <strong>Ideal Weight Range:</strong> ${minWeight}kg - ${maxWeight}kg
        `;

        // Show result with animation
        resultDiv.classList.add('active');

        // Store BMI in form data
        document.getElementById('bmi-value-stored').value = bmi.toFixed(1);
        document.getElementById('bmi-category-stored').value = category;

        console.log(`[EnquiryModule] BMI calculated: ${bmi.toFixed(1)} (${category})`);
    };

    // -------- FORM HANDLING --------

    /**
     * Enhanced form renderer with BMI calculator integrated
     */
    const renderEnquiryForm = () => {
        let html = '<form id="enquiry-form" class="enquiry-form">';

        // BMI Calculator Section
        html += `
            <div class="bmi-calculator">
                <div class="bmi-calculator-title">
                    <span class="material-icons-round" style="font-size: 1.2rem; color: #3525cd;">favorite</span>
                    BMI Calculator (Optional)
                </div>
                <div class="bmi-inputs-grid">
                    <div class="bmi-input-group">
                        <label class="bmi-label">Height (cm)</label>
                        <input type="number" class="bmi-input" id="bmi-height" placeholder="e.g., 170" min="100" max="250" step="0.1">
                    </div>
                    <div class="bmi-input-group">
                        <label class="bmi-label">Weight (kg)</label>
                        <input type="number" class="bmi-input" id="bmi-weight" placeholder="e.g., 70" min="20" max="300" step="0.1">
                    </div>
                </div>
                <button type="button" class="bmi-button" onclick="EnquiryModule.calculateBMI()">
                    <span class="material-icons-round" style="font-size: 1rem; vertical-align: middle;">calculate</span>
                    Calculate BMI
                </button>
                <div id="bmi-result" class="bmi-result">
                    <div class="bmi-value" id="bmi-value">--</div>
                    <div class="bmi-status" id="bmi-status">--</div>
                    <div class="bmi-info" id="bmi-info">--</div>
                </div>
                <!-- Hidden fields to store BMI data -->
                <input type="hidden" id="bmi-value-stored" name="bmi">
                <input type="hidden" id="bmi-category-stored" name="bmiCategory">
            </div>

            <hr style="margin: 1.5rem 0; border: none; border-top: 1px solid rgba(13, 28, 47, 0.08);">
            <div style="color: #666; font-size: 0.9rem; margin-bottom: 1rem;">Enquiry Information</div>
        `;

        // Form fields
        enquiryFormConfig.fields.forEach(field => {
            const isHalf = field.grid === 'half';
            const isFull = field.grid === 'full' || !field.grid;

            html += `<div class="form-group" style="${isHalf ? 'grid-column: span 1;' : 'grid-column: 1 / -1;'}">
                <label class="form-label" for="${field.name}">${field.label}</label>
            `;

            switch (field.type) {
                case 'text':
                case 'email':
                case 'date':
                case 'number':
                    html += `<input type="${field.type}" class="form-input" id="${field.name}" name="${field.name}" 
                        data-validation="${field.validation || ((field.name || '').toLowerCase().includes('email') ? 'email' : ((field.name || '').toLowerCase().includes('contact') ? 'phone' : ''))}"
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
            }

            html += '<div class="field-error" aria-live="polite"></div>';
            html += '</div>';
        });

        html += '</form>';

        // Wrap fields in grid for multi-column layout
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const form = tempDiv.querySelector('#enquiry-form');
        
        // Apply grid layout
        form.style.display = 'grid';
        form.style.gridTemplateColumns = '1fr 1fr';
        form.style.gap = '1.5rem';

        return tempDiv.innerHTML;
    };

    /**
     * Opens the enquiry form modal
     */
    const openForm = () => {
        const formHTML = renderEnquiryForm();

        // Use UIComponents to open modal
        UIComponents.openModal(
            'New Enquiry',
            { fields: [] },  // Empty fields - we're using custom HTML
            'enquiries',
            (data) => {} // Empty callback - we'll handle submission manually
        );

        // Replace modal body with our custom form
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = formHTML;

        // Update button labels
        document.querySelector('.modal-footer .btn-secondary').textContent = 'Cancel';
        document.querySelector('.modal-footer .btn-primary').textContent = 'Save Enquiry';

        // Override submit function
        const submitBtn = document.querySelector('.modal-footer .btn-primary');
        submitBtn.onclick = () => submitEnquiry();

        if (window.ValidationUtils) {
            ValidationUtils.attachLiveValidation(document.getElementById('enquiry-form'));
        }

        console.log('[EnquiryModule] ✓ Enquiry form opened');
    };

    /**
     * Submits the enquiry form
     */
    const submitEnquiry = () => {
        const form = document.getElementById('enquiry-form');
        
        if (!form.checkValidity() || (window.ValidationUtils && !ValidationUtils.validateForm(form))) {
            UIComponents.showToast(
                'Please correct the highlighted fields',
                'error',
                'Validation Error'
            );
            return;
        }

        // Collect form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        // Calculate age from DOB
        if (data.dob) {
            const dob = new Date(data.dob);
            const today = new Date();
            const age = today.getFullYear() - dob.getFullYear();
            data.age = age;
        }

        // Set default stage and status
        data.stage = 'new';
        data.status = 'new';

        // Create enquiry in database
        const enquiry = StateManager.Enquiries.create(data);

        // Show success notification
        UIComponents.showToast(
            `${enquiry.name} added to leads!`,
            'success',
            'Enquiry Created'
        );

        // Close modal
        UIComponents.closeModal();

        // Re-render Kanban board
        setTimeout(() => {
            renderKanbanBoard();
        }, 100);

        console.log('[EnquiryModule] ✓ Enquiry submitted:', enquiry);
    };

    // -------- INITIALIZATION --------

    /**
     * Initializes the enquiry module on page load
     */
    const initialize = () => {
        console.log('%c[EnquiryModule] 🚀 Initializing Enquiry & CRM Module', 'color: #3525cd; font-weight: bold');
        
        // Render Kanban board if we're on CRM section
        const crmSection = document.getElementById('crm-section');
        if (crmSection) {
            // Check if this is the active section
            const observer = new MutationObserver(() => {
                if (crmSection.classList.contains('active')) {
                    renderKanbanBoard();
                }
            });

            observer.observe(crmSection, { attributes: true });

            // Render on initial load if CRM is active
            if (crmSection.classList.contains('active')) {
                renderKanbanBoard();
            }
        }
    };

    // -------- PUBLIC API --------
    return {
        openForm,
        calculateBMI,
        renderKanbanBoard,
        initialize
    };
})();

// Initialize on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
    EnquiryModule.initialize();
});

// Expose to window for console access
window.EnquiryModule = EnquiryModule;
