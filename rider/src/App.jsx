import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import { onAuthChange, getRiderProfile, logoutRider, subscribeToRiderProfile } from './firebase'; // Added subscribeToRiderProfile
import './index.css';
import './App.css';


function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthChange(async (currentUser) => {
      if (currentUser) {
        // Check if this is a newly created account (within last 30 seconds)
        const accountAge = Date.now() - new Date(currentUser.metadata.creationTime).getTime();
        const isNewAccount = accountAge < 30000; // 30 seconds

        // For new accounts, retry profile check with delays to allow Firestore write to complete
        let result;
        if (isNewAccount) {
          console.log("New account detected, retrying profile check...");
          let retries = 5;
          while (retries > 0) {
            result = await getRiderProfile(currentUser.uid);
            if (result.success) break;

            // Wait before retry (exponential backoff: 500ms, 1s, 1.5s, 2s, 2.5s)
            await new Promise(resolve => setTimeout(resolve, (6 - retries) * 500));
            retries--;
          }
        } else {
          // Existing account - single check
          result = await getRiderProfile(currentUser.uid);
        }

        if (result.success) {
          setUser(currentUser);
        } else {
          console.log("Rider profile not found, logging out...");
          await logoutRider();
          setUser(null);
          alert("Your account access has been revoked.");
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Monitor Profile Existence (Real-time)
  useEffect(() => {
    if (user) {
      const unsubscribeProfile = subscribeToRiderProfile(
        user.uid,
        (profile) => {
          // Profile updated, can update local state if needed
        },
        async () => {
          // Profile deleted
          console.log("Rider profile deleted, logging out...");
          await logoutRider();
          setUser(null);
          alert("Your account has been deactivated by the admin.");
        }
      );
      return () => unsubscribeProfile && unsubscribeProfile();
    }
  }, [user]);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route
          path="/signup"
          element={!user ? <Signup /> : <Navigate to="/" />}
        />
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/" />}
        />
        <Route
          path="/"
          element={user ? <Dashboard /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
