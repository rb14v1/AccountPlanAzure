// src/Components/Sidebar.tsx
 
import React from "react";
import { Box, Typography, Button, IconButton, List, ListItem, ListItemText } from "@mui/material";
import { DARK_BG, SIDEBAR_WIDTH, COLLAPSED_WIDTH } from "./constants";
 
interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  onNewChat: () => void;
}

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
 
// const mockHistory = ["Java Learning Path", "React Project Setup", "SQL Optimization"];
 
const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, onNewChat }) => {
  return (
    <Box sx={{
      width: isOpen ? SIDEBAR_WIDTH : COLLAPSED_WIDTH,
      transition: "width 0.3s ease",
      bgcolor: DARK_BG,
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      borderRight: "1px solid #333",
      flexShrink: 0,
      position: "relative"
    }}>
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: isOpen ? "flex-start" : "center" }}>
        {isOpen ? (
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#fff", letterSpacing: 1, whiteSpace: "nowrap" }}>APM</Typography>
        ) : (
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#fff" }}>APM</Typography>
        )}
      </Box>
 
      {/* New Chat Button */}
      <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
         {isOpen ? (
          <Button fullWidth onClick={onNewChat} variant="outlined" sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)", textTransform: "none", justifyContent: "flex-start", "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.05)" } }}>+ New Chat</Button>
         ) : (
           <IconButton aria-label="Start new chat" onClick={onNewChat} sx={{ color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}><span>+</span></IconButton>
         )}
      </Box>
 
      {/* History List */}
      <Box sx={{ flex: 1, overflowY: "auto", px: 2 }}>
        {isOpen && <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 700, mb: 1, display: "block" }}>RECENT</Typography>}
        {/* <List>
          {mockHistory.map((item, index) => (
            <ListItem button key={index} sx={{ borderRadius: 1, mb: 0.5, justifyContent: isOpen ? "flex-start" : "center", px: isOpen ? 2 : 1, "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}>
              {!isOpen && <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.5)" }} />}
              {isOpen && <ListItemText primary={item} primaryTypographyProps={{ fontSize: "0.85rem", color: "#ddd", noWrap: true }} />}
            </ListItem>
          ))}
        </List> */}
      </Box>
 
      {/* Toggle Button */}
      <Box sx={{ position: 'absolute', top: '50%', right: -16, transform: 'translateY(-50%)', zIndex: 10 }}>
        <IconButton aria-label="Toggle sidebar" onClick={toggleSidebar} sx={{ bgcolor: DARK_BG, color: "#fff", width: 32, height: 32, border: '1px solid #333', "&:hover": { bgcolor: "#1a2e38" } }}>
          {isOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </Box>
    </Box>
  );
};
 
export default Sidebar;
 