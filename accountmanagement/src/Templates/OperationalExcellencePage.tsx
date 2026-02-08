import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  styled,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import DownloadTemplates from "../components/DownloadTemplates";
import { useData } from "../context/DataContext";

const API_BASE_URL = "http://localhost:8000/api";
const TEMPLATE_NAME = "Operational_Excellence_Strategy";

// ✅ 1. Match Interface to your JSON
interface OperationalExcellenceData {
  current_gp_percentage: string;
  gp_percentage_ambition: string;
  priority_levers_to_drive_margin_uplift: string[];
  plan_for_commercial_model_transformation: string[];
}

// Styled components for consistency
const SectionHeader = styled(Box)(({ theme }) => ({
  backgroundColor: "#022D36",
  color: "#ffffff",
  padding: "10px 16px",
  fontWeight: 700,
  fontSize: "0.95rem",
}));

const SectionBody = styled(Paper)(({ theme }) => ({
  padding: "16px",
  backgroundColor: "#ffffff",
  border: "1px solid #e0e0e0",
  borderRadius: 0,
}));

export default function OperationalExcellencePage() {
  const { globalData, setGlobalData } = useData();
  
  // ✅ 2. Get User ID safely
  const userId = globalData?.user_id || localStorage.getItem("user_id") || "101";
  
  // Access data from global store (or empty default)
  const backendData = globalData?.operational_excellence_strategy || {};

  // ✅ 3. Local State mapped to JSON keys
  const [formData, setFormData] = useState<OperationalExcellenceData>({
    current_gp_percentage: "",
    gp_percentage_ambition: "",
    priority_levers_to_drive_margin_uplift: [],
    plan_for_commercial_model_transformation: [],
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as any });

  const dataLoadedFromDB = useRef(false);
  const autoSaveAttempted = useRef(false);

  // Sync Global Data to Local Form
  useEffect(() => {
    if (backendData && Object.keys(backendData).length > 0) {
      setFormData({
        current_gp_percentage: backendData.current_gp_percentage || "",
        gp_percentage_ambition: backendData.gp_percentage_ambition || "",
        priority_levers_to_drive_margin_uplift: backendData.priority_levers_to_drive_margin_uplift || [],
        plan_for_commercial_model_transformation: backendData.plan_for_commercial_model_transformation || [],
      });
    }
  }, [backendData]);

  // ✅ 4. Load Data from DB on Mount
  useEffect(() => {
    const fetchData = async () => {
      if (dataLoadedFromDB.current) return;
      try {
        const res = await fetch(`${API_BASE_URL}/operational-excellence/?user_id=${userId}`);
        const data = await res.json();
        if (data && Object.keys(data).length > 0) {
          setGlobalData((prev: any) => ({ ...prev, operational_excellence_strategy: data }));
          dataLoadedFromDB.current = true;
        }
      } catch (err) {
        console.error("Failed to load data", err);
      }
    };
    fetchData();
  }, [userId, setGlobalData]);

  // ✅ 5. Auto-Save Logic (if chatbot pushes new data)
  useEffect(() => {
    const autoSave = async () => {
      const hasData = backendData && Object.keys(backendData).length > 0;
      if (hasData && !autoSaveAttempted.current && !dataLoadedFromDB.current) {
        autoSaveAttempted.current = true;
        try {
          await fetch(`${API_BASE_URL}/operational-excellence/save/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, ...backendData }),
          });
          setSnackbar({ open: true, message: "Auto-saved from Chatbot", severity: "success" });
          dataLoadedFromDB.current = true;
        } catch (e) {
          console.error("Auto-save failed", e);
        }
      }
    };
    // small delay to ensure state is settled
    const t = setTimeout(autoSave, 1000);
    return () => clearTimeout(t);
  }, [backendData, userId]);


  // ✅ 6. Manual Save Handler
  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = { user_id: userId, ...formData };
      const res = await fetch(`${API_BASE_URL}/operational-excellence/save/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (res.ok) {
        setGlobalData((prev: any) => ({ ...prev, operational_excellence_strategy: result.data }));
        setSnackbar({ open: true, message: "Saved Successfully", severity: "success" });
        setIsEditing(false);
      }
    } catch (e) {
      setSnackbar({ open: true, message: "Save Failed", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Helper to handle text changes
  const handleChange = (field: keyof OperationalExcellenceData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Helper to convert Array -> String for TextFields
  const arrayToString = (arr: string[]) => (arr || []).join("\n");
  // Helper to convert String -> Array for Saving
  const stringToArray = (str: string) => str.split("\n").filter(line => line.trim() !== "");

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "#fff", p: 4 }}>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>

      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        {/* Header Actions */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2, gap: 2 }}>
          <DownloadTemplates templateName={TEMPLATE_NAME} />
          {!isEditing ? (
            <Button variant="outlined" onClick={() => setIsEditing(true)}>Edit</Button>
          ) : (
            <>
              <Button variant="outlined" color="error" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button variant="contained" onClick={handleSave} disabled={loading}>
                {loading ? <CircularProgress size={24} color="inherit" /> : "Save"}
              </Button>
            </>
          )}
        </Box>

        {/* --- TEMPLATE CONTENT --- */}
        <Box id="template-to-download">
          <Typography variant="h4" sx={{ color: "#008080", fontWeight: 700, mb: 3 }}>
            Operational Excellence Strategy
          </Typography>

          {/* 1. GP Metrics Row */}
          <Box sx={{ display: "flex", gap: 3, mb: 3 }}>
            <Box sx={{ flex: 1 }}>
              <SectionHeader>Current GP %</SectionHeader>
              <SectionBody>
                {isEditing ? (
                  <TextField 
                    fullWidth size="small" 
                    value={formData.current_gp_percentage} 
                    onChange={(e) => handleChange("current_gp_percentage", e.target.value)} 
                  />
                ) : (
                  <Typography>{formData.current_gp_percentage || "TBD"}</Typography>
                )}
              </SectionBody>
            </Box>
            <Box sx={{ flex: 1 }}>
              <SectionHeader>GP % Ambition</SectionHeader>
              <SectionBody>
                {isEditing ? (
                  <TextField 
                    fullWidth size="small" 
                    value={formData.gp_percentage_ambition} 
                    onChange={(e) => handleChange("gp_percentage_ambition", e.target.value)} 
                  />
                ) : (
                  <Typography>{formData.gp_percentage_ambition || "TBD"}</Typography>
                )}
              </SectionBody>
            </Box>
          </Box>

          {/* 2. Priority Levers (List) */}
          <Box sx={{ mb: 3 }}>
            <SectionHeader>Priority Levers to Drive Margin Uplift</SectionHeader>
            <SectionBody>
              {isEditing ? (
                <TextField 
                  multiline rows={4} fullWidth 
                  value={arrayToString(formData.priority_levers_to_drive_margin_uplift)} 
                  onChange={(e) => handleChange("priority_levers_to_drive_margin_uplift", stringToArray(e.target.value))} 
                  placeholder="Enter each lever on a new line"
                />
              ) : (
                <Box component="ul" sx={{ m: 0, pl: 2 }}>
                  {formData.priority_levers_to_drive_margin_uplift.length > 0 ? (
                    formData.priority_levers_to_drive_margin_uplift.map((item, i) => (
                      <li key={i}><Typography>{item}</Typography></li>
                    ))
                  ) : <Typography>TBD</Typography>}
                </Box>
              )}
            </SectionBody>
          </Box>

          {/* 3. Commercial Transformation (List) */}
          <Box sx={{ mb: 3 }}>
            <SectionHeader>Plan for Commercial Model Transformation</SectionHeader>
            <SectionBody>
              {isEditing ? (
                <TextField 
                  multiline rows={4} fullWidth 
                  value={arrayToString(formData.plan_for_commercial_model_transformation)} 
                  onChange={(e) => handleChange("plan_for_commercial_model_transformation", stringToArray(e.target.value))} 
                  placeholder="Enter each plan item on a new line"
                />
              ) : (
                <Box component="ul" sx={{ m: 0, pl: 2 }}>
                  {formData.plan_for_commercial_model_transformation.length > 0 ? (
                    formData.plan_for_commercial_model_transformation.map((item, i) => (
                      <li key={i}><Typography>{item}</Typography></li>
                    ))
                  ) : <Typography>TBD</Typography>}
                </Box>
              )}
            </SectionBody>
          </Box>
          
          <Typography fontSize={10} color="gray">Classification: Controlled. Copyright ©2025 Version 1.</Typography>
        </Box>
      </Box>
    </Box>
  );
}