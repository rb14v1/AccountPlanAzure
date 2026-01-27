// src/pages/RetrieveChatPage.tsx

import React, { useEffect, useRef, useState } from "react";
import { Box, TextField, Button, IconButton } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import PromptModal from "../components/PromptModal";

import { PRIMARY_TEAL } from "../components/constants";
import type { Message, PromptDefinition } from "../components/constants";

import { useData } from "../context/DataContext";
import SendIcon from "@mui/icons-material/Send";


// n8n endpoints (via proxy)
const N8N_CHAT_URL = "/webhook/chat";
const PROMPTS_API_URL = "/webhook/prompts";

const RetrieveChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { setGlobalData } = useData();

  // ---------------- STATE ----------------
  const [input, setInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [messages, setMessages] = useState<Message[]>([]);
  const [prompts, setPrompts] = useState<PromptDefinition[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);

  // Modal state
  const [openModal, setOpenModal] = useState(false);
  const [activePromptId, setActivePromptId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const activePrompt = Array.isArray(prompts)
  ? prompts.find((p) => p.id === activePromptId) || null
  : null;

  useEffect(() => {
    setLoadingPrompts(true);

    axios
      .get(PROMPTS_API_URL)
      .then((res) => {
        const raw = res.data;

        let safePrompts: PromptDefinition[] = [];

        if (Array.isArray(raw)) {
          safePrompts = raw;
        } else if (Array.isArray(raw?.prompts)) {
          safePrompts = raw.prompts;
        } else if (Array.isArray(raw?.data)) {
          safePrompts = raw.data;
        } else {
          console.error("Invalid prompts payload:", raw);
        }

        setPrompts(safePrompts);
      })
      .catch((err) => {
        console.error("Failed to fetch prompts:", err);
        setPrompts([]);
      })
      .finally(() => setLoadingPrompts(false));
  }, []);


  const parseN8nResponse = (data: unknown) => {
    if (typeof data === "string") {
      try {
        const start = data.indexOf("{");
        const end = data.lastIndexOf("}");
        if (start !== -1 && end !== -1) {
          return JSON.parse(data.slice(start, end + 1));
        }
      } catch (e) {
        console.error("JSON parse failed:", e);
      }
    }
    return data;
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setSelectedFile(null);
  };

  const handlePromptSelect = (promptId: string) => {
    setActivePromptId(promptId);
    setOpenModal(true);
  };

  const handleModalSubmit = (finalText: string) => {
    setInput(finalText);
    setOpenModal(false);

    setTimeout(() => {
      textInputRef.current?.focus();
    }, 100);
  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText ?? input;
    if (!textToSend.trim() && !selectedFile) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: textToSend,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      attachment: selectedFile?.name,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSelectedFile(null);
    setIsTyping(true);

    try {
      const response = await axios.post(N8N_CHAT_URL, {
        prompt: textToSend,
      });

      const parsedData = parseN8nResponse(response.data);

      // // 4. ADDED LOGIC: Parse JSON and Save to Store
      // let parsedData = data;
      // if (typeof data === "string") {
      //   try {
      //      const jsonStartIndex = data.indexOf('{');
      //      const jsonEndIndex = data.lastIndexOf('}');
      //      if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
      //        const jsonString = data.substring(jsonStartIndex, jsonEndIndex + 1);
      //        parsedData = JSON.parse(jsonString);
      //      }
      //   } catch (e) {
      //     console.error("Could not auto-parse JSON string:", e);
      //   }
      // }
      
      // --- SMART TRAFFIC CONTROLLER ---
      
      // 1. Check for Account Team POD
      if (parsedData.Sales_and_Delivery_Leads || parsedData.Account_Team_POD?.Sales_and_Delivery_Leads) {
        console.log("Detected: Account Team POD Data");
        const cleanData = parsedData.Account_Team_POD || parsedData;
        setGlobalData((prev: any) => ({ ...prev, Account_Team_POD: cleanData }));

      // 2. Check for Service Line Growth
      } else if (parsedData.template_type === "service_line_growth_actions" || parsedData.Service_Line_Growth_Actions) {
      console.log("Detected: Service Line Growth Data");
      const cleanData = parsedData.data || parsedData.Service_Line_Growth_Actions || parsedData;
      setGlobalData((prev: any) => ({ ...prev, Service_Line_Growth_Actions: cleanData }));

      // 3. Check for Strategic Partnerships (NEW)
      } else if (parsedData.template_type === "strategic_partnerships") {
        console.log("Detected: Strategic Partnerships Data");
        // We save the 'data' array into the global store
        setGlobalData((prev: any) => ({ ...prev, Strategic_Partnerships: parsedData.data }));
      
      // 4. Check for Operational Excellence Strategy (⭐ NEW - ADD THIS)
      } else if (parsedData.template_type === "operational_excellence_strategy") {
      console.log("Detected: Operational Excellence Strategy Data");
      setGlobalData((prev: any) => ({ ...prev, Operational_Excellence_Strategy: parsedData.data }));

      // 5. Check for Critical Risk Tracking (NEW - ADD THIS)
      } else if (parsedData.template_type === "critical_risk_tracking") {
      console.log("Detected: Critical Risk Tracking Data");
      setGlobalData((prev: any) => ({ ...prev, Critical_Risk_Tracking: parsedData.data }));


      // 6. Check for Implementation Plan (NEW - ADD THIS)
      } else if (parsedData.template_type === "implementation_plan") {
      console.log("Detected: Implementation Plan Data");
      setGlobalData((prev: any) => ({ 
        ...prev, 
        Implementation_Plan: {
          plan_date: parsedData.plan_date,
          data: parsedData.data
        }
      }));

      // 7. Check for Investment Plan (NEW - ADD THIS)
      } else if (parsedData.template_type === "investment_plan") {
      console.log("Detected: Investment Plan Data");
      setGlobalData((prev: any) => ({ 
        ...prev, 
        Investment_Plan: {
        data: parsedData.data,
        total_investment_value: parsedData.total_investment_value
       }
      }));

      // 8. Check for Client Context (NEW - ADD THIS)
      } else if (parsedData.template_type === "client_context") {
      console.log("Detected: Client Context Data");
      setGlobalData((prev: any) => ({ ...prev, Client_Context: parsedData.data }));


      // 9. Check for Client Context Business Tech Priorities (NEW)
      } else if (parsedData.template_type === "client_context_business_tech_priorities" || parsedData.client_context_business_tech_priorities) {
      console.log("Detected: Client Context Business Tech Priorities Data");
      const cleanData = parsedData.data || parsedData.client_context_business_tech_priorities || parsedData;
      setGlobalData((prev: any) => ({ ...prev, client_context_business_tech_priorities: cleanData }));


      // 10. Check for Customer and Version 1 (NEW)
      } else if (parsedData.template_type === "customer_and_version_1" || parsedData.customer_and_version_1) {
      console.log("Detected: Customer and Version 1 Data");
      const cleanData = parsedData.data || parsedData.customer_and_version_1 || parsedData;
      setGlobalData((prev: any) => ({ ...prev, customer_and_version_1: cleanData }));

      // 11. Check for Growth Strategy (NEW)
      } else if (parsedData.template_type === "growth_strategy" || parsedData.growth_strategy) {
      console.log("Detected: Growth Strategy Data");
      const cleanData = parsedData.data || parsedData.growth_strategy || parsedData;
      setGlobalData((prev: any) => ({ ...prev, growth_strategy: cleanData }));


      // 12. Check for Org Structure Tech View (NEW)
      } else if (parsedData.template_type === "org_structure_tech_view" || parsedData.org_structure_tech_view) {
      console.log("Detected: Org Structure Tech View Data");
      const cleanData = parsedData.data || parsedData.org_structure_tech_view || parsedData;
      setGlobalData((prev: any) => ({ ...prev, org_structure_tech_view: cleanData }));

      // 13. Check for Relationship Heatmap (NEW)
      } else if (parsedData.template_type === "relationship_heatmap" || parsedData.relationship_heatmap) {
      console.log("Detected: Relationship Heatmap Data");
      const cleanData = parsedData.data || parsedData.relationship_heatmap || parsedData;
      setGlobalData((prev: any) => ({ ...prev, relationship_heatmap: cleanData }));

      // 14. Check for Key Growth Opportunities (NEW)
      } else if (parsedData.template_type === "key_growth_opportunities" || parsedData.key_growth_opportunities) {
      console.log("Detected: Key Growth Opportunities Data");
      const cleanData = parsedData.data || parsedData.key_growth_opportunities || parsedData;
      setGlobalData((prev: any) => ({ ...prev, key_growth_opportunities: cleanData }));

      // 15. Check for Implementation Plan for Growth (NEW)
      } else if (parsedData.template_type === "implementation_plan_for_growth" || parsedData.implementation_plan_for_growth) {
      console.log("Detected: Implementation Plan for Growth Data");
      const cleanData = parsedData.data || parsedData.implementation_plan_for_growth || parsedData;
      setGlobalData((prev: any) => ({ ...prev, implementation_plan_for_growth: cleanData }));

      
      } else {
        setGlobalData((prev: any) => ({ ...prev, ...parsedData }));
      }

      const botMessage: Message = {
        id: crypto.randomUUID(),
        text:
          typeof parsedData === "object"
            ? JSON.stringify(parsedData, null, 2)
            : String(parsedData),
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        text: "❌ Could not connect to n8n. Check CORS or Proxy settings.",
        sender: "bot",
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      (input.trim() || selectedFile)
    ) {
      e.preventDefault();
      handleSend();
    }
  };


  const handleTopRightAction = () => {
    navigate("/app");
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#fff",
      }}
    >
      <Header />

      <Box sx={{ flex: 1, display: "flex", minHeight: 0 }}>
        <Sidebar
          isOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onNewChat={handleNewChat}
        />

        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-end",
              p: 2,
            }}
          >
            <Button
              variant="contained"
              onClick={handleTopRightAction}
              sx={{
                bgcolor: PRIMARY_TEAL,
                color: "#fff",
                textTransform: "none",
                borderRadius: 2,
                fontWeight: 600,
                px: 3,
                "&:hover": { bgcolor: "#006b6b" },
              }}
            >
              Data
            </Button>
          </Box>

          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            <ChatArea
              messages={messages}
              isTyping={isTyping}
              prompts={prompts}
              onPromptSelect={handlePromptSelect}
            />
          </Box>

          <Box
            sx={{
              px: 4,
              py: 3,
              bgcolor: "#fff",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Box
              sx={{
                display: "flex",
                gap: 1,
                bgcolor: "#f9f9f9",
                p: 1,
                borderRadius: 8,
                border: "1px solid #e0e0e0",
                alignItems: "center",
                width: "100%",
                maxWidth: 900,
              }}
            >
              <input
                type="file"
                hidden
                ref={fileInputRef}
                onChange={(e) =>
                  e.target.files && setSelectedFile(e.target.files[0])
                }
              />


              <TextField
                inputRef={textInputRef}
                fullWidth
                multiline
                maxRows={3}
                placeholder="Type your query..."
                variant="standard"
                InputProps={{
                  disableUnderline: true,
                  style: {
                    paddingLeft: 30,
                    fontSize: "0.85rem",
                    lineHeight: "1.3",
                  },
                }}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
              />

              <IconButton
                onClick={() => handleSend()}
                disabled={!input.trim() && !selectedFile}
                sx={{
                  bgcolor: PRIMARY_TEAL,
                  color: "#fff",
                  width: 40,
                  height: 40,
                  "&:hover": { bgcolor: "#006b6b" },
                }}
                aria-label="Send message"
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Box>

          <Box
            sx={{
              textAlign: "center",
              py: 2.5,
              fontSize: 12,
              color: "#666",
              borderTop: "1px solid #e5e7eb",
              flexShrink: 0,
            }}
          >
            © 2025 Sales App. All rights reserved. @Version1
          </Box>
        </Box>

        <PromptModal
          open={openModal}
          activePrompt={activePrompt}
          onClose={() => setOpenModal(false)}
          onSubmit={handleModalSubmit}
        />

      </Box>
    </Box>
  );
};

export default RetrieveChatPage;
