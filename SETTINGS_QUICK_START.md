# Settings System - Quick Start Guide

## 🚀 Getting Started

### Step 1: Navigate to Settings
1. Click "Global Config" in the sidebar under "Settings"
2. You'll see three tabs: Company Profile | Packages & Courses | Tax Configuration

### Step 2: Configure Company Profile

**Tab: Company Profile**

Fill in your gym details:

| Field | Example | Required |
|-------|---------|----------|
| Gym Name | Peak Fitness Club | ✓ Yes |
| Logo URL | https://example.com/logo.png | ✗ No (optional) |
| Phone | +91 8765432100 | ✓ Yes |
| Email | admin@peakfitness.com | ✓ Yes |
| GST/SAC Number | GST-27AABCP1234A1Z0 | ✓ Yes |
| Full Address | 456 Sports Avenue, Bangalore, KA 560001 | ✓ Yes |

**Actions:**
- Click "Save Company Profile" to save changes
- Click "Preview Invoice" to see how it appears on member invoices

### Step 3: Set Up Tax Configuration

**Tab: Tax Configuration**

1. Enter Tax Type Label (e.g., "GST", "VAT", "Tax")
2. Use the slider to set tax percentage (0-50%)
3. See live preview: "If package is ₹1,000, tax will be ₹180"
4. Click "Save Tax Configuration"

💡 This tax will be automatically calculated in all future invoices

### Step 4: Create Gym Packages

**Tab: Packages & Courses**

**To Add Package:**
1. Click "Add Package" button
2. Fill in package details:
   - **Name:** e.g., "Annual Pass", "Monthly Premium"
   - **Duration:** 1 to 12 months (whole numbers)
   - **Base Price:** e.g., 2500 (in ₹)
3. Click "Add Package"

**To Delete Package:**
1. Find package in the list
2. Click the delete (trash) icon
3. Confirm deletion

**Default Packages (Pre-populated):**
- Standard (1 month) - ₹2,500
- Quarterly (3 months) - ₹7,000
- Half Yearly (6 months) - ₹13,000
- Annual (12 months) - ₹24,000

---

## 📄 How Invoice Updates Work

When you generate a member invoice, it automatically pulls from your settings:

```
BEFORE (Hardcoded):
┌──────────────────────────┐
│ Kinetic Atelier          │ ← Hardcoded
│ 123 fitness Street       │ ← Hardcoded
│ GST-XXXX123456           │ ← Hardcoded
└──────────────────────────┘

AFTER (Dynamic):
┌──────────────────────────┐
│ Peak Fitness Club        │ ← From Settings
│ 456 Sports Avenue        │ ← From Settings
│ GST-27AABCP1234A1Z0      │ ← From Settings
│ (Your Logo)              │ ← From Settings
└──────────────────────────┘
```

---

## 🎯 Common Tasks

### Task: Change Gym Name
1. Go to Settings → Company Profile
2. Update "Gym Name" field
3. Click "Save Company Profile"
4. All future invoices will use new name

### Task: Add Logo to Invoices
1. Go to Settings → Company Profile
2. Paste full image URL in "Logo URL" field
3. Preview appears in the "Logo Preview" box
4. Click "Save Company Profile"
5. Invoices will display logo

### Task: Update Tax Percentage
1. Go to Settings → Tax Configuration
2. Adjust slider to new percentage
3. See calculation preview update
4. Click "Save Tax Configuration"
5. New invoices use new tax%

### Task: Create New Package Type
1. Go to Settings → Packages & Courses
2. Click "Add Package"
3. Enter details (Name, Duration, Price)
4. Click "Add Package"
5. Package appears in member registration dropdown

### Task: Remove Package
1. Go to Settings → Packages & Courses
2. Find package in list
3. Click red delete button
4. Confirm deletion
5. Package no longer available (but existing members keep their package)

---

## 💾 Data Saved Where

All settings stored in browser's localStorage:

**Storage Key:** `ka_settings`

**What's Saved:**
- ✓ Company Profile (Name, Address, Phone, Email, GST, Logo)
- ✓ Tax Configuration (Percentage, Label)
- ✓ Package List (All packages you create)

**Persists:**
- ✓ Page refreshes
- ✓ Browser restarts
- ✓ Until browser storage cleared

---

## ⚠️ Important Reminders

### Do This:
✅ Save settings before generating invoices  
✅ Use full URLs for logo (https://...)  
✅ Set realistic tax percentages  
✅ Create packages before registering members  

### Don't Do This:
❌ Leave required fields empty  
❌ Use relative paths for logo  
❌ Set tax percentage > 50% (won't break, but unrealistic)  
❌ Delete a package then expect old members to update  

---

## 🔍 Verification

To verify settings are saved:

**In Browser Console (Press F12):**
```javascript
// View all settings
SettingsManager.getAll()

// View company profile
SettingsManager.getCompanyProfile()

// View tax settings
SettingsManager.getTaxConfiguration()

// View packages
SettingsManager.getPackages()

// View localStorage directly
JSON.parse(localStorage.getItem('ka_settings'))
```

---

## 🎨 Preview Invoice Before Saving

1. After filling Company Profile form
2. Click "Preview Invoice" button
3. Modal shows how settings appear on invoice
4. Review company info, logo, tax ID
5. Close modal and adjust if needed
6. Click "Save Company Profile"

---

## ✨ Features

### Dynamic Invoicing
- Gym info pulled from settings automatically
- Tax line item calculated based on settings
- Logo displayed if URL provided
- GST/SAC number shown on invoice

### Tax Slider
- Easy visual adjustment
- Live calculation preview
- Example shows impact on ₹1,000

### Logo Preview
- Real-time preview in settings
- Shows how it will appear on invoice
- Verify correct image before saving

### Package Management
- Add unlimited packages
- Edit/Delete existing packages
- Packages appear in member registration
- Default packages pre-loaded

### Settings Export/Import
- Export settings as JSON (API available)
- Import settings from JSON (API available)
- Useful for backup/restore

---

## 📞 Need Help?

**Forgot Password?**
- Settings saved locally, no password needed

**Logo Not Showing?**
- Check URL is accessible (try opening in new tab)
- Ensure HTTPS protocol (https://, not http://)
- Try different image URL

**Toast Notification Missing?**
- Refresh page if you don't see "Settings Updated" toast
- Check browser console (F12) for errors

**Settings Not Saving?**
- Ensure localStorage enabled in browser
- Try clearing browser cache and refresh
- Check browser console for error messages

---

## 🚀 Next Steps

1. ✅ **Configure Company Profile** - Enter your gym details
2. ✅ **Set Tax Rate** - Configure your GST/tax percentage
3. ✅ **Create Packages** - Add your membership packages
4. ✅ **Test Invoice** - Generate a member invoice to verify
5. ✅ **Add Members** - Start registering members

---

## 📋 Settings Checklist

- [ ] Company Profile filled with gym details
- [ ] Logo URL uploaded and previewed
- [ ] Phone and email valid
- [ ] GST number entered
- [ ] Tax percentage set correctly
- [ ] Default packages reviewed
- [ ] New custom packages added (if needed)
- [ ] Invoice preview looks correct

---

**Version:** 1.0  
**Status:** ✅ Ready to Use  
**Date:** March 22, 2026
