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

// Define the interface matching your JSON output
interface OperationalExcellenceData {
  current_gp_percent: string;
  gp_ambition_percent: string;
  priority_levers_for_margin_uplift: string[];
  commercial_transformation_plan: string;
}

const TEMPLATE_NAME = "Operational_Excellence_Strategy";

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

export default function OperationalExcellencePage() {
  const { globalData, setGlobalData } = useData();

  const operationalData: OperationalExcellenceData =
    globalData?.Operational_Excellence_Strategy || {
      current_gp_percent: "",
      gp_ambition_percent: "",
      priority_levers_for_margin_uplift: [],
      commercial_transformation_plan: "",
    };

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
    if (globalData?.Operational_Excellence_Strategy && !editable.isEditing) {
      editable.updateDraft(globalData.Operational_Excellence_Strategy);
    }
  }, [globalData?.Operational_Excellence_Strategy]);

  // STEP 1: Load data from database when component mounts
  useEffect(() => {
    const loadDataFromDB = async () => {
      if (dataLoadedFromDB.current) return;

      console.log("Loading operational excellence from database...");
      setInitialLoading(true);

      try {
        const response = await fetch(`${API_BASE_URL}/operational-excellence/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const dbData = await response.json();
          console.log("Operational excellence loaded from DB:", dbData);

          if (dbData && Object.keys(dbData).length > 0) {
            setGlobalData((prev: any) => ({
              ...prev,
              Operational_Excellence_Strategy: dbData,
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
        console.log("Operational excellence already in DB, skipping auto-save");
        return;
      }

      const hasValidData =
        operationalData &&
        (operationalData.current_gp_percent ||
          operationalData.gp_ambition_percent ||
          operationalData.priority_levers_for_margin_uplift?.length > 0 ||
          operationalData.commercial_transformation_plan);

      const isNewDataFromChatbot = operationalData && !operationalData.id;

      if (hasValidData && isNewDataFromChatbot && !autoSaveAttempted.current) {
        console.log("New operational excellence from chatbot detected, auto-saving...");
        autoSaveAttempted.current = true;

        try {
          console.log("Sending operational excellence to backend:", operationalData);

          const response = await fetch(
            `${API_BASE_URL}/operational-excellence/save_strategy/`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(operationalData),
            }
          );

          const result = await response.json();
          console.log("Auto-save response:", result);

          if (response.ok && result.success) {
            setGlobalData((prev: any) => ({
              ...prev,
              Operational_Excellence_Strategy: result.data,
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

  // Handle field changes
  const handleFieldChange = (
    field: keyof OperationalExcellenceData,
    value: string | string[]
  ) => {
    editable.updateDraft({
      ...editable.draftData,
      [field]: value,
    });
  };

  // Handle array field changes (for priority levers)
  const handleArrayItemChange = (index: number, value: string) => {
    const updatedArray = [...editable.draftData.priority_levers_for_margin_uplift];
    updatedArray[index] = value;
    handleFieldChange("priority_levers_for_margin_uplift", updatedArray);
  };

  // STEP 3: Manual save
  const handleManualSave = async () => {
    setLoading(true);
    try {
      console.log("Manual save - sending operational excellence:", editable.draftData);

      const response = await fetch(
        `${API_BASE_URL}/operational-excellence/save_strategy/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editable.draftData),
        }
      );

      const result = await response.json();
      console.log("Manual save response:", result);

      if (response.ok && result.success) {
        setGlobalData((prev: any) => ({
          ...prev,
          Operational_Excellence_Strategy: result.data,
        }));

        editable.saveEdit(() => {
          // Save completed
        });

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
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
        }}
      >
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading operational excellence...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "#ffffff", p: 2 }}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Box sx={{ maxWidth: 1600, mx: "auto", px: 4, py: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            mb: 2,
          }}
        >
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
                sx={{
                  backgroundColor: "#008080",
                  ml: 2,
                  color: "#fff",
                  "&:hover": {
                    backgroundColor: "#006d6d",
                  },
                }}
              >
                {loading ? <CircularProgress size={24} /> : "Save"}
              </Button>
              <Button
                variant="outlined"
                onClick={editable.cancelEdit}
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

          {/* GP Metrics Table */}
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
                        value={editable.draftData.current_gp_percent}
                        onChange={(e) =>
                          handleFieldChange("current_gp_percent", e.target.value)
                        }
                        InputProps={{
                          sx: { color: "#000000" },
                        }}
                      />
                    ) : (
                      editable.draftData.current_gp_percent
                    )}
                  </MetricBodyCell>
                  <MetricBodyCell>
                    {editable.isEditing ? (
                      <TextField
                        size="small"
                        fullWidth
                        value={editable.draftData.gp_ambition_percent}
                        onChange={(e) =>
                          handleFieldChange("gp_ambition_percent", e.target.value)
                        }
                        InputProps={{
                          sx: { color: "#000000" },
                        }}
                      />
                    ) : (
                      editable.draftData.gp_ambition_percent
                    )}
                  </MetricBodyCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {/* Priority Levers Section */}
          <Box sx={{ mb: 3 }}>
            <SectionHeader>
              What are the priority levers to drive margin uplift?
            </SectionHeader>
            <SectionBody>
              {editable.isEditing ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {editable.draftData.priority_levers_for_margin_uplift.map(
                    (item, idx) => (
                      <TextField
                        key={idx}
                        size="small"
                        fullWidth
                        value={item}
                        onChange={(e) =>
                          handleArrayItemChange(idx, e.target.value)
                        }
                        placeholder={`Lever ${idx + 1}`}
                        InputProps={{
                          sx: { color: "#000000" },
                        }}
                      />
                    )
                  )}
                </Box>
              ) : (
                editable.draftData.priority_levers_for_margin_uplift.map(
                  (item, idx) => (
                    <Typography
                      key={idx}
                      sx={{ mb: 1, fontSize: 13, color: "#000000" }}
                    >
                      • {item}
                    </Typography>
                  )
                )
              )}
            </SectionBody>
          </Box>

          {/* Commercial Transformation Section */}
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
                  value={editable.draftData.commercial_transformation_plan}
                  onChange={(e) =>
                    handleFieldChange(
                      "commercial_transformation_plan",
                      e.target.value
                    )
                  }
                  InputProps={{
                    sx: { color: "#000000" },
                  }}
                />
              ) : (
                <Typography
                  sx={{ fontSize: 13, whiteSpace: "pre-wrap", color: "#000000" }}
                >
                  {editable.draftData.commercial_transformation_plan}
                </Typography>
              )}
            </SectionBody>
          </Box>

          <Typography sx={{ fontSize: 10, color: "#6b7280", mt: 2 }}>
            Classification: Controlled. Copyright ©2025 Version 1. All rights
            reserved.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
