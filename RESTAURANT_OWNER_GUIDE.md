# Fine Burger & Fast Food — Restaurant Owner Operating Guide

*Last updated: 10 September 2026 — all features live, no pending items*

---

## The 3 Portals

| Portal | Who Uses It | Deployed On |
|---|---|---|
| **Customer Site** | Your customers | Vercel |
| **Admin Panel** | You (the owner) | Vercel |
| **Rider App** | Your delivery riders | Vercel |

> All 3 portals are separate URLs on Vercel. Check your Vercel dashboard for the exact links.

---

## System Status — What's Working Right Now

| Feature | Status | Notes |
|---|---|---|
| Customer ordering | ✅ Live | |
| Real-time order alerts in admin | ✅ Live | Sound + browser notification |
| Menu management | ✅ Live | |
| Image uploads (menu & sliders) | ✅ Live | Cloudinary (25GB free) |
| Rider management | ✅ Live | |
| Order tracking for customers | ✅ Live | |
| Financial dashboard | ✅ Live | |
| Staff / POS mode | ✅ Live | |
| Inventory manager | ✅ Live | |
| Stock auto-deduction on order | ✅ Live | Cloud Function |
| Stock restore on cancellation | ✅ Live | Cloud Function |
| Rider delivery stats | ✅ Live | Auto-increments when you click Delivered in admin |
| Rider order alerts | ✅ Live | Instant via Firestore — appears the moment you assign |
| Image uploads (menu & sliders) | ✅ Live | Cloudinary — 25 GB free, no Firebase billing needed |
| Firebase Storage | N/A | Not used — Cloudinary handles all images |

---

## ADMIN PANEL

### Logging In
- Open your Admin Panel URL on any browser (phone, tablet, or laptop)
- Email: `aneeb458@gmail.com`
- Use your password

---

### Managing Orders — Your Daily Task

When a customer places an order it appears instantly on your screen with a **sound alert**.

**Order Status Flow:**
```
Pending → Preparing → Ready / Out for Delivery → Delivered
```

**What to do step by step:**

1. **New order arrives** → You hear the buzzer → Go to Order Manager
2. Click **Accept / Preparing** — kitchen starts working
3. When food is ready:
   - **Dine-in or Pickup** → Click **"Ready"**
   - **Delivery** → Click **"Out for Delivery"** → Select a rider from the dropdown
4. Rider picks up and delivers → Click **"Delivered"** — rider's delivery count updates automatically
5. If a customer cancels → Click **"Cancel"** (stock is automatically restored)

**Searching for an order:**
- Type the Order Reference (e.g. `FB-X7K2`) in the search box to find it instantly

---

### Managing the Menu

#### Adding a New Item
1. Sidebar → **Menu Items** → **"Add New Item"**
2. Fill in: Name, Price, Category, Description
3. Upload an image — it goes to **Cloudinary automatically** (no extra setup needed)
4. Toggle **Available** → ON
5. Click **Save** — appears on customer site immediately

#### Editing an Item
1. Find item → Click the **pencil (edit)** icon
2. Make changes → **Save**

#### Taking an Item Off the Menu Temporarily
- Edit → Toggle **Available** → OFF → Save
- Disappears from customer site instantly
- Turn it back ON when ready

#### Marking Out of Stock
- Edit → Toggle **In Stock** → OFF → Save
- Customers see "Out of Stock" and cannot add it to cart
- Turn back ON when restocked

#### Deleting an Item Permanently
- Click the **trash (delete)** icon → Confirm
- ⚠️ Cannot be undone

---

### Managing Categories

Categories are the tabs on the customer menu (e.g. Burgers, Drinks, Deals).

1. Sidebar → **Categories** → **"Add Category"**
2. Enter name and set the **Order number** (1 = appears first)
3. Save

To reorder categories: Edit each one and change its Order number.

---

### Managing Sliders (Homepage Banners)

The rotating promotional images on the customer homepage.

1. Sidebar → **Slider Manager** → **"Add Slide"**
2. Upload an image (best size: **1920 × 600 px**)
3. Add optional title/subtitle text
4. Set order number
5. Toggle **Active** → ON → Save

To temporarily hide a slide: Edit → Toggle **Active** → OFF.

---

### Store Settings

Sidebar → **Settings**

| Setting | What It Does |
|---|---|
| **Store Open** | Toggle OFF to close the store (customers cannot order) |
| **Force Open** | Override hours — store stays open 24/7 regardless of schedule |
| **Operating Hours** | Set open/close times per day of the week |
| **Delivery Fee** | Auto-added to every delivery order |
| **Minimum Order** | Minimum cart value required to checkout |
| **Staff Mode PIN** | The PIN your waitstaff uses to unlock POS mode (default: `1234`) |
| Store Name, Phone, Address | Shown to customers across the site |

**To close the store for a holiday:**
Settings → Toggle **Store Open** → OFF → Save → reopen when ready.

---

### Managing Riders

Sidebar → **Rider Manager**

