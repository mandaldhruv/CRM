# 🎯 ENQUIRY & CRM MODULE - Documentation

## Overview

The Enquiry Module provides a complete CRM pipeline for managing gym leads with:
- **Kanban Board** - Visual pipeline (New → Contacted → Converted)
- **Advanced Enquiry Form** - 13 comprehensive fields
- **BMI Calculator** - Dynamic health calculation with color-coded feedback
- **Auto-Persistence** - All data saved to localStorage

---

## 🏗️ Architecture

### Files
- **enquiry-module.js** (450+ lines) - Main module with all logic
- **index.html** - Updated CRM section with Kanban board markup + CSS
- **state-management.js** - Enquiries CRUD operations (no changes needed)

### Module Structure
```javascript
EnquiryModule = {
    openForm()           // Opens enquiry form modal
    calculateBMI()       // Calculates BMI from height/weight
    renderKanbanBoard()  // Renders Kanban with dynamic data
    initialize()         // Called on page load
}
```

---

## 🎨 UI Components

### 1. Kanban Board

The Kanban board displays enquiries organized by pipeline stage:

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  New Inquiry    │  │   Contacted     │  │   Converted     │
│  Count: 5       │  │   Count: 2      │  │  Count: 18      │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│                 │  │                 │  │                 │
│ John Doe        │  │ Sarah Smith     │  │ Mike Wilson     │
│ Membership      │  │ Nutrition       │  │ Personal Train. │
│ ⭐ 5/5          │  │ ⭐ 4/5          │  │ ⭐ 5/5          │
│ 📅 Mar 22, 2025 │  │ 📅 Mar 21, 2025 │  │ 📅 Mar 20, 2025 │
│                 │  │                 │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

**Features:**
- Three columns: New, Contacted, Converted
- Dynamic record counts at top
- Card displays: Name, Enquiry Type, Interest Rating, Date
- Cards hover with subtle lift animation
- Empty state message if no records

### 2. Enquiry Form

Complete form with 13 fields organized in 2-column grid:

```
Contact No          │  Date
Name                │  Gender
DOB                 │  Address (full width)
Heard About Us      │  Referral Name
Enquiry For         │  Interest Level (1-5)
Follow-up Date      │  Assigned To
Comments (full width)
```

### 3. BMI Calculator Widget

Interactive calculator in form header:

```
┌─────────────────────────────────────┐
│ ❤️  BMI Calculator (Optional)       │
│                                      │
│  Height (cm)  │  Weight (kg)       │
│  [170       ] │ [70            ]   │
│                                      │
│  [Calculate BMI]                    │
│                                      │
│  ┌──────────────────────────────┐  │
│  │ 24.1                         │  │
│  │ Great in shape! ✓            │  │
│  │ Ideal Weight: 53-69 kg       │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Color Coding:**
- 🔵 Underweight (< 18.5) - Blue
- 🟢 Normal (18.5-24.9) - Green
- 🟠 Overweight (25-29.9) - Orange
- 🔴 Obese (≥ 30) - Red

---

## 📋 Form Fields

| Field | Type | Required | Options |
|-------|------|----------|---------|
| Contact No | Text | ✓ | Phone format |
| Date | Date | ✓ | Date picker |
| Name | Text | ✓ | Any name |
| Gender | Select | ✓ | Male, Female, Other |
| DOB | Date | ✓ | Date picker |
| Address | Textarea | ✗ | Free text |
| Heard About Us | Select | ✓ | Google, Social Media, Referral, etc. |
| Referred By | Text | ✗ | Member name |
| Enquiry For | Select | ✓ | Membership, Personal Training, Group Class, etc. |
| Interest Level | Select | ✓ | 1-5 rating |
| Follow-up Date | Date | ✓ | Date picker |
| Assigned To | Select | ✓ | Staff member names |
| Comments | Textarea | ✗ | Free notes |

---

## 🧮 BMI Calculator Details

### Formula
```
BMI = Weight (kg) / (Height (m))²
```

### Categories & Status

| BMI Range | Category | Status | Color |
|-----------|----------|--------|-------|
| < 18.5 | Underweight | Needs nutrition support | Blue |
| 18.5-24.9 | Normal | Great in shape! | Green |
| 25-29.9 | Overweight | Consider fitness program | Orange |
| ≥ 30 | Obese | Weight management recommended | Red |

### Ideal Weight Range
Calculated as: 18.5 to 24.9 BMI range
- Min Weight = 18.5 × (height in meters)²
- Max Weight = 24.9 × (height in meters)²

### Example
```
Height: 170 cm = 1.7m
- Min Weight = 18.5 × 1.7² = 53.4 kg
- Max Weight = 24.9 × 1.7² = 71.6 kg

