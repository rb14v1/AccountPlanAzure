import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "./layout/MainLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

import UploadPage from "./pages/UploadPage";
import RetrieveChatPage from "./pages/RetrieveChatPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Login */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Redirect root */}
        
        
        {/* Pages */}
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/chat" element={<RetrieveChatPage />} />
        <Route path="/app/*" element={<MainLayout />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
