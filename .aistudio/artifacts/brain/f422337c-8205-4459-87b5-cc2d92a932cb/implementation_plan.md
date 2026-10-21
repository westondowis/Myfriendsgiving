# Additive Menu Expansion: Apple Pie, Pecan Pie & Holiday Drinks

Seamlessly add separate **Apple Pie**, **Pecan Pie**, and **Holiday Drinks (e.g., Hot Toddies / Mulled Wine)** to the main items list while strictly preserving all existing claims, guest assignments, and custom dishes in the live ledger.

## User Review & Critical Decisions

> [!IMPORTANT]
> - **Non-Destructive Additive Strategy**: No existing dish documents in Firestore will be overwritten, modified, or deleted. Any existing claim (including claims on the original combined *"Apple Pie or Pecan Pie"* or *"Beverages"*) will remain 100% intact with the guest's name and timestamp preserved.
> - **Confirmed Choices**:
>   1. Existing combined claims are kept intact; **Apple Pie** and **Pecan Pie** are introduced as distinct new claimable items.
>   2. General beverages are preserved, and **Holiday Drinks (e.g., Hot Toddies)** is added as a dedicated specialty beverage category.

---

## 1. Overview & Core Concept

- **What It Does**: Expands the main Thanksgiving checklist by introducing dedicated entries for **Apple Pie**, **Pecan Pie**, and **Holiday Drinks (e.g., Hot Toddies / Mulled Wine)**.
- **Data Safety Guarantee**: When an existing feast is opened, an additive sync routine checks which new items are absent and writes only the missing items as available slots. All existing guest claims remain completely undisturbed.
- **Target Experience**: Guests visiting the feast link immediately see the new open slots ready to be claimed alongside previously claimed dishes.

---

## 2. User Experience & Visual Design

### Updated Core Checklist
The feast items will include:
1. Roast Turkey / Main Protein 🦃
2. Green Bean Casserole 🥬
3. Traditional Stuffing / Dressing 🍞
4. Mashed Potatoes & Gravy 🥔
5. Cranberry Sauce 🫐
6. Sweet Potato Casserole 🍠
7. Fresh Dinner Rolls & Butter 🥖
8. Macaroni & Cheese 🧀
9. Roasted Fall Vegetables 🥕
10. Pumpkin Pie & Whipped Cream 🎃
11. Traditional Apple Pie or Pecan Pie *(Preserved if previously claimed)* 🥧
12. **Apple Pie** *(New dedicated item)* 🍏🥧
13. **Pecan Pie** *(New dedicated item)* 🍂🥧
14. Beverages / Wine / Cider 🍷
15. **Holiday Drinks (e.g., Hot Toddies / Mulled Wine)** *(New dedicated specialty drinks)* ☕🍹
16. Appetizer / Charcuterie Board 🍇
17. Ice & Disposable Tableware 🧊

### UI & Counter Updates
- **Progress Counter**: Dynamically computes the total active items and claimed count so the progress bar smoothly recalibrates (`[X] of [Total] items covered`).
- **Claiming Flow**: Tapping *"Claim This"* on Apple Pie, Pecan Pie, or Holiday Drinks opens the standard 2-step confirmation modal and locks it in via real-time Firestore sync.
- **Fridge Print Checklist**: Automatically includes the new items in the printed refrigerator coordination view.

---

## 3. Technical Architecture & Data Strategy

### System Interaction Diagram

```
┌────────────────────────────────────────────────────────┐
│                   Active Potluck                       │
│             /potlucks/{potluckId}/dishes               │
├────────────────────────────────────────────────────────┤
│ Existing Dishes (Preserved Unchanged):                 │
│  ├── dish-1 (Roast Turkey)         -> [Claimed/Open]   │
│  ├── ...                                               │
│  └── custom-* (Custom Dishes)      -> [Preserved]      │
├────────────────────────────────────────────────────────┤
│ Additive Insertion (Only If Missing):                  │
│  ├── dish-apple-pie       -> "Apple Pie" (Open)        │
│  ├── dish-pecan-pie       -> "Pecan Pie" (Open)        │
│  └── dish-holiday-drinks  -> "Holiday Drinks" (Open)   │
└────────────────────────────────────────────────────────┘
```

### Implementation Steps

1. **Update `DEFAULT_ITEMS` Template (`index.html`)**:
   - Add discrete definitions:
     - `{ id: "dish-apple-pie", name: "Apple Pie", emoji: "🥧", order: 11, isCustom: false }`
     - `{ id: "dish-pecan-pie", name: "Pecan Pie", emoji: "🥧", order: 12, isCustom: false }`
     - `{ id: "dish-holiday-drinks", name: "Holiday Drinks (e.g., Hot Toddies / Mulled Wine)", emoji: "☕", order: 14, isCustom: false }`
   - Adjust ordering so items group logically (proteins -> sides -> breads -> pies/desserts -> beverages -> supplies).

2. **Additive Firestore Sync (`ensureNewItemsExist`)**:
   - Inside `loadPotluck()`, after fetching existing dishes from Firestore:
   - Identify which of the new items are not yet in the active potluck's documents.
   - For each missing item, call `setDoc(doc(db, 'potlucks', potluckId, 'dishes', item.id), item)` with `claimedBy: null`.
   - **Crucial Rule**: Never perform a batch delete, clear, or overwrite of existing documents. Existing documents and their `claimedBy` / `claimedAt` fields are untouched.

3. **Verify Security Rules & Blueprint**:
   - The current `firestore.rules` already permits `create` and `update` for valid dish schemas on `/potlucks/{potluckId}/dishes/{dishId}`.
   - The new item IDs match `isValidId` (`^[a-zA-Z0-9_\-]+$`) and adhere strictly to `isValidDish`.

4. **Testing & Verification**:
   - Verify that all previously claimed items retain their claims on browser refresh.
   - Verify that Apple Pie, Pecan Pie, and Holiday Drinks appear as open slots and can be claimed with real-time sync.
   - Confirm compilation and linting pass with zero errors.
