# Kinetic Atelier CRM - Developer Guide

## 📋 Overview

Your Gym CRM is built with:
- **State Management**: localStorage-based database with CRUD operations
- **UI Components**: Glassmorphism modal drawer + toast notification system
- **Architecture**: Modular, modern vanilla JavaScript (no frameworks required)

---

## 🗂️ File Structure

```
CRM/
├── index.html                 # Main HTML with integrated UI
├── state-management.js        # localStorage + CRUD operations
├── ui-components.js           # Modal/Drawer + Toast system
└── DEVELOPER_GUIDE.md        # This file
```

---

## 🗄️ State Management API

### Core Functions

#### `StateManager.generateId()`
Generates unique IDs in format: `YYYYMMDD_HHmmss_XXXX`

```javascript
const id = StateManager.generateId();
// Result: "20250322_143052_a7f2"
```

#### `StateManager.saveData(key, data)`
Saves array to localStorage

```javascript
StateManager.saveData('ka_members', membersArray);
```

#### `StateManager.getData(key)`
Retrieves data from localStorage

```javascript
const members = StateManager.getData('ka_members');
```

#### `StateManager.getStats()`
Get overview of all records

```javascript
StateManager.getStats();
// { members: 5, enquiries: 3, staff: 2, ... }
```

#### `StateManager.clearAll()`
⚠️ Resets entire database (testing only)

```javascript
StateManager.clearAll();
```

---

## 👥 CRUD Operations

### Members

```javascript
// CREATE
const member = StateManager.Members.create({
    firstName: 'Sarah',
    lastName: 'Jenkins',
    email: 'sarah@example.com',
    phone: '+1 (555) 000-0000',
    membershipPlan: 'elite',
    joinDate: '2024-01-15',
    renewalDate: '2024-04-15',
    notes: 'VIP member, prefers morning sessions'
});

// READ - All
const allMembers = StateManager.Members.getAll();

// READ - Specific
const member = StateManager.Members.getById('20250322_143052_a7f2');

// READ - By Status
const activeMembers = StateManager.Members.getByStatus('active');

// STATISTICS
const activeCount = StateManager.Members.getActiveCount();

// UPDATE
const updated = StateManager.Members.update(memberId, {
    membershipPlan: 'pro',
    renewalDate: '2024-05-15'
});

// DELETE
StateManager.Members.delete(memberId);
```

### Enquiries (Leads)

```javascript
// CREATE
const enquiry = StateManager.Enquiries.create({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1 (555) 111-1111',
    source: 'website',  // website, referral, social, walkIn
    goal: 'weightLoss', // weightLoss, muscleGain, endurance, general
    notes: 'Interested in beginner classes'
});

// GET BY STAGE
const newLeads = StateManager.Enquiries.getByStage('new');      // new, contacted, converted
```

### Staff

```javascript
// CREATE
const staff = StateManager.Staff.create({
    firstName: 'Marcus',
    lastName: 'Thorne',
    email: 'marcus@kinetic.com',
    phone: '+1 (555) 222-2222',
    role: 'trainer',        // trainer, frontDesk, manager, nutritionist
    hireDate: '2023-06-15',
    salary: 3500
});

// GET BY ROLE
const trainers = StateManager.Staff.getByRole('trainer');
```

### Packages

```javascript
// CREATE
const package = StateManager.Packages.create({
    name: '3-Month Elite',
    description: 'Full gym access + 2 weekly coaching sessions',
    price: 299.99,
    durationMonths: 3,
    capacity: 5  // Max sessions/week
});
```

### Expenses

```javascript
// CREATE
const expense = StateManager.Expenses.create({
    category: 'equipment',  // equipment, maintenance, utilities, staffing, other
    description: 'Treadmill repair',
    amount: 450.00,
    date: '2025-03-20',
    vendor: 'TechnoGym Service Center',
    notes: 'Motor replacement'
});

// STATISTICS
const totalExpenses = StateManager.Expenses.getTotalExpenses();
```

### Receipts

```javascript
// CREATE
const receipt = StateManager.Receipts.create({
    memberId: '20250322_143052_a7f2',
    memberName: 'Sarah Jenkins',
    description: 'Monthly membership - March',
    amount: 89.99,
    paymentMethod: 'card',  // cash, card, check, online
    date: '2025-03-20'
});

// STATISTICS
const totalRevenue = StateManager.Receipts.getTotalAmount();
```

---

## 🎨 UI Components API

### Modal/Drawer System

#### `UIComponents.openModal(title, formConfig, entity, onSubmit)`
Opens custom modal with form

