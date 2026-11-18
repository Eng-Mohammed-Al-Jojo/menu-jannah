import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { ThemeProvider } from "./context/ThemeContext";
import { OrderSystemProvider } from "./context/OrderSystemContext";
import "./i18n";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <OrderSystemProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </OrderSystemProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
