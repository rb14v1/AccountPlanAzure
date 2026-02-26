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
const TEMPLATE_NAME = "critical_risk"; // ✅ Matches Backend Schema

// Define the interface matching your JSON output
export interface CriticalRisk {
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
  padding: "8px",
  verticalAlign: "top",
  whiteSpace: "normal",
  wordBreak: "break-word",
};

const categoryCell = {
  backgroundColor: "#177E89",
  color: "#ffffff",
  fontWeight: 700,
  verticalAlign: "middle",
};

const AutoGrowTextField = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <TextField
    fullWidth
    multiline
    minRows={1}
    size="small"
    value={value}
    onChange={onChange}
    InputProps={{
      style: {
        overflow: "hidden",
        resize: "none",
      },
    }}
    sx={{
      "& textarea": {
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      },
    }}
  />
);

// --- SAFE EXTRACTOR BRIDGE ---
const extractData = (source: any): CriticalRisk[] => {
  const rawArray = Array.isArray(source?.data) ? source.data : (Array.isArray(source) ? source : []);
  
  const mapped = rawArray.map((item: any, i: number) => ({
    category: item.category || "",
    risk_number: Number(item.risk_number) || i + 1,
    description_of_risk: item.description_of_risk || "",
    impact_of_risk: item.impact_of_risk || "",
    timeline: item.timeline || "",
    countermeasures_taken: item.countermeasures_taken || "",
    owner: item.owner || "",
  }));

  // Ensure minimum 5 empty rows
  while (mapped.length < 5) {
    mapped.push({
      category: "",
      risk_number: mapped.length + 1,
      description_of_risk: "",
      impact_of_risk: "",
      timeline: "",
      countermeasures_taken: "",
      owner: "",
    });
  }
  return mapped;
};

