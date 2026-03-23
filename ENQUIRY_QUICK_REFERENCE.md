# 🎯 ENQUIRY & CRM MODULE - Quick Reference

## 🚀 Getting Started (2 minutes)

### How to Create an Enquiry
1. Navigate to **CRM** section
2. Click **"New Enquiry"** button
3. Fill the form (only * fields required)
4. Use BMI calculator for health info (optional)
5. Click **"Save Enquiry"**
6. See success notification + Kanban updates

---

## 📊 Kanban Board

### Three Stages
| Stage | Purpose | What Happens |
|-------|---------|--------------|
| **New** | Fresh leads | Default for new enquiries |
| **Contacted** | Follow-up in progress | After initial contact |
| **Converted** | Became members | When they joined |

### What You See
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ New (5)     │  │Contact (2)  │  │Convert (18) │
├─────────────┤  ├─────────────┤  ├─────────────┤
│ John Doe    │  │ Jane Smith  │  │ Mike Wilson │
│ Membership  │  │ Training    │  │ Training    │
│ ⭐ 5/5      │  │ ⭐ 4/5      │  │ ⭐ 5/5      │
│ 📅 Mar 20   │  │ 📅 Mar 19   │  │ 📅 Mar 18   │
└─────────────┘  └─────────────┘  └─────────────┘
```

---

## 🧮 BMI Calculator

### Quick Use
```
1. Enter Height (cm)     → e.g., 170
2. Enter Weight (kg)     → e.g., 70
3. Click "Calculate"
4. See Result:
   - BMI value (24.1)
   - Health status ("Great in shape!")
   - Ideal weight range (53-72 kg)
```

### Color-Coded Results

| BMI | Status | Color | Recommendation |
|-----|--------|-------|-----------------|
| < 18.5 | Underweight 🔵 | Blue | Nutrition support |
| 18.5-24.9 | Normal 🟢 | Green | Keep it up! |
| 25-29.9 | Overweight 🟠 | Orange | Gym program |
| ≥ 30 | Obese 🔴 | Red | Weight management |

### Formula
```
BMI = Weight (kg) / (Height in meters)²
Example: 70 kg / (1.7m)² = 24.1
```

---

## 📋 Form Fields (13 Total)

### Essential (Required - 10 fields)
```
□ Contact No        +91 XXXXX XXXXX
□ Date              today's date
□ Name              John Doe
□ Gender            Male / Female / Other
□ DOB               birthdate (auto-calc age)
□ Heard About Us    Google / Social / Referral / etc.
□ Enquiry For       Membership / Training / etc.
□ Interest Level    1★ to 5★★★★★
□ Follow-up Date    when to contact next
□ Assigned To       Name of staff member
```

### Optional (3 fields)
```
□ Address           Full address
□ Referred By       Name of member who referred
□ Comments          Any notes
```

---

## 💾 Data Saved

When you submit an enquiry, this data is stored in localStorage:

```javascript
{
    id: "20250322_143052_a7f2",
    contactNo: "+91 98765 43210",
    date: "2025-03-22",
    name: "John Doe",
    gender: "male",
    dob: "1990-05-15",
    age: 34,                    // auto-calculated
    address: "123 Main St",
    heardAbout: "referral",
    referral: "Mike Wilson",
    enquiryFor: "membership",
    rating: "5",
    followUpDate: "2025-03-29",
    executive: "marcus",
    comment: "Very interested!",
    bmi: "24.1",               // from calculator
    bmiCategory: "normal",     // from calculator
    stage: "new",              // always starts as "new"
    createdAt: "2025-03-22T14:30:52Z"
}
```

---

## 🎯 Console Commands (Testing)

### View All Enquiries
```javascript
StateManager.Enquiries.getAll()
```

### View by Stage
```javascript
StateManager.Enquiries.getByStage('new')        // New leads
StateManager.Enquiries.getByStage('contacted')   // Contacted
StateManager.Enquiries.getByStage('converted')   // Converted
```

### Manually Update Stage
```javascript
StateManager.Enquiries.update(enquiryId, {
    stage: 'contacted'
});
```

### Force Kanban Update
```javascript
EnquiryModule.renderKanbanBoard()
```

### Get All Enquiries Count
```javascript
StateManager.Enquiries.getAll().length
```

###Test BMI Calculator by Hand
```javascript
// If height = 170cm, weight = 70kg
const bmi = 70 / (1.7 * 1.7);  // 24.1
console.log(bmi.toFixed(1));
```

---

## 🎨 Form Layout

### Column Layout
```
Left Column          │  Right Column
─────────────────────┼──────────────────────
Contact No           │  Date
Name                 │  Gender
DOB                  │  Address (spans both)
Heard About Us       │  Referral Name
Enquiry For          │  Interest Level (1-5)
Follow-up Date       │  Assigned To
Comments (spans both columns)
─────────────────────┼──────────────────────
```

### Mobile View
All fields stack single column on small screens

---

## 🔄 Data Flow

### Complete Workflow
```
1. User clicks "New Enquiry"
   ↓
2. Form opens in glassmorphism modal
   ↓
3. User fills 10 required fields (3 optional)
   ↓
4. Optional: Calculate BMI with height & weight
   ↓
5. User clicks "Save Enquiry"
   ↓
6. Form validates (all * fields required)
   ↓
7. Data saved to localStorage.ka_enquiries
   ↓
