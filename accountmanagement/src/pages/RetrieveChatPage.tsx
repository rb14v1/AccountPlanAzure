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
      id: Date.now(),
      text: textToSend,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachment: fileName
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInput("");
    setSelectedFile(null);
    setIsTyping(true);

    // --- CONNECT TO DJANGO BACKEND ---
    try {
      const response = await api.post("/chat", {
        user_id: "101",
        query: textToSend,
      });

      // ✅ Check for template data in response headers
      const templateDataHeader = response.headers['x-template-data'];
      const templateTypeHeader = response.headers['x-template-type'];
      
      // Get the plain text answer for display
      const textAnswer = response.data;
      
      console.log("📝 Text Answer:", textAnswer);
      console.log("📋 Template Type:", templateTypeHeader);
      console.log("📊 Template Data Header:", templateDataHeader ? "Present" : "Not present");

      // If we have template data, parse and route it
      if (templateDataHeader && templateTypeHeader) {
        try {
          const parsedData = JSON.parse(templateDataHeader);
          console.log("✅ Parsed Template Data:", parsedData);
          
          // --- SMART TRAFFIC CONTROLLER ---
          // Route data based on template_type
          
          if (parsedData.template_type === "growth_strategy") {
            console.log("✅ Detected: Growth Strategy Data");
            console.log("📊 Growth Strategy Content:", parsedData.data);
            setGlobalData((prev: any) => ({ 
              ...prev, 
              growth_strategy: parsedData.data 
            }));
            
          } else if (parsedData.template_type === "strategic_partnerships") {
            console.log("✅ Detected: Strategic Partnerships Data");
            setGlobalData((prev: any) => ({ 
              ...prev, 
              Strategic_Partnerships: parsedData.data 
            }));
            
          } else if (parsedData.template_type === "account_team_pod") {
            console.log("✅ Detected: Account Team POD Data");
            setGlobalData((prev: any) => ({ 
              ...prev, 
              Account_Team_POD: parsedData.data 
            }));
            
          } else if (parsedData.template_type === "service_line_growth") {
            console.log("✅ Detected: Service Line Growth Data");
            setGlobalData((prev: any) => ({ 
              ...prev, 
              Service_Line_Growth_Actions: parsedData.data 
            }));
            
          } else if (parsedData.template_type === "operational_excellence") {
            console.log("✅ Detected: Operational Excellence Data");
            setGlobalData((prev: any) => ({ 
              ...prev, 
              Operational_Excellence_Strategy: parsedData.data 
            }));

          } else if (parsedData.template_type === "customer_profile") {
            console.log("✅ Detected: Customer Profile Data");
            setGlobalData((prev: any) => ({ 
              ...prev, 
              customer_and_version_1: parsedData.data 
            }));

          } else if (parsedData.template_type === "investment_plan") {
            console.log("✅ Detected: Investment Plan Data");
            setGlobalData((prev: any) => ({ 
              ...prev, 
              Investment_Plan: parsedData.data 
            }));

          } else if (parsedData.template_type === "critical_risk") {
            console.log("✅ Detected: Critical Risk Data");
            setGlobalData((prev: any) => ({ 
              ...prev, 
              Critical_Risk_Tracking: parsedData.data 
            }));

          } else if (parsedData.template_type === "relationship_heatmap") {
            console.log("✅ Detected: Relationship Heatmap Data");
            setGlobalData((prev: any) => ({ 
              ...prev, 
              relationship_heatmap: parsedData.data 
            }));

          } else if (parsedData.template_type === "implementation_plan") {
            console.log("✅ Detected: Implementation Plan Data");
            setGlobalData((prev: any) => ({ 
              ...prev, 
              Implementation_Plan: parsedData.data 
            }));

          } else {
            // Generic fallback for unknown template types
            console.log(`ℹ️ Generic template data: ${parsedData.template_type}`);
            setGlobalData((prev: any) => ({ 
              ...prev, 
              [parsedData.template_type]: parsedData.data 
            }));
          }
          
        } catch (parseError) {
          console.error("❌ Error parsing template data:", parseError);
        }
      }

      // --- UI UPDATE (Show AI Message with PLAIN TEXT) ---
      const botResponse: Message = {
        id: Date.now() + 1,
        text: textAnswer,  // ✅ Display plain text, not JSON
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botResponse]);

    } catch (error: any) {
      console.error("Connection Error:", error);
      
      let errorText = "❌ Could not connect to backend. ";
      if (error.response) {
        errorText += `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorText += "No response from server. Check if backend is running on http://127.0.0.1:8000";
      } else {
        errorText += error.message;
      }

      const errorMsg: Message = {
        id: Date.now() + 1,
        text: errorText,
        sender: "bot",
        timestamp: new Date().toLocaleTimeString()
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
          {/* Top Right Button */}
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
