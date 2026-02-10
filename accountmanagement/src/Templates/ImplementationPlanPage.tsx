import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  MenuItem,
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
  Alert
} from "@mui/material";
import DownloadTemplates from "../components/DownloadTemplates";
import { useEditableTable } from "../hooks/useEditableTable";
import { useData } from "../context/DataContext";

const API_BASE_URL = "http://localhost:8000/api";
const TEMPLATE_NAME = "Implementation_Plan_For_Growth";

const STATUS_OPTIONS = [
  "Completed",
  "On-track",
  "Critical to fast-track",
  "Delayed",
  "To be initiated",
];

const legendItems = [
  { label: "Completed", color: "#7EAA55" },
  { label: "On-track", color: "#0070C0" },
  { label: "Critical to fast-track", color: "#FFC000" },
  { label: "Delayed", color: "#C00000" },
  { label: "To be initiated", color: "#D9D9D9" },
];

const getStatusColor = (status: string): string => {
  const normalized = (status || "").toLowerCase().trim();
  if (normalized === "completed") return "#7EAA55";
  if (normalized === "on-track" || normalized === "on track") return "#0070C0";
  if (normalized.includes("critical") || normalized.includes("fast-track")) return "#FFC000";
  if (normalized === "delayed") return "#C00000";
  return "#D9D9D9"; // Default / To be initiated
};

// --- Styled Components ---
const PageWrapper = styled(Box)({
  display: "flex",
  flexDirection: "column",
  height: "calc(100vh - 100px)",
  backgroundColor: "#fff",
  padding: "16px 24px",
  overflow: "auto",
  width: "100%",
});

const HeaderCell = styled(TableCell)({
  backgroundColor: "#002b2e",
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.75rem",
  border: "1px solid #333",
  textAlign: "center",
  padding: "4px 8px",
});

const BodyCell = styled(TableCell)({
  fontSize: "0.75rem",
  border: "1px solid #333",
  padding: "4px 8px",
  verticalAlign: "top",
});

const StatusCell = styled(TableCell)<{ statusColor: string }>(({ statusColor }) => ({
  backgroundColor: statusColor,
  color: "#fff",
  fontWeight: 700,
  textAlign: "center",
  fontSize: "0.75rem",
  border: "1px solid #333",
  padding: "4px 8px",
}));

