# Quick Setup Guide

## ⚡ Fast Track to Getting Started

### Step 1: Install Node.js
Download and install from [nodejs.org](https://nodejs.org/) (v18 or higher)

### Step 2: Install Dependencies

```bash
# Navigate to project
cd /Users/mac/Documents/GitHub/fineburger

# Install client dependencies
cd client
npm install

# Install admin dependencies
cd ../admin
npm install
```

### Step 3: Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable these services:
   - ✅ Firestore Database
   - ✅ Storage
   - ✅ Authentication (Email/Password)

4. Get your config:
   - Go to Project Settings → General
   - Scroll to "Your apps" → SDK setup and configuration
   - Copy the config object

5. Update `firebase-config.js` in the root directory with your credentials

### Step 4: Configure Firebase Rules

**Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

**Storage Rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Step 5: Create Admin User

1. Firebase Console → Authentication → Users
2. Click "Add User"
3. Enter email and password
4. Save credentials for login

### Step 6: Initialize Settings

In Firestore Database, create a document in `settings` collection:

```json
{
  "storeOpen": true,
  "storeInfo": {
    "name": "Fine Burger",
    "phone": "+1 234 567 890",
    "email": "info@fineburger.com",
    "address": "123 Main Street"
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

### Step 7: Run the Applications

**Terminal 1 - Client Website:**
```bash
cd client
npm run dev
```
Opens at: http://localhost:3000

**Terminal 2 - Admin Panel:**
```bash
cd admin
npm run dev
```
Opens at: http://localhost:3001

### Step 8: First Time Setup

1. Open http://localhost:3001 (Admin Panel)
2. Login with your Firebase credentials
3. Go to "Categories" and add some categories:
   - Burgers
   - Pizza
   - Drinks
   - Sides
4. Go to "Menu Items" and add your first item
5. Go to "Hero Sliders" and add a promotional banner
6. Visit http://localhost:3000 to see your client website!

## 🎯 Common Issues

**"npx: command not found"**
- Install Node.js first

**"Firebase connection error"**
- Check firebase-config.js has correct credentials
- Verify Firebase project is active

**"Login failed"**
- Make sure user exists in Firebase Authentication
- Check email/password are correct

**"Images not uploading"**
- Verify Storage rules are set
- Check file size is under 5MB

## 📚 Next Steps

- Customize colors in `client/src/styles/index.css`
- Add your restaurant's menu items
- Upload your own images
- Configure your operating hours
- Test on mobile devices

## 🆘 Need Help?

Check the full [README.md](file:///Users/mac/Documents/GitHub/fineburger/README.md) for detailed documentation.
