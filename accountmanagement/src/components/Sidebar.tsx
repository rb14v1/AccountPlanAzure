import React, { useState } from "react";
import { Box, Typography, Button, IconButton } from "@mui/material";
import { DARK_BG, SIDEBAR_WIDTH, COLLAPSED_WIDTH } from "./constants";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
 
interface SidebarProps {
  open: boolean;
  chatList: any[];
  onOpenChat: (id: number) => void;
  onNewChat: () => void;
}

 
const Sidebar: React.FC<SidebarProps> = ({
  open,
  chatList,
  onOpenChat,
  onNewChat,
}) => {
  // 1. Logic for "Default Collapsed" (false)
  const [isOpen, setIsOpen] = useState(false);
  
  const [activeChatId, setActiveChatId] = useState<number | null>(null);

  // 2. Local toggle function that actually makes the button work
  const handleToggle = () => {
    setIsOpen(!isOpen);
  };
 
  return (
    <Box sx={{
      width: isOpen ? SIDEBAR_WIDTH : COLLAPSED_WIDTH,
      transition: "width 0.3s ease",
      backgroundColor: "#f0fdfa", // light teal
      color: "#134e4a",
      display: "flex",
      flexDirection: "column",
      borderRight: "1px solid #ccfbf1",
      flexShrink: 0,
      position: "relative"
    }}>
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: "1px solid #ccfbf1",
 display: "flex", alignItems: "center", justifyContent: isOpen ? "flex-start" : "center" }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#fff", letterSpacing: isOpen ? 1 : 0, whiteSpace: "nowrap" }}>
          APM
        </Typography>
      </Box>
 
      {/* New Chat Button */}
      <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
          {isOpen ? (
            <Button
              fullWidth
              onClick={onNewChat}
              variant="contained"
sx={{
  textTransform: "none",
  justifyContent: "flex-start",
  borderRadius: 2,
  fontWeight: 500,
  backgroundColor: "#0f766e",
  color: "#ffffff",
  boxShadow: "0 2px 6px rgba(20,184,166,0.3)",
  "&:hover": {
    backgroundColor: "#115e59",
  },
}}

            >
              + New Chat
            </Button>
          ) : (
            <IconButton
              aria-label="Start new chat"
              onClick={onNewChat}
              sx={{
  color: "#0f766e",
  border: "1px solid #99f6e4",
  "&:hover": {
    backgroundColor: "#ccfbf1",
  },
}}

            >
              <span>+</span>
            </IconButton>
          )}
      </Box>
 
      {/* History List Space */}
      <Box sx={{ flex: 1, overflowY: "auto", px: 2 }}>
  {isOpen && (
    <>
      <Typography
        variant="caption"
        sx={{ color: "#5eead4", fontWeight: 700, mb: 1 }}
      >
        RECENT
      </Typography>

      {chatList.map((chat) => (
        <Button
  key={chat.id}
  fullWidth
  onClick={() => {
  setActiveChatId(chat.id);
  onOpenChat(chat.id);
}}

  sx={{
  justifyContent: "flex-start",
  textTransform: "none",
  mb: 0.5,
  px: 1.5,
  py: 1,
  borderRadius: 2,
  transition: "all 0.2s ease",

  // ACTIVE (selected chat)
  backgroundColor: activeChatId === chat.id ? "#14b8a6" : "transparent",
  color: activeChatId === chat.id ? "#ffffff" : "#134e4a",


  // HOVER
  "&:hover": {
    backgroundColor: "#ccfbf1",
  },

  // CLICK effect
  "&:active": {
  backgroundColor: "#14b8a6",
  color: "#ffffff",
},

}}

>
  {chat.title || "New Chat"}
</Button>

      ))}
    </>
  )}
</Box>

 
      {/* Toggle Button - Now uses local handleToggle */}
      <Box sx={{ position: 'absolute', top: '50%', right: -16, transform: 'translateY(-50%)', zIndex: 10 }}>
        <IconButton
          aria-label="Toggle sidebar"
          onClick={handleToggle}
          sx={{
  bgcolor: "#14b8a6",
  color: "#ffffff",
  width: 34,
  height: 34,
  border: "1px solid #5eead4",
  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  "&:hover": {
    bgcolor: "#0f766e",
  },
}}

        >
          {isOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </Box>
    </Box>
  );
};
 
export default Sidebar;
 
 
 