#### Adding a New Rider
1. Click **"Generate Signup Code"** — a one-time code is created
2. Share the code with your rider (WhatsApp/message it to them)
3. Rider opens the Rider App URL, clicks **"Sign Up"**, enters their details + the code
4. Their profile appears in your Rider Manager list
5. You can see their status, current orders, and reset their password

#### Resetting a Rider's Password
- Find rider → Click **"Reset Password"**
- A new random password appears — share it with the rider
- They use it to log back in

#### Removing a Rider
- Click **"Delete"** → Confirms removal from both login and database

---

### Inventory Manager

Sidebar → **Inventory Manager**

Track raw materials (chicken, bread, oil, etc.):
- Add ingredients with their unit and current stock quantity
- Stock levels decrease automatically when orders are placed (linked to menu items)
- Get a low-stock warning when quantities fall below your set threshold

---

### Financial Dashboard

Sidebar → **Financial Dashboard**

Shows: Revenue (from delivered orders) | Expenses | Net Profit | Profit Margin

Filter by: **Today / Week / Month / Year**

#### Recording an Expense
1. Sidebar → **Expense Manager** → **"Add Expense"**
2. Enter: Description, Amount (PKR), Category, Date
3. Save — it immediately updates the Financial Dashboard

---

### Reports

Sidebar → **Reports**

- Best-selling menu items
- Order volume by day/week
- Revenue trends
- Category performance charts

---

## RIDER APP — How Your Riders Use It

### First-Time Setup (New Rider)
1. You generate a signup code in Admin → Rider Manager
2. Rider opens the Rider App URL on their phone
3. Clicks **"Sign Up"** — enters name, email, phone, password, and the signup code
4. Logs in — they immediately see any orders assigned to them

### Daily Use
1. Rider logs in at the start of their shift
2. When you assign them an order it appears on their screen instantly
3. For each order:
   - Tap **"Accept"** → heading to pickup
   - Tap the address to open Google Maps navigation
   - After delivering → tap **"Delivered"**
4. The order is marked complete in your admin panel automatically — rider's stats update instantly

---

## CUSTOMER SITE — How Customers Order

1. Customer visits your site URL
2. Browses menu by category (tabs at top)
3. Clicks an item → selects size/extras if any → **Add to Cart**
4. Opens cart → **Checkout**
5. Selects order type:
   - **Delivery** → enters name, phone, address
   - **Dine-in** → enters name, table number
   - **Pickup** → enters name, phone
6. Places order — gets an **Order Reference** like `FB-X7K2`
7. Can track their order live at the **Track Order** page

**Customers can also:**
- Create an account to view order history
- Track without an account using their order reference number
- Enable push notifications on the tracking page for live status updates

---

## STAFF / POS MODE — Taking In-Store Orders

Use this on a tablet at your counter for dine-in and walk-in customers.

**How to activate:**
1. Open the **Customer Site** on a tablet/phone at the counter
2. **Tap the Fine Burger logo 5 times quickly**
3. A PIN box appears — enter: **`1234`** (or whatever you've set in Settings)
4. Staff Mode is now ON

**What changes in Staff Mode:**
- Orders placed go straight to **"Preparing"** (no payment step needed)
- Designed for your cashier/waiter to place orders on behalf of walk-in customers
- Table number field appears for dine-in

**To deactivate:** Refresh the page or tap the logo 5 times again.

**To change the PIN:** Admin Panel → Settings → Staff Mode Dine-In PIN → enter new PIN → Save.

---

## Image Storage — Cloudinary

All menu images and slider banners upload to **Cloudinary** (not Firebase Storage).

- **Free plan:** 25 GB storage, 25 GB bandwidth/month
- No setup needed — already connected
- Images deliver via Cloudinary's global CDN (fast load times worldwide)
- Your Cloudinary account: **diveaqbo** at cloudinary.com

---

## Quick Reference — Common Situations

| Situation | What to Do |
|---|---|
| New order comes in | Order Manager → Accept → Preparing → assign rider → Delivered |
| Item ran out | Menu Items → Edit → Toggle In Stock OFF |
| Closing early today | Settings → Toggle Store Open OFF |
| Rider not responding | Order Manager → edit order → reassign to another rider |
| Customer asks "where is my order?" | Order Manager → search by FB reference → check status |
| Add a promo banner | Slider Manager → Add Slide → upload image → Active ON |
| Check today's earnings | Financial Dashboard → select "Today" |
| Record a supply expense | Expense Manager → Add Expense |
| New rider joining | Rider Manager → Generate Signup Code → share with rider |
| Rider forgot password | Rider Manager → find rider → Reset Password |

---

## Important Notes

- **All changes are live immediately** — no refresh needed on the customer site
- **Real-time orders** — appear on your screen the moment a customer submits
- **No app to install** — admin panel and rider app run in any browser
- **Works on mobile** — admin panel and rider app are mobile-friendly
- **Sound alerts** — new orders play a buzzer in the admin panel (keep the tab open and unmuted)

---

*For technical support, contact your developer.*