User Input: Weight 70 kg
- BMI = 70 / (1.7)² = 24.2
- Status: "Great in shape!"
- Range: 53-72 kg
```

---

## 🔄 Data Flow

### Form Submission Flow

```
User clicks "New Enquiry"
         ↓
EnquiryModule.openForm()
         ↓
Modal opens with form + BMI calculator
         ↓
User fills form (BMI optional)
         ↓
Clicks "Save Enquiry"
         ↓
submitEnquiry()
    - Validate required fields
    - Calculate age from DOB
    - Set stage: "new"
    - Set status: "new"
         ↓
StateManager.Enquiries.create(data)
    - Generate unique ID
    - Add timestamps
    - Store in localStorage
         ↓
UIComponents.showToast("Success")
         ↓
UIComponents.closeModal()
         ↓
EnquiryModule.renderKanbanBoard()
    - Fetch enquiries from state
    - Group by stage
    - Render cards
         ↓
Kanban board updates automatically
```

---

## 📊 Kanban Board Details

### Stage Transitions

```
New (Initial)
    ↓ After contact
Contacted
    ↓ Converted member
Converted
```

### Card Information
Each card shows:
- **Name** - Lead's name (primary text)
- **Goal** - Enquiry type (Membership, Personal Training, etc.)
- **Rating** - Interest level (1-5 stars)
- **Date** - Enquiry date
- **Contact** - Phone number

### Column Header
- Title: "New Inquiry", "Contacted", "Converted"
- Count: Live count of enquiries in each stage (auto-updated)

---

## 💾 Data Storage

### Enquiry Object Structure
```javascript
{
    id: "20250322_143052_a7f2",           // Unique ID
    contactNo: "+91 98765 43210",
    date: "2025-03-22",
    name: "John Doe",
    gender: "male",
    dob: "1990-05-15",
    address: "123 Main St, City",
    age: 34,                               // Auto-calculated
    heardAbout: "referral",
    referral: "Mike Wilson",
    enquiryFor: "membership",
    rating: "5",
    followUpDate: "2025-03-29",
    executive: "marcus",
    comment: "Very interested in premium membership",
    bmi: "24.5",                          // From calculator
    bmiCategory: "normal",                // From calculator
    stage: "new",                         // Always "new" on creation
    status: "new",
    createdAt: "2025-03-22T14:30:52Z",
    updatedAt: "2025-03-22T14:30:52Z"
}
```

### localStorage Key
- **ka_enquiries** - Contains array of all enquiry objects

---

## 🎯 Usage Examples

### Example 1: Open Enquiry Form
```javascript
// Click button in UI (already integrated)
// Or programmatically:
EnquiryModule.openForm();
```

### Example 2: Calculate BMI
```javascript
// In form, user enters:
// Height: 170 cm
// Weight: 70 kg
// Clicks "Calculate BMI" button

// Result displayed:
// BMI: 24.1
// Status: "Great in shape!"
// Ideal Range: 53-72 kg
```

### Example 3: View Kanban Board
```javascript
// Click "CRM" in sidebar
// Kanban board renders automatically with all enquiries

// Or programmatically:
EnquiryModule.renderKanbanBoard();
```

### Example 4: Get Enquiry Stats
```javascript
// In console:
StateManager.Enquiries.getAll()           // All enquiries
StateManager.Enquiries.getByStage('new')       // New leads
StateManager.Enquiries.getByStage('contacted') // Contacted
StateManager.Enquiries.getByStage('converted') // Converted
```

---

## 🔌 Integration Points

### With State Management
```javascript
// Enquiries are stored in StateManager.Enquiries
const enquiry = StateManager.Enquiries.create(data);
const all = StateManager.Enquiries.getAll();
const newLeads = StateManager.Enquiries.getByStage('new');

