import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Link,
  MenuItem,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";

type AuthState = "login" | "register";

/**
 * n8n Signup/Login Webhook Call
 */
const authWebhook = async (
  action: "login" | "signup",
  data: any
) => {
  // NOTE: Ensure this URL matches your n8n webhook exactly
  const response = await fetch(
    `http://54.226.23.150:5678/webhook/28b70d38-c7aa-4cd8-bbcc-bb5a2a2412e1/auth/${action}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );

  const result = await response.json();

  // 1. Check for HTTP errors (like 401 Unauthorized or 500 Server Error)
  if (!response.ok) {
    throw new Error(result?.message || "Authentication failed");
  }

  // 2. Check for logical errors (if n8n returns 200 OK but says success: false)
  if (result.success === false) {
    throw new Error(result.message || "Operation failed");
  }

  return result; 
};

const Auth: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [state, setState] = useState<AuthState>("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    role: "user",
    sector: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const toggleState = () => {
    setState((prev) => (prev === "login" ? "register" : "login"));
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // 1. Prepare Payload based on state
      const payload =
        state === "register"
          ? {
              username: formData.username,
              email: formData.email,
              role: formData.role,
              sector: formData.sector,
              password: formData.password,
            }
          : {
              username: formData.username,
              password: formData.password,
            };

      // 2. Call Webhook
      const response = await authWebhook(
        state === "register" ? "signup" : "login",
        payload
      );

      // ==========================================
      // LOGIC BRANCH: Handle Register vs Login
      // ==========================================

      if (state === "register") {
        // --- SCENARIO A: REGISTRATION ---
        // Do NOT login. Do NOT redirect to upload.
        // Just tell the user it worked and switch to login screen.
        
        setMessage({
          type: "success",
          text: "Registration successful! Please log in with your new credentials.",
        });

        // Switch to login view automatically
        setState("login");
        
        // Optional: Clear the password field for safety
        setFormData((prev) => ({ ...prev, password: "" }));
        
        // Stop execution here
        return; 
      }

      // --- SCENARIO B: LOGIN ---
      // If we get here, state is "login" and webhook was successful.
      
      const user = response.user || {
        username: formData.username,
        role: formData.role || "user",
        sector: formData.sector || "",
      };

      // Store session
      login(user);

      setMessage({
        type: "success",
        text: "Login successful. Redirecting...",
      });

      // Redirect to upload page
      setTimeout(() => {
        navigate("/upload", { replace: true });
      }, 300);

    } catch (err: any) {
      // Handle any errors (401 from n8n, network error, etc.)
      setMessage({
        type: "error",
        text: err.message || "Authentication failed. Check your credentials.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minHeight="100vh" display="flex" flexDirection="column">
      <Box
        flex={1}
        display="flex"
        alignItems="center"
        justifyContent="center"
        bgcolor="#f4f6f8"
        px={2}
      >
        <Paper sx={{ width: "100%", maxWidth: 380, p: 4, borderRadius: 3 }}>
          <Typography variant="h4" fontWeight={600} textAlign="center">
            {state === "login" ? "Login" : "Sign Up"}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            mt={1}
            mb={1}
          >
            {state === "login"
              ? "Please sign in to continue"
              : "Create a new account"}
          </Typography>

          {message && (
            <Alert severity={message.type} sx={{ mb: 1 }}>
              {message.text}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              margin="normal"
              required
            />

            {state === "register" && (
              <>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  margin="normal"
                  required
                />

                <TextField
                  fullWidth
                  select
                  label="Role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  margin="normal"
                  required
                >
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </TextField>

                <TextField
                  fullWidth
                  label="Sector"
                  name="sector"
                  value={formData.sector}
                  onChange={handleChange}
                  margin="normal"
                  required
                />
              </>
            )}

            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 1,
                height: 44,
                borderRadius: 999,
                bgcolor: "teal",
                "&:hover": { bgcolor: "#00796b" },
              }}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={22} sx={{ color: "white" }} />
              ) : state === "login" ? (
                "Login"
              ) : (
                "Sign Up"
              )}
            </Button>
          </Box>

          <Typography variant="body2" textAlign="center" mt={3}>
            {state === "login"
              ? "Don't have an account?"
              : "Already have an account?"}{" "}
            <Link component="button" onClick={toggleState}>
              Click here
            </Link>
          </Typography>
        </Paper>
      </Box>

      <Footer />
    </Box>
  );
};

export default Auth;