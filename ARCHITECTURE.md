# 🏗️ Kinetic Atelier - Architecture Guide

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         index.html (UI Layer)                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │   Navigation     │  │   Data Tables    │  │   Settings   │  │
│  │   Sidebar        │  │   Cards & Stats  │  │   Forms (no) │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
└──────────────────┬──────────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│  ui-components.js        │  │ state-management.js      │
│  (Presentation Layer)    │  │ (Data/Logic Layer)       │
│                          │  │                          │
│ ✓ Modal/Drawer          │  │ ✓ Members CRUD           │
│ ✓ Toast Notifications   │  │ ✓ Enquiries CRUD         │
│ ✓ 6 Form Templates      │  │ ✓ Staff CRUD             │
│ ✓ Form Validation       │  │ ✓ Packages CRUD          │
│ ✓ Animation Handlers    │  │ ✓ Expenses CRUD          │
│                          │  │ ✓ Receipts CRUD          │
│                          │  │ ✓ ID Generation          │
│ Interface API:          │  │ ✓ Filtering & Stats      │
│ - openModal()           │  │ ✓ Auto-validation        │
│ - showToast()           │  │ ✓ Logging                │
│ - submitForm()          │  │                          │
│ - [Entity]Form()        │  │ Interface API:           │
│                          │  │ - Members.create()       │
│                          │  │ - Members.getAll()       │
│                          │  │ - Members.update()       │
│                          │  │ - Members.delete()       │
│                          │  │ - [All entities]         │
└────────┬─────────────────┘  └──────────┬───────────────┘
         │                               │
         │            ┌──────────────────┘
         │            │
         ▼            ▼
    ┌────────────────────────────────────────────┐
    │          Browser localStorage              │
    │  (Persistent Data Layer)                   │
    │                                            │
    │  ka_members      │  ka_enquiries           │
    │  ┌────────────┐  │  ┌────────────┐       │
    │  │ [Member][] │  │  │[Enquiry][] │       │
    │  └────────────┘  │  └────────────┘       │
    │                                            │
    │  ka_staff        │  ka_packages            │
    │  ┌────────────┐  │  ┌────────────┐       │
    │  │ [Staff][]  │  │  │[Package][] │       │
    │  └────────────┘  │  └────────────┘       │
    │                                            │
    │  ka_expenses     │  ka_receipts            │
    │  ┌────────────┐  │  ┌────────────┐       │
    │  │[Expense][] │  │  │[Receipt][] │       │
    │  └────────────┘  │  └────────────┘       │
    │                                            │
    └────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### User Action → Database Save Flow

```
User clicks "New Member"
         │
         ▼
UI Component opens modal
with form template
         │
         ▼
User fills form &
clicks "Save"
         │
         ▼
UIComponents.submitForm()
validates form data
         │
         ▼
Data passed to callback
UIComponents.openMemberForm((data) => {...})
         │
         ▼
StateManager.Members.create(data)
- Generates unique ID
- Adds timestamps
- Adds default fields
- Returns new record
         │
         ▼
saveData('ka_members', array)
serializes & saves
to localStorage
         │
         ▼
UIComponents.showToast()
shows success notification
         │
         ▼
✓ Data persisted!
Ready for retrieval
```

---

## Module Interaction Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface                           │
│  (Buttons, Forms, Tables, Cards in index.html)              │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────┴─────────┐
        │                  │
        ▼                  ▼
  ┌──────────────┐  ┌───────────────────┐
  │ UI Component │  │  State Manager    │
  │ Entry Point  │  │  Entry Point      │
  └──────────────┘  └───────────────────┘
        │                  │
   ┌────┴────┐        ┌────┴────┐
   │          │        │         │
   ▼          ▼        ▼         ▼
  Modal     Toast   CRUD Ops  Utilities
  System    System
   │          │        │         │
   │          │        │         │
   └────┬─────┘        └────┬────┘
        │                   │
        │         ┌─────────┘
        │         │
        ▼         ▼
    ┌──────────────────────┐
    │  localStorage        │
    │  (Data Persistence)  │
    └──────────────────────┘
