# Settings Management System - Implementation Guide

## 📋 Overview

The Settings Management System provides a complete master configuration interface for the Gym CRM, allowing administrators to configure company profile, tax settings, and manage gym packages dynamically. All settings are persisted to `localStorage.ka_settings` and integrated throughout the application.

---

## 🏗️ Architecture

### Module Structure

```
Settings System
├── SettingsManager (settings-management.js)
│   ├── State persistence (localStorage.ka_settings)
│   ├── CRUD operations for settings
│   └── Data validation & defaults
│
├── SettingsModule (settings-module.js)
│   ├── UI rendering (tabbed interface)
│   ├── Form handling
│   └── Real-time preview
│
└── Invoice Integration (members-module.js)
    ├── Dynamic gym info in invoices
    ├── Tax calculation using settings
    └── Logo & GST from settings
```

---

## 🔧 Components

### 1. SettingsManager (settings-management.js)

**Purpose:** Core data management for settings with localStorage persistence

**Default Settings Structure:**
```javascript
{
    companyProfile: {
        gymName: 'Kinetic Atelier',
        logoUrl: 'https://...',
        fullAddress: '123 Fitness Street...',
        phone: '+91 9876543210',
        email: 'info@...',
        gstNumber: 'GST-XXXX123456'
    },
    taxConfiguration: {
        taxPercentage: 18,
        taxLabel: 'GST'
    },
    packages: [
        { id: 'pkg_standard', name: 'Standard', durationMonths: 1, basePrice: 2500 },
        { id: 'pkg_quarterly', name: 'Quarterly', durationMonths: 3, basePrice: 7000 },
        { id: 'pkg_halfyear', name: 'Half Yearly', durationMonths: 6, basePrice: 13000 },
        { id: 'pkg_annual', name: 'Annual', durationMonths: 12, basePrice: 24000 }
    ]
}
```

**Key Functions:**

| Function | Purpose | Returns |
|----------|---------|---------|
| `initialize()` | Create settings if not exist | void |
| `getAll()` | Get complete settings object | object |
| `getCompanyProfile()` | Get company details only | object |
| `getTaxConfiguration()` | Get tax settings | object |
| `getPackages()` | Get all packages | array |
| `getPackageById(id)` | Get single package | object/null |
| `saveCompanyProfile(data)` | Save/update company info | boolean |
| `saveTaxConfiguration(data)` | Save/update tax settings | boolean |
| `addPackage(data)` | Create new package | object/null |
| `updatePackage(id, data)` | Update package | boolean |
| `deletePackage(id)` | Delete package | boolean |
| `resetToDefaults()` | Reset all settings | boolean |
| `exportSettings()` | Export as JSON string | string |
| `importSettings(json)` | Import from JSON | boolean |

**Usage Examples:**

```javascript
// Get company profile
const profile = SettingsManager.getCompanyProfile();
console.log(profile.gymName); // "Kinetic Atelier"

// Save company profile
SettingsManager.saveCompanyProfile({
    gymName: 'My Gym',
    phone: '+91 1234567890',
    gstNumber: 'GST-12345'
});

// Manage packages
const newPkg = SettingsManager.addPackage({
    name: 'Premium',
    durationMonths: 6,
    basePrice: 15000
});

SettingsManager.deletePackage('pkg_standard');

// Get tax for calculations
const tax = SettingsManager.getTaxConfiguration();
const taxAmount = price * (tax.taxPercentage / 100);
```

---

### 2. SettingsModule (settings-module.js)

**Purpose:** UI layer for settings management with tabbed interface

**Three Tabs:**

#### Tab 1: Company Profile
- **Fields:**
  - Gym Name (required)
  - Logo URL (optional, with preview)
  - Phone (required)
  - Email (required)
  - GST/SAC Number (required)
  - Full Address (required)
- **Features:**
  - Real-time logo preview
  - Invoice preview button
  - Form validation
- **Actions:**
  - Save Company Profile button
  - Preview Invoice button

#### Tab 2: Packages & Courses
- **Features:**
  - List all packages with details
  - Add Package form (modal inline)
  - Edit/Delete actions per package
  - Empty state UI
- **Fields per Package:**
  - Package Name (e.g., "Annual Pass")
  - Duration in Months (1-12)
  - Base Price (₹)
