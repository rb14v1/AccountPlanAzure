import React, { useState } from "react";
import { Box, Typography, Button, IconButton } from "@mui/material";
import { SIDEBAR_WIDTH, COLLAPSED_WIDTH } from "./constants";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DeleteIcon from "@mui/icons-material/Delete";

interface SidebarProps {
  open: boolean;
  chatList?: any[];
  activeChatId: number | null;
  onOpenChat: (id: number) => void;
  onNewChat: () => void;
  onDeleteChat: (id: number) => void;
}
 
const Sidebar: React.FC<SidebarProps> = ({
  open,
  chatList = [],
  activeChatId,
  onOpenChat,
  onNewChat,
  onDeleteChat,   // ✅ ADD THIS
}) => {
 
  const [isOpen, setIsOpen] = useState(false);
 
  const handleToggle = () => {
    setIsOpen(!isOpen);
  };
 
  // Function to limit title to first 4 words
  const getShortTitle = (text: string) => {
    if (!text) return "New Chat";
 
    const words = text.split(" ");
    return words.slice(0, 4).join(" ") + (words.length > 4 ? "..." : "");
  };
 
  return (
    <Box
      sx={{
        width: isOpen ? SIDEBAR_WIDTH : COLLAPSED_WIDTH,
        transition: "width 0.3s ease",
        backgroundColor: "#f0fdfa",
        color: "#134e4a",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid #ccfbf1",
        flexShrink: 0,
        position: "relative",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          borderBottom: "1px solid #ccfbf1",
          display: "flex",
          alignItems: "center",
          justifyContent: isOpen ? "flex-start" : "center",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: "#181818",
            letterSpacing: isOpen ? 1 : 0,
            whiteSpace: "nowrap",
          }}
        >
          AMP
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
 
      {/* History List */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 2,
 
          // Scrollbar styles
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "transparent",
            borderRadius: "10px",
          },
          "&:hover::-webkit-scrollbar-thumb": {
            background: "rgba(0,0,0,0.25)",
          },
 
          scrollbarWidth: "thin",
          scrollbarColor: "transparent transparent",
        }}
      >
        {isOpen && (
          <>
            <Typography
              variant="caption"
              sx={{ color: "#5eead4", fontWeight: 700, mb: 1 }}
            >
              RECENT
            </Typography>
 
            {chatList.map((chat) => (
              <Box
    key={chat?.id}
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      mb: 0.5,
      borderRadius: 2,

      backgroundColor:
        activeChatId === chat.id ? "#14b8a6" : "transparent",

      "&:hover": {
        backgroundColor:
          activeChatId === chat.id
            ? "#14b8a6"
            : "#ccfbf1",
      },
    }}
  >
    {/* Chat Button (UNCHANGED LOGIC) */}
    <Button
      fullWidth
      onClick={() => onOpenChat(chat.id)}
      sx={{
        flex: 1,
        justifyContent: "flex-start",
        textTransform: "none",
        px: 1.5,
        py: 1,
        borderRadius: 2,

        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",

        color:
          activeChatId === chat.id ? "#ffffff" : "#134e4a",
      }}
    >
      {getShortTitle(chat.title)}
    </Button>

    {/* DELETE ICON (NEW FEATURE) */}
    <IconButton
      size="small"
      onClick={(e) => {
        e.stopPropagation();   // 🚨 prevents opening chat
        onDeleteChat(chat.id);
      }}
      sx={{
        mr: 1,
        color:
          activeChatId === chat.id ? "#ffffff" : "#134e4a",

        "&:hover": {
          color: "#ef4444",
        },
      }}
    >
      <DeleteIcon fontSize="small" />
    </IconButton>
  </Box>
))}

          </>
        )}
      </Box>
 
      {/* Toggle Button */}
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          right: -16,
          transform: "translateY(-50%)",
          zIndex: 10,
        }}
      >
        <IconButton
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
 
 