8. Success toast shown: "John Doe added to leads!"
   ↓
9. Modal closes
   ↓
10. Kanban board re-renders with new card
    ↓
11. New card appears in "New" column
```

---

## 🎯 Enquiry Lifecycle

### Stage Progression
```
Step 1: CREATE
User adds enquiry
→ Stage: "new"
→ Appears in "New Inquiry" column
→ Email/SMS sent to assigned executive

Step 2: CONTACT
Executive calls/messages lead
→ Update stage: "contacted"
→ Card moves to "Contacted" column
→ Set follow-up date
→ Add notes in comments

Step 3: CONVERT
Lead agrees to join
→ Create member in Members section
→ Update enquiry stage: "converted"
→ Card moves to "Converted" column
→ Create receipt for payment
```

---

## 📊 Quick Stats

### Console Commands
```javascript
// Total enquiries
StateManager.Enquiries.getAll().length

// New leads this week
StateManager.Enquiries.getByStage('new').length

// Conversion rate
const total = StateManager.Enquiries.getAll().length;
const converted = StateManager.Enquiries.getByStage('converted').length;
const rate = (converted / total * 100).toFixed(1);
console.log(`Conversion: ${rate}%`);

// Average interest level
const enquiries = StateManager.Enquiries.getAll();
const avgRating = (enquiries.reduce((s, e) => s + parseInt(e.rating || 0), 0) / enquiries.length).toFixed(1);
console.log(`Avg Interest: ${avgRating}/5`);
```

---

## 🖱️ Button Locations

### In UI
- **"New Enquiry"** - Top right of CRM section
- **"Calculate"** - In BMI calculator section of form
- **"Save Enquiry"** - Bottom right of modal (green button)
- **"Cancel"** - Bottom left of modal (gray button)

### Navigation
- **Sidebar CRM Link** - Clicking shows Kanban board
- **Cards** - Click any card to view details (future feature)

---

## ⚠️ Important Notes

### Requirements
- ✅ All fields with * must be filled
- ✅ Date format: YYYY-MM-DD (date picker handles this)
- ✅ Phone: Any format (e.g., +91 98765 43210)
- ✅ Interest Level: Required despite seeming optional

### BMI Calculator
- 🟢 Optional - don't need to use it
- 📊 Values auto-saved to enquiry if calculated
- 🔢 Height in cm (100-250 range)
- ⚖️ Weight in kg (20-300 range)

### Data Persistence
- 💾 All enquiries saved to localStorage automatically
- 🔄 Data survives page refresh
- 📱 Data persists across browser sessions
- 🗑️ Clear browser cache to reset

---

## 🆘 Troubleshooting

### "Save Enquiry" button doesn't work
→ Check all required fields (marked with *)
→ Open console (F12) for error messages

### BMI Calculator not calculating
→ Check height is 100-250 cm
→ Check weight is 20-300 kg
→ Both must be positive numbers

### Kanban board is empty
→ Create a new enquiry first
→ Check localStorage: `JSON.parse(localStorage.getItem('ka_enquiries'))`

### Form won't open
→ Make sure enquiry-module.js is loaded
→ Check console for errors (F12)
→ Try `EnquiryModule.openForm()` manually

---

## 💡 Pro Tips

### Tip 1: Pre-fill Follow-up Date
Set follow-up date 7 days after enquiry date
→ Reminds you when to contact lead next

### Tip 2: Use Interest Levels Strategically
- ⭐⭐⭐⭐⭐ (5) = Hot leads, contact today
- ⭐⭐⭐⭐ (4) = Warm, contact within 2 days
- ⭐⭐⭐ (3) = Neutral, contact within 1 week
- ⭐⭐ (2) = Cool, contact as available
- ⭐ (1) = Not interested, don't contact

### Tip 3: Use Comments Effectively
```
"Sarah - very interested, mentioned budget concern,
wants to see pricing. Follow up Mon 3pm with proposal."
```

### Tip 4: Track Source
Different sources convert differently
→ Track which brings best leads
→ Focus marketing on top sources

### Tip 5: BMI for Services
Member BMI can help:
- Recommend personal training
- Suggest nutrition coaching
- Create tailored fitness plans

---

## 📈 Performance

### How many enquiries can system handle?
- ✅ 100s - no problem
- ✅ 1,000s - still fast
- ⚠️ 10,000+ - consider backend

### Browser Storage Limits
- Typically 5-10MB available
- Enquiry ≈ 200 bytes
- Can store ~50,000 enquiries

---

## 🔗 Related Modules

### Connect with Other Modules
1. **Members Module** - Convert enquiry to member
2. **Staff Module** - Assign enquiry to team
3. **Finance Module** - Track revenue from conversions

---

## 📞 Quick Reference

| Need | Command |
|------|---------|
| Open form | Click "New Enquiry" button or `EnquiryModule.openForm()` |
| Calculate BMI | Enter height/weight + click "Calculate" |
| See all enquiries | `StateManager.Enquiries.getAll()` |
| See new leads | `StateManager.Enquiries.getByStage('new')` |
| Update stage | `StateManager.Enquiries.update(id, {stage: 'contacted'})` |
| Force Kanban refresh | `EnquiryModule.renderKanbanBoard()` |
| Get record count | `StateManager.Enquiries.getAll().length` |

---

**Happy lead management! 🚀**

For detailed documentation, see: **ENQUIRY_MODULE_GUIDE.md**
