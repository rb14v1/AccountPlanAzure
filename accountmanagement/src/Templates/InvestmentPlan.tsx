import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  styled,
  MenuItem,
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
const TEMPLATE_NAME = "investment_plan";

// Define interfaces
interface InvestmentRow {
  id: number;
  type: string;
  desc: string;
  val: string;
  outcome: string;
  owner: string;
  status: string;
  remarks: string;
}

interface InvestmentPlanData {
  rows: InvestmentRow[];
  totalValue: string;
}

const DARK_BG = "#0b1e26";
const PRIMARY_TEAL = "#008080";
const STATUS_COLORS: Record<string, string> = {
  Approved: "#90c978",
  "On-track": "#0070c0",
  Delayed: "#ffc000",
  "At Risk": "#c00000",
  "To be discussed": "#d9d9d9",
};

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  border: "1px solid #ccc",
  padding: "8px 12px",
  fontSize: "0.8rem",
  fontFamily: "Arial, sans-serif",
  verticalAlign: "top",
  whiteSpace: "normal",
  wordBreak: "break-word",

  "&.header": {
    backgroundColor: DARK_BG,
    color: "#fff",
    fontWeight: 700,
    fontSize: "0.85rem",
    border: "1px solid #000",
  },
  "&.status-cell": {
    color: "#fff",
    fontWeight: 700,
    textAlign: "center",
  },
  "&.total-label": {
    fontWeight: 800,
    textAlign: "right",
    fontSize: "0.9rem",
    border: "none",
  },
  "&.total-value": {
    backgroundColor: "#00b0f0",
    color: "#fff",
    fontWeight: 700,
    textAlign: "center",
    fontSize: "0.9rem",
  },
}));

const headers = [
  "#",
  "Investment type",
  "Investment description",
  "Investment value (€K)",
  "Targeted outcome",
  "Primary owner",
  "Timeline Status",
  "Remarks",
];

