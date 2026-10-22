# Substantial Event Details & Venue Card

Elevate the event details at the top of the Friendsgiving Feast Ledger from a small, generic text string into a prominent, welcoming **parchment card**. This gives guests an immediate, unmistakable overview of the date, time, location (**3295 Eliot St, United States**), host notes, and interactive Google Maps directions, while providing hosts with an inline editing tool.

## User Review & Critical Decisions

> [!IMPORTANT]
> - **Confirmed Format**: Prominent warm parchment card with clear typography, feast date/time, full venue address (**3295 Eliot St, United States**), interactive "Open in Maps" button, and 1-tap "Copy Address" utility.
> - **Host Inline Editing**: When the host is signed in with Google, an "Edit Event Details" action button appears directly on the card to modify date, time, location, or host note in real-time Firestore sync without leaving the page.
> - **Zero-Disruption Guarantee**: Existing claims and dish assignments remain 100% intact.

---

## 1. Overview & Core Concept

- **Problem Solved**: Previously, potluck details were rendered as a small, easily-overlooked text line beneath the main title. Arriving guests couldn't easily verify the address, launch directions, or read host instructions.
- **Solution**: A dedicated, beautifully-styled event card right below the header title. It establishes a festive, physical invitation aesthetic with high-contrast typography, clear hierarchy, and actionable buttons.
- **Default Details**:
  - **Venue Address**: `3295 Eliot st, United States`
  - **Date & Time**: `Thursday, November 26 · 4:00 PM` (or the host's configured time)
  - **Host Welcome Note**: `Hot dishes ready by 4:30 PM · Bring your appetite and holiday cheer!`

---

## 2. User Experience & Visual Design

### The Event Details Parchment Card

```
┌────────────────────────────────────────────────────────────────────────┐
│  🍁 THANKSGIVING GATHERING                                  [Host: Alex]│
│                                                                        │
│  📅 Thursday, November 26 · 4:00 PM                                    │
│  📍 3295 Eliot St, United States                                       │
│                                                                        │
│  💬 "Hot dishes ready by 4:30 PM. BYOB & bring your holiday cheer!"    │
│                                                                        │
│  [ 🗺️ Open in Google Maps ]   [ 📋 Copy Address ]   [ ✏️ Edit (Host) ]  │
└────────────────────────────────────────────────────────────────────────┘
```

### Visual Specifications
- **Container**: Off-white parchment background (`#FFFFFF` on `#FAF6F0` canvas) with a warm border (`#E5DACD`), soft shadow (`shadow-warm`), and rounded geometry (`rounded-2xl`).
- **Typography**: 
  - Eyebrow header in warm terracotta serif with a festive leaf accent.
  - Primary date and address displayed in legible, high-contrast walnut slate (`#2C1E16`) with clear iconography.
  - Host message set in a warm italicized quote box with a subtle amber border.
- **Interactive Action Bar**:
  - **Open in Google Maps**: Direct link opening `https://www.google.com/maps/search/?api=1&query=3295+Eliot+st+United+States` in a new tab.
  - **Copy Address**: One-click clipboard copy with an instant confirmation toast (`"Address copied to clipboard!"`).
  - **Host Edit Details**: Appears only for the authenticated event host, triggering a modal to update title, date, location address, and notes.

---

## 3. Technical Architecture & Data Strategy

### System Flow Diagram

```
┌────────────────────────────┐
│      Firestore Potluck     │
│   /potlucks/{potluckId}    │
│  - eventDate               │
│  - notes (or location)     │
│  - title                   │
└──────────────┬─────────────┘
               │ Real-Time Listener (onSnapshot)
               ▼
┌────────────────────────────┐
│    Event Details Card      │
│  - Render Date & Time      │
│  - Render 3295 Eliot St    │
│  - Google Maps Action Link │
│  - Copy Address Clipboard  │
└──────────────┬─────────────┘
               │ Host clicks "Edit Details"
               ▼
┌────────────────────────────┐
│    Edit Details Modal      │
│  - Updates Firestore doc   │
│  - Instant Live Sync       │
└────────────────────────────┘
```

### Implementation Steps

1. **Card Component in `index.html`**:
   - Replace the narrow `#potluck-event-details` div with a substantial, styled `#event-details-card` section.
   - Include date, address, note fields, and action buttons (`openMaps`, `copyAddress`, `openEditModal`).

2. **Inline Host Edit Modal**:
   - Add a lightweight modal allowing the host to update the event date, venue address, and host message.
   - On submit, call `setDoc(doc(db, 'potlucks', activePotluckId), { ... }, { merge: true })` to persist immediately to Firestore.

3. **Fallback & Default Value Handling**:
   - If a potluck document lacks a custom location, seamlessly default to `3295 Eliot st, United States`.
   - Update printable fridge checklist to also prominently feature the address and date at the top.

4. **Security & Validation**:
   - Update `firebase-blueprint.json` and `firestore.rules` if needed to ensure `location` or `notes` fields validate smoothly with `isValidPotluck`.
   - Ensure non-hosts cannot overwrite the metadata document while allowing guests to read and use the map link.

5. **Testing & Verification**:
   - Verify layout responsiveness across desktop and mobile screens.
   - Verify Google Maps link correctly resolves to `3295 Eliot st, United States`.
   - Verify clipboard copy works seamlessly and displays toast.
   - Verify compilation with `compile_applet` and linting with `lint_applet`.
