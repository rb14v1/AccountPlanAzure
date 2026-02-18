import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import axios from "axios";
import { Navigate } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";

// n8n webhook URL
const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL || "http://localhost:5678/webhook/upload";

export default function UploadPage() {
  const { user, loading } = useAuth();

  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  //  wait for auth to hydrate from localStorage
  if (loading) {
    return null;
  }

  //  protect page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    files.forEach((file) => formData.append("data", file));

    formData.append("username", user.username);
    formData.append("role", user.role);
    formData.append("sector", user.sector);

    try {
      await axios.post(WEBHOOK_URL, formData);
      setMessage({
        type: "success",
        text: "Files uploaded successfully to n8n!",
      });
      setFiles([]);
    } catch (err) {
      setMessage({
        type: "error",
        text: "Failed to upload. Check console for details.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setFiles(Array.from(e.target.files));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <Box minHeight="100vh" display="flex" flexDirection="column">
      <Header />

      <Box
        flex={1}
        display="flex"
        alignItems="center"
        justifyContent="center"
        px={2}
        bgcolor="#f7f9fb"
      >
        <Box width="100%" maxWidth={700}>
          <Typography variant="h4" color="teal" fontWeight={700} mb={3}>
            Upload Files
          </Typography>

          <Paper
            elevation={0}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            sx={{
              border: "2px dashed #0b2b2e",
              p: 5,
              textAlign: "center",
              backgroundColor: "#ffffff",
            }}
          >
            <CloudUploadIcon sx={{ fontSize: 48, color: "#0b2b2e" }} />
            <Typography mt={2} fontWeight={600}>
              Drag & drop files here
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Any file type supported (PDF, Excel, Word, HTML, etc.)
            </Typography>

            <Button
              variant="contained"
              component="label"
              sx={{
                mt: 3,
                backgroundColor: "#0b2b2e",
                "&:hover": { backgroundColor: "#145a60" },
              }}
            >
              Select Files
              <input type="file" hidden multiple onChange={handleChange} />
            </Button>
          </Paper>

          {files.length > 0 && (
            <Box mt={4}>
              <Typography fontWeight={600} mb={1}>
                Selected Files
              </Typography>

              <List sx={{ mb: 2 }}>
                {files.map((file, index) => (
                  <ListItem key={index} disablePadding divider>
                    <ListItemText
                      primary={file.name}
                      secondary={`${(file.size / 1024).toFixed(2)} KB`}
                    />
                  </ListItem>
                ))}
              </List>

              {message && (
                <Alert severity={message.type} sx={{ mb: 2 }}>
                  {message.text}
                </Alert>
              )}

              <Button
                variant="contained"
                fullWidth
                onClick={handleUpload}
                disabled={uploading}
                sx={{
                  bgcolor: "#00838f",
                  py: 1.5,
                  fontSize: "1rem",
                  "&:hover": { bgcolor: "#005662" },
                }}
              >
                {uploading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Submit"
                )}
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      <Footer />
    </Box>
  );
}
