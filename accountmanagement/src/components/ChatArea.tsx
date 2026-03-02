// src/Components/ChatArea.tsx
 
import React, { useEffect, useRef } from "react";
import { Box, Typography, Avatar, Paper, Card, CardActionArea, CircularProgress, Button, TextField } from "@mui/material";
import { PRIMARY_TEAL, DARK_BG, USER_BG, BOT_BG} from "./constants";
import type { PromptDefinition } from "./constants";
import type { Message } from "./constants";
 
 
interface ChatAreaProps {
  messages: Message[];
  isTyping: boolean;
  prompts?: PromptDefinition[];
  onPromptSelect?: (promptId: string) => void;
  onDataClick?: () => void;
 
  // ✅ ADD THESE (for input functionality)
  input: string;
  setInput: (val: string) => void;
  handleSend: (overrideText?: string) => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  textInputRef: React.RefObject<HTMLInputElement>;
}
 
const ENABLE_STARTER_PROMPTS = true; // future -> import.meta.env.VITE_ENABLE_PROMPTS === "true";
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
 
  /* ===== SCROLLBAR STYLING ===== */
 
  /* For Chrome, Edge, Safari */
  "&::-webkit-scrollbar": {
    width: "8px",
  },
 
  "&::-webkit-scrollbar-track": {
    background: "transparent",   // Track transparent
  },
 
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "transparent",  // Thumb transparent
    borderRadius: "10px",
  },
 
  "&::-webkit-scrollbar-thumb:hover": {
    backgroundColor: "rgba(0,0,0,0.2)",  // show slightly on hover
  },
 
  /* For Firefox */
  scrollbarWidth: "thin",
  scrollbarColor: "transparent transparent",
};
 
 
const typingIndicatorSx = {
  display: "flex",
  gap: 2,
  alignItems: "center",
  maxWidth: 900,
  mx: "auto",
  width: "100%",
};
 
const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isTyping,
  prompts,
  onPromptSelect,
  onDataClick,
  input,
  setInput,
  handleSend,
  handleKeyPress,
  textInputRef
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
 
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);
 
  return (
    <Box sx={chatContainerSx}>
      {messages.length === 0 ? (
  <Box
    sx={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center",
      width: "100%",
    }}
  >
    <Typography variant="h5" sx={{ fontWeight: 600, color: "#222", mb: 3 }}>
      Welcome to the Version 1 Sales Assistant
    </Typography>
 
    {/* ✅ INPUT BOX MOVED HERE */}
    <Box
      sx={{
        width: "100%",
        maxWidth: 900,
        display: "flex",
        gap: 1,
        alignItems: "center",
        mb: 4,   // space before cards
      }}
    >
      <input type="file" style={{ display: "none" }} />
 
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
          background: "linear-gradient(135deg, #14b8a6, #0f766e)",
          color: "#ffffff",
          borderRadius: "50%",
          minWidth: "42px",
          width: "42px",
          height: "42px",
          p: 0,
          boxShadow: "0 2px 6px rgba(20,184,166,0.4)",
          "&:hover": {
            background: "linear-gradient(135deg, #0f766e, #115e59)",
          },
        }}
      >
        ➤
      </Button>
    </Box>
  </Box>
) : (
        <>
          {messages.map((msg) => (
  <Box
    key={`${msg.id}-${msg.sender}`}
    sx={{
      display: "flex",
      gap: 2,
      flexDirection: msg.sender === "user" ? "row-reverse" : "row",
      alignItems: "flex-start",
      maxWidth: 900,
      width: "100%",
      mx: "auto",
    }}
  >
    <Avatar
      sx={{
        bgcolor: msg.sender === "bot" ? PRIMARY_TEAL : DARK_BG,
        color: "#fff",
        width: 32,
        height: 32,
        fontSize: "0.85rem",
        fontWeight: "bold",
      }}
    >
      {msg.sender === "user" ? "U" : "AI"}
    </Avatar>
 
    <Box sx={{ maxWidth: "80%" }}>
 
      {/* MESSAGE BOX */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: msg.sender === "user" ? USER_BG : BOT_BG,
          color: "#333",
          fontSize: "0.95rem",
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
        }}
      >
        {typeof msg.attachment === "string" && msg.attachment.length > 0 && (
          <Box
            sx={{
              mb: 1,
              display: "flex",
              alignItems: "center",
              gap: 1,
              bgcolor: "rgba(255,255,255,0.5)",
              p: 0.5,
              borderRadius: 1,
            }}
          >
            <span style={{ fontSize: "1.2rem" }}>📄</span>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {msg.attachment}
            </Typography>
          </Box>
        )}
 
        {msg.text ?? <Typography variant="caption">Message unavailable</Typography>}
      </Paper>
 
      {/* ✅ DATA BUTTON ONLY FOR BOT */}
      {msg.sender === "bot" && onDataClick && (
        <Box sx={{ mt: 1 }}>
          <Button
            variant="contained"
            size="small"
            onClick={onDataClick}
            sx={{
              bgcolor: PRIMARY_TEAL,
              "&:hover": { bgcolor: "#006b30" },
              borderRadius: "20px",
              px: 2,
              py: 0.5,
              fontSize: "12px",
              textTransform: "none",
            }}
          >
            Data
          </Button>
        </Box>
      )}
    </Box>
  </Box>
))}
          {isTyping && <Box sx={typingIndicatorSx}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: PRIMARY_TEAL, fontSize: "0.85rem", color: "#fff" }}>AI</Avatar>
            <Box sx={{ bgcolor: BOT_BG, px: 2, py: 1.5, borderRadius: 2 }}><Box sx={{ display: "flex", gap: 0.5 }}><CircularProgress size={10} sx={{ color: "#999" }} /><CircularProgress size={10} sx={{ color: "#999" }} /><CircularProgress size={10} sx={{ color: "#999" }} /></Box></Box></Box>}
          <div ref={messagesEndRef} />
        </>
      )}
 
      {ENABLE_STARTER_PROMPTS && messages.length === 0 && prompts && (
  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', mt: 4 }}>
    {prompts.map((p) => (
      <Card
        key={p.id}
        sx={{ width: 250, cursor: 'pointer', '&:hover': { boxShadow: 6 } }}
        onClick={() => onPromptSelect?.(p.id)}
      >
        <CardActionArea sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" color={PRIMARY_TEAL} gutterBottom>
            {p.title}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {p.description}
          </Typography>
        </CardActionArea>
      </Card>
    ))}
  </Box>
)}
    </Box>
  );
};
 
export default ChatArea;
 