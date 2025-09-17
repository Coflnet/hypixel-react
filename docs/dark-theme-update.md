# Dark Theme Update Summary

## Overview
Updated all bright background color overrides to use dark theme colors and adjusted text colors accordingly. All instances of `#f8f9fa` and other light backgrounds have been replaced with appropriate dark alternatives.

## Changes Made

### 1. CoflCoinPaymentSelection.tsx
**Updated Card Background:**
- Changed `backgroundColor: '#f8f9fa'` to `backgroundColor: '#2a3644'`
- Added dark border: `border: '1px solid #495057'`

**Updated Text Colors:**
- Main title: `color: '#212529'` → `color: '#f8f9fa'`
- Balance text: `color: '#6c757d'` → `color: '#adb5bd'`
- Price: `color: '#28a745'` → `color: '#20c997'` (brighter green)
- Price details: `color: '#6c757d'` → `color: '#adb5bd'`
- Total text: `color: '#495057'` → `color: '#e9ecef'`
- Description: `color: '#6c757d'` → `color: '#adb5bd'`

**Updated Borders:**
- Border separator: `borderTop: '1px solid #dee2e6'` → `borderTop: '1px solid #495057'`

### 2. CoflCoinAmountSelection.tsx
**Updated Recommendation Box:**
- Background: `backgroundColor: '#e7f3ff'` → `backgroundColor: '#1a4b5c'`
- Border: `border: '1px solid #bee5eb'` → `border: '1px solid #0c5460'`
- Text color: `color: '#0c5460'` → `color: '#17a2b8'`

**Updated Card Backgrounds:**
- Selected state: `backgroundColor: '#eef4ff'` → `backgroundColor: '#1a3a52'`
- Unselected state: `backgroundColor: 'white'` → `backgroundColor: '#2a3644'`
- Selected border: `border: '2px solid #004085'` → `border: '2px solid #0056b3'`
- Unselected border: `border: '2px solid #dee2e6'` → `border: '2px solid #495057'`

**Updated Text Colors:**
- Price display: `color: '#28a745'` → `color: '#20c997'`
- Per coin price: `color: '#6c757d'` → `color: '#adb5bd'`
- Savings text: `color: '#28a745'` → `color: '#20c997'`
- Special option text: `color: '#0c5460'` → `color: '#17a2b8'`

**Updated Shadows:**
- Selected card: Enhanced blue shadow with higher opacity
- Unselected card: Darker shadow for better contrast

## Color Scheme Used

### Dark Backgrounds
- **Primary card background:** `#2a3644` (dark blue-gray)
- **Selected card background:** `#1a3a52` (darker blue)
- **Info box background:** `#1a4b5c` (dark teal)

### Bright Text Colors
- **Primary text:** `#f8f9fa` (light gray)
- **Secondary text:** `#adb5bd` (medium gray)
- **Success/Price text:** `#20c997` (bright teal)
- **Info text:** `#17a2b8` (cyan)
- **Emphasis text:** `#e9ecef` (lighter gray)

### Borders
- **Primary borders:** `#495057` (medium dark gray)
- **Accent borders:** `#0c5460` (dark teal)
- **Selected borders:** `#0056b3` (bright blue)

## Benefits
1. **Consistency:** All components now follow the same dark theme pattern
2. **Accessibility:** Better contrast ratios for text readability
3. **Modern Look:** Dark theme provides a more modern, professional appearance
4. **Eye Strain:** Reduced eye strain in low-light conditions
5. **Brand Coherence:** Matches the overall application's dark theme

## Files Modified
- `/components/CoflCoins/CoflCoinPaymentSelection.tsx`
- `/components/CoflCoins/CoflCoinAmountSelection.tsx`

All changes maintain functionality while improving the visual experience with consistent dark theming.
