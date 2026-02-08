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
const TEMPLATE_NAME = "Service Line Growth Actions";

const columns = [
  "Development Area",
  "Objective",
  "Target Buying Centres",
  "Current Status",
  "Next Action / Responsible person",
];

// ✅ Keys here must match the backend normalization exactly
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

export default function ServiceLineGrowth() {
  const { globalData, setGlobalData } = useData();
  const backendData = globalData?.service_line_growth_actions;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning",
  });

  const autoSaveAttempted = useRef(false);
  const dataLoadedFromDB = useRef(false);
  const previousDataRef = useRef<any>(null);

  // Helper to map backend object to table rows
  const buildRows = (data: any) => {
    return rowLabels.map((label) => {
      const key = KEY_MAP[label];
      const rowData = data?.[key] || {};
      return {
        label,
        key,
        Objective: rowData.Objective || "",
        Target_Buying_Centres: rowData.Target_Buying_Centres || "",
        Current_Status: rowData.Current_Status || "",
        Next_Action_and_Responsible_Person: rowData.Next_Action_and_Responsible_Person || "",
      };
    });
  };

  const editable = useEditableTable(buildRows(backendData));

  // Sync draft whenever backendData changes (e.g., from Chatbot)
  useEffect(() => {
    if (backendData) {
      editable.updateDraft(buildRows(backendData));
    }
  }, [backendData]);

  // STEP 1: Load from DB on Mount
  useEffect(() => {
    const loadFromDB = async () => {
      if (dataLoadedFromDB.current) return;
      setInitialLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/service-line-growth/`);
        if (response.ok) {
          const dbData = await response.json();
          if (dbData && Object.keys(dbData).length > 0) {
            setGlobalData((prev: any) => ({ ...prev, service_line_growth_actions: dbData }));
            dataLoadedFromDB.current = true;
          }
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setInitialLoading(false);
      }
    };
    loadFromDB();
  }, [setGlobalData]);

  // STEP 2: Auto-save new Chatbot data
  useEffect(() => {
    const autoSave = async () => {
      if (!backendData || dataLoadedFromDB.current || autoSaveAttempted.current) return;
      
      autoSaveAttempted.current = true;
      try {
        const response = await fetch(`${API_BASE_URL}/service-line-growth/save_growth/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(backendData),
        });
        if (response.ok) {
          setSnackbar({ open: true, message: "✅ Growth actions synced", severity: "success" });
        }
      } catch (error) {
        autoSaveAttempted.current = false;
      }
    };
    const timer = setTimeout(autoSave, 1500);
    return () => clearTimeout(timer);
  }, [backendData]);

  // STEP 3: Manual Save
  const handleSave = async () => {
    setLoading(true);
    try {
      const payload: any = {};
      editable.draftData.forEach((row: any) => {
        payload[row.key] = {
          Objective: row.Objective,
          Target_Buying_Centres: row.Target_Buying_Centres,
          Current_Status: row.Current_Status,
          Next_Action_and_Responsible_Person: row.Next_Action_and_Responsible_Person,
        };
      });

      const response = await fetch(`${API_BASE_URL}/service-line-growth/save_growth/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setGlobalData((prev: any) => ({ ...prev, service_line_growth_actions: result.data }));
        editable.saveEdit(() => {});
        setSnackbar({ open: true, message: "✅ Saved successfully", severity: "success" });
      }
    } catch (error) {
      setSnackbar({ open: true, message: "❌ Save failed", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const updateCell = (rowKey: string, field: string, value: string) => {
    editable.updateDraft(
      editable.draftData.map((row: any) =>
        row.key === rowKey ? { ...row, [field]: value } : row
      )
    );
  };

  if (initialLoading) return <Box sx={{ p: 10, textAlign: "center" }}><CircularProgress /><Typography>Loading Growth Plan...</Typography></Box>;

  return (
    <Box sx={{ width: "100%", bgcolor: "#fff", p: 2 }}>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>

      <Box sx={{ maxWidth: 1800, mx: "auto", px: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <DownloadTemplates templateName={TEMPLATE_NAME} />
          {!editable.isEditing ? (
            <Button variant="outlined" onClick={editable.startEdit} sx={{ ml: 2, color: PRIMARY_TEAL, borderColor: PRIMARY_TEAL }}>Edit</Button>
          ) : (
            <>
              <Button variant="contained" onClick={handleSave} disabled={loading} sx={{ ml: 2, bgcolor: PRIMARY_TEAL }}>
                {loading ? <CircularProgress size={24} color="inherit" /> : "Save"}
              </Button>
              <Button variant="outlined" onClick={editable.cancelEdit} sx={{ ml: 2 }}>Cancel</Button>
            </>
          )}
        </Box>

        <Box id="template-to-download">
          <Typography variant="h4" sx={{ fontWeight: 700, color: PRIMARY_TEAL, mb: 2 }}>Service Line Growth Actions</Typography>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  {columns.map((col) => (
                    <StyledTableCell key={col} className="header">{col}</StyledTableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {editable.draftData.map((row: any) => (
                  <TableRow key={row.key}>
                    <StyledTableCell className="row-label">{row.label}</StyledTableCell>
                    {[
                      "Objective",
                      "Target_Buying_Centres",
                      "Current_Status",
                      "Next_Action_and_Responsible_Person",
                    ].map((field) => (
                      <StyledTableCell key={field}>
                        {editable.isEditing ? (
                          <TextField
                            multiline
                            fullWidth
                            size="small"
                            value={row[field]}
                            onChange={(e) => updateCell(row.key, field, e.target.value)}
                          />
                        ) : (
                          row[field] || "TBD"
                        )}
                      </StyledTableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </Box>
  );
}