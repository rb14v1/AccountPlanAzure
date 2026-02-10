import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Typography,
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

/* ---------- CONSTANTS ---------- */
const TEMPLATE_NAME = "Service Line Growth Actions";

const columns = [
  "Development Area",
  "Objective",
  "Target Buying Centres",
  "Current Status",
  "Next Action / Responsible person",
];

const KEY_MAP: Record<string, string> = {
  "Cloud Transformation": "Cloud_Transformation",
  "Data": "Data",
  "AI": "AI",
  "SRG Managed Services": "SRG_Managed_Services",
  "EA": "EA",
  "Strategy, Design and Change": "Strategy_Design_and_Change",
  "SAM & Licensing": "SAM_and_Licensing",
};

const rowLabels = Object.keys(KEY_MAP);

const PRIMARY_TEAL = "#008080";
const DARK_BG = "#0b1e26";

/* ---------- STYLES ---------- */
const StyledTableCell = styled(TableCell)(() => ({
  border: "1px solid #000",
  padding: "12px 16px",
  fontSize: "0.85rem",
  "&.header": {
    backgroundColor: DARK_BG,
    color: "#fff",
    fontWeight: 700,
    textAlign: "center",
  },
  "&.row-label": {
    fontWeight: 700,
    backgroundColor: "#fff",
    width: "20%",
  },
}));