```javascript
UIComponents.openModal(
    'Add New Member',
    memberFormConfig,
    'members',
    (data) => {
        // Handle form submission
        const member = StateManager.Members.create(data);
        UIComponents.showToast('Member added!', 'success', 'Success');
    }
);
```

#### `UIComponents.closeModal()`
Closes the drawer

```javascript
UIComponents.closeModal();
```

#### `UIComponents.submitForm()`
Manually submits form (auto-called by Save button)

```javascript
UIComponents.submitForm();
```

### Pre-built Forms

#### `UIComponents.openMemberForm(callback)`
```javascript
UIComponents.openMemberForm((data) => {
    const member = StateManager.Members.create(data);
    UIComponents.showToast(`Member ${data.firstName} added!`, 'success', 'Created');
});
```

#### `UIComponents.openEnquiryForm(callback)`
```javascript
UIComponents.openEnquiryForm((data) => {
    const enquiry = StateManager.Enquiries.create(data);
    UIComponents.showToast('New lead created!', 'success', 'Lead Added');
});
```

#### `UIComponents.openStaffForm(callback)`
```javascript
UIComponents.openStaffForm((data) => {
    const staff = StateManager.Staff.create(data);
    UIComponents.showToast('Staff member added!', 'success', 'Added');
});
```

#### `UIComponents.openExpenseForm(callback)`
```javascript
UIComponents.openExpenseForm((data) => {
    const expense = StateManager.Expenses.create(data);
    UIComponents.showToast('Expense recorded!', 'success', 'Recorded');
});
```

#### `UIComponents.openPackageForm(callback)`
```javascript
UIComponents.openPackageForm((data) => {
    const pkg = StateManager.Packages.create(data);
    UIComponents.showToast('Package created!', 'success', 'Created');
});
```

#### `UIComponents.openReceiptForm(callback)`
```javascript
UIComponents.openReceiptForm((data) => {
    const receipt = StateManager.Receipts.create(data);
    UIComponents.showToast('Receipt issued!', 'success', 'Issued');
});
```

### Toast Notifications

#### `UIComponents.showToast(message, type, title, duration)`

```javascript
// Success Toast (default 4000ms)
UIComponents.showToast(
    'Member successfully added to the system',
    'success',
    'Member Created',
    4000
);

// Error Toast
UIComponents.showToast(
    'Email address already exists in database',
    'error',
    'Validation Error',
    5000
);

// Info Toast
UIComponents.showToast(
    'System will be under maintenance tonight',
    'info',
    'Scheduled Maintenance',
    6000
);
```

---

## 🎯 Common Usage Patterns

### Complete Member Signup Flow

```javascript
// 1. Open form modal
UIComponents.openMemberForm((data) => {
    // 2. Create member in database
    const member = StateManager.Members.create(data);
    
    // 3. Optionally create receipt
    const receipt = StateManager.Receipts.create({
        memberId: member.id,
        memberName: `${member.firstName} ${member.lastName}`,
        description: `Joined - ${member.membershipPlan}`,
        amount: 99.99,
        paymentMethod: 'card',
        date: new Date().toISOString().split('T')[0]
    });
    
    // 4. Show success notification
    UIComponents.showToast(
        `${member.firstName} is now an active member!`,
        'success',
        'Welcome to Kinetic Atelier'
    );
});
```

### Lead Management

```javascript
// 1. Create lead
UIComponents.openEnquiryForm((data) => {
    const enquiry = StateManager.Enquiries.create(data);
    UIComponents.showToast('Lead created!', 'success', 'New Lead');
});

// 2. Later - Update stage when contacted
StateManager.Enquiries.update(enquiryId, {
    stage: 'contacted',
    notes: 'Called on 2025-03-20, interested in 3-month trial'
});

// 3. Move to converted when they join
StateManager.Enquiries.update(enquiryId, {
    stage: 'converted',
    notes: 'Converted to Premium member'
});
```

### Dashboard Metrics

```javascript
// Get dashboard stats programmatically
function updateDashboard() {
    const activeMembers = StateManager.Members.getActiveCount();
    const totalExpenses = StateManager.Expenses.getTotalExpenses();
    const totalRevenue = StateManager.Receipts.getTotalAmount();
    const stats = StateManager.getStats();
    
    console.log({
        activeMembers,
        totalExpenses,
        totalRevenue,
        stats
    });
}
```

---

## 📋 Data Structure Reference

### Member Object
```javascript
{
    id: "20250322_143052_a7f2",
    firstName: "Sarah",
    lastName: "Jenkins",
    email: "sarah@example.com",
    phone: "+1 (555) 000-0000",
    membershipPlan: "elite",
    joinDate: "2024-01-15",
    renewalDate: "2024-04-15",
    notes: "VIP member, prefers morning sessions",
    status: "active",
    createdAt: "2025-03-20T14:30:52.000Z",
    updatedAt: "2025-03-20T14:30:52.000Z"
}
```

