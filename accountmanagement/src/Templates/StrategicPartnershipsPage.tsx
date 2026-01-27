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

interface APIPartnershipRow {
  id?: number;
  partner_name: string;
  internal_poc: string;
  partner_type: string;
  sell_with_revenue_fy25_actuals_forecast: string;
  sell_with_revenue_fy26_target: string;
  key_engagements: string;
  support_needed: string;
}

const TEMPLATE_NAME = "Strategic_Partnerships";
const API_BASE_URL = "http://localhost:8000/api";

const headerCell = {
  backgroundColor: "#022D36",
  color: "white",
  fontSize: 11,
  fontWeight: 700,
  border: "1px solid #ccc",
  verticalAlign: "middle",
};

const subHeaderCell = {
  ...headerCell,
  fontSize: 10,
  textAlign: "center",
};

const bodyCell = {
  fontSize: 11,
  border: "1px solid #ccc",
  height: 40,
};

const partnerCell = {
  ...bodyCell,
  backgroundColor: "#177E89",
  color: "white",
  fontWeight: 700,
};

export default function StrategicPartnershipsPage() {
  const { globalData, setGlobalData } = useData();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning",
  });
  
  const autoSaveAttempted = useRef(false);
  const dataLoadedFromDB = useRef(false);

  // STEP 1: Load data from database when component mounts
  useEffect(() => {
    const loadDataFromDB = async () => {
      if (dataLoadedFromDB.current) return;
      
      console.log("Loading data from database...");
      setInitialLoading(true);
      
      try {
        const response = await fetch(
          `${API_BASE_URL}/strategic-partnerships/`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const dbData = await response.json();
          console.log("Data loaded from DB:", dbData);
          
          if (dbData && dbData.length > 0) {
            // Update global context with DB data
            setGlobalData((prev: any) => ({
              ...prev,
              Strategic_Partnerships: dbData,
            }));
            dataLoadedFromDB.current = true;
          } else {
            console.log("No data found in database");
          }
        }
      } catch (error) {
        console.error("Error loading data from DB:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadDataFromDB();
  }, []); // Run only once on mount

  const partnershipsData: APIPartnershipRow[] =
    globalData?.Strategic_Partnerships || [];

  const editable = useEditableTable(partnershipsData);

  const displayData =
    editable.draftData.length > 0
      ? editable.draftData
      : Array(5).fill({
          partner_name: "",
          internal_poc: "",
          partner_type: "",
          sell_with_revenue_fy25_actuals_forecast: "",
          sell_with_revenue_fy26_target: "",
          key_engagements: "",
          support_needed: "",
        });

  // STEP 2: Auto-save when NEW data arrives from chatbot
  useEffect(() => {
    const autoSaveToDatabase = async () => {
      // Skip if data was loaded from DB (not from chatbot)
      if (dataLoadedFromDB.current && !autoSaveAttempted.current) {
        console.log("Data already in DB, skipping auto-save");
        return;
      }

      const hasValidData = partnershipsData.some(
        (row) => row.partner_name && row.partner_name.trim() !== ""
      );

      // Check if data is NEW (no IDs means fresh from chatbot)
      const isNewDataFromChatbot = partnershipsData.length > 0 && 
        partnershipsData.every(row => !row.id);

      if (hasValidData && isNewDataFromChatbot && !autoSaveAttempted.current) {
        console.log("New data from chatbot detected, auto-saving...");
        autoSaveAttempted.current = true;

        try {
          const validData = partnershipsData.filter(
            (row) => row.partner_name && row.partner_name.trim() !== ""
          );

          console.log("Sending data to backend:", validData);

          const response = await fetch(
            `${API_BASE_URL}/strategic-partnerships/bulk_save/`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ partnerships: validData }),
            }
          );

          const result = await response.json();
          console.log("Auto-save response:", result);

          if (response.ok && result.success) {
            setGlobalData((prev: any) => ({
              ...prev,
              Strategic_Partnerships: result.data,
            }));

            setSnackbar({
              open: true,
              message: `✅ Auto-saved ${result.count} partnerships to database`,
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
  }, [partnershipsData, setGlobalData]);

  const handleFieldChange = (
    index: number,
    field: keyof APIPartnershipRow,
    value: string
  ) => {
    const updatedData = [...editable.draftData];
    updatedData[index] = {
      ...updatedData[index],
      [field]: value,
    };
    editable.updateDraft(updatedData);
  };

  // STEP 3: Manual save when user edits
  const handleManualSave = async () => {
    setLoading(true);
    try {
      const validData = editable.draftData.filter(
        (row) => row.partner_name && row.partner_name.trim() !== ""
      );

      console.log("Manual save - sending data:", validData);

      const response = await fetch(
        `${API_BASE_URL}/strategic-partnerships/bulk_save/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ partnerships: validData }),
        }
      );

      const result = await response.json();
      console.log("Manual save response:", result);

      if (response.ok && result.success) {
        setGlobalData((prev: any) => ({
          ...prev,
          Strategic_Partnerships: result.data,
        }));

        editable.saveEdit(() => {
          // Save completed
        });

        setSnackbar({
          open: true,
          message: `✅ Successfully saved ${result.count} partnerships`,
          severity: "success",
        });
      } else {
        throw new Error(result.message || "Failed to save");
      }
    } catch (error) {
      console.error("Manual save error:", error);
      setSnackbar({
        open: true,
        message: "❌ Failed to save changes to database",
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
        <Typography sx={{ ml: 2 }}>Loading partnerships data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
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

      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <DownloadTemplates templateName={TEMPLATE_NAME} />
        <Box>
          {!editable.isEditing ? (
            <Button
              variant="contained"
              onClick={editable.startEdit}
              disabled={loading}
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
                sx={{ ml: 2 }}
              >
                Cancel
              </Button>
            </>
          )}
        </Box>
      </Box>

      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        Strategic partnerships
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={headerCell}>Partner *</TableCell>
              <TableCell sx={headerCell}>Internal POC</TableCell>
              <TableCell sx={headerCell}>Partner type</TableCell>
              <TableCell sx={headerCell} colSpan={2} align="center">
                Sell-with Revenue
              </TableCell>
              <TableCell sx={headerCell}>Key Engagements</TableCell>
              <TableCell sx={headerCell}>Support needed</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={subHeaderCell}></TableCell>
              <TableCell sx={subHeaderCell}></TableCell>
              <TableCell sx={subHeaderCell}></TableCell>
              <TableCell sx={subHeaderCell}>
                FY25
                <br />
                (Actuals + Forecast)
              </TableCell>
              <TableCell sx={subHeaderCell}>
                FY26
                <br />
                (Target)
              </TableCell>
              <TableCell sx={subHeaderCell}></TableCell>
              <TableCell sx={subHeaderCell}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayData.map((row, index) => (
              <TableRow key={row.id || index}>
                <TableCell sx={partnerCell}>
                  {editable.isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={row.partner_name}
                      onChange={(e) =>
                        handleFieldChange(index, "partner_name", e.target.value)
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
                    row.partner_name
                  )}
                </TableCell>
                <TableCell sx={bodyCell}>
                  {editable.isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={row.internal_poc}
                      onChange={(e) =>
                        handleFieldChange(index, "internal_poc", e.target.value)
                      }
                    />
                  ) : (
                    row.internal_poc
                  )}
                </TableCell>
                <TableCell sx={bodyCell}>
                  {editable.isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={row.partner_type}
                      onChange={(e) =>
                        handleFieldChange(index, "partner_type", e.target.value)
                      }
                    />
                  ) : (
                    row.partner_type
                  )}
                </TableCell>
                <TableCell sx={bodyCell}>
                  {editable.isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={row.sell_with_revenue_fy25_actuals_forecast}
                      onChange={(e) =>
                        handleFieldChange(
                          index,
                          "sell_with_revenue_fy25_actuals_forecast",
                          e.target.value
                        )
                      }
                    />
                  ) : (
                    row.sell_with_revenue_fy25_actuals_forecast
                  )}
                </TableCell>
                <TableCell sx={bodyCell}>
                  {editable.isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={row.sell_with_revenue_fy26_target}
                      onChange={(e) =>
                        handleFieldChange(
                          index,
                          "sell_with_revenue_fy26_target",
                          e.target.value
                        )
                      }
                    />
                  ) : (
                    row.sell_with_revenue_fy26_target
                  )}
                </TableCell>
                <TableCell sx={bodyCell}>
                  {editable.isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      value={row.key_engagements}
                      onChange={(e) =>
                        handleFieldChange(
                          index,
                          "key_engagements",
                          e.target.value
                        )
                      }
                    />
                  ) : (
                    row.key_engagements
                  )}
                </TableCell>
                <TableCell sx={bodyCell}>
                  {editable.isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={row.support_needed}
                      onChange={(e) =>
                        handleFieldChange(index, "support_needed", e.target.value)
                      }
                    />
                  ) : (
                    row.support_needed
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="caption" sx={{ display: "block", mt: 2 }}>
        Classification: Controlled. Copyright ©2025 Version 1. All rights reserved.
      </Typography>
    </Box>
  );
}
