# Fine Burger - Restaurant Web Application

A complete dual-webapp system for restaurant management with a client-facing website and admin inventory management panel.

## 🌟 Features

### Client Website
- **Modern Dark Theme** - Inspired by Ranchers Cafe design
- **Hero Slider** - Auto-playing promotional banners
- **Menu Display** - Categorized menu with beautiful product cards
- **Item Customization** - Modal with variations and quantity selection
- **Shopping Cart** - Full cart functionality with item management
- **Real-time Updates** - Instant sync with admin changes via Firebase
- **Responsive Design** - Works perfectly on all devices
- **Store Status** - Shows operating hours and availability

### Admin Panel
- **Dashboard** - Overview with statistics and quick actions
- **Category Management** - Add, edit, delete, and reorder categories
- **Menu Item Management** - Full CRUD with image upload and variations
- **Inventory Tracking** - Stock level management and low stock alerts
- **Hero Slider Management** - Upload and manage homepage sliders
- **Settings** - Configure store hours, contact info, and status
- **Firebase Authentication** - Secure admin access

## 🚀 Getting Started

### Prerequisites

1. **Node.js** (v18 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version` and `npm --version`

2. **Firebase Project**
   - Create a project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore Database
   - Enable Firebase Storage
   - Enable Firebase Authentication (Email/Password)

### Installation

1. **Install Dependencies**

```bash
# Install client dependencies
cd client
npm install

# Install admin dependencies
cd ../admin
npm install
```

2. **Configure Firebase**

Edit `firebase-config.js` in the root directory with your Firebase credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

Get these values from:
Firebase Console → Project Settings → General → Your apps → SDK setup and configuration

3. **Set up Firebase Security Rules**

**Firestore Rules** (Firebase Console → Firestore Database → Rules):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /categories/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /items/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /settings/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /sliders/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

**Storage Rules** (Firebase Console → Storage → Rules):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /menu-images/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /sliders/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

4. **Create Admin User**

Go to Firebase Console → Authentication → Users → Add User
- Email: your-admin@email.com
- Password: your-secure-password

5. **Initialize Firestore Collections**

In Firebase Console → Firestore Database, create a document in the `settings` collection:

```json
{
  "storeOpen": true,
  "storeInfo": {
    "name": "Fine Burger",
    "phone": "+1 234 567 890",
    "email": "info@fineburger.com",
    "address": "123 Main Street, City"
  },
  "operatingHours": {
    "monday": { "open": "10:00", "close": "22:00" },
    "tuesday": { "open": "10:00", "close": "22:00" },
    "wednesday": { "open": "10:00", "close": "22:00" },
    "thursday": { "open": "10:00", "close": "22:00" },
    "friday": { "open": "10:00", "close": "22:00" },
    "saturday": { "open": "11:00", "close": "23:00" },
    "sunday": { "open": "11:00", "close": "23:00" }
  }
}
```

### Running the Applications

**Client Website** (Port 3000):
```bash
cd client
npm run dev
```
Open http://localhost:3000

**Admin Panel** (Port 3001):
```bash
cd admin
npm run dev
```
Open http://localhost:3001

## 📖 Usage Guide

### Admin Panel Workflow

1. **Login** - Use your Firebase admin credentials
2. **Add Categories** - Create menu categories (e.g., Burgers, Pizza, Drinks)
3. **Add Menu Items** - Upload items with images, prices, and variations
4. **Manage Inventory** - Update stock levels and availability
5. **Configure Settings** - Set operating hours and store information
6. **Add Hero Sliders** - Upload promotional banners for homepage

### Client Website Features

- Browse menu by category
- Click items to see details and customization options
- Add items to cart with selected variations
- View cart and adjust quantities
- See real-time availability based on admin settings

## 🗂️ Project Structure

```
fineburger/
├── client/                 # Customer-facing website
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # Firebase integration
│   │   └── styles/        # CSS files
│   └── package.json
│
├── admin/                  # Admin panel
│   ├── src/
│   │   ├── components/    # Admin components
│   │   ├── pages/         # Admin pages
│   │   ├── services/      # Firebase integration
│   │   └── styles/        # CSS files
│   └── package.json
│
└── firebase-config.js      # Shared Firebase config
```

## 🎨 Customization

### Colors
Edit CSS custom properties in `client/src/styles/index.css`:
```css
:root {
  --color-accent: #FFB400;  /* Change accent color */
  --color-black: #000000;   /* Background color */
}
```

### Restaurant Name
Update in:
- `client/src/components/Header.jsx`
- `admin/src/components/Sidebar.jsx`
- Firebase settings collection

## 🔧 Troubleshooting

**Firebase Connection Issues:**
- Verify firebase-config.js has correct credentials
- Check Firebase project is active
- Ensure billing is enabled for Storage

**Admin Login Fails:**
- Verify user exists in Firebase Authentication
- Check email/password are correct
- Ensure Authentication is enabled in Firebase

**Images Not Uploading:**
- Check Storage rules are set correctly
- Verify Storage is enabled in Firebase
- Ensure file size is under 5MB

## 📝 License

This project is open source and available for personal and commercial use.

## 🤝 Support

For issues or questions, please create an issue in the repository.

---

Built with ❤️ using React, Firebase, and Vite
