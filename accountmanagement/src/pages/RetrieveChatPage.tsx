// src/Components/RetrieveChatPage.tsx
 
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
  "service_line_growth_actions",
  "operational_excellence_strategy",
  "service_line_penetration",
  "customer_profile",
  "investment_plan",
  "account_performance_quarterly_plan",
  "tech_spend_view", // ✅ ADDED THIS
  "relationship_heatmap", // ✅ ADDED THIS FOR YOUR OTHER TEMPLATE
  "account_cockpit_view",
  "org_structure_tech_view",
  "revenue_teardown",
  "planned_action_genai",
  "operational_implementation_plan",
  "margin_improvement",
  "margin_improvement_plan_2"
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
  const [activePrompt, setActivePrompt] = useState<any>(null);
 
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
 
// DELETE CHAT FUNCTION
const handleDeleteChat = async (id: number) => {
  try {
    console.log("Deleting chat:", id);
 
    // Call backend API
    await api.delete(`/chats/${id}/delete`);
 
 
    // Remove from UI
    setChatList((prev) => prev.filter((chat) => chat.id !== id));
 
    // If current chat is deleted → reset
    if (currentChatId === id) {
      setCurrentChatId(null);
      setMessages([]);
      localStorage.removeItem("activeChatId");
    }
 
  } catch (err) {
    console.error("Error deleting chat", err);
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
 
  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim() && !selectedFile) return;
 
    const fileName = selectedFile ? selectedFile.name : undefined;
 
    // --- UI UPDATE (Show User Message) ---
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
      // ✅ If user types: "<template_name> <company_name>"
      const parts = textToSend.trim().split(/\s+/);
      const maybeTemplate = parts[0] || "";
      const companyName = parts.slice(1).join(" ").trim();
 
      if ((ALLOWED_TEMPLATES as readonly string[]).includes(maybeTemplate) && companyName) {
          const user = getUser();
          if (!user) return;
 
        const fillRes = await api.post("/template/fill", {
          user_id: user.id,
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
      const user = getUser();
if (!user) return;
 
if (!currentChatId) {
  alert("Please create a chat first");
  return;
}
 
const response = await api.post("/chat", {
  user_id: user.id,
  chat_id: currentChatId,
  query: textToSend,
});
      // IMPORTANT: response.data can be STRING or OBJECT
      const respData = response.data;
 
        // ✅ NEW: backend returns { message, payload }
        if (respData && typeof respData === "object" && respData.message) {
          // messageText declaration fixed
          const messageText = String(respData.message || "");
 
          // ✅ UNIVERSAL MAPPING: Capture any template type and normalize for the Data button
          const rawType = respData.template_type || respData.payload?.template_type;
          if (rawType) {
            let routeName = rawType.toLowerCase().replace(/_/g, "-");
           
            // 🚀 FIX: Map backend names to your exact frontend MainLayout tab IDs
            if (routeName === "tech-spend-view") routeName = "tech-spend";
            // Add other fixes here if needed, e.g.:
            // if (routeName === "relationship-heatmap-view") routeName = "relationship-heatmap";
 
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
 
      const logosHeader = response.headers["x-company-logos"];
 
      if (logosHeader) {
        try {
          const parsedLogos = JSON.parse(logosHeader);
 
          console.log("🖼️ Logos from backend:", parsedLogos);
 
          setGlobalData((prev: any) => ({
            ...prev,
            companyLogos: parsedLogos,
          }));
        } catch (err) {
          console.error("❌ Failed to parse company logos header", err);
        }
      }
 
      // Existing header based logic (keep, but safe)
      const templateDataHeader = response.headers["x-template-data"];
      const templateTypeHeader = response.headers["x-template-type"];
 
      const textAnswer = response.data;
 
      console.log("📝 Text Answer:", textAnswer);
      console.log("📋 Template Type:", templateTypeHeader);
 
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
    const lastTemplate = localStorage.getItem("last_detected_template");
 
    if (lastTemplate) {
      // 1. Tell TabContext to set the active component
      const routeName = lastTemplate.toLowerCase().replace(/_/g, "-");
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
  <>
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", bgcolor: "#f5f5f5" }}>
     
      {/* HEADER */}
      <Header
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        onNewChat={handleNewChat}
      />
 
      {/* MAIN CONTENT */}
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
       
        {/* SIDEBAR */}
        <Sidebar
          open={isSidebarOpen}
          chatList={chatList}
          activeChatId={currentChatId}
          onOpenChat={openChat}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
        />
 
        {/* CHAT AREA */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
         
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
            onDataClick={handleTopRightAction}
 
            input={input}
            setInput={setInput}
            handleSend={handleSend}
            handleKeyPress={handleKeyPress}
            textInputRef={textInputRef}
          />
 
          {/* FOOTER */}
          <Box
            sx={{
              textAlign: "center",
              py: 1,
              fontSize: "0.75rem",
              color: "#999",
              bgcolor: "#fff",
            }}
          >
            © 2025 Sales App. All rights reserved. @Version1
          </Box>
 
        </Box>
      </Box>
    </Box>
 
    {/* PROMPT MODAL */}
    <PromptModal
      open={openModal}
      activePrompt={activePrompt}
      onClose={() => setOpenModal(false)}
      onSubmit={(finalText) => {
        setOpenModal(false);
        handleSend(finalText);
      }}
    />
  </>
);
};
 
export default RetrieveChatPage;
 