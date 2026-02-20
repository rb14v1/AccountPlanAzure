import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  styled,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import DownloadTemplates from "../components/DownloadTemplates";
import { useEditableTable } from "../hooks/useEditableTable";
import { useData } from "../context/DataContext";

const API_BASE_URL = "http://localhost:8000/api";
const TEMPLATE_NAME = "operational_excellence_strategy";

// 1. UPDATED INTERFACE: Matches backend output to prevent data loss
interface OperationalExcellenceData {
  current_gp_percentage: string;
  gp_percentage_ambition: string;
  priority_levers_to_drive_margin_uplift: string[];
  plan_for_commercial_model_transformation: string;
  id?: any;
}

const MetricHeaderCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: "#022D36",
  color: "#ffffff",
  fontWeight: 700,
  fontSize: theme.typography.pxToRem(12),
  textAlign: "center",
  border: "1px solid #000",
  padding: 8,
}));

const MetricBodyCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: "#F2F2F2",
  color: "#000000",
  fontWeight: 600,
  fontSize: theme.typography.pxToRem(12),
  textAlign: "center",
  border: "1px solid #000",
  padding: 8,
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  backgroundColor: "#022D36",
  color: "#ffffff",
  padding: "10px 16px",
  fontWeight: 700,
  fontSize: theme.typography.pxToRem(14),
}));

const SectionBody = styled(Box)(({ theme }) => ({
  backgroundColor: "#F2F2F2",
  color: "#000000",
  border: "1px solid #ccc",
  padding: 16,
  minHeight: 120,
}));

// 2. SAFETY EXTRACTOR: Bridges backend and frontend keys to prevent crashes
const extractData = (source: any): OperationalExcellenceData => {
  const data = source?.data || source || {};

  // Check for both old frontend keys and new backend keys
  const levers = data.priority_levers_to_drive_margin_uplift || data.priority_levers_for_margin_uplift;
  const plan = data.plan_for_commercial_model_transformation || data.commercial_transformation_plan;

  return {
    current_gp_percentage: data.current_gp_percentage || data.current_gp_percent || "",
    gp_percentage_ambition: data.gp_percentage_ambition || data.gp_ambition_percent || "",
    priority_levers_to_drive_margin_uplift: Array.isArray(levers) ? levers : [],
    // Safely handles if backend accidentally returns an array for the text block
    plan_for_commercial_model_transformation: Array.isArray(plan) ? plan.join("\n") : (plan || ""),
    id: data.id,
  };
};

