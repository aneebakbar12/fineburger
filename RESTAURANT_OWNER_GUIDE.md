# Fine Burger — Restaurant Owner Operating Guide

---

## The 3 Portals

| Portal | Who Uses It | URL |
|---|---|---|
| **Customer Site** | Your customers | Your Vercel/Firebase URL |
| **Admin Panel** | You (the owner) | Your admin Vercel URL |
| **Rider App** | Your delivery riders | Your rider Vercel URL |

---

## ADMIN PANEL — Daily Operations

### Logging In
- Go to your admin panel URL
- Login with your email: `aneeb458@gmail.com`
- Use your password

---

### Managing Orders (Most Important)

When a customer places an order, it appears instantly in **Order Manager**.

**Order Status Flow:**
```
Pending → Preparing → Ready / Out for Delivery → Delivered
```

**What to do with each order:**
1. Order arrives → Click **"Accept"** (moves to Preparing)
2. Food is ready → Click **"Ready"** (for dine-in/pickup) OR **"Out for Delivery"** (assign a rider)
3. Customer receives food → Click **"Delivered"**
4. If customer cancels → Click **"Cancel"**

**Assigning a Rider:**
- When you click "Out for Delivery", a dropdown appears
- Select which rider to assign
- The rider sees it instantly on their app

---

### Managing the Menu

#### Adding a New Item
1. Go to **Menu Items** in the sidebar
2. Click **"Add New Item"**
3. Fill in: Name, Price, Category, Description
4. Upload an image (goes to Cloudinary automatically)
5. Toggle **Available** ON
6. Click **Save**

#### Editing an Item
1. Find the item in the list
2. Click the **Edit** (pencil) icon
3. Change what you need
4. Click **Save**

#### Taking an Item Off Menu Temporarily
- Click Edit → Toggle **Available** to OFF → Save
- Item disappears from customer site immediately
- Turn it back ON when available again

#### Marking an Item Out of Stock
- Click Edit → Toggle **In Stock** to OFF → Save
- Customers see "Out of Stock" and cannot add it to cart

#### Deleting an Item
- Click the **Delete** (trash) icon
- Confirm deletion
- ⚠️ This is permanent

---

### Managing Categories

Categories appear as tabs on the customer menu (e.g. Burgers, Drinks, Sides).

1. Go to **Categories** in sidebar
2. Click **"Add Category"**
3. Give it a name and set the order number (1 = appears first)
4. Save

To reorder: Edit each category and change its Order number.

---

### Managing Sliders (Homepage Banners)

The big images that rotate on the homepage.

1. Go to **Slider Manager**
2. Click **"Add Slide"**
3. Upload an image (recommended size: 1920×600px)
4. Add title and subtitle text (optional)
5. Set order number
6. Toggle **Active** ON
7. Save

---

### Store Settings

Go to **Settings** in the sidebar.

**Things you can control:**
- **Store Open/Closed** — Toggle to close the store (customers cannot order)
- **Force Open** — Override operating hours (always open regardless of time)
- **Operating Hours** — Set open/close times for each day of the week
- **Store Name, Phone, Address** — Shown to customers
- **Delivery Fee** — Added automatically to delivery orders
- **Minimum Order** — Minimum amount required to place an order

**To close the store temporarily** (e.g. holiday):
- Settings → Toggle **Store Open** to OFF → Save
- Customers see "Store Closed" and cannot order
- Turn it back ON when you reopen

---

### Managing Riders

Go to **Rider Manager**.

**Adding a New Rider:**
1. Click **"Generate Signup Code"**
2. Share the code with your rider
3. Rider downloads the rider app and signs up using that code
4. Their profile appears in your list once registered
5. You can **Approve** or **Block** them

**Resetting a Rider's Password:**
- Find the rider → Click **"Reset Password"**
- A new password is generated and shown to you
- Share it with the rider

**Removing a Rider:**
- Click **"Delete"** — removes them from auth and database completely

---

### Financial Dashboard

Go to **Financial Dashboard**.

- Shows **Revenue** (from delivered orders), **Expenses**, and **Net Profit**
- Filter by: Today / Week / Month / Year
- Add expenses manually in **Expense Manager**

**To record an expense:**
1. Go to **Expense Manager**
2. Click **"Add Expense"**
3. Enter: Description, Amount, Category, Date
4. Save

---

### Reports

Go to **Reports** for:
- Best-selling items
- Order volume over time
- Revenue charts
- Category performance

---

## RIDER APP — How Your Riders Use It

### First Time Setup
1. Rider gets the signup code from you
2. Opens the rider app URL
3. Clicks **"Sign Up"**
4. Enters name, email, phone, password, and the signup code
5. Logs in — they're ready

### Daily Use
1. Rider opens the app and logs in
2. They see orders assigned to them
3. For each order:
   - **Accept** → they're on their way
   - **Delivered** → marks order complete
4. They can tap the customer's address to open Google Maps

---

## CUSTOMER SITE — How Customers Order

1. Customer visits your site
2. Browses menu by category
3. Clicks an item → Add to Cart
4. Goes to cart → Checkout
5. Fills in: Name, Phone, Address (for delivery) or Table Number (for dine-in)
6. Places order
7. Gets an **Order Reference** (e.g. FB-X7K2)
8. Can track order live at `/track` page

**Customers can also:**
- Create an account to see order history
- Track orders without an account using their order reference

---

## STAFF MODE (POS / In-Restaurant Orders)

For orders placed in-store by your staff:

1. On the customer site, **tap the Fine Burger logo 5 times quickly**
2. Enter the PIN: **ask your developer for the PIN**
3. Staff Mode activates — orders go straight to "Preparing" (no payment needed)
4. Use this for dine-in and walk-in orders placed by your cashier

---

## Quick Reference — Common Situations

| Situation | What to Do |
|---|---|
| New order arrives | Order Manager → Accept → prepare food |
| Item sold out | Menu Items → Edit → Toggle In Stock OFF |
| Closing early today | Settings → Toggle Store Open OFF |
| Rider didn't show up | Order Manager → reassign to another rider |
| Customer asks for order status | Order Manager → search by order reference |
| Want to add a promotion image | Slider Manager → Add Slide |
| Check today's revenue | Financial Dashboard → select "Today" |

---

## Important Notes

- **All changes are live instantly** — no need to refresh customer site
- **Menu images** are stored on Cloudinary (25GB free)
- **Orders, customers, settings** are stored on Firebase (free, unlimited reads)
- **Real-time** — orders appear on your screen the moment a customer places them
- **No app download needed** — everything runs in the browser on any device

---

*For technical issues, contact your developer.*
