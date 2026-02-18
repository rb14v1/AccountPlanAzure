import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Typography,
  MenuItem,
  styled,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { useData } from "../context/DataContext";
import { useEditableTable } from "../hooks/useEditableTable";
import DownloadTemplates from "../components/DownloadTemplates";

const API_BASE_URL = "http://localhost:8000/api";
const TEMPLATE_NAME = "Relationship_Heatmap";

const RELATIONSHIP_OPTIONS = ["Promoter", "Neutral", "Detractor"];

const PRIMARY_TEAL = "#008080";
const DARK_BG = "#0b1e26";
const COLOR_NEUTRAL = "#d9a441";
const COLOR_PROMOTER = "#90c978";
const COLOR_DETRACTOR = "#e06666";

const StyledTableCell = styled(TableCell)(() => ({
  border: "1px solid #ccc",
  padding: "8px 12px",
  fontSize: "0.8rem",
  verticalAlign: "top", // 🔴 IMPORTANT: allows row height to grow
  whiteSpace: "normal",
  wordBreak: "break-word",
  "&.header": {
    backgroundColor: DARK_BG,
    color: "#fff",
    fontWeight: 700,
    border: "1px solid #000",
  },
}));


const headers = [
  "#",
  "Client Stakeholder",
  "Role",
  "Reports to",
  "Level",
  "Client relationship",
  "Engagement Plan, Next Action",
];

const getRowColorByRelationship = (relationship: string) => {
  const rel = relationship.toLowerCase();
  if (rel.includes("promoter") || rel.includes("strong")) return COLOR_PROMOTER;
  if (rel.includes("detractor") || rel.includes("weak")) return COLOR_DETRACTOR;
  if (rel.includes("neutral") || rel.includes("moderate")) return COLOR_NEUTRAL;
  return "#fff";
};

