import React, { useState } from "react";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

import { Link as RouterLink } from "react-router-dom";

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
import { registerUser } from "../services/authWebhook";


const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState({
  username: "",
  email: "",
  password: "",
});



  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await registerUser(formData);

      setMessage({
        type: "success",
        text: "Registration successful! Please log in.",
      });

      setTimeout(() => navigate("/login"), 800);
    } catch (err: any) {
  setMessage({
    type: "error",
    text:
      err.error ||
      err.username ||
      err.email ||
      err.password ||
      "Registration failed",
  });
}
 finally {
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
  sx={{
    background: "linear-gradient(to right, #f8fafc, #f1f5f9)",
  }}
>

        <Paper
  elevation={3}
  sx={{
    width: "100%",
    maxWidth: 400,
    p: 5,
    borderRadius: 4,
    border: "1px solid #e0f2f1",
    boxShadow: "0px 8px 30px rgba(0,0,0,0.05)",
  }}
>

          <Typography variant="h4" fontWeight={600} textAlign="center">
            Sign Up
          </Typography>

          <Typography variant="body2" color="text.secondary" textAlign="center" mt={1}>
            Create a new account
          </Typography>

          {message && <Alert severity={message.type}>{message.text}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
  fullWidth
  name="username"
  placeholder="UserID"
  margin="normal"
  onChange={handleChange}
  required
  InputProps={{
    startAdornment: <PersonOutlineIcon sx={{ mr: 1, color: "gray" }} />,
  }}
  sx={{
    "& .MuiOutlinedInput-root": {
      borderRadius: "999px",
      backgroundColor: "#ffffff",
      "& fieldset": { borderColor: "#e0e0e0" },
      "&:hover fieldset": { borderColor: "#26a69a" },
      "&.Mui-focused fieldset": { borderColor: "#26a69a" },
    },
    "& input:-webkit-autofill": {
      WebkitBoxShadow: "0 0 0 100px #ffffff inset",
      WebkitTextFillColor: "#000",
    },
  }}
/>

            <TextField
  fullWidth
  name="email"
  placeholder="Email"
  margin="normal"
  onChange={handleChange}
  required
  InputProps={{
    startAdornment: <EmailOutlinedIcon sx={{ mr: 1, color: "gray" }} />,
  }}
  sx={{
    "& .MuiOutlinedInput-root": {
      borderRadius: "999px",
      backgroundColor: "#ffffff",
      "& fieldset": { borderColor: "#e0e0e0" },
      "&:hover fieldset": { borderColor: "#26a69a" },
      "&.Mui-focused fieldset": { borderColor: "#26a69a" },
    },
    "& input:-webkit-autofill": {
      WebkitBoxShadow: "0 0 0 100px #ffffff inset",
      WebkitTextFillColor: "#000",
    },
  }}
/>

            

            <TextField
  fullWidth
  name="password"
  type="password"
  placeholder="Password"
  margin="normal"
  onChange={handleChange}
  required
  InputProps={{
    startAdornment: <LockOutlinedIcon sx={{ mr: 1, color: "gray" }} />,
  }}
  sx={{
    "& .MuiOutlinedInput-root": {
      borderRadius: "999px",
      backgroundColor: "#ffffff",
      "& fieldset": { borderColor: "#e0e0e0" },
      "&:hover fieldset": { borderColor: "#26a69a" },
      "&.Mui-focused fieldset": { borderColor: "#26a69a" },
    },
    "& input:-webkit-autofill": {
      WebkitBoxShadow: "0 0 0 100px #ffffff inset",
      WebkitTextFillColor: "#000",
    },
  }}
/>


            <Button
  type="submit"
  fullWidth
  variant="contained"
  sx={{
    mt: 2,
    height: 50,
    borderRadius: "999px",
    fontWeight: 600,
    fontSize: 16,
    background: "linear-gradient(90deg, #009688, #26a69a)",
    boxShadow: "0 4px 12px rgba(0,150,136,0.3)",
    "&:hover": {
      background: "linear-gradient(90deg, #00897b, #26a69a)",
    },
  }}
  disabled={loading}
>

              {loading ? <CircularProgress size={22} sx={{ color: "white" }} /> : "Sign Up"}
            </Button>
          </Box>

          <Typography variant="body2" textAlign="center" mt={3}>
            Already have an account?{" "}
            <Link
  component={RouterLink}
  to="/login"
  sx={{ color: "#009688", fontWeight: 500 }}
>
  Click here
</Link>

          </Typography>
        </Paper>
      </Box>

      <Footer />
    </Box>
  );
};

export default RegisterPage;
