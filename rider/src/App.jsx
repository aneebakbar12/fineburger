import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
        // Initial check on load/login
        const result = await getRiderProfile(currentUser.uid);
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
