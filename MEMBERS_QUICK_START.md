# 🚀 MEMBER MODULE - QUICK START GUIDE

## ⚡ Get Started in 30 Seconds

1. **Open your app** → Click "Members" in sidebar
2. **Click "Add Member"** → Form modal opens
3. **Fill the form** (10 required fields)
4. **Watch auto-calculations** happen in real-time
5. **Click "Save & Print Invoice"**
6. **Print your invoice!**

---

## 📊 Members Table Overview

| Column | What It Shows |
|--------|---------------|
| **Member ID** | Unique ID (MEM-20250322ABC12) |
| **Name** | Full name |
| **Contact** | Phone number |
| **Package** | Membership type |
| **End Date** | When membership expires |
| **Balance** | Money owed or "Paid" |
| **Status** | Active/Inactive badge |
| **Actions** | Edit or View Invoice |

---

## 🔍 Search & Filter

### Search
```
"John" → Shows all members named John
"john@example.com" → Finds by email
"+91 9876543210" → Finds by phone
```

### Filter by Status
- **All** - Show everyone
- **Active** - Only paying members
- **Inactive** - Inactive memberships

### Filter by Gender
- All Genders
- Male
- Female
- Other

---

## 📝 Form Fields (13 Required)

### Basic Info Section
```
✓ Member ID        (Auto-generated, e.g., MEM-202503ABC12)
✓ First Name       (John)
✓ Last Name        (Doe)
✓ Contact No       (+91 98765 43210)
✓ Email           (john@example.com)
✓ DOB             (15-05-1990) → Auto-calc Age
✓ Gender          (Male/Female/Other)
✓ Blood Group     (O+, A+, B+, AB+, etc)
✓ Address         (123 Main St, City)
○ Health Details  (Optional - allergies, injuries)
```

### Course Registration Section
```
✓ Package          (Basic/Premium/Elite + duration)
✓ Start Date       (22-03-2024)
  End Date         (Auto-calc from duration)
✓ Membership Fees  (Auto-fill from package)
○ Discount (%)     (0-100, optional)
✓ Amount Paid      (₹25,600)
  Balance          (Auto-calc)
✓ Payment Mode     (Cash/Card/Online/UPI/Cheque)
```

---

## 💰 Pricing Quick Reference

### BASIC
- 3 mo: ₹3,000   | 6 mo: ₹5,400   | 12 mo: ₹9,600

### PREMIUM
- 3 mo: ₹5,000   | 6 mo: ₹9,000   | 12 mo: ₹16,000

### ELITE
- 3 mo: ₹8,000   | 6 mo: ₹14,400  | 12 mo: ₹25,600

### PERSONAL TRAINING
- Per session: ₹500

---

## 🤖 Auto-Calculations

### Age
```
DOB: 15-05-1990  →  Today: 34 years old
(Auto-fills when you pick a DOB)
```

### End Date
```
Start: 22-03-2024 + Elite 12 mo = 22-03-2025
(Auto-calc when package & start date set)
```

### Fees
```
Select "Elite 12 Months"  →  Fees: ₹25,600
(Auto-fill from package)
```

### Balance
```
Fees: ₹25,600 - Discount 10% - Paid ₹23,040 = ₹0 Balance
(Updates as you type in any field)
```

---

## 🧾 Invoice Features

### What's Included
```
✓ Gym Details (Name, address, phone, GST ID)
✓ Member Info (ID, name, contact, DOB, age, blood group)
✓ Membership Details (Package, dates, status, next due)
✓ Payment Breakdown (Fees, discount, paid, balance)
✓ Signature Lines (Member + Manager)
✓ Watermark (Generated datetime)
```

### How to Print
1. After saving member, invoice opens in modal
2. Click **"Print Invoice"** button
3. Browser print dialog opens
4. Choose printer
5. Click Print!

### Print Preview
- Buttons hidden
- Clean layout
- Professional formatting
- Optimized for A4 paper

---

## 💾 Console Commands

```javascript
// See all members
StateManager.Members.getAll()

// Count active members
StateManager.Members.getAll().filter(m => m.status === 'active').length

// Get member by ID
StateManager.Members.getById('member-123')

// See all receipts
StateManager.Receipts.getAll()

// Render table fresh
MemberModule.renderMembersTable()

// Check stats
StateManager.getStats()

// Clear all data (⚠️ CAUTION!)
StateManager.clearAll()
```