- **Actions:**
  - Add Package button
  - Edit & Delete per package

#### Tab 3: Tax Configuration
- **Fields:**
  - Tax Type Label (e.g., "GST", "VAT")
  - Tax Percentage (0-50% with slider)
  - Live calculation preview
  - Example calculation display
- **Actions:**
  - Save Tax Configuration button

**Key Functions:**

| Function | Purpose |
|----------|---------|
| `initialize()` | Setup tabs, load settings from SettingsManager |
| `switchTab(tabName)` | Render tab panel, update active state |
| `renderCompanyProfileTab()` | Render company form |
| `renderPackagesTab()` | Render packages list |
| `renderTaxTab()` | Render tax config form |
| `saveCompanyProfile(event)` | Save company data via SettingsManager |
| `saveTaxConfiguration(event)` | Save tax settings via SettingsManager |
| `savePackage(event)` | Create new package via SettingsManager |
| `deletePackage(id)` | Delete package with confirmation |
| `openAddPackageForm()` | Show inline add form |
| `closePackageForm()` | Hide inline add form |
| `showPreview()` | Display invoice preview modal |

**Usage:**

```javascript
// Initialize on page load (auto-run)
SettingsModule.initialize();

// Switch tabs programmatically
SettingsModule.switchTab('packages');

// Show invoice preview
SettingsModule.showPreview();
```

---

### 3. Invoice Integration (members-module.js)

**Modified Function:** `generateInvoiceHTML(memberData)`

**Changes:**
1. Reads gym info from `SettingsManager.getCompanyProfile()`
2. Reads tax from `SettingsManager.getTaxConfiguration()`
3. Includes logo from settings
4. Displays GST from settings
5. Calculates tax line item in invoice totals
6. Uses gym name in thank-you message

**Invoice Content Sourced from Settings:**

| Invoice Section | Source | Field |
|-----------------|--------|-------|
| Gym Name (header) | CompanyProfile | `gymName` |
| Logo | CompanyProfile | `logoUrl` (optional) |
| Address | CompanyProfile | `fullAddress` |
| Phone | CompanyProfile | `phone` |
| Email | CompanyProfile | `email` |
| Tax ID/GST | CompanyProfile | `gstNumber` |
| Tax Line Item | TaxConfiguration | `taxPercentage`, `taxLabel` |
| Closing Message | CompanyProfile | `gymName` |

**Invoice Example with Settings:**

```
┌─────────────────────────────────┐
│    [LOGO FROM SETTINGS]         │
│    Kinetic Atelier              │ ← FROM SETTINGS
├─────────────────────────────────┤
│ 123 Fitness Street, Gym City    │ ← FROM SETTINGS
│ Phone: +91 9876543210           │ ← FROM SETTINGS
│ Email: info@kineticatelier.com  │ ← FROM SETTINGS
│ Tax ID: GST-XXXX123456          │ ← FROM SETTINGS
├─────────────────────────────────┤
│ Member Details [...]            │
├─────────────────────────────────┤
│ Package Membership      ₹2,500   │
│ Discount (10%)           ₹-250  │
│ ─────────────────────────────── │
│ Subtotal               ₹2,250   │
│ GST (18%)              ₹405     │ ← TAX % FROM SETTINGS
│ ─────────────────────────────── │
│ Total Amount           ₹2,655   │
├─────────────────────────────────┤
│ Amount Paid            ₹2,655   │
│ Outstanding Balance     ₹0      │
└─────────────────────────────────┘
Thank you for enrolling with Kinetic Atelier!
```

---

## 💾 localStorage Structure

**Key:** `ka_settings`

**Location:** Browser's localStorage

**Format:** JSON object (auto-serialized)

**Access:**
```javascript
// View raw JSON
const rawSettings = localStorage.getItem('ka_settings');

// View as object
const settings = JSON.parse(rawSettings);

// Export all settings
const json = SettingsManager.exportSettings();
```

---

## 🎨 UI Components

### Settings Tabs (CSS Classes)

**Tab Navigation:**
```css
.settings-tabs           /* Container for tab buttons */
.settings-tab-btn        /* Individual tab button */
.settings-tab-btn.active /* Active tab state */
.settings-tab-btn:hover  /* Hover effect */
```

