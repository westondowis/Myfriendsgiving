# Google Host Authentication & Zero-Login Guest Feast Ledger

Provide a seamless dual-tier Friendsgiving coordination platform where hosts authenticate with Google to create and govern potlucks, while guests access and claim items instantly via direct share links with zero login friction.

## User Review & Critical Decisions

> [!IMPORTANT]
> - **Dual Access Architecture**: The potluck owner signs in securely with Google to establish and manage the event. Guests receiving the link bypass authentication entirely and can immediately claim dishes.
> - **Direct Firestore Realtime Streaming**: Replaces unstable mock REST endpoints with direct Firebase Firestore real-time snapshot listeners (`onSnapshot`) tied to the provisioned database (`ai-studio-feastledger-f422337c-8205-4459-87b5-cc2d92a932cb`), guaranteeing persistent data that never vanishes on page refresh.

- **Host Capabilities**: Google Sign-In with popup, potluck creation, event title/notes, master claim overview, direct link generation, and dish deletion.
- **Guest Capabilities**: Zero-login view of the live ledger, 2-step claiming ("Claim This" modal with confirmation), "Bring Something Else" wildcard dish addition, and safe dish unclaim option.
- **Initial Menu**: Auto-populates the 14 curated traditional Thanksgiving items upon potluck creation.

---

## 1. Overview & Core Concept

- **What It Does**: Allows hosts to sign in with their Google account to create a Thanksgiving potluck feast. The app generates a permanent direct link (e.g. `?potluck=<POTLUCK_ID>`) that the host texts or emails to friends. Friends open the link on their mobile phones with **no account or password**, view the live dishes, and lock in what they are bringing. All claims sync live across all screens in real time.
- **Target Audience**: Potluck hosts who want centralized ownership and guests who want zero-login claiming on their smartphones.
- **Key Value**: Solves data disappearance on refresh by utilizing authenticated, persistent Firestore documents while maintaining friction-free coordination for guests.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Host Flow (Google Sign-In & Potluck Creation)**:
   - Host clicks **"Host a Feast"** or **"Sign in with Google"** in the top navigation.
   - A standard Google Auth popup authenticates the host.
   - Host enters a Potluck Title (e.g., *"The Miller Friendsgiving 2026"*), date, and optional host notes.
   - Clicking **"Create Feast"** provisions the potluck record and seeds the 14 curated Thanksgiving dishes in Firestore.
   - Host receives a 1-click **"Copy Guest Link"** button to share with guests.

2. **Guest Flow (Zero Login Direct Claiming)**:
   - Guest opens the shared URL on their phone (`?potluck=xyz`).
   - The screen instantly streams the live feast status and dish cards without asking for any login.
   - Tapping **"Claim This"** opens a compact modal:
     - Field: Guest Name / Family (required)
     - Checkbox: *"I confirm I am bringing this dish and will feed the feast!"* (required)
     - Action: *"Lock It In 🦃"*
   - The row immediately switches to **Locked In** displaying `Claimed by [Guest Name]` with a warm amber badge.
   - Confetti celebration bursts, and the claim is persisted directly to Firestore.

3. **Wildcard / "Bringing Something Else?" Flow**:
   - Guests can add family traditions or specialty beverages using the inline form at the bottom.
   - Writes directly to the potluck's dish list and streams to all active guests.

### Visual Identity & Theme

- **Palette**: Deep terracotta (`#8C3A27`), burnt amber (`#C25927`), warm cream canvas (`#FAF6F0`), dark walnut text (`#2C1E16`), and sage green (`#526650`).
- **Claimed Badge**: Soft harvest-gold pill (`#FEF3C7` with `#92400E` text) with a lock icon.
- **Typography**: Editorial serif headers (`Fraunces`) paired with clean body typography (`Plus Jakarta Sans`).
- **Header Elements**: Active counter pill showing `[X] of [Total] items covered` and a progress bar that fills as dishes are claimed.
- **Host Controls**: A clean top drawer/badge showing the signed-in host profile avatar and name with a link to create/switch feasts.

---

## 3. Key Product Decisions & Trade-Offs

- **Firestore vs. Mock REST Bin / LocalStorage**:
  - *Chosen Approach*: Firebase Firestore via the provisioned database instance.
  - *Why*: Eliminates data loss, network rate limits, and cross-device sync failures. Firestore provides native WebSockets for instant updates across mobile devices.
- **Host Google Auth vs. Guest Zero-Auth**:
  - *Chosen Approach*: Require Google Auth *only* for the event creator/host; allow public unauthenticated reads and claims on the shared potluck document.
  - *Why*: Maximizes guest participation (no one drops off because of forgotten passwords) while giving the host authenticated authority over event creation and management.
- **Single Root `index.html` Delivery**:
  - *Chosen Approach*: Retain self-contained architecture inside `index.html` using Firebase CDN modules and Tailwind CDN so the application runs immediately without build friction.

---

## 4. Technical Architecture & Data Strategy

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                       │
│  ┌───────────────────────┐   ┌───────────────────────┐  │
│  │   Host Dashboard      │   │   Guest Ledger View   │  │
│  │ (Google Authenticated)│   │     (Zero Login)      │  │
│  └───────────┬───────────┘   └───────────┬───────────┘  │
└──────────────┼───────────────────────────┼──────────────┘
               │                           │
               ▼                           ▼
┌─────────────────────────────────────────────────────────┐
│              Firebase Authentication & SDK              │
│       - GoogleAuthProvider / signInWithPopup            │
│       - onAuthStateChanged state listener               │
└──────────────────────────────┬──────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────┐
│              Cloud Firestore (Real-Time)                │
│                                                         │
│  /potlucks/{potluckId}                                  │
│     ├── title: "Friendsgiving 2026"                     │
│     ├── ownerId: "uid_123"                              │
│     ├── ownerName: "Jordan Miller"                      │
│     ├── ownerEmail: "jordan@gmail.com"                  │
│     └── createdAt: timestamp                            │
│                                                         │
│  /potlucks/{potluckId}/dishes/{dishId}                  │
│     ├── id: "dish-1"                                    │
│     ├── name: "Roast Turkey / Main Protein"             │
│     ├── emoji: "🦃"                                     │
│     ├── order: 1                                        │
│     ├── isCustom: false                                 │
│     ├── claimedBy: "Sarah & Mike"                       │
│     └── claimedAt: "2026-10-19T..."                     │
└─────────────────────────────────────────────────────────┘
```

### Firestore Security Rules

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /potlucks/{potluckId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && resource.data.ownerId == request.auth.uid;
    }
    match /potlucks/{potluckId}/dishes/{dishId} {
      allow read: if true;
      allow create, update: if true;
      allow delete: if request.auth != null || resource.data.isCustom == true;
    }
  }
}
```

### Key Sequences

1. **Host Signs In**: `signInWithPopup(auth, provider)` sets current user.
2. **Host Creates Potluck**: Adds `/potlucks/{potluckId}` document and batch-seeds the 14 default items into the subcollection.
3. **Guest Views**: Reads `potluckId` from URL query string (`?potluck=...`). If none exists, either shows the host creation screen or loads the default community feast.
4. **Live Stream**: `onSnapshot(collection(db, 'potlucks', potluckId, 'dishes'), ...)` pushes live updates to the UI within milliseconds of any claim.
5. **Guest Claims**: `updateDoc(doc(db, 'potlucks', potluckId, 'dishes', dishId), { claimedBy, claimedAt })`.
