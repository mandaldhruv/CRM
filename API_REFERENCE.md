# Kinetic Atelier - API Quick Reference

## 🗄️ State Management - Quick API

| Method | Usage |
|--------|-------|
| `StateManager.generateId()` | Generates unique ID |
| `StateManager.getStats()` | Get record counts for all entities |
| `StateManager.getData(key)` | Read from localStorage |
| `StateManager.saveData(key, data)` | Write to localStorage |
| `StateManager.clearAll()` | Reset entire database ⚠️ |

---

## 👥 Members CRUD

```javascript
StateManager.Members.create(obj)          // Create member
StateManager.Members.getAll()             // Get all members
StateManager.Members.getById(id)          // Get by ID
StateManager.Members.getByStatus(status)  // Filter by status
StateManager.Members.getActiveCount()     // Get active count
StateManager.Members.update(id, obj)      // Update fields
StateManager.Members.delete(id)           // Delete member
```

**Data Template:**
```javascript
{
    firstName: "string",
    lastName: "string",
    email: "string",
    phone: "string",
    membershipPlan: "elite|pro|standard|basic",
    joinDate: "YYYY-MM-DD",
    renewalDate: "YYYY-MM-DD",
    notes: "string"
}
```

---

## 📞 Enquiries (Leads) CRUD

```javascript
StateManager.Enquiries.create(obj)        // Create enquiry
StateManager.Enquiries.getAll()           // Get all enquiries
StateManager.Enquiries.getById(id)        // Get by ID
StateManager.Enquiries.getByStage(stage)  // Filter: new|contacted|converted
StateManager.Enquiries.update(id, obj)    // Update
StateManager.Enquiries.delete(id)         // Delete
```

**Data Template:**
```javascript
{
    name: "string",
    email: "string",
    phone: "string",
    source: "website|referral|social|walkIn",
    goal: "weightLoss|muscleGain|endurance|general",
    notes: "string"
}
```

---

## 👔 Staff CRUD

```javascript
StateManager.Staff.create(obj)            // Create staff
StateManager.Staff.getAll()               // Get all staff
StateManager.Staff.getById(id)            // Get by ID
StateManager.Staff.getByRole(role)        // Filter: trainer|frontDesk|manager|nutritionist
StateManager.Staff.update(id, obj)        // Update
StateManager.Staff.delete(id)             // Delete
```

**Data Template:**
```javascript
{
    firstName: "string",
    lastName: "string",
    email: "string",
    phone: "string",
    role: "trainer|frontDesk|manager|nutritionist",
    hireDate: "YYYY-MM-DD",
    salary: number
}
```

---

## 📦 Packages CRUD

```javascript
StateManager.Packages.create(obj)         // Create package
StateManager.Packages.getAll()            // Get all packages
StateManager.Packages.getById(id)         // Get by ID
StateManager.Packages.update(id, obj)     // Update
StateManager.Packages.delete(id)          // Delete
```

**Data Template:**
```javascript
{
    name: "string",
    description: "string",
    price: number,
    durationMonths: number,
    capacity: number  // sessions/week
}
```

---

## 💸 Expenses CRUD

```javascript
StateManager.Expenses.create(obj)         // Create expense
StateManager.Expenses.getAll()            // Get all expenses
StateManager.Expenses.getById(id)         // Get by ID
StateManager.Expenses.getTotalExpenses()  // Sum all
StateManager.Expenses.update(id, obj)     // Update
StateManager.Expenses.delete(id)          // Delete
```

**Data Template:**
```javascript
{
    category: "equipment|maintenance|utilities|staffing|other",
    description: "string",
    amount: number,
    date: "YYYY-MM-DD",
    vendor: "string",
    notes: "string"
}
```

---

## 🧾 Receipts CRUD

```javascript
StateManager.Receipts.create(obj)         // Create receipt
StateManager.Receipts.getAll()            // Get all receipts
StateManager.Receipts.getById(id)         // Get by ID
StateManager.Receipts.getTotalAmount()    // Sum all
StateManager.Receipts.update(id, obj)     // Update
StateManager.Receipts.delete(id)          // Delete
```

**Data Template:**
```javascript
{
    memberId: "string",
    memberName: "string",
    description: "string",
    amount: number,
    paymentMethod: "cash|card|check|online",
    date: "YYYY-MM-DD"
}
```

---

## 🎨 UI Components

### Forms (Built-in)

```javascript
UIComponents.openMemberForm(callback)      // Member form
UIComponents.openEnquiryForm(callback)     // Enquiry/Lead form
UIComponents.openStaffForm(callback)       // Staff form
UIComponents.openExpenseForm(callback)     // Expense form
UIComponents.openPackageForm(callback)     // Package form
UIComponents.openReceiptForm(callback)     // Receipt form
```

