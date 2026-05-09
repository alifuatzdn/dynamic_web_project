
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainPage from "./pages/MainPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import FlightDetailPage from "./pages/FlightDetailPage";
import BookingConfirmationPage from "./pages/BookingConfirmationPage";
import './styles/global.css';

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/flight/:id" element={<FlightDetailPage />} />
        <Route path="/confirmation" element={<BookingConfirmationPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