const InvestmentPlan: React.FC = () => {
  const { globalData, setGlobalData } = useData();
  const investmentData = globalData?.investment_plan || null;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning",
  });

  const autoSaveAttempted = useRef(false);
  const dataLoadedFromDB = useRef(false);

  // Helper to extract nested array safely from multiple possible backend keys
  const extractItems = (dataObj: any): any[] => {
    if (!dataObj) return [];
    if (dataObj.data && Array.isArray(dataObj.data.investments)) return dataObj.data.investments;
    if (dataObj.data && Array.isArray(dataObj.data.data)) return dataObj.data.data;
    if (Array.isArray(dataObj.data)) return dataObj.data;
    if (Array.isArray(dataObj.investments)) return dataObj.investments;
    return [];
  };

  // Transform data into rows format
  const initialData = React.useMemo(() => {
    let rows: InvestmentRow[];
    const items = extractItems(investmentData);

    if (items.length === 0) {
      rows = [
        {
          id: 1,
          type: "Billing investment",
          desc: "",
          val: "",
          outcome: "",
          owner: "",
          status: "Approved",
          remarks: "",
        },
        {
          id: 2,
          type: "Buffers",
          desc: "",
          val: "",
          outcome: "",
          owner: "",
          status: "Delayed",
          remarks: "",
        },
        {
          id: 3,
          type: "Innovation",
          desc: "",
          val: "",
          outcome: "",
          owner: "",
          status: "At Risk",
          remarks: "",
        },
        {
          id: 4,
          type: "Free resources",
          desc: "",
          val: "",
          outcome: "",
          owner: "",
          status: "On-track",
          remarks: "",
        },
        {
          id: 5,
          type: "Marketing investments / relationship building",
          desc: "",
          val: "",
          outcome: "",
          owner: "",
          status: "Approved",
          remarks: "",
        },
        {
          id: 6,
          type: "Travel investments",
          desc: "",
          val: "",
          outcome: "",
          owner: "",
          status: "Delayed",
          remarks: "",
        },
      ];
    } else {
      rows = items.map((item: any, index: number) => ({
        id: item.investment_number || index + 1,
        type: item.investment_type || "",
        desc: item.investment_description || "",
        val: item.investment_value_eur || item.investment_value || "",
        outcome: item.targeted_outcome || "",
        owner: item.primary_owner || "",
        status: item.timeline_status || item.status || "To be discussed",
        remarks: item.remarks || "",
      }));
    }

    return {
      rows,
      totalValue: investmentData?.data?.total_investment_value || investmentData?.total_investment_value || "XX",
    };
  }, [investmentData]);

  // Initialize editable table hook
  const editable = useEditableTable(initialData);

  // Update draft when investmentData changes (from chatbot)
  useEffect(() => {
    if (investmentData && !editable.isEditing) {
      const items = extractItems(investmentData);
      const updatedData = {
        rows: items.length > 0
          ? items.map((item: any, index: number) => ({
              id: item.investment_number || index + 1,
              type: item.investment_type || "",
              desc: item.investment_description || "",
              val: item.investment_value_eur || item.investment_value || "",
              outcome: item.targeted_outcome || "",
              owner: item.primary_owner || "",
              status: item.timeline_status || item.status || "To be discussed",
              remarks: item.remarks || "",
            }))
          : initialData.rows,
        totalValue: investmentData?.data?.total_investment_value || investmentData?.total_investment_value || "XX",
      };
      editable.updateDraft(updatedData);
    }
  }, [investmentData]);

  // STEP 1: Load data from database when component mounts
  useEffect(() => {
    const loadDataFromDB = async () => {
      if (dataLoadedFromDB.current) return;

      console.log("Loading investment plan from database...");
      setInitialLoading(true);

      try {
        const userId = globalData?.user_id || localStorage.getItem("user_id") || "101";
        const response = await fetch(`${API_BASE_URL}/investment-plan/?user_id=${userId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const dbData = await response.json();
          console.log("Investment plan loaded from DB:", dbData);

          if (dbData && Object.keys(dbData).length > 0) {
            setGlobalData((prev: any) => ({
              ...prev,
              investment_plan: dbData,
            }));
            dataLoadedFromDB.current = true;
          } else {
            console.log("No investment plan found in database");
          }
        }
      } catch (error) {
        console.error("Error loading investment plan from DB:", error);
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
        console.log("Investment plan already in DB, skipping auto-save");
        return;
      }

      const items = extractItems(investmentData);
      const hasValidData = items.length > 0;
      const isNewDataFromChatbot = investmentData && !investmentData.id;

      if (hasValidData && isNewDataFromChatbot && !autoSaveAttempted.current) {
        console.log("New investment plan from chatbot detected, auto-saving...");
        autoSaveAttempted.current = true;

        try {
          console.log("Sending investment plan to backend:", investmentData);

          const userId = globalData?.user_id || localStorage.getItem("user_id") || "101";
          
          const payload = {
            user_id: userId,
            data: {
              investments: items,
              total_investment_value: investmentData?.data?.total_investment_value || investmentData?.total_investment_value || "XX"
            }
          };

          const response = await fetch(
            `${API_BASE_URL}/investment-plan/save_plan/`,
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
              investment_plan: result.data,
            }));

            setSnackbar({
              open: true,
              message: "✅ Investment Plan auto-saved to database",
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
  }, [investmentData, setGlobalData]);

  const STATUS_OPTIONS = [
    "Approved",
    "On-track",
    "Delayed",
    "At Risk",
    "To be discussed",
  ];

  // Handle row field change
  const handleRowChange = (
    index: number,
    field: keyof InvestmentRow,
    value: string | number
  ) => {
    const updatedRows = [...editable.draftData.rows];
    updatedRows[index] = {
      ...updatedRows[index],
      [field]: value,
    };
    editable.updateDraft({
      ...editable.draftData,
      rows: updatedRows,
    });
  };

  // Handle total value change
  const handleTotalValueChange = (value: string) => {
    editable.updateDraft({
      ...editable.draftData,
      totalValue: value,
    });
  };

  // STEP 3: Manual save when user edits
  const handleManualSave = async () => {
    setLoading(true);
    try {
      const userId = globalData?.user_id || localStorage.getItem("user_id") || "101";

      const backendFormatted = {
        user_id: userId,
        data: {
          investments: editable.draftData.rows.map((row: InvestmentRow) => ({
            investment_number: row.id,
            investment_type: row.type,
            investment_description: row.desc,
            investment_value_eur: row.val,
            targeted_outcome: row.outcome,
            primary_owner: row.owner,
            timeline_status: row.status,
            remarks: row.remarks,
          })),
          total_investment_value: editable.draftData.totalValue,
        }
      };

      console.log("Manual save - sending investment plan:", backendFormatted);

      const response = await fetch(`${API_BASE_URL}/investment-plan/save_plan/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(backendFormatted),
      });

      const result = await response.json();
      console.log("Manual save response:", result);

      if (response.ok && result.success) {
        setGlobalData((prev: any) => ({
          ...prev,
          investment_plan: result.data,
        }));

        editable.saveEdit(() => {
          // Save completed
        });

        setSnackbar({
          open: true,
          message: "✅ Investment Plan successfully saved",
          severity: "success",
        });
      } else {
        throw new Error(result.message || "Failed to save");
      }
    } catch (error) {
      console.error("Manual save error:", error);
      setSnackbar({
        open: true,
        message: "❌ Failed to save Investment Plan",
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
          width: "100%",
        }}
      >
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading investment plan...</Typography>
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
          severity={snackbar.severity as any}
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

        {/* TABLE */}
        <Box id="template-to-download" className="template-section">
          <Box className="pdf-section">
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: PRIMARY_TEAL,
                mb: 2,
              }}
            >
              Investment plan for next 12 months
            </Typography>

            {/* Status Legend */}
            <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
              {Object.entries(STATUS_COLORS).map(([label, color]) => (
                <Box
                  key={label}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
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

            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    {headers.map((head, idx) => (
                      <StyledTableCell key={idx} className="header">
                        {head}
                      </StyledTableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {editable.draftData.rows.map((row: InvestmentRow, index: number) => (
                    <TableRow key={row.id}>
                      <StyledTableCell>{row.id}</StyledTableCell>

                      <StyledTableCell>
                        {editable.isEditing ? (
                          <TextField
                            fullWidth
                            size="small"
                            value={row.type}
                            onChange={(e) =>
                              handleRowChange(index, "type", e.target.value)
                            }
                          />
                        ) : (
                          row.type
                        )}
                      </StyledTableCell>

                      <StyledTableCell>
                        {editable.isEditing ? (
                          <TextField
                            fullWidth
                            multiline
                            size="small"
                            value={row.desc}
                            onChange={(e) =>
                              handleRowChange(index, "desc", e.target.value)
                            }
                          />
                        ) : (
                          row.desc
                        )}
                      </StyledTableCell>

                      <StyledTableCell>
                        {editable.isEditing ? (
                          <TextField
                            fullWidth
                            multiline
                            minRows={1}
                            maxRows={6}
                            size="small"
                            value={row.val}
                            onChange={(e) =>
                              handleRowChange(index, "val", e.target.value)
                            }
                            sx={{
                              "& .MuiInputBase-root": {
                                alignItems: "flex-start",
                              },
                              "& textarea": {
                                resize: "none",
                                lineHeight: "1.4",
                              },
                            }}
                          />
                        ) : (
                          row.val
                        )}
                      </StyledTableCell>

                      <StyledTableCell>
                        {editable.isEditing ? (
                          <TextField
                            fullWidth
                            multiline
                            size="small"
                            value={row.outcome}
                            onChange={(e) =>
                              handleRowChange(index, "outcome", e.target.value)
                            }
                          />
                        ) : (
                          row.outcome
                        )}
                      </StyledTableCell>

                      <StyledTableCell>
                        {editable.isEditing ? (
                          <TextField
                            fullWidth
                            multiline
                            minRows={1}
                            maxRows={6}
                            size="small"
                            value={row.owner}
                            onChange={(e) =>
                              handleRowChange(index, "owner", e.target.value)
                            }
                            sx={{
                              "& .MuiInputBase-root": {
                                alignItems: "flex-start",
                              },
                              "& textarea": {
                                resize: "none",
                                lineHeight: "1.4",
                              },
                            }}
                          />
                        ) : (
                          row.owner
                        )}
                      </StyledTableCell>

                      <StyledTableCell
                        className="status-cell"
                        sx={{
                          backgroundColor: STATUS_COLORS[row.status] || "#d9d9d9",
                        }}
                      >
                        {editable.isEditing ? (
                          <TextField
                            select
                            fullWidth
                            size="small"
                            value={row.status}
                            onChange={(e) =>
                              handleRowChange(index, "status", e.target.value)
                            }
                            sx={{
                              "& .MuiInputBase-root": {
                                color: "#fff",
                                fontWeight: 700,
                                backgroundColor: "transparent",
                              },
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: "rgba(255,255,255,0.5)",
                              },
                              "& svg": {
                                color: "#fff",
                              },
                            }}
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <MenuItem key={status} value={status}>
                                {status}
                              </MenuItem>
                            ))}
                          </TextField>
                        ) : (
                          row.status
                        )}
                      </StyledTableCell>

                      <StyledTableCell>
                        {editable.isEditing ? (
                          <TextField
                            fullWidth
                            multiline
                            size="small"
                            value={row.remarks}
                            onChange={(e) =>
                              handleRowChange(index, "remarks", e.target.value)
                            }
                          />
                        ) : (
                          row.remarks
                        )}
                      </StyledTableCell>
                    </TableRow>
                  ))}

                  {/* Total Row */}
                  <TableRow>
                    <StyledTableCell colSpan={3} className="total-label">
                      Total
                    </StyledTableCell>
                    <StyledTableCell className="total-value">
                      {editable.isEditing ? (
                        <TextField
                          fullWidth
                          size="small"
                          value={editable.draftData.totalValue}
                          onChange={(e) => handleTotalValueChange(e.target.value)}
                          sx={{
                            "& .MuiInputBase-root": {
                              color: "white",
                              fontWeight: 700,
                              textAlign: "center",
                            },
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "rgba(255, 255, 255, 0.3)",
                            },
                          }}
                        />
                      ) : (
                        editable.draftData.totalValue
                      )}
                    </StyledTableCell>
                    <StyledTableCell colSpan={4}></StyledTableCell>
                  </TableRow>
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
    </Box>
  );
};

export default InvestmentPlan;