export default function RelationshipHeatmap() {
  const { globalData, setGlobalData } = useData();
  const backendRows = globalData?.relationship_heatmap || [];

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning",
  });

  const [isPrinting, setIsPrinting] = useState(false);

  const autoSaveAttempted = useRef(false);
  const dataLoadedFromDB = useRef(false);

  const initialRows = [...backendRows];
  while (initialRows.length < 5) {
    initialRows.push({
      stakeholder_number: initialRows.length + 1,
      client_stakeholder: "",
      role: "",
      reports_to: "",
      level: "",
      client_relationship: "",
      engagement_plan_next_action: "",
    });
  }

  const editable = useEditableTable(initialRows);

  // Update draft when data changes from chatbot
  useEffect(() => {
    if (backendRows && backendRows.length > 0 && !editable.isEditing) {
      const updatedRows = [...backendRows];
      while (updatedRows.length < 5) {
        updatedRows.push({
          stakeholder_number: updatedRows.length + 1,
          client_stakeholder: "",
          role: "",
          reports_to: "",
          level: "",
          client_relationship: "",
          engagement_plan_next_action: "",
        });
      }
      editable.updateDraft(updatedRows);
    }
  }, [backendRows]);

  // STEP 1: Load data from database when component mounts
  useEffect(() => {
    const loadDataFromDB = async () => {
      if (dataLoadedFromDB.current) return;

      console.log("Loading relationship heatmap from database...");
      setInitialLoading(true);

      try {
        const response = await fetch(`${API_BASE_URL}/relationship-heatmap/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const dbData = await response.json();
          console.log("Relationship heatmap loaded from DB:", dbData);

          if (dbData && dbData.data && dbData.data.length > 0) {
            setGlobalData((prev: any) => ({
              ...prev,
              relationship_heatmap: dbData.data,
            }));
            dataLoadedFromDB.current = true;
          } else {
            console.log("No relationship heatmap found in database");
          }
        }
      } catch (error) {
        console.error("Error loading relationship heatmap from DB:", error);
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
        console.log("Relationship heatmap already in DB, skipping auto-save");
        return;
      }

      const hasValidData = backendRows && backendRows.length > 0;
      const isNewDataFromChatbot =
        backendRows && backendRows.length > 0 && !backendRows[0]?.id;

      if (hasValidData && isNewDataFromChatbot && !autoSaveAttempted.current) {
        console.log("New relationship heatmap from chatbot detected, auto-saving...");
        autoSaveAttempted.current = true;

        try {
          const payload = { data: backendRows };
          console.log("Sending relationship heatmap to backend:", payload);

          const response = await fetch(
            `${API_BASE_URL}/relationship-heatmap/save_heatmap/`,
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
              relationship_heatmap: result.data.data,
            }));

            setSnackbar({
              open: true,
              message: "✅ Relationship Heatmap auto-saved to database",
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
  }, [backendRows, setGlobalData]);

  const updateCell = (index: number, field: string, value: string) => {
    const updated = [...editable.draftData];
    updated[index] = { ...updated[index], [field]: value };
    editable.updateDraft(updated);
  };

  const addRow = () => {
    editable.updateDraft([
      ...editable.draftData,
      {
        stakeholder_number: editable.draftData.length + 1,
        client_stakeholder: "",
        role: "",
        reports_to: "",
        level: "",
        client_relationship: "",
        engagement_plan_next_action: "",
      },
    ]);
  };

  // STEP 3: Manual save
  const handleManualSave = async () => {
    setLoading(true);
    try {
      const payload = { data: editable.draftData };
      console.log("Manual save - sending relationship heatmap:", payload);

      const response = await fetch(
        `${API_BASE_URL}/relationship-heatmap/save_heatmap/`,
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
          relationship_heatmap: result.data.data,
        }));

        editable.saveEdit(() => {
          // Save completed
        });

        setSnackbar({
          open: true,
          message: "✅ Relationship Heatmap successfully saved",
          severity: "success",
        });
      } else {
        throw new Error(result.message || "Failed to save");
      }
    } catch (error) {
      console.error("Manual save error:", error);
      setSnackbar({
        open: true,
        message: "❌ Failed to save Relationship Heatmap",
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
        <Typography sx={{ ml: 2 }}>Loading relationship heatmap...</Typography>
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
          <DownloadTemplates
            templateName={TEMPLATE_NAME}
            beforeDownload={() => setIsPrinting(true)}
            afterDownload={() => setIsPrinting(false)}
          />

          {!editable.isEditing ? (
            <Button
              variant="outlined"
              onClick={editable.startEdit}
              disabled={loading}
              sx={{
                borderColor: PRIMARY_TEAL,
                color: PRIMARY_TEAL,
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
                  backgroundColor: PRIMARY_TEAL,
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
                  borderColor: PRIMARY_TEAL,
                  color: PRIMARY_TEAL,
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
              color: PRIMARY_TEAL,
              mb: 2,
            }}
          >
            Relationship heatmap
          </Typography>

          {/* TABLE */}
          <TableContainer component={Paper} elevation={0}>
            <Table
  sx={{
    tableLayout: "fixed",
    width: "100%",
    pageBreakInside: "auto",   // ✅ IMPORTANT: allow page breaking ONLY between rows
  }}
>


              <colgroup>
                <col style={{ width: "4%" }} />   {/* # */}
                <col style={{ width: "18%" }} />  {/* Client Stakeholder */}
                <col style={{ width: "18%" }} />  {/* Role */}
                <col style={{ width: "18%" }} />  {/* Reports to */}
                <col style={{ width: "18%" }} />  {/* Level */}
                <col style={{ width: "10%" }} />  {/* Client relationship */}
                <col style={{ width: "14%" }} />  {/* Engagement Plan */}
              </colgroup>

              <TableHead
  sx={{
    display: "table-header-group", // ✅ REQUIRED for repeating header on every page
  }}
>

                <TableRow>
                  {headers.map((h) => (
                    <StyledTableCell key={h} className="header">
                      {h}
                    </StyledTableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {editable.draftData.map((row: any, index: number) => (
                  <TableRow
  key={index}
  sx={{
    backgroundColor: getRowColorByRelationship(
      row.client_relationship
    ),
    pageBreakInside: "avoid", // ✅ CRITICAL: do not split rows across pages
  }}
>

                    <StyledTableCell>{row.stakeholder_number}</StyledTableCell>
                    {[
                      "client_stakeholder",
                      "role",
                      "reports_to",
                      "level",
                      "client_relationship",
                      "engagement_plan_next_action",
                    ].map((field) => (
                      <StyledTableCell key={field}>
                        {editable.isEditing && !isPrinting ? (

                          field === "client_relationship" ? (
                            <TextField
                              select
                              fullWidth
                              size="small"
                              value={row[field]}
                              onChange={(e) =>
                                updateCell(index, field, e.target.value)
                              }
                              SelectProps={{ displayEmpty: true }}
                            >
                              <MenuItem value="">
                                <em>None</em>
                              </MenuItem>
                              {RELATIONSHIP_OPTIONS.map((option) => (
                                <MenuItem key={option} value={option}>
                                  {option}
                                </MenuItem>
                              ))}
                            </TextField>
                          ) : (
                            <TextField
                              fullWidth
                              multiline
                              minRows={1}
                              maxRows={6}
                              size="small"
                              value={row[field]}
                              onChange={(e) =>
                                updateCell(index, field, e.target.value)
                              }
                              InputProps={{
                                style: {
                                  fontSize: "0.8rem",
                                  lineHeight: "1.4",
                                  overflow: "hidden",   // 🔴 stops scrollbar flicker
                                  resize: "none",       // 🔴 prevents resize loop
                                },
                              }}
                            />


                          )
                        ) : (
  <Box
    sx={{
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      fontSize: "0.8rem",
      lineHeight: 1.4,
    }}
  >
    {row[field] || ""}
  </Box>

)}

                      </StyledTableCell>
                    ))}
                  </TableRow>
                ))}

                {/* ADD ROW */}
                {editable.isEditing && (
                  <TableRow>
                    <StyledTableCell colSpan={7}>
                      <Button
                        onClick={addRow}
                        sx={{
                          color: PRIMARY_TEAL,
                          textTransform: "none",
                          "&:hover": { backgroundColor: "#e6f4f4" },
                        }}
                      >
                        + Add stakeholder
                      </Button>
                    </StyledTableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* LEGEND */}
          <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
            {[
              ["Promoter", COLOR_PROMOTER],
              ["Neutral", COLOR_NEUTRAL],
              ["Detractor", COLOR_DETRACTOR],
            ].map(([label, color]) => (
              <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    backgroundColor: color,
                    border: "1px solid #000",
                  }}
                />
                <Typography fontSize={12}>{label}</Typography>
              </Box>
            ))}
          </Box>

          <Typography sx={{ fontSize: 10, color: "#6b7280", mt: 3 }}>
            Classification: Controlled. Copyright ©2025 Version 1.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