---

## 🎨 Common Workflows

### Workflow 1: Add New Member

```
1. Click "Add Member" button
2. Fill First Name, Last Name, Contact, Email
3. Pick DOB (age auto-fills)
4. Select Gender and Blood Group
5. Enter Address
6. Select Package (fees auto-fill)
7. Set Start Date (end date auto-calc)
8. Enter Amount Paid
9. Select Payment Mode
10. Click "Save & Print Invoice"
11. Print the invoice
✓ Member added, receipt created, invoice printed!
```

### Workflow 2: Find a Member

```
1. Go to Members section
2. Type name in search box
3. Table filters instantly
4. Or click "Active"/"Inactive" filter
5. Or select gender from dropdown
✓ Found!
```

### Workflow 3: Edit Member

```
1. Find member in table
2. Click "Edit" button
3. Form opens with pre-filled data
4. Update fields as needed
5. Click "Save & Print Invoice"
✓ Member updated!
```

### Workflow 4: View Receipt

```
1. Find member in table
2. Click "Receipt" icon (next to Edit)
3. Invoice modal opens
4. Click "Print Invoice" to print
✓ Receipt printed!
```

---

## ✅ Field Validation

### Required Fields (*)
```
✓ First Name       - Must not be empty
✓ Last Name        - Must not be empty
✓ Contact No       - Must be valid phone format
✓ Email           - Must have @ symbol
✓ DOB             - Must be valid date
✓ Gender          - Must select option
✓ Blood Group     - Must select option
✓ Address         - Must not be empty
✓ Package         - Must select option
✓ Start Date      - Must be valid date
✓ Amount Paid     - Must be number
✓ Payment Mode    - Must select option
```

### Optional Fields
```
○ Health Details   - Can be left empty
○ Discount %      - Defaults to 0
```

### Error Handling
```
If required field empty → Red border shows
Toast error: "Please fill all required fields"
Form won't submit until fixed
```

---

## 🔴 Troubleshooting

| Problem | Fix |
|---------|-----|
| Form won't open | Refresh page, check console (F12) |
| Numbers won't calculate | Click another field to trigger calc |
| Can't find member | Check search spelling, try different field |
| Balance shows wrong | Check discount is 0-100% |
| Can't print invoice | Close modal, open invoice again |
| Members list empty | Create first member via "Add Member" |
| Search not working | Type full name/email/phone |

---

## 📱 On Different Devices

### Desktop (PC/Mac)
- All features visible
- 2-column form side-by-side
- Full table visible

### Tablet
- Form stacks vertically
- Touch-optimized buttons
- Table scrolls if needed

### Mobile
- Form full-width
- One field per row
- Large tap targets
- Table scrolls horizontally

---

## 💡 Pro Tips

✨ **Tip 1:** Auto-age calculates automatically when you set DOB
✨ **Tip 2:** End date auto-fills when you pick package & start date  
✨ **Tip 3:** Use discount for promo offers
✨ **Tip 4:** Keep paid amount = final fees for zero balance
✨ **Tip 5:** Check console for quick member counts: `StateManager.Members.getAll().length`
✨ **Tip 6:** Print directly - no PDF conversion needed
✨ **Tip 7:** Search works on type - no submit needed
✨ **Tip 8:** Invoices save automatically with member

---

## 🎯 Member Statuses

### Active
- ✓ Green badge
- Paid or paying
- Valid membership

### Inactive  
- ✗ Red badge
- Expired or terminated
- No active membership

---

## 📞 Member Lifecycle

```
┌─────────────────┐
│  Create Member  │ ← "Add Member" button
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Status: Active │
│ Invoice Printed │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  On Expiry Date │
│ Can Renew       │
└────────┬────────┘
         │
      ┌──┴──┐
      ▼     ▼
    Renew  Lapse
      │     │
      ▼     ▼
   Active Inactive
```

---

## 🚀 Ready to Go!

**Your member management system is ready!**

Start by:
1. Click Members in sidebar
2. Click "Add Member"
3. Fill the form
4. Save & Print!

All data saves automatically to your browser's storage. 🎉