const CriticalRiskPage: React.FC = () => {
  const { globalData, setGlobalData } = useData();
  const userId = globalData?.user_id || localStorage.getItem("user_id") || "101";

  const rawData = extractData(globalData?.critical_risk);
  const editable = useEditableTable<CriticalRisk[]>(rawData);

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

  // 1. Sync from Chatbot
  useEffect(() => {
    if (globalData?.critical_risk && !editable.isEditing) {
      editable.updateDraft(extractData(globalData.critical_risk));
    }
  }, [globalData?.critical_risk]);

  // 2. Load data from unified DB endpoint
  useEffect(() => {
    const loadDataFromDB = async () => {
      if (dataLoadedFromDB.current) return;
      setInitialLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/template-payload/${TEMPLATE_NAME}/?user_id=${userId}`);
        if (response.ok) {
          const dbData = await response.json();
          if (Object.keys(dbData).length > 0) {
            const parsed = extractData(dbData);
            setGlobalData((prev: any) => ({ ...prev, critical_risk: parsed }));
            editable.updateDraft(parsed);
            dataLoadedFromDB.current = true;
          }
        }
      } catch (error) {
        console.error("Error loading critical risks from DB:", error);
      } finally {
        setInitialLoading(false);
      }
    };
    loadDataFromDB();
  }, [userId, setGlobalData]);

  // 3. Auto-save when NEW data arrives from chatbot
  useEffect(() => {
    const autoSaveToDatabase = async () => {
      if (dataLoadedFromDB.current && !autoSaveAttempted.current) return;

      const rawGlobal = globalData?.critical_risk;
      const isNewDataFromChatbot = rawGlobal && !rawGlobal.id && (Array.isArray(rawGlobal.data) || Array.isArray(rawGlobal));

      if (isNewDataFromChatbot && !autoSaveAttempted.current) {
        autoSaveAttempted.current = true;
        try {
          const payload = { user_id: userId, data: rawData };
          const response = await fetch(`${API_BASE_URL}/template-payload/${TEMPLATE_NAME}/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const result = await response.json();
          if (response.ok && result.success) {
            setGlobalData((prev: any) => ({ ...prev, critical_risk: extractData(result.data) }));
            setSnackbar({ open: true, message: "✅ Critical Risks auto-saved to database", severity: "success" });
          }
        } catch (error) {
          autoSaveAttempted.current = false;
        }
      }
    };
    const timeoutId = setTimeout(autoSaveToDatabase, 500);
    return () => clearTimeout(timeoutId);
  }, [rawData, userId, setGlobalData]);

  // 4. Manual save to unified DB endpoint
  const handleManualSave = async () => {
    setLoading(true);
    try {
      const payload = { user_id: userId, data: editable.draftData };
      const response = await fetch(`${API_BASE_URL}/template-payload/${TEMPLATE_NAME}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setGlobalData((prev: any) => ({ ...prev, critical_risk: extractData(result.data) }));
        editable.saveEdit(() => {});
        setSnackbar({ open: true, message: "✅ Critical Risks successfully saved", severity: "success" });
        dataLoadedFromDB.current = true;
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      console.error("Manual save error:", error);
      setSnackbar({ open: true, message: "❌ Failed to save Critical Risks", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Group risks by category for display
  const groupedRisks = editable.draftData.reduce((acc, risk) => {
    const cat = risk.category || "Category";
    if (!acc[cat]) acc[cat] = [];
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
          <DownloadTemplates
            templateName="Critical Risk Tracking"
            beforeDownload={() => setIsPrinting(true)}
            afterDownload={() => setIsPrinting(false)}
          />

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
                {loading ? <CircularProgress size={24} color="inherit" /> : "Save"}
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
            <Table
              sx={{
                tableLayout: "fixed",
                width: "100%",
              }}
            >
              <colgroup>
                <col style={{ width: "14%" }} />  {/* Category */}
                <col style={{ width: "6%" }} />   {/* # */}
                <col style={{ width: "20%" }} />  {/* Description */}
                <col style={{ width: "18%" }} />  {/* Impact */}
                <col style={{ width: "12%" }} />  {/* Timeline */}
                <col style={{ width: "18%" }} />  {/* Countermeasures */}
                <col style={{ width: "12%" }} />  {/* Owner */}
              </colgroup>

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
                        {/* Category */}
                        <TableCell sx={{ ...cell, ...categoryCell }}>
                          {editable.isEditing && !isPrinting ? (
                            <AutoGrowTextField
                              value={risk.category}
                              onChange={(e) =>
                                handleFieldChange(globalIndex, "category", e.target.value)
                              }
                            />
                          ) : (
                            <Box sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                              {risk.category}
                            </Box>
                          )}
                        </TableCell>

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
                          {editable.isEditing && !isPrinting ? (
                            <AutoGrowTextField
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
                            <Box sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                              {risk.description_of_risk}
                            </Box>
                          )}
                        </TableCell>

                        {/* Impact of Risk */}
                        <TableCell sx={cell}>
                          {editable.isEditing && !isPrinting ? (
                            <AutoGrowTextField
                              value={risk.impact_of_risk}
                              onChange={(e) =>
                                handleFieldChange(globalIndex, "impact_of_risk", e.target.value)
                              }
                            />
                          ) : (
                            <Box sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                              {risk.impact_of_risk}
                            </Box>
                          )}
                        </TableCell>

                        {/* Timeline */}
                        <TableCell sx={cell}>
                          {editable.isEditing && !isPrinting ? (
                            <AutoGrowTextField
                              value={risk.timeline}
                              onChange={(e) =>
                                handleFieldChange(globalIndex, "timeline", e.target.value)
                              }
                            />
                          ) : (
                            <Box sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                              {risk.timeline}
                            </Box>
                          )}
                        </TableCell>

                        {/* Countermeasures Taken */}
                        <TableCell sx={cell}>
                          {editable.isEditing && !isPrinting ? (
                            <AutoGrowTextField
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
                            <Box sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                              {risk.countermeasures_taken}
                            </Box>
                          )}
                        </TableCell>

                        {/* Owner */}
                        <TableCell sx={cell}>
                          {editable.isEditing && !isPrinting ? (
                            <AutoGrowTextField
                              value={risk.owner}
                              onChange={(e) =>
                                handleFieldChange(globalIndex, "owner", e.target.value)
                              }
                            />
                          ) : (
                            <Box sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                              {risk.owner}
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

        </Box>
      </Box>
      <style>
{`
@media print {
  table {
    table-layout: fixed !important;
    width: 100% !important;
    border-collapse: collapse !important;
  }

  thead {
    display: table-header-group !important;
  }

  tr {
    page-break-inside: avoid !important;
  }

  th, td {
    white-space: pre-wrap !important;
    word-break: break-word !important;
    vertical-align: top !important;
  }
}
`}
</style>

    </Box>
  );
};

export default CriticalRiskPage;