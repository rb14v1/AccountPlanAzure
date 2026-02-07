// src/Components/ChatPage.tsx

import React, { useState } from "react";
import { Box, TextField, Button, IconButton } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import api from "../api/axios";
import { PRIMARY_TEAL } from "../components/constants";
import type { Message } from "../components/constants";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import PromptModal from "../components/PromptModal";
import { useData } from "../context/DataContext";

const ALLOWED_TEMPLATES = [
  "growth_strategy",
  "strategic_partnerships",
  "account_team_pod",
  "service_line_growth",
  "operational_excellence",
  "service_line_penetration",
  "customer_profile",
  "investment_plan",
  "account_dashboard",
] as const;

const RetrieveChatPage: React.FC = () => {
  const { setGlobalData } = useData();
  const [input, setInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const navigate = useNavigate();

  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [activePrompt, setActivePrompt] = useState<any>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const textInputRef = React.useRef<HTMLInputElement>(null);

  // --- helpers ---
  const toDisplayText = (val: any): string => {
    if (val === null || val === undefined) return "";
    if (typeof val === "string") return val;
    // axios may parse JSON automatically → object/array
    try {
      return JSON.stringify(val, null, 2);
    } catch {
      return String(val);
    }
  };

  // --- Handlers ---
  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setSelectedFile(null);
  };

  const handleCardClick = (promptObj: any) => {
    setActivePrompt(promptObj);
    setOpenModal(true);
  };

  const handleModalSubmit = (finalText: string) => {
    setInput(finalText);
    setOpenModal(false);
    setTimeout(() => {
      if (textInputRef.current) {
        textInputRef.current.focus();
      }
    }, 100);
  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim() && !selectedFile) return;

    const fileName = selectedFile ? selectedFile.name : undefined;

    

    // --- UI UPDATE (Show User Message) ---
    const newUserMsg: Message = {
      id: crypto.randomUUID(),
      text: textToSend,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      attachment: fileName,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInput("");
    setSelectedFile(null);
    setIsTyping(true);

    try {
      // ✅ If user types: "<template_name> <company_name>"
      const parts = textToSend.trim().split(/\s+/);
      const maybeTemplate = parts[0] || "";
      const companyName = parts.slice(1).join(" ").trim();

      if ((ALLOWED_TEMPLATES as readonly string[]).includes(maybeTemplate) && companyName) {
        const fillRes = await api.post("/template/fill", {
          user_id: "101",
          template_name: maybeTemplate,
          company_name: companyName,
        });

        const parsedData = fillRes.data;

        if (parsedData?.template_type) {
          setGlobalData((prev: any) => ({
            ...prev,
            [parsedData.template_type]: parsedData.data,
          }));
        }

        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          text: `✅ Filled template "${maybeTemplate}" for "${companyName}".`,
          sender: "bot",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setIsTyping(false);
        return;
      }

      // --- Normal Chat ---
      const response = await api.post("/chat", {
        user_id: "101",
        query: textToSend,
      });

      // IMPORTANT: response.data can be STRING or OBJECT
      const respData = response.data;

        // ✅ NEW: backend returns { message, payload }
        if (respData && typeof respData === "object" && respData.message) {
          const messageText = String(respData.message || "");

          const payload = respData.payload;
          if (payload?.template_type && payload?.data) {
            setGlobalData((prev: any) => ({
              ...prev,
              [payload.template_type]: payload.data,
            }));
          }

          const botResponse: Message = {
            id: crypto.randomUUID(),
            text: messageText,
            sender: "bot",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };

          setMessages((prev) => [...prev, botResponse]);
          setIsTyping(false);
          return;
        }


      // Existing header based logic (keep, but safe)
      const templateDataHeader = response.headers["x-template-data"];
      const templateTypeHeader = response.headers["x-template-type"];

      if (templateDataHeader && templateTypeHeader) {
        try {
          const parsedHeader = JSON.parse(templateDataHeader);
          setGlobalData((prev: any) => ({
            ...prev,
            [parsedHeader.template_type]: parsedHeader.data,
          }));
        } catch (err) {
          console.error("❌ Template parse error:", err);
        }
      }

      const botResponse: Message = {
        id: crypto.randomUUID(),
        text: toDisplayText(respData), // ✅ ALWAYS STRING
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, botResponse]);
    } catch (error: any) {
      let errorText = "❌ Could not connect to backend. ";

      if (error.response) {
        // also try to show backend body
        const body = error.response?.data;
        errorText += `Server error: ${error.response.status}. `;
        if (body) errorText += `\n${toDisplayText(body).slice(0, 1200)}`;
      } else if (error.request) {
        errorText += "No response from server. Check if backend is running.";
      } else {
        errorText += error.message;
      }

      const errorMsg: Message = {
        id: crypto.randomUUID(),
        text: errorText,
        sender: "bot",
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTopRightAction = () => {
    navigate("/app");
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", bgcolor: "#f5f5f5" }}>
      <Header
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        onNewChat={handleNewChat}
      />

      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar open={isSidebarOpen} />

        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
          <Box sx={{ position: "absolute", top: 16, right: 16, zIndex: 10 }}>
            <Button
              variant="contained"
              onClick={handleTopRightAction}
              sx={{
                bgcolor: PRIMARY_TEAL,
                "&:hover": { bgcolor: "#006b30" },
                borderRadius: 2,
                px: 3,
              }}
            >
              Data
            </Button>
          </Box>

          <ChatArea messages={messages} isTyping={isTyping} />

          <Box sx={{ p: 2, bgcolor: "#fff", borderTop: "1px solid #ddd" }}>
            <Box sx={{ maxWidth: 900, mx: "auto", display: "flex", gap: 1, alignItems: "center" }}>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
              />

              <IconButton onClick={() => fileInputRef.current?.click()} sx={{ color: "#999", p: 1 }}>
                📎
              </IconButton>

              <TextField
                fullWidth
                multiline
                maxRows={4}
                placeholder="Type your query..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                inputRef={textInputRef}
              />

              <Button
                onClick={() => handleSend()}
                sx={{
                  bgcolor: PRIMARY_TEAL,
                  borderRadius: 4,
                  minWidth: "40px",
                  width: "40px",
                  height: "40px",
                  p: 0,
                  "&:hover": { bgcolor: "#006b30" },
                }}
              >
                ➤
              </Button>
            </Box>

            <Box sx={{ textAlign: "center", mt: 1, fontSize: "0.75rem", color: "#999" }}>
              © 2025 Sales App. All rights reserved. @Version1
            </Box>
          </Box>
        </Box>
      </Box>

      <PromptModal
        open={openModal}
        prompt={activePrompt}
        onClose={() => setOpenModal(false)}
        onSubmit={handleModalSubmit}
      />
    </Box>
  );
};

export default RetrieveChatPage;