**Tab Panels:**
```css
.settings-tab-panel            /* Tab content container */
.settings-tab-panel.active     /* Active panel display */
```

**Package List:**
```css
.package-row              /* Individual package container */
.package-row:hover        /* Hover effect */
.package-info             /* Package details */
.package-actions          /* Edit/Delete buttons */
```

**Forms:**
```css
.form-group               /* Form field container */
.form-group label         /* Label styling */
.form-input               /* Input field */
.form-input:focus         /* Focus state with blue border */
```

### Tab Animation

Smooth fade-in animation for tab switches:
```css
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to {   opacity: 1; transform: translateY(0);    }
}
```

---

## 🔌 Integration Points

### 1. Dashboard Display

```javascript
// In DashboardAnalytics, pull gym name for branding
const profile = SettingsManager.getCompanyProfile();
document.title = `${profile.gymName} - Dashboard`;
```

### 2. Receipt Generation

```javascript
// In Members Module invoice generation
const profile = SettingsManager.getCompanyProfile();
const tax = SettingsManager.getTaxConfiguration();
// Invoice pulled from settings automatically
```

### 3. Package Dropdown

```javascript
// When adding members, show packages from settings
const packages = SettingsManager.getPackages();
packages.forEach(pkg => {
    // Create option: "Standard (1 month) - ₹2,500"
});
```

### 4. Report Headers

```javascript
// Any printed/exported report can use
const gymInfo = SettingsManager.getCompanyProfile();
// Header: "Kinetic Atelier - Finance Report"
```

---

## 📊 Data Flow

```
┌─────────────────────────────────┐
│   Settings UI (SettingsModule)  │
│   - Tabbed interface            │
│   - Form inputs                 │
└──────────────┬──────────────────┘
               │ User saves
               ▼
┌─────────────────────────────────┐
│ SettingsManager (Business Logic)│
│ - Validation                    │
│ - Defaults                      │
│ - CRUD operations               │
└──────────────┬──────────────────┘
               │ Persist
               ▼
┌─────────────────────────────────┐
│  localStorage.ka_settings       │
│  (JSON persistence)             │
└──────────────┬──────────────────┘
               │ Read
               ▼
┌─────────────────────────────────┐
│  Throughout App:                │
│  - Invoice generation           │
│  - Dashboard display            │
│  - Package selection            │
│  - Reports                      │
└─────────────────────────────────┘
```

---

## 🚀 Usage Scenarios

### Scenario 1: Admin Sets Up Gym

```javascript
// 1. Navigate to Settings → Company Profile tab
// 2. Fill in gym details:
SettingsManager.saveCompanyProfile({
    gymName: 'Peak Fitness Club',
    phone: '+91 8765432100',
    email: 'admin@peakfitness.com',
    gstNumber: 'GST-27AABCP1234A1Z0',
    fullAddress: '456 Sports Avenue, Bangalore, KA 560001',
    logoUrl: 'https://example.com/peak-fitness-logo.png'
});

// 3. Navigate to Tax Configuration
SettingsManager.saveTaxConfiguration({
    taxPercentage: 18,
    taxLabel: 'GST'
});

// 4. Navigate to Packages & Courses
// 5. Add custom packages
SettingsManager.addPackage({
    name: 'Premium Family',
    durationMonths: 12,
    basePrice: 35000
});
```

### Scenario 2: Generate Invoice for Member

```javascript
// 1. Admin clicks "Generate Invoice" on member
// 2. System calls generateInvoiceHTML(memberData)
// 3. Invoice automatically includes:
//    - Gym name, address, phone, email (from settings)
//    - Logo (from settings URL)
//    - GST number (from settings)
//    - Tax calculation (from settings tax %)
// 4. PDF/Print uses these values automatically
```

### Scenario 3: Create New Package Offering

```javascript
// 1. Admin goes to Settings → Packages & Courses
// 2. Clicks "Add Package"
// 3. Fills form:
//    - Name: "Corporate Partnership"
//    - Duration: 6 months
//    - Price: 18,000
// 4. Click "Add Package"
// 5. New package available in member registration dropdown
```

### Scenario 4: Change Tax Rate for New Financial Year