```

---

## Component Lifecycle

### Modal Component Lifecycle

```
┌─────────────┐
│ Button Click│
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│ openMemberForm(callback)        │
│ - Pass form config              │
│ - Pass callback function        │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ renderForm(config)              │
│ - Create form HTML              │
│ - Inject into modal body        │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ openModal()                     │
│ - Add .active to drawer         │
│ - Add .active to overlay        │
│ - Enable ESC listener           │
│ - Start slide animation         │
└──────┬──────────────────────────┘
       │
       ▼
   ┌───────────┐
   │ User fills│
   │   form    │
   └─────┬─────┘
         │
    ┌────┴────────────────────────────┐
    │                                 │
 Clicks Save                      Clicks Cancel / ESC
    │                                 │
    ▼                                 ▼
submitForm()                    closeModal()
- Validate                      - Remove .active
- Collect data                  - Remove .active
- Call callback                 - Disable listeners
- Create record                 - Slide out animation
- Close modal                        │
    │                                │
    └────────────────┬───────────────┘
                     │
                     ▼
            ┌────────────────────┐
            │ Final State        │
            │ Modal is hidden    │
            │ Data persisted (or)│
            │ No changes         │
            └────────────────────┘
```

---

## State Management Data Structure

### Member Object In Detail

```javascript
StateManager.Members.create({
    firstName: "Sarah",
    lastName: "Jenkins",
    email: "sarah@example.com",
    phone: "+1 (555) 000-0000",
    membershipPlan: "elite",
    joinDate: "2024-01-15",
    renewalDate: "2024-04-15",
    notes: "VIP member"
})

Returns:
{
    // Auto-generated by StateManager
    id: "20250322_143052_a7f2",           ← Unique identifier
    createdAt: "2025-03-22T14:30:52Z",   ← Timestamp
    updatedAt: "2025-03-22T14:30:52Z",   ← Auto-updated
    status: "active",                     ← Default field
    
    // From form input
    firstName: "Sarah",
    lastName: "Jenkins",
    email: "sarah@example.com",
    phone: "+1 (555) 000-0000",
    membershipPlan: "elite",
    joinDate: "2024-01-15",
    renewalDate: "2024-04-15",
    notes: "VIP member"
}

Stored in localStorage as:
localStorage.ka_members = 
JSON.stringify([
    { id: "...", firstName: "Sarah", ... },
    { id: "...", firstName: "Marcus", ... },
    ...
])
```

---

## API Call Examples Flow

### Example 1: Create Member Flow

```
Step 1: Open Form
└─ UIComponents.openMemberForm(callback)
   │
   ├─ Get form config (memberFormConfig)
   ├─ Render form HTML
   ├─ Show modal drawer
   └─ Wait for user input

Step 2: Validate & Submit
└─ User clicks "Save Record"
   │
   ├─ Validate all fields
   ├─ Collect form data
   ├─ Call callback(data)
   └─ Continue to Step 3

Step 3: Save to Database
└─ StateManager.Members.create(data)
   │
   ├─ Generate ID: "20250322_143052_a7f2"
   ├─ Add timestamps
   ├─ Add default status: "active"
   ├─ Get existing members array
   ├─ Add new member to array
   ├─ Save array to localStorage
   ├─ Log success to console
   └─ Return new member object

Step 4: User Feedback
└─ UIComponents.showToast(...)
   │
   ├─ Create toast DOM element
   ├─ Add to toast container
   ├─ Start slide-in animation
   ├─ Auto-dismiss after 4000ms
   └─ Slide out & remove
```

---

## Form Configuration Structure

```javascript
const formConfig = {
    fields: [
        {
            name: 'fieldName',              // HTML input name
            label: 'Display Label',         // Form label text
            type: 'text',                   // Input type
            required: true,                 // Validation
            placeholder: 'Help text'        // Placeholder
        },
        {
            name: 'selectField',
            label: 'Select Option',
            type: 'select',
            required: true,
            options: [                      // For select only
                { value: 'opt1', label: 'Option 1' },
                { value: 'opt2', label: 'Option 2' }
            ]
        }
    ]
};