/* ---------- MAIN COMPONENT ---------- */
const ServiceLineGrowth: React.FC = () => {
  const { globalData, setGlobalData } = useData();
  const backendData = globalData?.service_line_growth_actions;


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
  const previousDataRef = useRef<any>(null);

  /* 🔑 Build editable array from object - Function to create rows */
  const buildRows = (data: any) => {
    return rowLabels.map((label) => {
      const key = KEY_MAP[label];
      return {
        label,
        key,
        Objective: data?.[key]?.Objective || "",
        Target_Buying_Centres: data?.[key]?.Target_Buying_Centres || "",
        Current_Status: data?.[key]?.Current_Status || "",
        Next_Action_and_Responsible_Person:
          data?.[key]?.Next_Action_and_Responsible_Person || "",
      };
    });
  };

  const editable = useEditableTable(buildRows(backendData));

  // 🔥 KEY FIX: Update editable data when backendData changes
  useEffect(() => {
    if (backendData) {
      console.log("🔄 Backend data changed, updating editable rows");
      const newRows = buildRows(backendData);
      editable.updateDraft(newRows);
    }
  }, [backendData]);

  // 🔥 CRITICAL FIX: Detect when NEW chatbot data arrives (different from DB data)
  useEffect(() => {
    if (!backendData || !previousDataRef.current) {
      previousDataRef.current = backendData;
      return;
    }

    // Check if the data content has changed (not just the reference)
    const dataChanged = JSON.stringify(previousDataRef.current) !== JSON.stringify(backendData);
    
    if (dataChanged) {
      console.log("🆕 DETECTED NEW DATA from chatbot!");
      console.log("Previous:", previousDataRef.current);
      console.log("New:", backendData);
      
      // Reset flags so auto-save can run again
      autoSaveAttempted.current = false;
      dataLoadedFromDB.current = false;
      
      previousDataRef.current = backendData;
    }
  }, [backendData]);


  // STEP 1: Load data from database when component mounts
  useEffect(() => {
    const loadDataFromDB = async () => {
      if (dataLoadedFromDB.current) return;


      console.log("📂 Loading service line growth from database...");
      setInitialLoading(true);


      try {
        const response = await fetch(`${API_BASE_URL}/service-line-growth/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });


        if (response.ok) {
          const dbData = await response.json();
          console.log("✅ Service line growth loaded from DB:", dbData);


          if (dbData && Object.keys(dbData).length > 0) {
            setGlobalData((prev: any) => ({
              ...prev,
              service_line_growth_actions: dbData,
            }));
            dataLoadedFromDB.current = true;
            previousDataRef.current = dbData;
          } else {
            console.log("ℹ️ No service line growth found in database");
          }
        } else {
          console.log("⚠️ DB fetch returned status:", response.status);
        }
      } catch (error) {
        console.error("❌ Error loading service line growth from DB:", error);
      } finally {
        setInitialLoading(false);
      }
    };


    loadDataFromDB();
  }, [setGlobalData]);


  // STEP 2: Auto-save when NEW data arrives from chatbot
  useEffect(() => {
    const autoSaveToDatabase = async () => {
      console.log("💾 AUTO-SAVE CHECK:");
      console.log("  - dataLoadedFromDB:", dataLoadedFromDB.current);
      console.log("  - autoSaveAttempted:", autoSaveAttempted.current);
      console.log("  - backendData exists:", !!backendData);
      console.log("  - backendData has ID:", backendData?.id);

      // Check if we have valid data
      const hasValidData = backendData && Object.keys(backendData).length > 0;
      if (!hasValidData) {
        console.log("⏭️ Skipping: No valid data");
        return;
      }

      // If already attempted auto-save, skip
      if (autoSaveAttempted.current) {
        console.log("⏭️ Skipping: Auto-save already attempted");
        return;
      }

      // If data was loaded from DB and no new data detected, skip
      if (dataLoadedFromDB.current) {
        console.log("⏭️ Skipping: Data already in DB");
        return;
      }


      console.log("🚀 AUTO-SAVING new chatbot data...");
      autoSaveAttempted.current = true;


      try {
        console.log("📤 Sending to backend:", backendData);


        const response = await fetch(
          `${API_BASE_URL}/service-line-growth/save_growth/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(backendData),
          }
        );


        const result = await response.json();
        console.log("📥 Auto-save response:", result);


        if (response.ok && result.success) {
          console.log("✅ AUTO-SAVE SUCCESSFUL! Updating global data...");
          setGlobalData((prev: any) => ({
            ...prev,
            service_line_growth_actions: result.data,
          }));
          dataLoadedFromDB.current = true;
          previousDataRef.current = result.data;


          setSnackbar({
            open: true,
            message: "✅ Service Line Growth auto-saved to database",
            severity: "success",
          });
        } else {
          throw new Error(result.message || "Auto-save failed");
        }
      } catch (error) {
        console.error("❌ Auto-save error:", error);
        setSnackbar({
          open: true,
          message: "⚠️ Auto-save failed. You can edit and save manually.",
          severity: "warning",
        });
        autoSaveAttempted.current = false;
      }
    };


    const timeoutId = setTimeout(() => {
      autoSaveToDatabase();
    }, 500);


    return () => clearTimeout(timeoutId);
  }, [backendData, setGlobalData]);


  const updateCell = (rowKey: string, field: string, value: string) => {
    editable.updateDraft(
      editable.draftData.map((row: any) =>
        row.key === rowKey ? { ...row, [field]: value } : row
      )
    );
  };


  // STEP 3: Manual save when user edits
  const handleSave = async () => {
    setLoading(true);
    try {
      const updatedObject: any = {};
      editable.draftData.forEach((row: any) => {
        updatedObject[row.key] = {
          Objective: row.Objective,
          Target_Buying_Centres: row.Target_Buying_Centres,
          Current_Status: row.Current_Status,
          Next_Action_and_Responsible_Person:
            row.Next_Action_and_Responsible_Person,
        };
      });


      console.log("💾 Manual save - sending:", updatedObject);


      const response = await fetch(
        `${API_BASE_URL}/service-line-growth/save_growth/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedObject),
        }
      );


      const result = await response.json();
      console.log("📥 Manual save response:", result);


      if (response.ok && result.success) {
        setGlobalData((prev: any) => ({
          ...prev,
          service_line_growth_actions: result.data,
        }));


        editable.saveEdit(() => {
          // Save completed
        });


        setSnackbar({
          open: true,
          message: "✅ Service Line Growth successfully saved",
          severity: "success",
        });
      } else {
        throw new Error(result.message || "Failed to save");
      }
    } catch (error) {
      console.error("❌ Manual save error:", error);
      setSnackbar({
        open: true,
        message: "❌ Failed to save Service Line Growth",
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
        <Typography sx={{ ml: 2 }}>Loading service line growth...</Typography>
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
                onClick={handleSave}
                disabled={loading}
                sx={{
                  backgroundColor: PRIMARY_TEAL,
                  ml: 2,
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
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: PRIMARY_TEAL,
              mb: 2,
            }}
          >
            Service Line Growth Actions
          </Typography>


          <TableContainer component={Paper} elevation={0}>
            <Table
              sx={{
                tableLayout: "fixed",
                width: "100%",
              }}
            >
              <colgroup>
                <col style={{ width: "20%" }} /> {/* Development Area */}
                <col style={{ width: "20%" }} /> {/* Objective */}
                <col style={{ width: "20%" }} /> {/* Target Buying Centres */}
                <col style={{ width: "20%" }} /> {/* Current Status */}
                <col style={{ width: "20%" }} /> {/* Next Action */}
              </colgroup>

              <TableHead>
                <TableRow>
                  {columns.map((col) => (
                    <StyledTableCell key={col} className="header">
                      {col}
                    </StyledTableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {editable.draftData.map((row: any) => (
                  <TableRow key={row.key}>
                    <StyledTableCell className="row-label">
                      {row.label}
                    </StyledTableCell>
                    {[
                      "Objective",
                      "Target_Buying_Centres",
                      "Current_Status",
                      "Next_Action_and_Responsible_Person",
                    ].map((field) => (
                      <StyledTableCell key={field}>
                        {editable.isEditing && !isPrinting ? (
                          <TextField
                            multiline
                            fullWidth
                            size="small"
                            value={row[field]}
                            onChange={(e) =>
                              updateCell(row.key, field, e.target.value)
                            }
                          />
                        ) : (
                          <Box
                            sx={{
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                              fontSize: "0.85rem",
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
              </TableBody>
            </Table>
          </TableContainer>


          <Typography sx={{ fontSize: 10, color: "#6b7280", mt: 3 }}>
            Classification: Controlled. Copyright ©2025 Version 1.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};


export default ServiceLineGrowth;