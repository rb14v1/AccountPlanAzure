import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "./layout/MainLayout";
import Auth from "./pages/Auth";
import UploadPage from "./pages/UploadPage";
import RetrieveChatPage from "./pages/RetrieveChatPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Auth />} />

        {/* Redirect root */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Protected pages */}
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/chat" element={<RetrieveChatPage />} />
        <Route path="/app/*" element={<MainLayout />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
