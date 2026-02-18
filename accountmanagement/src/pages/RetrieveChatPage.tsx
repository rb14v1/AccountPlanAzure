// src/Components/ChatPage.tsx

import React, { useState, useEffect } from "react";
import { Box, TextField, Button, IconButton } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import api from "../api/axios";
import { PRIMARY_TEAL } from "../components/constants";
import type { Message, PromptDefinition } from "../components/constants";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import PromptModal from "../components/PromptModal";
import { useData } from "../context/DataContext";
import { useTab } from "../context/TabContext";
import { STARTER_PROMPTS } from "../components/constants";

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
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [chatList, setChatList] = useState<any[]>([]);
  const navigate = useNavigate();
  const { navigateTo } = useTab();
  
  const getUser = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user || !user.id) {
      throw new Error("User not logged in");
    }
    return user;
  } catch (e) {
    console.error("Invalid user in localStorage");
    return null;
  }
};

  const fetchChats = async () => {
  const user = getUser();
  if (!user) return;

  try {
    const res = await api.get("/chats", {
      params: { user_id: user.id },
    });
    setChatList(res.data);
  } catch (err) {
    console.error("Error fetching chats", err);
  }
};



  useEffect(() => {
    const user = getUser();
    if (!user) return;

    const storedChatId = localStorage.getItem("activeChatId");

    // Load chat list
    api.get("/chats", {
      params: { user_id: user.id },
    }).then(res => {
      setChatList(res.data);
    });

    // 🔥 Restore last active chat
    if (storedChatId) {
      const chatIdNum = Number(storedChatId);
      setCurrentChatId(chatIdNum);


      api.get(`/chats/${chatIdNum}`).then(res => {
        setMessages(
          res.data.map((m: any) => ({
            id: m.id,
            sender: m.sender,
            text: m.text,
            timestamp: new Date(m.timestamp).toLocaleTimeString(),
          }))
        );
      });
    }
  }, []);

  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [activePrompt, setActivePrompt] = useState<PromptDefinition | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const textInputRef = React.useRef<HTMLInputElement>(null);

  // --- Handlers ---
  const openChat = async (id: number) => {
  try {
    setCurrentChatId(id);
    localStorage.setItem("activeChatId", id.toString());

    const res = await api.get(`/chats/${id}`);

    const formatted = res.data.map((m: any) => ({
      id: m.id,
      sender: m.sender,
      text: m.text,
      timestamp: new Date(m.timestamp).toLocaleTimeString(),
    }));

    setMessages(formatted);

    await fetchChats(); // optional refresh
  } catch (err) {
    console.error("Error opening chat", err);
  }
};


  
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
  const handleNewChat = async () => {
  try {
    const user = getUser();
    if (!user) return;

    const res = await api.post("/chats/new", {
      user_id: user.id,
    });

    const newChat = res.data;

    setCurrentChatId(newChat.id);
    localStorage.setItem("activeChatId", newChat.id.toString());

    setMessages([]);

    await fetchChats(); // refresh sidebar

  } catch (err) {
    console.error("Error creating chat", err);
  }
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

    const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride !== undefined ? textOverride : input;
    if (!textToSend.trim() && !selectedFile) return;
 
    const newUserMsg: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: "user",
      timestamp: new Date().toLocaleTimeString(),
      attachment: selectedFile ? selectedFile.name : undefined,
    };
 
    setMessages((prev) => [...prev, newUserMsg]);
    setInput("");
    setSelectedFile(null);
    setIsTyping(true);
 
    try {
      // ✅ Template Fill Logic
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
 
          // ✅ Store any detected template as a route-friendly key
          const routeName = parsedData.template_type.toLowerCase().replace(/_/g, "-");
          localStorage.setItem("last_detected_template", routeName);
        }
 
        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          text: `✅ Filled template "${maybeTemplate}" for "${companyName}".`,
          sender: "bot",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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
 
      const respData = response.data;
 
      if (respData && typeof respData === "object" && respData.message) {
        // ✅ messageText declaration fixed
        const messageText = String(respData.message || "");
 
        // ✅ UNIVERSAL MAPPING: Capture any template type and normalize for the Data button
        const rawType = respData.template_type || respData.payload?.template_type;
        if (rawType) {
          const routeName = rawType.toLowerCase().replace(/_/g, "-");
          localStorage.setItem("last_detected_template", routeName);
        }
 
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
 
      const botResponse: Message = {
        id: crypto.randomUUID(),
        text: toDisplayText(respData),
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
 
      setMessages((prev) => [...prev, botResponse]);
    } catch (error: any) {
      let errorText = "❌ Could not connect to backend. ";
      if (error.response) {
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
    const lastTemplate = localStorage.getItem("last_detected_template");
 
    if (lastTemplate) {
      // 1. Tell TabContext to set the active component
      navigateTo(lastTemplate);
      // 2. Change the URL so MainLayout's renderPage() switch finds the match
      navigate(`/app/${lastTemplate}`);
    } else {
      // Default fallback
      navigateTo("customer-profile");
      navigate("/app/customer-profile");
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", bgcolor: "#f5f5f5" }}>
      <Header
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        onNewChat={handleNewChat}
      />

      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar
  open={isSidebarOpen}
  chatList={chatList}
  onOpenChat={openChat}
  onNewChat={handleNewChat}
/>



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

          <ChatArea
            messages={messages}
            isTyping={isTyping}
            prompts={STARTER_PROMPTS}
            onPromptSelect={(id) => {
              const found = STARTER_PROMPTS.find(p => p.id === id);
              if (found) {
                setActivePrompt(found);
                setOpenModal(true);
              }
            }}
          />

          <Box sx={{ p: 2, bgcolor: "#fff", borderTop: "1px solid #ddd" }}>
            <Box sx={{ maxWidth: 900, mx: "auto", display: "flex", gap: 1, alignItems: "center" }}>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
              />

              

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
        activePrompt={activePrompt}
        onClose={() => setOpenModal(false)}
        onSubmit={(finalText) => {
          setOpenModal(false);
          handleSend(finalText);
        }}
      />
    </Box>
  );
};

export default RetrieveChatPage;
