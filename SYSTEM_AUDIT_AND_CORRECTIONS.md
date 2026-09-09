# Fine Burger — System Audit & Corrections Specification

**Document Purpose**: This document details all technical corrections, security fixes, logic bug resolutions, and UX refinements required to bring the existing Fine Burger codebase into its most stable, secure, and professional form. No extraneous features or scope creep are included—only perfecting what has already been built.

---

## 1. Critical Security Corrections

### 1.1 Broken Access Control in Firestore Rules
* **File**: `FIREBASE_RULES.txt`
* **Problem**: 
  The current rule allows any authenticated user full read/write access to orders, expenses, and inventory:
  ```javascript
  match /orders/{orderId} {
    allow read, update, delete: if request.auth != null;
  }
  match /expenses/{document=**} {
    allow read, write: if request.auth != null;
  }
  match /inventory/{document=**} {
    allow read, write: if request.auth != null;
  }
  ```
  Because customers can register and log in on the client app, **any registered customer has `request.auth != null`**. This allows regular customers to read all customer addresses and phone numbers, view financial expenses, and delete orders.
* **Correction**:
  Create an `admins` collection in Firestore where only admin UIDs are stored. Update Firestore rules with a helper function:
  ```javascript
  function isAdmin() {
    return request.auth != null && 
      exists(/databases/$(database)/documents/admins/$(request.auth.uid));
  }
  ```
  Protect all sensitive collections (`expenses`, `inventory`, order deletion/updates) using `isAdmin()`.

---

### 1.2 Public Stock Level Manipulation
* **File**: `FIREBASE_RULES.txt` (Lines 12–13)
* **Problem**:
  ```javascript
  allow update: if request.resource.data.diff(resource.data).affectedKeys()
                   .hasOnly(['stockLevel', 'inStock']);
  ```
  Any anonymous internet user can use the Firestore JavaScript client to set any menu item's `stockLevel` to 0 or `inStock` to `false`.
* **Correction**:
  Remove public update permissions from `/items/{itemId}`. Stock deduction must be performed securely server-side via Cloud Functions or restricted to authorized transactions.

---

### 1.3 Insecure Plaintext Staff Mode PIN
* **File**: `client/src/contexts/StaffModeContext.jsx` (Line 15)
* **Problem**:
  ```javascript
  const [staffPin, setStaffPin] = useState('1234');
  ```
  The PIN is hardcoded in the client bundle. Anyone inspecting the code or guessing `1234` can unlock Staff Mode and auto-confirm dine-in orders into the kitchen.
* **Correction**:
  Fetch the staff PIN from the protected `/settings/storeInfo` document in Firestore (or verify it via a Cloud Function) rather than keeping it hardcoded in client state.

---

## 2. Core Architecture & Logic Bug Corrections

### 2.1 Double Stock Deduction on New Orders
* **Files**:
  * Client: `client/src/services/firebase.js` (`createOrder` transaction, lines 75–120)
  * Server: `functions/index.js` (`onOrderCreated` trigger, lines 14–59)
* **Problem**:
  When a customer places an order, the client-side code runs a Firestore transaction that deducts inventory. Once the order document is created, the Firebase Cloud Function `onOrderCreated` triggers and deducts inventory a **second time**. Ordering 2 items reduces inventory by 4.
* **Correction**:
  Consolidate inventory deduction into a single authority:
  * Remove stock deduction from `client/src/services/firebase.js`.
  * Let the server-side Cloud Function `onOrderCreated` handle atomic stock deduction and out-of-stock flagging.

---

### 2.2 Severe Code Duplication in Cloud Functions
* **File**: `functions/index.js`
* **Problem**:
  * `resetRiderPassword` is declared twice (Lines 116–189 and Lines 305–380).
  * `deleteRiderCompletely` is declared twice (Lines 214–294 and Lines 405–489).
  * `generatePassword` is declared twice (Lines 196–203 and Lines 387–394).
* **Correction**:
  Clean up `functions/index.js` to remove all duplicate function declarations, eliminating syntax conflicts and unnecessary deployment overhead.

---

### 2.3 Orphaned Firebase Auth Accounts on Rider Deletion
* **Files**:
  * `admin/src/pages/RiderManager.jsx` (Line 50)
  * `admin/src/services/firebase.js` (`deleteRider`, lines 640–658)
* **Problem**:
  When an admin deletes a rider, the admin panel calls `deleteRider`, which only deletes the Firestore profile. The rider's Firebase Authentication account remains active, preventing the rider's email from ever being re-used and leaving a dangling auth account.
* **Correction**:
  Update `RiderManager.jsx` to call the existing `deleteRiderCompletely` Cloud Function, which deletes both the Firestore profile document and the Firebase Authentication user account in one step.

---

## 3. Admin & Operational Corrections

