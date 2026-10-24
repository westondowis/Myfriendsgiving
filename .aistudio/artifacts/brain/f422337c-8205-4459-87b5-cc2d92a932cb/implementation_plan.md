# Implementation Plan - MyFriendsgiving Multi-Event & Guest Management System

## Overview
Extend MyFriendsgiving into a full-cycle Event & Guest Management system featuring multi-event creation, AI-powered food ledger generation via server-side Gemini API route (`/api/events/ai-generate-ledger`), multi-step RSVP onboarding with named plus-ones (`/invite/[event_id]` or hash route), atomic guest/claim persistence, and one-click SMS invite dispatching.

---

## Proposed Changes

### 1. Backend API & Server Routes (`server.ts`)
- **`POST /api/events/ai-generate-ledger`**: Server-side endpoint using `@google/genai` to generate structured JSON arrays of food and drink items categorized by type (Appetizer, Main, Side, Dessert, Beverage, Supplies) based on event title, description, theme, and estimated attendance.
- **`POST /api/events`**: Create event and initial ledger items in Firestore.
- **`POST /api/rsvp`**: Atomic transaction for guest attendance, plus-ones, and ledger item claims with concurrency safeguards.
- **`GET /api/events/[id]/manifesto`**: Retrieve event details, guest list, plus-ones, and claimed items for admin dashboard.

### 2. Database & Data Models (`firebase-blueprint.json` & Firestore Rules)
- **`Event`**: id, title, description, location, event_date, creator_id, max_guests_per_invitee, max_total_attendees, custom_confirmation_message, created_at.
- **`FoodLedgerItem`**: id, event_id, name, category, quantity_needed, claimed_by_guest_id, is_custom_addition.
- **`Guest`**: id, event_id, name, phone_number, status (`ATTENDING`, `DECLINED`), plus_one_count, created_at.
- **`SecondaryGuest`**: id, primary_guest_id, event_id, name, phone_number.
- **Firestore Security Rules (`firestore.rules`)**: Secure access rules for `events`, `foodLedgerItems`, `guests`, and `secondaryGuests`.

### 3. Frontend UI Components & Views (`index.html` / `src/`)
- **Event Creator & AI Ledger Generator Wizard**:
  - Modal/View for creating events with custom capacity limits, custom post-RSVP confirmation messages, and AI Ledger generator button.
- **Admin Dashboard / Attendance Manifesto**:
  - Central tabular view showing confirmed headcounts, guest details, plus-ones, and claimed items with clipboard export.
- **Public Multi-Step RSVP & Claiming Flow (`/invite/[event_id]`)**:
  - Step 1: Attendance & Plus-One Details with dynamic named inputs.
  - Step 2: Food Feast Ledger selection & claiming or custom addition.
  - Step 3: Confirmation card with custom host message and **One-Click Native SMS Invite Trigger** (`sms:[phone]?body=...`) for each named plus-one.

---

## Verification Plan

### Automated Tests & Linter
- Run `npm run build` and `npm run lint` to verify TypeScript types and bundle compilation.
- Verify server routes start successfully and respond correctly to health and API probes.

### Manual Verification
- Create an event using the Event Builder and test AI Ledger Generation.
- Simulate guest RSVP through the multi-step onboarding and verify real-time Firestore sync and SMS link generation.
