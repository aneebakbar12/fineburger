# Firebase Cloud Functions Setup & Deployment Guide

## Overview
This guide will help you deploy the Firebase Cloud Functions for direct password reset functionality.

## Prerequisites

1. **Firebase Blaze Plan** (Pay-as-you-go)
   - Required for Cloud Functions
   - Very affordable for small usage (first 2M invocations free/month)
   - Upgrade at: https://console.firebase.google.com/project/fineburger-b1d65/usage/details

2. **Node.js** installed (v18 or higher)
   - Check: `node --version`

## Step-by-Step Deployment

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

Verify installation:
```bash
firebase --version
```

### Step 2: Login to Firebase

```bash
firebase login
```

This will open a browser window for authentication.

### Step 3: Initialize Firebase (if not already done)

Navigate to your project root:
```bash
cd /Users/mac/Documents/GitHub/fineburger
```

If you haven't initialized Firebase yet:
```bash
firebase init
```

Select:
- ✅ Functions
- Choose "Use an existing project"
- Select "fineburger-b1d65"
- Choose JavaScript
- Do you want to use ESLint? **No**
- Install dependencies? **Yes**

### Step 4: Install Dependencies

```bash
cd functions
npm install
```

### Step 5: Deploy Cloud Functions

From the project root:
```bash
firebase deploy --only functions
```

This will:
- Upload your Cloud Function code
- Deploy `resetRiderPassword` function
- Provide you with a deployment URL

### Step 6: Verify Deployment

After deployment, you should see output like:
```
✔  functions[resetRiderPassword(us-central1)] Successful create operation.
Function URL (resetRiderPassword(us-central1)): https://us-central1-fineburger-b1d65.cloudfunctions.net/resetRiderPassword
```

### Step 7: Test the Function

1. Go to admin panel
2. Navigate to Rider Management
3. Click "🔄 Reset Password (Direct)" on any rider
4. Confirm the action
5. You should see a modal with the new password

## Troubleshooting

### Error: "Firebase CLI not found"
```bash
npm install -g firebase-tools
```

### Error: "Billing account not configured"
- Go to Firebase Console → Project Settings → Usage and billing
- Upgrade to Blaze plan

### Error: "Permission denied"
- Make sure you're logged in: `firebase login`
- Check you have owner/editor role in Firebase project

### Error: "Function deployment failed"
- Check `functions/index.js` for syntax errors
- Run `npm install` in the `functions/` directory
- Check Firebase Console → Functions for error logs

### Error when calling function from admin panel
- Check browser console for errors
- Verify Firebase Functions is initialized in `firebase-config.js`
- Check that `httpsCallable` is imported correctly

## Viewing Logs

To see function execution logs:
```bash
firebase functions:log
```

Or view in Firebase Console:
https://console.firebase.google.com/project/fineburger-b1d65/functions/logs

## Cost Estimate

Firebase Cloud Functions pricing (Blaze plan):
- First 2,000,000 invocations/month: **FREE**
- After that: $0.40 per million invocations
- 400,000 GB-seconds compute time/month: **FREE**

For a small restaurant with 5 riders and occasional password resets, you'll likely stay within the free tier.

## Files Created

- `/functions/index.js` - Cloud Function code
- `/functions/package.json` - Dependencies
- `/firebase.json` - Firebase configuration
- `/functions/.gitignore` - Git ignore file

## Next Steps

After successful deployment:
1. Test password reset in admin panel
2. Verify new password works in rider app
3. Check that temp password is updated in Firestore

## Support

If you encounter issues:
1. Check Firebase Console logs
2. Verify all files are in place
3. Ensure Firebase Blaze plan is active
4. Check that admin is authenticated when calling function