Supported Types:
├─ text       → <input type="text">
├─ email      → <input type="email">
├─ number     → <input type="number">
├─ date       → <input type="date">
├─ select     → <select><option>
├─ textarea   → <textarea>
└─ checkbox   → <input type="checkbox">
```

---

## Error Handling Flow

```
User Action
     │
     ▼
Try Operation
     │
  ┌──┴──┐
  │     │
Success Error
  │     │
  ▼     ▼
Save & Err to
Notify Console
  │     │
  │     ▼
  │  Try/Catch
  │  Blocks
  │     │
  │  Err
  │  logged
  │     │
  ▼     ▼
Return Notify
Result User
```

---

## localStorage Structure

```
Browser localStorage
│
├─ ka_members: '[{"id":"...","firstName":"Sarah",...}]'
├─ ka_enquiries: '[{"id":"...","name":"John",...}]'
├─ ka_staff: '[{"id":"...","role":"trainer",...}]'
├─ ka_packages: '[{"id":"...","name":"Elite",...}]'
├─ ka_expenses: '[{"id":"...","amount":500,...}]'
└─ ka_receipts: '[{"id":"...","amount":99.99,...}]'

Each is a JSON array of objects
Total size typically < 1MB for 1000s of records
Survives browser restart
Cleared only by user action or code
```

---

## Rendering Flow for Tables

### Current (Manual)
```
Users see static demo data
from index.html
```

### Recommended (Dynamic)
```
Page Load
   │
   ▼
StateManager.Members.getAll()
   │
   ▼
Loop through members array
   │
  ┌┴─────────────────┐
  │                  │
  ▼                  ▼
Create          Append to
<tr> for        table
each            tbody
member
   │
   └──────┬──────────┘
          │
          ▼
Table auto-updates
with live data
```

---

## Performance Characteristics

### Creation: O(n)
```javascript
Members.create(data)
- Read all members O(n)
- Push new member O(1)
- Save to localStorage O(n) serialization
Total: O(n) reasonable for < 10,000 records
```

### Retrieval: O(1) or O(n)
```javascript
Members.getAll()           // O(n) - reads & parses
Members.getById(id)        // O(n) - searches array
Members.getByStatus(s)     // O(n) - filters array
```

### Update: O(n)
```javascript
Members.update(id)
- Read all O(n)
- Find by ID O(n)
- Update O(1)
- Save O(n)
Total: O(n)
```

### Suggested Optimization (Future)
```javascript
// For 10,000+ records, consider:
// 1. Implement indexing by ID
// 2. Cache getAll() results
// 3. Debounce frequent saves
// 4. Migrate to IndexedDB
```

---

## Security Considerations

```
⚠️ Client-side only - NOT production ready for sensitive data

For production, need:
✓ Backend API with database
✓ Authentication/Authorization
✓ Encryption at rest
✓ HTTPS for transport
✓ Access controls
✓ Audit logging
✓ Regular backups

For now (development):
✓ Safe because localStorage isolated per domain
✓ No network exposure
✓ Perfect for prototyping/testing
✓ All data lost if cache cleared
```

---

## Integration Points for Backend

When you're ready to connect a backend API:

```javascript
// Current: localStorage only
const member = StateManager.Members.create(data);

// Future: With backend sync
const member = StateManager.Members.create(data);
await fetch('/api/members', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(member)
});

// Future: Sync with backend on startup
window.addEventListener('DOMContentLoaded', async () => {
    StateManager.initialize();
    const backendMembers = await fetch('/api/members').then(r => r.json());
    StateManager.saveData('ka_members', backendMembers);
});
```

---

## Browser Compatibility

```
✓ Chrome 60+       localStorage ✓  backdrop-filter ✓
✓ Firefox 55+      localStorage ✓  backdrop-filter ✓
✓ Safari 12+       localStorage ✓  backdrop-filter ✓
✓ Edge 79+         localStorage ✓  backdrop-filter ✓

Fallbacks implemented:
├─ -webkit-backdrop-filter (Safari)
├─ All animations still work without blur
└─ Forms fully functional in older browsers
```

---

This architecture is designed to be:
- **Modular** - Clear separation of concerns
- **Scalable** - Easy to add entities
- **Maintainable** - Well documented
- **Extensible** - Ready for backend integration
- **User-friendly** - Modern and responsive

---
