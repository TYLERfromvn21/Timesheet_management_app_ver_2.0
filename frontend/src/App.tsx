// frontend/src/App.tsx
// Main application component that sets up routing
// and renders the appropriate views based on the URL.
import React from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes"; 

function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App;