### 3.1 Audio Alert Collision (Simultaneous Beeping)
* **Files**:
  * `admin/src/App.jsx` (Lines 129–148)
  * `admin/src/pages/OrderManager.jsx` (Lines 381–412)
* **Problem**:
  Both `App.jsx` and `OrderManager.jsx` maintain active subscriptions to `orders` and trigger Web Audio beeps independently. When an order arrives while the admin is viewing the Orders screen, both audio players fire at the exact same moment, causing an abrasive audio clash.
* **Correction**:
  Centralize order sound notifications in `App.jsx` (or a dedicated Audio Notification Provider) and remove the redundant local audio listener inside `OrderManager.jsx`.

---

### 3.2 High Latency & Database Billing in Financial Queries
* **File**: `admin/src/services/firebase.js` (`getTotalRevenue`, lines 51–88)
* **Problem**:
  `getTotalRevenue` executes a full document download of every order in the database and computes the sum using `.reduce()` in browser memory. With thousands of orders, this will cause high Firestore read bills and page freezing.
* **Correction**:
  Replace manual client-side mapping with Firestore's native aggregation query:
  ```javascript
  import { getAggregateFromServer, sum } from 'firebase/firestore';

  const snapshot = await getAggregateFromServer(q, {
    totalRevenue: sum('total')
  });
  return snapshot.data().totalRevenue || 0;
  ```

---

## 4. Customer Experience (UX) Corrections

### 4.1 Order Confirmation & Reference Number Display
* **File**: `client/src/components/Cart.jsx` (Lines 97–109, Lines 115–142)
* **Problem**:
  When an order is submitted, the cart displays a generic "Order Placed!" message for 3 seconds and automatically closes. It never shows the customer their **Order ID**, estimated wait time, or order details. Guests have no record or proof of their order.
* **Correction**:
  Keep the modal/confirmation screen open after order placement until dismissed. Display:
  * Order Reference Number (e.g., `#FB-8A3F`)
  * Order summary and total amount
  * Delivery address or Table number
  * A "Close" button rather than an arbitrary 3-second timeout

---

### 4.2 Missing Required Validation on Item Variations
* **File**: `client/src/components/ItemModal.jsx` (Lines 40–50)
* **Problem**:
  When an item has variations (e.g., size, patty selection), customers can click "Add to Cart" without choosing any option, resulting in incomplete orders sent to the kitchen.
* **Correction**:
  Validate that all variation options are selected before allowing the user to add the item to the cart, highlighting unselected dropdowns with a friendly prompt.

---

### 4.3 Redundant `/menu` Page Wrapper
* **File**: `client/src/pages/Menu.jsx`
* **Problem**:
  The `/menu` route simply renders the full `Home.jsx` component, displaying the large promotional hero slider again instead of focusing directly on the menu items.
* **Correction**:
  Configure `Menu.jsx` to hide the hero slider and auto-focus on the category filters and menu item grid.

---

### 4.4 Default Vite Favicon & Branding
* **File**: `client/index.html` (Line 5)
* **Problem**:
  The browser tab displays the default Vite logo (`/vite.svg`) and basic generic meta tags.
* **Correction**:
  Replace the favicon with a Fine Burger icon and add OpenGraph tags (`og:title`, `og:image`, `og:description`) so links shared on WhatsApp or social media display a professional preview card.

---

## 5. Local Environment Correction (Windows Compatibility)

* **Directory**: `client/node_modules`, `admin/node_modules`, `rider/node_modules`
* **Problem**:
  The `node_modules` directories in this workspace were copied from a macOS environment. The `.bin` directories contain Unix shell scripts and lack Windows `.cmd` wrappers; native Rollup binaries (`@rollup/rollup-win32-x64-msvc`) are missing, preventing Vite from building on Windows.
* **Correction**:
  Re-run clean dependency installation on Windows:
  ```powershell
  # For client
  cd client; Remove-Item -Recurse -Force node_modules, package-lock.json; npm install
  # For admin
  cd ../admin; Remove-Item -Recurse -Force node_modules, package-lock.json; npm install
  # For rider
  cd ../rider; Remove-Item -Recurse -Force node_modules, package-lock.json; npm install
  ```

---

## 6. What Is Needed From You (Database & Environment Setup)

To implement these corrections seamlessly, the following two steps are needed from your side:

1. **Admin UID Identification**:
   * What is the email address or UID of your main admin user in Firebase Authentication?
   * We will add this UID into an `admins` collection in Firestore so that your account is recognized as an authorized administrator under the corrected security rules.

2. **Firebase CLI Deployment**:
   * When we update `FIREBASE_RULES.txt` and `functions/index.js`, we will deploy them using:
     ```bash
     firebase deploy --only firestore:rules
     firebase deploy --only functions
     ```
   * Ensure your terminal is authenticated with your Firebase account via `firebase login`.
