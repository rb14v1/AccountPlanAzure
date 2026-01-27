// src/Components/ChatArea.tsx
 
import React, { useEffect, useRef } from "react";
import { Box, Typography, Avatar, Paper, Card, CardActionArea, CircularProgress } from "@mui/material";

import { PRIMARY_TEAL, DARK_BG, USER_BG, BOT_BG} from "./constants";
import type { PromptDefinition } from "./constants";
import type { Message } from "./constants";


interface ChatAreaProps {
  messages: Message[];
  isTyping: boolean;
  prompts?: PromptDefinition[];          
  onPromptSelect?: (promptId: string) => void;
}

const ENABLE_STARTER_PROMPTS = false; // future -> import.meta.env.VITE_ENABLE_PROMPTS === "true";
const chatContainerSx = {
  flex: 1,
  px: 4,
  py: 2,
  overflowY: "auto",
  bgcolor: "#fff",
  display: "flex",
  flexDirection: "column",
  gap: 3,
  height: "100%",
};

const typingIndicatorSx = {
  display: "flex",
  gap: 2,
  alignItems: "center",
  maxWidth: 900,
  mx: "auto",
  width: "100%",
};

const ChatArea: React.FC<ChatAreaProps> = ({ messages, isTyping,prompts, onPromptSelect }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
 
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);
 
  return (
    <Box sx={chatContainerSx}>
      {messages.length === 0 ? (
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: "#222", mb: 4 }}>
            Welcome to the Version 1 Sales Assistant</Typography>
          {ENABLE_STARTER_PROMPTS && prompts && prompts.length > 0 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, maxWidth: 900, width: '100%', mx: 'auto' }}>
            {prompts.map((prompt) => (
              <Card key={prompt.id} variant="outlined" sx={{ height: '100%', minHeight: 100, borderRadius: 3, borderColor: "#e0e0e0", transition: "all 0.3s ease", "&:hover": { borderColor: PRIMARY_TEAL, bgcolor: "rgba(0,128,128,0.03)", transform: "translateY(-2px)", "& .prompt-desc": { display: "block", opacity: 1, maxHeight: "150px", marginTop: "8px" } } }}>
                <CardActionArea onClick={() => onPromptSelect?.(prompt.id)} sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1a1a1a" }}>{prompt.title}</Typography>
                  <Typography className="prompt-desc" variant="body2" sx={{ color: "#666", fontSize: "0.9rem", lineHeight: 1.5, display: "none", opacity: 0, maxHeight: 0, transition: "all 0.3s ease" }}>{prompt.description}</Typography>
                </CardActionArea>
              </Card>
            ))}
          </Box> 
          )}
        </Box>
      ) : (
        <>
          {messages.map((msg) => (
            <Box key={`${msg.id}-${msg.sender}`} sx={{ display: "flex", gap: 2, flexDirection: msg.sender === "user" ? "row-reverse" : "row", alignItems: "flex-start", maxWidth: 900, width: '100%', mx: 'auto' }}>
              <Avatar sx={{ bgcolor: msg.sender === "bot" ? PRIMARY_TEAL : DARK_BG, color: "#fff", width: 32, height: 32, fontSize: "0.85rem", fontWeight: "bold" }}>
                {msg.sender === "user" ? "U" : "AI"}
              </Avatar>
              <Box sx={{ maxWidth: "80%" }}>
                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: msg.sender === "user" ? USER_BG : BOT_BG, color: "#333", fontSize: "0.95rem", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {typeof msg.attachment === "string" && msg.attachment.length > 0 && 
                  <Box sx={{
                      mb: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      bgcolor: "rgba(255,255,255,0.5)",
                      p: 0.5,
                      borderRadius: 1,
                    }}>
                    <span style={{ fontSize: "1.2rem" }}>📄</span>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>{msg.attachment}</Typography>
                  </Box>}
                  {msg.text ?? <Typography variant="caption">Message unavailable</Typography>}
                </Paper>
              </Box>
            </Box>
          ))}
          {isTyping && <Box sx={typingIndicatorSx}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: PRIMARY_TEAL, fontSize: "0.85rem", color: "#fff" }}>AI</Avatar>
            <Box sx={{ bgcolor: BOT_BG, px: 2, py: 1.5, borderRadius: 2 }}><Box sx={{ display: "flex", gap: 0.5 }}><CircularProgress size={10} sx={{ color: "#999" }} /><CircularProgress size={10} sx={{ color: "#999" }} /><CircularProgress size={10} sx={{ color: "#999" }} /></Box></Box></Box>}
          <div ref={messagesEndRef} />
        </>
      )}
    </Box>
  );
};
 
export default ChatArea;
 