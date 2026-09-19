# Fine Burger & Fast Food — Restaurant Presentation & Operating Master Guide

*Client Presentation & Operating Manual — Complete 3-Portal Ecosystem*  
*Prepared for Restaurant Owners & Management (Baghbanpura, Lahore)*

---

## 🌟 Executive Overview: What You Are Presenting Today

You are presenting a complete, custom-built restaurant technology ecosystem designed specifically for **Fine Burger & Fast Food (Since 1981)**. It replaces third-party commissions (like Foodpanda) with a 100% owned digital ordering and kitchen management system.

The system connects three specialized portals running in real time:

| Portal | Intended User | Live Production URL | Key Role |
|:---|:---|:---|:---|
| **1. Customer Portal** | Diners & Online Customers | [https://fineburger.vercel.app/](https://fineburger.vercel.app/) | Menu browsing, live customization, delivery map pinning, instant checkout, and real-time live tracking. |
| **2. Admin & Kitchen Console** | Restaurant Owner, Cashier, Chefs | [https://fineburger-admin.vercel.app/](https://fineburger-admin.vercel.app/) | Kitchen Display System (KDS), buzzer alerts, rider dispatching, 1-click stock toggles, expenses, and profit reports. |
| **3. Rider Delivery App** | Delivery Couriers | [https://finerider.vercel.app/](https://finerider.vercel.app/) | Courier shift toggle, active order alerts, 1-tap WhatsApp/calling, turn-by-turn Google Maps navigation, and cash collection summary. |

---

## 🎬 Step-by-Step Live Demo Script (For Presenting to the Owners)

Follow this exact sequence when you sit down with the owners. It demonstrates the live data flow across all three apps in under 5 minutes:

### Step 1: Open the Portals Side-by-Side
1. **On your laptop**: Open the **Admin Panel** (`https://fineburger-admin.vercel.app/`). Log in (`aneeb458@gmail.com`). Leave the sound on and navigate to **Live Orders**.
2. **On your phone / tablet**: Open the **Customer Website** (`https://fineburger.vercel.app/`).
3. **On a second phone (or mobile browser tab)**: Open the **Rider App** (`https://finerider.vercel.app/`).

---

### Step 2: Show the Customer Ordering Journey
1. **Browse Menu**: Show the owners how clean and fast the menu is. Point out:
   - Categories at the top (Burgers, Special Deals, Pizza'z, Paratha Rolls, Arabian Broast, Fries & Wings).
   - Real PKR pricing and food photography.
2. **Customize an Item**: Tap **Chicken Boti Burger** (or any pizza/burger).
   - Select **"Combo with Fries & Drink (+Rs. 120)"**.
   - Show them how the price updates dynamically from Rs. 370 to Rs. 490.
   - Tap **"Add to Cart"**.
3. **Checkout in Seconds**:
   - Open the Cart drawer.
   - Show the 3 fulfillment methods: **🛵 Delivery**, **🛍️ Takeaway**, or **🍽️ Dine-in**.
   - Select **Delivery** $\rightarrow$ tap **"📍 Pin on Map"** to show the interactive Lahore map with automatic address reverse-geocoding.
   - Enter name and phone (e.g. `0300 1234567`).
   - Tap **Confirm Order**.

---

### Step 3: Show the Instant Kitchen Buzzer & Ticket
1. The moment you place the order on your phone, the **Admin Console** on your laptop will:
   - Play the urgent **520 Hz audio kitchen buzzer**.
   - Show a browser push notification: *"🍔 New Order!"*.
   - Render the ticket at the top of the queue with a permanent reference like **`#FB-X7K2`**.
2. Show the owners the order card:
   - Item breakdown with quantities and selected variations.
   - Customer name, phone, and delivery address.
   - Preparation countdown timer.
3. Click **"Accept & Cook"** $\rightarrow$ status moves to **Cooking**.
4. Show the customer's phone: The live tracking stepper automatically moves to **"In Kitchen"** in real time without refreshing!

---

### Step 4: Show the Kitchen Ready & Rider Dispatch
1. When the kitchen finishes cooking, click **"✨ Mark Ready"**.
2. Select a courier from the **"Select Delivery Rider..."** dropdown $\rightarrow$ click **"🛵 Dispatch Rider"**.
3. Point to the **Rider App**:
   - The rider's phone plays an audio chime and vibrates.
   - Order `#FB-X7K2` appears instantly under **Active Deliveries**.
   - Shows customer address, 1-tap **"🗺️ Open Turn-by-Turn Maps"**, 1-tap **"💬 WhatsApp"**, and the exact bag contents (`1x Chicken Boti Burger (Combo)`).
4. Rider taps **"📦 Picked Up • Start Delivery"** $\rightarrow$ Customer's tracking screen changes to **"On The Way"**.
5. Rider taps **"✅ Mark Delivered & Cash Received"**:
   - Order moves to the rider's Completed list.
   - The rider's **"Cash to Handover"** counter updates (e.g. `Rs. 610`).
   - The Admin console registers the order as completed.

---

### Step 5: Show In-Store POS Mode (For Cashier Counter)
1. On the customer website, tap the **Fine Burger logo 5 times quickly** (or press `Ctrl+Shift+S`).
2. Enter PIN: **`1234`**.
3. Show the owners how this turns the device into an in-store Point of Sale:
   - Counter staff can take walk-in orders in seconds.
   - For **🍽️ Dine-in**: Prompts for **Table Number** (e.g. Table 4).
   - For **🛍️ Takeaway**: Prompts for **Customer Name** (e.g. Ali Ahmed).
   - Tap **"Send to Kitchen"** $\rightarrow$ skips the pending queue and sends the order directly to kitchen prep with a kitchen bell sound!

---

### Step 6: Show Kitchen Display System (KDS Fullscreen)
1. In the Admin **Order Manager**, tap **"📺 Kitchen KDS View"**.
2. Show the owners how the sidebar collapses to display large, high-contrast cooking queue cards designed for kitchen wall tablets.

---

### Step 7: Show 1-Click Inventory / "Sold Out" Control
1. Go to Admin $\rightarrow$ **Menu Management**.
2. Show them how easy it is to handle sold-out items during busy hours:
   - Directly in the table, click the **`● In Stock`** button on any item.
   - It instantly flips to **`○ Sold Out`**.
   - Open the customer site: That burger is now immediately greyed out with an "Out of Stock" badge so customers cannot order it.
   - Click it again $\rightarrow$ instantly active again!

---

### Step 8: Show Reports & Financial Dashboard
1. Go to Admin $\rightarrow$ **Financial Dashboard**:
   - Revenue from delivered orders.
   - Total recorded supply expenses (meat, oil, packaging).
   - True net profit and profit margins.
2. Go to **Reports**:
   - Best-selling menu items.
   - Trailing 7-day and monthly sales revenue trend charts.

---

## 📖 Complete Feature Reference & How Everything is Managed

### 1. Customer Ordering Portal (`client/`)
- **Category Navigation**: Horizontal scrolling category pill bar (Burgers, Special Deals, Pizza'z, Paratha Rolls, etc.) with auto-scroll to category sections.
- **Product Customization**: Dynamic sizes (Small, Medium, Large) and add-ons (extra cheese, mayo dip, combo upgrades) that calculate exact PKR totals in real time.
- **Multi-Channel Fulfillment**:
  - **🛵 Delivery**: Customer provides delivery address or pins their exact house on the Leaflet map. Adds the configured delivery fee automatically.
  - **🛍️ Takeaway**: Customer enters their name and phone. Delivery fee is automatically set to Rs. 0.
  - **🍽️ Dine-in**: Customer enters their table number. Delivery fee is automatically set to Rs. 0.
- **Pakistani Phone Validation**: Enforces standard Pakistani mobile formats (`03XX XXXXXXX` or `+92 3XX XXXXXXX`).
- **Live Order Tracking (`/track-order/:orderId`)**:
  - Step-by-step progress: *Order Received $\rightarrow$ In Kitchen $\rightarrow$ On The Way $\rightarrow$ Delivered*.
  - Push notification alerts on status updates.
  - Direct WhatsApp link pre-filled with the order reference.
  - Recent order memory so guest customers can track previous orders anytime.
- **Staff / POS Mode**: Hidden activation (5 logo taps or `Ctrl+Shift+S`) protected by a 4-digit PIN (`1234`).

---

### 2. Restaurant Admin Console (`admin/`)
- **Live Order Queue**:
  - Orders categorized by tabs: *All, Pending, Cooking, Ready, In Transit, Delivered, Cancelled*.
  - Permanent `#FB-XXXX` order references that never shift when new tickets arrive.
  - Real-time search by order reference, customer name, phone number, or table number.
  - Audio buzzer alerts (synthesized Web Audio, no external audio file dependencies).
- **Kitchen Display System (KDS)**:
  - 1-click full-screen mode for kitchen tablets.
  - Preparation countdown timers showing elapsed cooking time.
- **Thermal Receipt Printing**:
  - Prints clean 58mm / 80mm ESC/POS receipts formatted for thermal receipt printers.
- **Menu Management**:
  - Full CRUD: Add item, edit item, delete item.
  - 1-click instant `In Stock` / `Sold Out` table toggle.
  - Automatic image uploads to Cloudinary CDN (no storage fees).
  - Categorization and sorting.
- **Slider Management**:
  - Add, edit, reorder, or temporarily hide homepage promotional banners.
- **Store Settings**:
  - **Store is Open** switch: 1-click master switch to pause taking orders.
  - **Force Store Open (24/7)**: Override schedule so the restaurant stays open 24/7.
  - **Weekly Operating Hours**: Chronologically ordered Monday through Sunday, supporting overnight shifts (e.g. 5:00 PM to 3:00 AM).
  - **Delivery Fee**: Configurable base fee added to all delivery orders.
  - **Staff PIN**: Change the waitstaff POS PIN anytime.
- **Rider Fleet Management**:
  - Live `🟢 On Duty` / `⚪ Offline` courier presence badges.
  - Active delivery count and total deliveries per courier.
  - Single-use signup code generator for secure courier onboarding.
  - Password reset link dispatch.
- **Finance & Expenses**:
  - Log daily operational expenses (poultry, vegetables, dairy, oil, packaging, utilities).
  - Real-time financial dashboard computing net profit and margins.
  - Exportable reports on top-selling items and sales volume.

---

### 3. Rider Delivery Portal (`rider/`)
- **Mobile-First Interface**: Designed specifically for smartphone screens mounted on delivery motorcycles.
- **Duty Toggle**: Couriers tap `Go Online` when starting their shift so the kitchen knows they are available.
- **Active Order Alerts**: Device vibration and audio chime when a new delivery is dispatched.
- **Bag Verification**: Courier sees the full item list and selected variations on the card to verify the order before leaving the restaurant.
- **One-Tap Customer Contact**:
  - 📞 Direct phone call.
  - 💬 WhatsApp message automatically sanitized with Pakistani international country code (`923...`).
  - 🗺️ Turn-by-turn Google Maps navigation intent.
- **Shift Cash Reconciliation**: Real-time summary showing total cash on delivery collected that must be handed over to the cashier at shift end.
- **Outdoor Daylight Mode**: 1-tap `☀️ Sun / 🌙 Night` high-contrast theme switch for readability under direct midday Pakistani sunlight.

---

## 🔒 Security & Data Architecture

1. **Firestore Database Rules**:
   - Public users can browse menu items, categories, and slider banners.
   - Public users can create orders and look up their own individual order receipts using their order reference.
   - Only authorized administrators (`aneeb458@gmail.com`) can modify menu items, categories, store settings, or view expenses.
   - Delivery couriers can only update the delivery status of orders assigned directly to their rider account.
2. **Cloudinary Media Storage**:
   - All menu photos and marketing banners upload to Cloudinary CDN under folder `fineburger/`.
   - 25 GB free storage and global CDN delivery ensures fast loading on mobile networks.
3. **No Database Index Pitfalls**:
   - Sorting for categories, banners, and signup codes is performed safely in-memory, avoiding missing Firestore index errors.

---

## 🛠️ Owner Cheat Sheet (Print or Share with Owner)

| Task | Where to Go in Admin | What to Do |
|:---|:---|:---|
| **Take a Counter Order** | Open Customer Site $\rightarrow$ Tap Logo 5 times $\rightarrow$ PIN `1234` | Select Dine-in or Takeaway $\rightarrow$ Add items $\rightarrow$ "Send to Kitchen" |
| **New Order Arrives** | Admin $\rightarrow$ **Live Orders** | Hear buzzer $\rightarrow$ Click **"Accept & Cook"** |
| **Food is Ready** | Admin $\rightarrow$ **Live Orders** | Click **"Mark Ready"** |
| **Dispatch a Courier** | Admin $\rightarrow$ **Live Orders** (Ready tab) | Pick rider from dropdown $\rightarrow$ Click **"Dispatch Rider"** |
| **Complete Takeaway** | Admin $\rightarrow$ **Live Orders** | Click **"✓ Hand Over / Paid"** |
| **Mark an Item Sold Out** | Admin $\rightarrow$ **Menu Items** | Click the green **"● In Stock"** button on that row $\rightarrow$ Turns red **"○ Sold Out"** |
| **Close Store Early** | Admin $\rightarrow$ **Settings** | Uncheck **"Store is Open"** $\rightarrow$ Click **Save Settings** |
| **Onboard a New Rider** | Admin $\rightarrow$ **Rider Management** | Click **"Generate Signup Code"** $\rightarrow$ WhatsApp code to rider |
| **Record a Supply Expense** | Admin $\rightarrow$ **Expense Manager** | Click **"Add Expense"** $\rightarrow$ Enter amount & description $\rightarrow$ Save |
| **Check Today's Profit** | Admin $\rightarrow$ **Financial Dashboard** | View live Gross Revenue, Total Expenses, and Net Profit |

---

*Fine Burger Restaurant Ecosystem is fully compiled, verified, and live on Vercel.*