// --- Main Component ---
export default function ImplementationPlanPage() {
  const { globalData, setGlobalData } = useData();
  
  // ✅ 1. User ID Logic
  const userId = globalData?.user_id || localStorage.getItem("user_id") || "101";
  const companyName = globalData?.company_name || localStorage.getItem("company_name") || "";

  // Default Data
  const defaultData = {
    actions: [
      { action: "", timeline: "", owner: "", status: "To be initiated", investment_needed: "", impact: "" },
      { action: "", timeline: "", owner: "", status: "To be initiated", investment_needed: "", impact: "" },
      { action: "", timeline: "", owner: "", status: "To be initiated", investment_needed: "", impact: "" }
    ]
  };

  const implementationData = globalData?.implementation_plan || defaultData;
  const editable = useEditableTable(implementationData);
  
  const [loading, setLoading] = useState(false);
  const dataLoaded = useRef(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as any });

  // ✅ 2. Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      if (dataLoaded.current) return;
      try {
        const res = await fetch(`${API_BASE_URL}/implementation-plan/?user_id=${userId}`);
        const dbData = await res.json();
        
        if (dbData && dbData.actions && dbData.actions.length > 0) {
          editable.updateDraft(dbData);
          setGlobalData((prev: any) => ({ ...prev, implementation_plan: dbData }));
          dataLoaded.current = true;
        }
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };
    fetchData();
  }, [userId]);

  // ✅ 3. Sync with Chatbot
  const backendData = globalData?.implementation_plan;
  useEffect(() => {
    if (backendData) {
       editable.updateDraft(backendData);
    }
  }, [backendData]);

  // ✅ 4. Save Logic
  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        user_id: userId,
        company_name: companyName,
        ...editable.draftData
      };

      const response = await fetch(`${API_BASE_URL}/implementation-plan/save/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save");

      editable.saveEdit(() => {
        setGlobalData((prev: any) => ({ ...prev, implementation_plan: editable.draftData }));
      });
      setSnackbar({ open: true, message: "✅ Saved successfully", severity: "success" });
    } catch (e) {
      console.error("Save error:", e);
      setSnackbar({ open: true, message: "❌ Failed to save", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleActionChange = (index: number, field: string, value: string) => {
    const updated = [...editable.draftData.actions];
    updated[index] = { ...updated[index], [field]: value };
    editable.updateDraft({ ...editable.draftData, actions: updated });
  };

  const addRow = () => {
    const newRow = { action: "", timeline: "", owner: "", status: "To be initiated", investment_needed: "", impact: "" };
    editable.updateDraft({ ...editable.draftData, actions: [...editable.draftData.actions, newRow] });
  };

  return (
    <Box sx={{ bgcolor: "#fff", minHeight: "100vh" }}>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', p: 2, gap: 2 }}>
        <DownloadTemplates templateName={TEMPLATE_NAME} />
        {!editable.isEditing ? (
          <Button variant="outlined" onClick={editable.startEdit} sx={{ borderColor: "#00a99d", color: "#00a99d" }}>Edit</Button>
        ) : (
          <>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading}
              sx={{ backgroundColor: "#00a99d", color: "#fff" }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Save"}
            </Button>
            <Button variant="outlined" onClick={editable.cancelEdit} sx={{ borderColor: "#00a99d", color: "#00a99d" }}>Cancel</Button>
          </>
        )}
      </Box>

      <PageWrapper id="template-to-download">
        <Box className="pdf-section">
        <Typography variant="h5" sx={{ color: "#00a99d", fontWeight: 700, mb: 2 }}>
          Implementation plan for growth
        </Typography>

        <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
          {legendItems.map((item) => (
            <Box key={item.label} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box sx={{ width: 16, height: 16, bgcolor: item.color, border: "1px solid #000" }} />
              <Typography variant="caption">{item.label}</Typography>
            </Box>
          ))}
        </Box>

        <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #333", borderRadius: 0 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <HeaderCell sx={{ width: "25%" }}>Action / Initiative</HeaderCell>
                <HeaderCell sx={{ width: "10%" }}>Timeline</HeaderCell>
                <HeaderCell sx={{ width: "15%" }}>Owner</HeaderCell>
                <HeaderCell sx={{ width: "15%" }}>Status</HeaderCell>
                <HeaderCell sx={{ width: "15%" }}>Investment needed</HeaderCell>
                <HeaderCell sx={{ width: "20%" }}>Impact</HeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {editable.draftData.actions.map((row: any, i: number) => (
                <TableRow key={i}>
                  <BodyCell>
                    {editable.isEditing ? <TextField fullWidth multiline size="small" value={row.action} onChange={(e) => handleActionChange(i, 'action', e.target.value)} /> : row.action}
                  </BodyCell>
                  <BodyCell>
                    {editable.isEditing ? <TextField fullWidth size="small" value={row.timeline} onChange={(e) => handleActionChange(i, 'timeline', e.target.value)} /> : row.timeline}
                  </BodyCell>
                  <BodyCell>
                    {editable.isEditing ? <TextField fullWidth size="small" value={row.owner} onChange={(e) => handleActionChange(i, 'owner', e.target.value)} /> : row.owner}
                  </BodyCell>
                  <StatusCell statusColor={getStatusColor(row.status)}>
                    {editable.isEditing ? (
                      <TextField select fullWidth size="small" value={row.status} onChange={(e) => handleActionChange(i, 'status', e.target.value)} sx={{ "& .MuiInputBase-root": { color: "#fff", fontWeight: 700 }, "& svg": { color: "#fff" } }}>
                        {STATUS_OPTIONS.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                      </TextField>
                    ) : row.status}
                  </StatusCell>
                  <BodyCell>
                    {editable.isEditing ? <TextField fullWidth size="small" value={row.investment_needed} onChange={(e) => handleActionChange(i, 'investment_needed', e.target.value)} /> : row.investment_needed}
                  </BodyCell>
                  <BodyCell>
                    {editable.isEditing ? <TextField fullWidth multiline size="small" value={row.impact} onChange={(e) => handleActionChange(i, 'impact', e.target.value)} /> : row.impact}
                  </BodyCell>
                </TableRow>
              ))}
              {editable.isEditing && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Button onClick={addRow}>+ Add Row</Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        </Box>
      </PageWrapper>
    </Box>
  );
}