StateManager.Enquiries.update(enquiryId, {
    stage: 'contacted',
    followUpDate: '2025-03-29'
});
```

### With Navigation
```javascript
// When navigating to CRM section:
function showSection(sectionId) {
    // ... other logic ...
    if (sectionId === 'crm') {
        EnquiryModule.renderKanbanBoard();
    }
}
```

### With UI Components
```javascript
// Form uses UIComponents modal system
UIComponents.openModal(...)
UIComponents.showToast(...)
UIComponents.closeModal()
```

---

## 🎨 CSS Styling

### Kanban Board Classes
- `.kanban-board` - Main container, flex layout
- `.kanban-column` - Individual column (flex: 0 0 32%)
- `.kanban-header` - Column header with title + count
- `.kanban-count` - Badge with record count
- `.kanban-cards` - Card container
- `.kanban-card` - Individual card
- `.kanban-card-name` - Card heading
- `.kanban-card-tag` - Tag/label
- `.kanban-empty` - Empty state message

### BMI Calculator Classes
- `.bmi-calculator` - Widget container with gradient background
- `.bmi-inputs-grid` - 2-column input layout
- `.bmi-input` - Height/Weight input field
- `.bmi-button` - Calculate button with gradient
- `.bmi-result` - Result display container
- `.bmi-value` - BMI number (color-coded)
- `.bmi-status` - Status text (color-coded)
- `.bmi-info` - Weight range info

### Color-Coded States
```css
.underweight { color: #1976d2; }  /* Blue */
.normal      { color: #2e7d32; }  /* Green */
.overweight  { color: #ed6c02; }  /* Orange */
.obese       { color: #ba1a1a; }  /* Red */
```

---

## 🖱️ Interactions

### Form Submission
```
User: Fills form → Clicks "Save Enquiry"
System: Validates → Saves to localStorage → Shows toast → Closes modal → Re-renders board
```

### BMI Calculation
```
User: Enters height & weight → Clicks "Calculate"
System: Calculates BMI → Determines category → Displays color-coded result → Shows ideal range
```

### Kanban Navigation
```
User: Clicks CRM sidebar item
System: Shows Kanban board → Fetches enquiries → Groups by stage → Renders cards
```

### Card Viewing
```
User: Clicks card (future enhancement)
System: Could show detailed view with edit/delete options
```

---

## 📱 Responsive Design

### Desktop (1024px+)
- 3-column Kanban layout side-by-side
- 2-column form layout

### Tablet (768px - 1023px)
- Kanban columns full width stacked
- Form adapts to available space

### Mobile (< 768px)
- Single column layout
- Kanban scrolls vertically
- Form fields full width

---

## 🔍 Debugging

### Check Kanban Board
```javascript
// In console:
EnquiryModule.renderKanbanBoard()  // Force re-render
StateManager.getStats()             // View all records
StateManager.Enquiries.getAll()     // View all enquiries
```

### Check Form Validation
```javascript
// Fill form and check console for validation messages
// All required fields marked with "required" attribute
```

### Check BMI Calculator
```javascript
// Test with valid inputs:
// Height: 170, Weight: 70 → BMI ≈ 24.1
// Height: 180, Weight: 100 → BMI ≈ 30.9
```

### Check Data Persistence
```javascript
// After submitting form:
JSON.parse(localStorage.getItem('ka_enquiries'))
// Should contain your new enquiry
```

---

## ✨ Features Implemented

✅ Kanban board with 3 stages (New, Contacted, Converted)  
✅ Dynamic card rendering from localStorage  
✅ Live record counts per stage  
✅ 13-field enquiry form with validation  
✅ BMI calculator with color-coded feedback  
✅ Age calculation from DOB  
✅ Smooth animations (card hover, result display)  
✅ Auto-save to localStorage  
✅ Toast notifications on success  
✅ Modal form system integration  
✅ Responsive design (desktop/mobile)  
✅ Console API for testing  

---

## 🐛 Troubleshooting

### Issue: Kanban board not showing
**Solution:** Make sure you're in the CRM section and enquiries exist
```javascript
StateManager.Enquiries.getAll()  // Check if records exist
```

### Issue: BMI calculator not working
**Solution:** Check that height and weight are valid numbers
```javascript
// Valid: 170 cm, 70 kg
// Invalid: 0 cm, -50 kg
```

### Issue: Form not submitting
**Solution:** Check that all required fields are filled
```javascript
// Red asterisk (*) indicates required field
```

### Issue: Cards not updating
**Solution:** Click CRM or refresh page
```javascript
EnquiryModule.renderKanbanBoard()  // Force update
```

---

## 🚀 Next Enhancements

1. **Drag & Drop** - Move cards between columns to update stage
2. **Card Details** - Click card to view full details/edit
3. **Bulk Actions** - Multi-select for bulk status update
4. **Filters** - Filter by source, interest level, date range
5. **Search** - Search enquiries by name or phone
6. **Export** - Export leads to CSV/PDF
7. **Assignment** - Reassign leads to different executives
8. **Reports** - Conversion funnel analytics
9. **Notifications** - Alert on upcoming follow-ups
10. **Activity Log** - Track all changes to enquiry

---

## 📞 API Reference

```javascript
// Main Module Methods
EnquiryModule.openForm()           // Open enquiry form
EnquiryModule.calculateBMI()       // Calculate BMI (button click)
EnquiryModule.renderKanbanBoard()  // Render pipeline
EnquiryModule.initialize()         // Initialize on load

// State Manager Integration
StateManager.Enquiries.create(data)              // Create enquiry
StateManager.Enquiries.getAll()                  // Get all
StateManager.Enquiries.getByStage(stage)        // Filter by stage
StateManager.Enquiries.update(id, changes)      // Update
StateManager.Enquiries.delete(id)               // Delete

// UI Components Integration
UIComponents.openModal(title, config, entity, callback)
UIComponents.showToast(message, type, title, duration)
UIComponents.closeModal()
```

---

**The Enquiry & CRM module is fully integrated and ready for use! 🚀**
