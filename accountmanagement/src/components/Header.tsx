import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import v1Logo from "../assets/version1.png";
import profileIcon from "../assets/profileIcon.png";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const goBack = () => navigate(-1);
  const { logout, user } = useAuth();
  const pathname = location.pathname;
  const showBackButton = pathname === "/app";

  const showProfile =
    pathname === "/upload" ||
    pathname.includes("/chat");


  const isLoginPage = location.pathname === "/login";
  const isUpload = location.pathname.startsWith("/upload");
  const isChat = location.pathname.startsWith("/chat");

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleLogout = () => {
    setAnchorEl(null);
    logout();
    navigate("/login", { replace: true });
  };

  if (isLoginPage) return null;

  return (
    <AppBar
      position="static"
      elevation={1}
      sx={{
        backgroundColor: "white",
        borderBottom: "1px solid #e5e7eb",
        height: 56,
        justifyContent: "center",
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          minHeight: 56,
          px: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            display="flex"
            alignItems="center"
            sx={{ cursor: "pointer" }}
            onClick={() => navigate("/upload")}
          >
            <Box
              component="img"
              src={v1Logo}
              alt="Version 1"
              sx={{ height: 40 }}
            />
          </Box>

          {showBackButton && (
            <IconButton
              onClick={goBack}
              sx={{
                border: "1px solid #e5e7eb",
                borderRadius: 2,
                width: 36,
                height: 36,
                "&:hover": { backgroundColor: "#f1f5f9" },
              }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        <Box display="flex" alignItems="center" gap={3}>
          <Typography
            sx={{
              cursor: "pointer",
              fontWeight: isUpload ? 700 : 500,
              color: isUpload ? "#008080" : "#374151",
              "&:hover": { color: "#008080" },
            }}
            onClick={() => navigate("/upload")}
          >
            Upload
          </Typography>

          <Typography
            sx={{
              cursor: "pointer",
              fontWeight: isChat ? 700 : 500,
              color: isChat ? "#008080" : "#374151",
              "&:hover": { color: "#008080" },
            }}
            onClick={() => navigate("/chat")}
          >
            Chatbot
          </Typography>

          {showProfile && (
            <>
              <IconButton aria-label="Open profile menu" onClick={(e) => setAnchorEl(e.currentTarget)}>
                <Avatar src={profileIcon} sx={{ width: 32, height: 32 }} />
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                <MenuItem disabled>
                  <Typography fontSize={14}>
                    {user?.username || "User"}
                  </Typography>
                </MenuItem>

                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
