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
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import DownloadTemplates from "../components/DownloadTemplates";
import { useEditableTable } from "../hooks/useEditableTable";
import { useData } from "../context/DataContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const TEMPLATE_NAME = "Critical_Risk_Tracking";

// Define the interface matching your JSON output
interface CriticalRisk {
  category: string;
  risk_number: number;
  description_of_risk: string;
  impact_of_risk: string;
  timeline: string;
  countermeasures_taken: string;
  owner: string;
}

// Styling
const headerCell = {
  backgroundColor: "#022D36",
  color: "#ffffff",
  fontWeight: 700,
  fontSize: 12,
  border: "1px solid #000",
  padding: "8px",
};

const cell = {
  border: "1px solid #000",
  fontSize: 12,
  height: 42,
  padding: "8px",
};

const categoryCell = {
  backgroundColor: "#177E89",
  color: "#ffffff",
  fontWeight: 700,
  verticalAlign: "middle",
};

const CriticalRiskPage: React.FC = () => {
  const { globalData, setGlobalData } = useData();
  const risksData: CriticalRisk[] = globalData?.Critical_Risk_Tracking || [];

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
  const editable = useEditableTable(risksData);

  // Create placeholder rows if no data (show 5 empty rows)
  const displayData =
    editable.draftData.length > 0
      ? editable.draftData
      : Array(5)
          .fill({
            category: "",
            risk_number: 0,
            description_of_risk: "",
            impact_of_risk: "",
            timeline: "",
            countermeasures_taken: "",
            owner: "",
          })
          .map((item, idx) => ({ ...item, risk_number: idx + 1 }));

  // Update draft when data changes from chatbot
  useEffect(() => {
    if (risksData && risksData.length > 0 && !editable.isEditing) {
      editable.updateDraft(risksData);
    }
  }, [risksData]);

  // STEP 1: Load data from database when component mounts
  useEffect(() => {
    const loadDataFromDB = async () => {
      if (dataLoadedFromDB.current) return;

      console.log("Loading critical risks from database...");
      setInitialLoading(true);

      try {
        const response = await fetch(`${API_BASE_URL}/critical-risk/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const dbData = await response.json();
          console.log("Critical risks loaded from DB:", dbData);

          if (dbData && dbData.data && dbData.data.length > 0) {
            setGlobalData((prev: any) => ({
              ...prev,
              Critical_Risk_Tracking: dbData.data,
            }));
            dataLoadedFromDB.current = true;
          } else {
            console.log("No critical risks found in database");
          }
        }
      } catch (error) {
        console.error("Error loading critical risks from DB:", error);
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
        console.log("Critical risks already in DB, skipping auto-save");
        return;
      }

      const hasValidData = risksData && risksData.length > 0;
      const isNewDataFromChatbot =
        risksData && risksData.length > 0 && !risksData[0]?.id;

      if (hasValidData && isNewDataFromChatbot && !autoSaveAttempted.current) {
        console.log("New critical risks from chatbot detected, auto-saving...");
        autoSaveAttempted.current = true;

        try {
          const payload = { data: risksData };
          console.log("Sending critical risks to backend:", payload);

          const response = await fetch(
            `${API_BASE_URL}/critical-risk/save_risks/`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            }
          );

          const result = await response.json();
          console.log("Auto-save response:", result);

          if (response.ok && result.success) {
            setGlobalData((prev: any) => ({
              ...prev,
              Critical_Risk_Tracking: result.data.data,
            }));

            setSnackbar({
              open: true,
              message: "✅ Critical Risks auto-saved to database",
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
  }, [risksData, setGlobalData]);

  // Group risks by category for display
  const groupedRisks = displayData.reduce((acc, risk) => {
    const cat = risk.category || "Category";
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(risk);
    return acc;
  }, {} as Record<string, CriticalRisk[]>);

  // Handle field changes
  const handleFieldChange = (
    riskIndex: number,
    field: keyof CriticalRisk,
    value: string | number
  ) => {
    const updatedData = [...editable.draftData];
    updatedData[riskIndex] = {
      ...updatedData[riskIndex],
      [field]: value,
    };
    editable.updateDraft(updatedData);
  };

  // Find global index for a risk in grouped structure
  const getGlobalIndex = (category: string, localIndex: number): number => {
    let globalIndex = 0;
    for (const [cat, risks] of Object.entries(groupedRisks)) {
      if (cat === category) {
        return globalIndex + localIndex;
      }
      globalIndex += risks.length;
    }
    return globalIndex;
  };

  // STEP 3: Manual save
  const handleManualSave = async () => {
    setLoading(true);
    try {
      const payload = { data: editable.draftData };
      console.log("Manual save - sending critical risks:", payload);

      const response = await fetch(
        `${API_BASE_URL}/critical-risk/save_risks/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      console.log("Manual save response:", result);

      if (response.ok && result.success) {
        setGlobalData((prev: any) => ({
          ...prev,
          Critical_Risk_Tracking: result.data.data,
        }));

        editable.saveEdit(() => {
          // Save completed
        });

        setSnackbar({
          open: true,
          message: "✅ Critical Risks successfully saved",
          severity: "success",
        });
      } else {
        throw new Error(result.message || "Failed to save");
      }
    } catch (error) {
      console.error("Manual save error:", error);
      setSnackbar({
        open: true,
        message: "❌ Failed to save Critical Risks",
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
        <Typography sx={{ ml: 2 }}>Loading critical risks...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "#fff", p: 2 }}>
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

      <Box sx={{ maxWidth: 1800, mx: "auto", px: 4, py: 2 }}>
        {/* HEADER */}
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
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#008080",
              mb: 2,
            }}
          >
            Critical risk tracking
          </Typography>

          {/* TABLE */}
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  {[
                    "Category",
                    "#",
                    "Description of Risk",
                    "Impact of Risk",
                    "Timeline",
                    "Countermeasures Taken",
                    "Owner",
                  ].map((header) => (
                    <TableCell key={header} sx={headerCell}>
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(groupedRisks).map(([category, risks]) =>
                  risks.map((risk, idx) => {
                    const globalIndex = getGlobalIndex(category, idx);
                    return (
                      <TableRow key={globalIndex}>
                        {/* Category cell with rowspan */}
                        {idx === 0 && (
                          <TableCell
                            rowSpan={risks.length}
                            sx={{ ...cell, ...categoryCell }}
                          >
                            {editable.isEditing ? (
                              <TextField
                                fullWidth
                                size="small"
                                value={risk.category}
                                onChange={(e) =>
                                  handleFieldChange(
                                    globalIndex,
                                    "category",
                                    e.target.value
                                  )
                                }
                                sx={{
                                  "& .MuiInputBase-root": {
                                    color: "white",
                                  },
                                  "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "rgba(255, 255, 255, 0.3)",
                                  },
                                }}
                              />
                            ) : (
                              category
                            )}
                          </TableCell>
                        )}

                        {/* Risk number */}
                        <TableCell sx={cell}>
                          {editable.isEditing ? (
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              value={risk.risk_number}
                              onChange={(e) =>
                                handleFieldChange(
                                  globalIndex,
                                  "risk_number",
                                  parseInt(e.target.value) || 0
                                )
                              }
                            />
                          ) : (
                            risk.risk_number || ""
                          )}
                        </TableCell>

                        {/* Description of Risk */}
                        <TableCell sx={cell}>
                          {editable.isEditing ? (
                            <TextField
                              fullWidth
                              size="small"
                              value={risk.description_of_risk}
                              onChange={(e) =>
                                handleFieldChange(
                                  globalIndex,
                                  "description_of_risk",
                                  e.target.value
                                )
                              }
                            />
                          ) : (
                            risk.description_of_risk
                          )}
                        </TableCell>

                        {/* Impact of Risk */}
                        <TableCell sx={cell}>
                          {editable.isEditing ? (
                            <TextField
                              fullWidth
                              size="small"
                              value={risk.impact_of_risk}
                              onChange={(e) =>
                                handleFieldChange(
                                  globalIndex,
                                  "impact_of_risk",
                                  e.target.value
                                )
                              }
                            />
                          ) : (
                            risk.impact_of_risk
                          )}
                        </TableCell>

                        {/* Timeline */}
                        <TableCell sx={cell}>
                          {editable.isEditing ? (
                            <TextField
                              fullWidth
                              size="small"
                              value={risk.timeline}
                              onChange={(e) =>
                                handleFieldChange(
                                  globalIndex,
                                  "timeline",
                                  e.target.value
                                )
                              }
                            />
                          ) : (
                            risk.timeline
                          )}
                        </TableCell>

                        {/* Countermeasures Taken */}
                        <TableCell sx={cell}>
                          {editable.isEditing ? (
                            <TextField
                              fullWidth
                              size="small"
                              value={risk.countermeasures_taken}
                              onChange={(e) =>
                                handleFieldChange(
                                  globalIndex,
                                  "countermeasures_taken",
                                  e.target.value
                                )
                              }
                            />
                          ) : (
                            risk.countermeasures_taken
                          )}
                        </TableCell>

                        {/* Owner */}
                        <TableCell sx={cell}>
                          {editable.isEditing ? (
                            <TextField
                              fullWidth
                              size="small"
                              value={risk.owner}
                              onChange={(e) =>
                                handleFieldChange(
                                  globalIndex,
                                  "owner",
                                  e.target.value
                                )
                              }
                            />
                          ) : (
                            risk.owner
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography sx={{ fontSize: 10, color: "#6b7280", mt: 3 }}>
            Classification: Controlled. Copyright ©2025 Version 1. All rights
            reserved.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default CriticalRiskPage;