**All callbacks receive validated form data:**
```javascript
UIComponents.openMemberForm((data) => {
    // data contains all form fields as object
    const member = StateManager.Members.create(data);
});
```

### Modal Control

```javascript
UIComponents.openModal(title, config, entity, callback)  // Custom modal
UIComponents.closeModal()          // Close drawer
UIComponents.submitForm()          // Manual submit
```

### Notifications

```javascript
UIComponents.showToast(message, type, title, duration = 4000)

// Types: 'success' | 'error' | 'info'

// Examples:
UIComponents.showToast('Member added!', 'success', 'Success')
UIComponents.showToast('Email exists', 'error', 'Error', 5000)
UIComponents.showToast('Maintenance tonight', 'info', 'Info')
```

---

## 📊 Common Patterns

### Get Active Members Count
```javascript
StateManager.Members.getActiveCount()
```

### Get Total Revenue
```javascript
StateManager.Receipts.getTotalAmount()
```

### Get Total Expenses
```javascript
StateManager.Expenses.getTotalExpenses()
```

### Get All Trainers
```javascript
StateManager.Staff.getByRole('trainer')
```

### Get New Leads
```javascript
StateManager.Enquiries.getByStage('new')
```

### Update Member Status
```javascript
StateManager.Members.update(memberId, { status: 'inactive' })
```

### Create Member + Receipt
```javascript
const member = StateManager.Members.create(memberData);
const receipt = StateManager.Receipts.create({
    memberId: member.id,
    memberName: `${member.firstName} ${member.lastName}`,
    description: `New membership - ${member.membershipPlan}`,
    amount: 99.99,
    paymentMethod: 'card',
    date: new Date().toISOString().split('T')[0]
});
```

---

## 🔑 localStorage Keys

| Key | Data |
|-----|------|
| `ka_members` | All member records |
| `ka_enquiries` | All enquiry/lead records |
| `ka_staff` | All staff records |
| `ka_packages` | All package records |
| `ka_expenses` | All expense records |
| `ka_receipts` | All receipt records |

**Access directly:**
```javascript
JSON.parse(localStorage.getItem('ka_members'))
localStorage.removeItem('ka_members')  // Clear one
localStorage.clear()                   // Clear all
```

---

## 🎯 Real-World Examples

### Complete Member Signup
```javascript
UIComponents.openMemberForm((memberData) => {
    // 1. Create member
    const member = StateManager.Members.create(memberData);
    
    // 2. Record payment
    StateManager.Receipts.create({
        memberId: member.id,
        memberName: `${member.firstName} ${member.lastName}`,
        description: `Joined - ${member.membershipPlan}`,
        amount: 99.99,
        paymentMethod: 'card',
        date: new Date().toISOString().split('T')[0]
    });
    
    // 3. Notify
    UIComponents.showToast(
        `${member.firstName} is now a member!`,
        'success',
        'Welcome'
    );
});
```

### Track Lead Lifecycle
```javascript
// 1. Create
const lead = StateManager.Enquiries.create({
    name: 'John',
    email: 'john@example.com',
    source: 'website',
    goal: 'weightLoss'
});

// 2. Update to Contacted
StateManager.Enquiries.update(lead.id, {
    stage: 'contacted',
    notes: 'Called, interested'
});

// 3. Convert to Member
StateManager.Enquiries.update(lead.id, { stage: 'converted' });
StateManager.Members.create({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    membershipPlan: 'elite'
});
```

### Dashboard Metrics
```javascript
function getDashboardMetrics() {
    return {
        activeMembers: StateManager.Members.getActiveCount(),
        newLeads: StateManager.Enquiries.getByStage('new').length,
        totalStaff: StateManager.Staff.getAll().length,
        totalRevenue: StateManager.Receipts.getTotalAmount(),
        totalExpenses: StateManager.Expenses.getTotalExpenses(),
        stats: StateManager.getStats()
    };
}
```

---

## 🐛 Debug Commands

```javascript
// View everything
StateManager.getStats()

// View one entity
StateManager.Members.getAll()
StateManager.Enquiries.getAll()
StateManager.Staff.getAll()
StateManager.Packages.getAll()
StateManager.Expenses.getAll()
StateManager.Receipts.getAll()

// Test notification
UIComponents.showToast('Test', 'success', 'Test Message')

// Reset database
StateManager.clearAll()
```

---

**For detailed documentation, see DEVELOPER_GUIDE.md**
