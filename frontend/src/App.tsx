// frontend/src/App.tsx
// Main application component that sets up routing
// and renders the appropriate views based on the URL.
import React, { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes"; 
import { useAuthStore } from "./store/authStore";

function App() {
  const checkAuth = useAuthStore(state => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <RouterProvider router={router} />
  );
}

export default App;