export default function OperationalExcellencePage() {
  const { globalData, setGlobalData } = useData();

  const operationalData = extractData(globalData?.operational_excellence_strategy);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning",
  });

  const autoSaveAttempted = useRef(false);
  const dataLoadedFromDB = useRef(false);

  // Initialize editable table hook
  const editable = useEditableTable(operationalData);

  // Update draft when data changes from chatbot
  useEffect(() => {
    if (globalData?.operational_excellence_strategy && !editable.isEditing) {
      editable.updateDraft(extractData(globalData.operational_excellence_strategy));
    }
  }, [globalData?.operational_excellence_strategy]);

  // STEP 1: Load data from database
  useEffect(() => {
    const loadDataFromDB = async () => {
      if (dataLoadedFromDB.current) return;

      console.log("Loading operational excellence from database...");
      setInitialLoading(true);

      try {
        // Pointed to unified template payload view
        const response = await fetch(`${API_BASE_URL}/template-payload/${TEMPLATE_NAME}/?user_id=101`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const dbData = await response.json();
          console.log("Operational excellence loaded from DB:", dbData);
          const parsedData = extractData(dbData);

          if (dbData && Object.keys(dbData).length > 0) {
            setGlobalData((prev: any) => ({
              ...prev,
              operational_excellence_strategy: parsedData,
            }));
            dataLoadedFromDB.current = true;
          } else {
            console.log("No operational excellence found in database");
          }
        }
      } catch (error) {
        console.error("Error loading operational excellence from DB:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadDataFromDB();
  }, [setGlobalData]);

  // STEP 2: Auto-save when NEW data arrives from chatbot
  useEffect(() => {
    const autoSaveToDatabase = async () => {
      if (dataLoadedFromDB.current && !autoSaveAttempted.current) {
        return;
      }

      const hasValidData =
        operationalData.current_gp_percentage ||
        operationalData.gp_percentage_ambition ||
        operationalData.priority_levers_to_drive_margin_uplift.length > 0 ||
        operationalData.plan_for_commercial_model_transformation;

      const isNewDataFromChatbot = operationalData && !operationalData.id;

      if (hasValidData && isNewDataFromChatbot && !autoSaveAttempted.current) {
        console.log("New operational excellence from chatbot detected, auto-saving...");
        autoSaveAttempted.current = true;

        try {
          const payload = { user_id: "101", data: operationalData };

          // Pointed to unified template payload view
          const response = await fetch(`${API_BASE_URL}/template-payload/${TEMPLATE_NAME}/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          const result = await response.json();

          if (response.ok && result.success) {
            setGlobalData((prev: any) => ({
              ...prev,
              operational_excellence_strategy: extractData(result.data),
            }));

            setSnackbar({
              open: true,
              message: "✅ Operational Excellence auto-saved to database",
              severity: "success",
            });
          } else {
            throw new Error(result.message || "Auto-save failed");
          }
        } catch (error) {
          console.error("Auto-save error:", error);
          setSnackbar({
            open: true,
            message: "⚠️ Auto-save failed. You can edit and save manually.",
            severity: "warning",
          });
          autoSaveAttempted.current = false;
        }
      }
    };

    const timeoutId = setTimeout(() => {
      autoSaveToDatabase();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [operationalData, setGlobalData]);

  const handleFieldChange = (field: keyof OperationalExcellenceData, value: string | string[]) => {
    editable.updateDraft({
      ...editable.draftData,
      [field]: value,
    });
  };

  const handleArrayItemChange = (index: number, value: string) => {
    // Make sure we have an array to spread
    const updatedArray = Array.isArray(editable.draftData.priority_levers_to_drive_margin_uplift) 
      ? [...editable.draftData.priority_levers_to_drive_margin_uplift] 
      : [];
    updatedArray[index] = value;
    handleFieldChange("priority_levers_to_drive_margin_uplift", updatedArray);
  };

  // STEP 3: Manual save
  const handleManualSave = async () => {
    setLoading(true);
    try {
      const payload = { user_id: "101", data: editable.draftData };
      
      // Pointed to unified template payload view
      const response = await fetch(`${API_BASE_URL}/template-payload/${TEMPLATE_NAME}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setGlobalData((prev: any) => ({
          ...prev,
          operational_excellence_strategy: extractData(result.data),
        }));

        editable.saveEdit(() => {});

        setSnackbar({
          open: true,
          message: "✅ Operational Excellence successfully saved",
          severity: "success",
        });
      } else {
        throw new Error(result.message || "Failed to save");
      }
    } catch (error) {
      console.error("Manual save error:", error);
      setSnackbar({
        open: true,
        message: "❌ Failed to save Operational Excellence",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading operational excellence...</Typography>
      </Box>
    );
  }

  // 3. SAFE RENDER FALLBACK: Guarantees the array .map() will NEVER crash the app again
  const safeLevers = Array.isArray(editable.draftData.priority_levers_to_drive_margin_uplift) 
    ? editable.draftData.priority_levers_to_drive_margin_uplift 
    : [];

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "#ffffff", p: 2 }}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Box sx={{ maxWidth: 1600, mx: "auto", px: 4, py: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mb: 2 }}>
          <DownloadTemplates templateName={TEMPLATE_NAME} />
          {!editable.isEditing ? (
            <Button
              variant="outlined"
              onClick={editable.startEdit}
              disabled={loading}
              sx={{
                borderColor: "#008080",
                color: "#008080",
                ml: 2,
                "&:hover": {
                  borderColor: "#006d6d",
                  backgroundColor: "#e6f4f4",
                },
              }}
            >
              Edit
            </Button>
          ) : (
            <>
              <Button
                variant="contained"
                onClick={handleManualSave}
                disabled={loading}
                sx={{ backgroundColor: "#008080", ml: 2, color: "#fff", "&:hover": { backgroundColor: "#006d6d" } }}
              >
                {loading ? <CircularProgress size={24} /> : "Save"}
              </Button>
              <Button
                variant="outlined"
                onClick={editable.cancelEdit}
                disabled={loading}
                sx={{ borderColor: "#008080", color: "#008080", ml: 2, "&:hover": { borderColor: "#006d6d", backgroundColor: "#e6f4f4" } }}
              >
                Cancel
              </Button>
            </>
          )}
        </Box>
        <Box id="template-to-download" className="template-section">
          <Box sx={{ mt: 2, mx: "auto" }}>
            <Typography fontSize={35} fontWeight={700} sx={{ color: "teal" }}>
              Operational excellence strategy
            </Typography>
          </Box>

          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <MetricHeaderCell>Current GP%</MetricHeaderCell>
                  <MetricHeaderCell>GP% Ambition</MetricHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <MetricBodyCell>
                    {editable.isEditing ? (
                      <TextField
                        size="small"
                        fullWidth
                        value={editable.draftData.current_gp_percentage}
                        onChange={(e) => handleFieldChange("current_gp_percentage", e.target.value)}
                        InputProps={{ sx: { color: "#000000" } }}
                      />
                    ) : (
                      editable.draftData.current_gp_percentage
                    )}
                  </MetricBodyCell>
                  <MetricBodyCell>
                    {editable.isEditing ? (
                      <TextField
                        size="small"
                        fullWidth
                        value={editable.draftData.gp_percentage_ambition}
                        onChange={(e) => handleFieldChange("gp_percentage_ambition", e.target.value)}
                        InputProps={{ sx: { color: "#000000" } }}
                      />
                    ) : (
                      editable.draftData.gp_percentage_ambition
                    )}
                  </MetricBodyCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mb: 3 }}>
            <SectionHeader>
              What are the priority levers to drive margin uplift?
            </SectionHeader>
            <SectionBody>
              {editable.isEditing ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {safeLevers.map((item, idx) => (
                    <TextField
                      key={idx}
                      size="small"
                      fullWidth
                      value={item}
                      onChange={(e) => handleArrayItemChange(idx, e.target.value)}
                      placeholder={`Lever ${idx + 1}`}
                      InputProps={{ sx: { color: "#000000" } }}
                    />
                  ))}
                  <Button 
                    onClick={() => handleFieldChange("priority_levers_to_drive_margin_uplift", [...safeLevers, ""])} 
                    sx={{ alignSelf: "flex-start", color: "#008080" }}
                  >
                    + Add Lever
                  </Button>
                </Box>
              ) : (
                safeLevers.map((item, idx) => (
                  <Typography key={idx} sx={{ mb: 1, fontSize: 13, color: "#000000" }}>
                    • {item}
                  </Typography>
                ))
              )}
            </SectionBody>
          </Box>

          <Box sx={{ mb: 3 }}>
            <SectionHeader>
              What is the plan for driving commercial model transformation from
              T&M to more FP and outcome linked business?
            </SectionHeader>
            <SectionBody>
              {editable.isEditing ? (
                <TextField
                  multiline
                  rows={4}
                  fullWidth
                  value={editable.draftData.plan_for_commercial_model_transformation}
                  onChange={(e) => handleFieldChange("plan_for_commercial_model_transformation", e.target.value)}
                  InputProps={{ sx: { color: "#000000" } }}
                />
              ) : (
                <Typography sx={{ fontSize: 13, whiteSpace: "pre-wrap", color: "#000000" }}>
                  {editable.draftData.plan_for_commercial_model_transformation}
                </Typography>
              )}
            </SectionBody>
          </Box>

          <Typography sx={{ fontSize: 10, color: "#6b7280", mt: 2 }}>
            Classification: Controlled. Copyright ©2025 Version 1. All rights reserved.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}