### Enquiry Object
```javascript
{
    id: "20250322_143052_a7f3",
    name: "John Doe",
    email: "john@example.com",
    phone: "+1 (555) 111-1111",
    source: "website",
    goal: "weightLoss",
    notes: "Interested in beginner classes",
    stage: "new",
    status: "new",
    createdAt: "2025-03-20T14:30:52.000Z",
    updatedAt: "2025-03-20T14:30:52.000Z"
}
```

### Receipt Object
```javascript
{
    id: "20250322_143052_a7f4",
    memberId: "20250322_143052_a7f2",
    memberName: "Sarah Jenkins",
    description: "Monthly membership - March",
    amount: 89.99,
    paymentMethod: "card",
    date: "2025-03-20",
    status: "issued",
    createdAt: "2025-03-20T14:30:52.000Z",
    updatedAt: "2025-03-20T14:30:52.000Z"
}
```

---

## 💾 Storage Keys

Data is stored under these localStorage keys:
- `ka_members` - Member records
- `ka_enquiries` - Enquiry/Lead records
- `ka_staff` - Staff records
- `ka_packages` - Membership packages
- `ka_expenses` - Expense records
- `ka_receipts` - Receipt records

**Access directly:** `localStorage.getItem('ka_members')`

---

## 🎨 Customizing Forms

### Creating a Custom Form

```javascript
const customFormConfig = {
    fields: [
        {
            name: 'fieldName',
            label: 'Display Label',
            type: 'text',  // text, email, number, date, select, textarea, checkbox
            required: true,
            placeholder: 'Help text...'
        },
        {
            name: 'selectField',
            label: 'Choose Option',
            type: 'select',
            required: true,
            options: [
                { value: 'opt1', label: 'Option 1' },
                { value: 'opt2', label: 'Option 2' }
            ]
        }
    ]
};

UIComponents.openModal('Custom Form', customFormConfig, 'custom', (data) => {
    console.log('Form data:', data);
});
```

---

## 🔍 Console Testing

Open browser DevTools (F12) and test:

```javascript
// Check database status
StateManager.getStats()

// Get all members
StateManager.Members.getAll()

// Create a test member
StateManager.Members.create({
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    phone: '555-0000',
    membershipPlan: 'standard',
    joinDate: '2025-03-01',
    renewalDate: '2025-06-01'
})

// Show test toast
UIComponents.showToast('Hello World!', 'success', 'Test')

// Reset everything
StateManager.clearAll()
```

---

## 🎨 Design System

### CSS Variables (from Kinetic Atelier)
```css
--primary: #3525cd
--primary-gradient: linear-gradient(135deg, #3525cd 0%, #4f46e5 100%)
--success: #2e7d32
--error: #ba1a1a
--warning: #ed6c02
--on-surface: #0d1c2f
--on-surface-variant: #464555
--surface: #f8f9ff
--transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
```

### Modal Styling
- Glassmorphism effect with backdrop blur
- Slide-in animation from right
- Smooth transitions using cubic-bezier
- Maintains design consistency

### Toast Styling
- Slides in from top-right
- Color-coded by type (success/error/info)
- Auto-dismisses or manually closeable
- Non-intrusive notifications

---

## 🚀 Performance Tips

1. **Batch Operations**: Combine multiple creates before saving
2. **Filter Early**: Use `.getByStatus()`, `.getByRole()` instead of loading all
3. **Pagination**: Implement pagination for large datasets
4. **Caching**: Cache frequently accessed data in variables
5. **Debounce**: Debounce rapid form submissions

---

## 📱 Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- localStorage support required
- CSS backdrop-filter support for full glassmorphism effect
- Fallback to regular blur on unsupported browsers

---

## 🐛 Debugging Tips

```javascript
// Enable verbose logging
StateManager.Members.create({ /* data */ })  // Logs to console

// Check for errors
try {
    StateManager.Members.update(id, data);
} catch (error) {
    console.error('Update failed:', error);
}

// Monitor localStorage changes
Object.defineProperty(localStorage, 'setItem', {
    value: function(key, val) {
        console.log(`Storage changed: ${key} = ${val.substring(0, 50)}...`);
    }
});
```

---

## 📚 Next Steps

1. **Dynamic Tables**: Load real data into tables from StateManager
2. **Search/Filter**: Add member search, status filters
3. **Export**: Add CSV/PDF export functionality
4. **Analytics**: Build charts using data from StateManager
5. **Sync**: Implement backend API integration
6. **Validation**: Add advanced form validation rules

---

**Happy coding! 🚀**
