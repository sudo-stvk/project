import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import "./styles/tokens.css";
import "./styles/app.css";
const router = createBrowserRouter([
  {
    path: "*",
    element: (
      <AppProvider>
        <App />
      </AppProvider>
    ),
  },
]);
ReactDOM.createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />,
);