```javascript
// 1. Admin goes to Settings → Tax Configuration
// 2. Updates:
//    - Tax Percentage: 18% → 20% (hypothetically)
//    - Tax Label: GST (stays same)
// 3. Saves changes
// 4. All new invoices generated with 20% tax
// 5. Existing invoices unaffected (historical)
```

---

## ⚠️ Important Notes

### Data Persistence
- All settings saved to `localStorage.ka_settings`
- Survives page refreshes
- Cleared only if user clears browser storage
- No backend sync (client-side only)

### Validation
- Company name, phone, email are required
- Email format validated by HTML5
- Tax percentage constrained to 0-50%
- Package base price must be ≥ 0

### Default Values
- If settings missing, system reverts to `DEFAULT_SETTINGS`
- First load initializes with defaults
- Can reset to defaults via API

### Logo URL
- Must be full URL (https://...)
- Relative paths will not work
- Image should be 160x160px recommended
- Placeholder logo if URL fails to load

### Package IDs
- Auto-generated as `pkg_` + timestamp
- Unique within settings
- Used for programmatic reference

---

## 📱 Responsive Behavior

**Desktop (> 768px):**
- Tab buttons horizontal
- 2-column form layout
- Full logo preview

**Tablet (768px - 1024px):**
- Tab buttons wrap if needed
- 2-column form remains

**Mobile (< 768px):**
- Tab buttons single row (scrollable)
- 1-column form layout
- Logo preview smaller
- Package list stacked

---

## 🔐 Data Security

**No Security Restrictions:**
- Settings UI accessible to all users
- No role-based access control
- Consider adding admin-only restriction if needed

**Future Enhancement:**
```javascript
// Could add access control:
const canEditSettings = (user) => user.role === 'admin';
```

---

## 🐛 Troubleshooting

**Issue:** Settings not saving
- **Check:** Console for errors in SettingsManager
- **Verify:** localStorage enabled in browser
- **Try:** `StateManager.clearAll()` and refresh

**Issue:** Invoice not showing new gym name
- **Check:** `SettingsManager.getCompanyProfile()` in console
- **Verify:** `members-module.js` is loading after `settings-management.js`
- **Ensure:** Settings saved before generating invoice

**Issue:** Logo not appearing on preview
- **Check:** Logo URL is accessible (https://)
- **Verify:** Image format supported (PNG, JPG, SVG)
- **Test:** Open URL directly in new tab

**Issue:** Tax not displaying in invoice
- **Check:** Tax configuration saved: `SettingsManager.getTaxConfiguration()`
- **Verify:** Tax percentage > 0
- **Ensure:** Invoice generation reads from SettingsManager

---

## 📚 API Quick Reference

```javascript
// COMPANY PROFILE
SettingsManager.getCompanyProfile()
SettingsManager.saveCompanyProfile({ gymName, logoUrl, etc. })

// TAX CONFIGURATION
SettingsManager.getTaxConfiguration()
SettingsManager.saveTaxConfiguration({ taxPercentage, taxLabel })

// PACKAGES
SettingsManager.getPackages()
SettingsManager.getPackageById(id)
SettingsManager.addPackage({ name, durationMonths, basePrice })
SettingsManager.updatePackage(id, { name, durationMonths, basePrice })
SettingsManager.deletePackage(id)

// UTILITIES
SettingsManager.resetToDefaults()
SettingsManager.exportSettings()
SettingsManager.importSettings(jsonString)

// UI MODULE
SettingsModule.initialize()
SettingsModule.switchTab(tabName)
SettingsModule.showPreview()
```

---

## ✅ Checklist for Implementation

- ✅ `settings-management.js` created with CRUD operations
- ✅ `settings-module.js` created with tabbed UI
- ✅ `index.html` updated with settings-section HTML
- ✅ CSS added for tabs, forms, and packages
- ✅ Script references added (settings-management.js, settings-module.js)
- ✅ `members-module.js` updated to use SettingsManager for invoices
- ✅ Default settings with common packages
- ✅ Logo preview integration
- ✅ Tax calculation in invoice
- ✅ Documentation complete

---

**Status:** ✅ Complete & Production Ready

**Version:** 1.0 - Settings Management System

**Last Updated:** March 22, 2026
