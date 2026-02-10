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
  const rel = (relationship || "").toLowerCase();
  if (rel.includes("promoter") || rel.includes("strong")) return COLOR_PROMOTER;
  if (rel.includes("detractor") || rel.includes("weak")) return COLOR_DETRACTOR;
  if (rel.includes("neutral") || rel.includes("moderate")) return COLOR_NEUTRAL;
  return "#fff";
};

export default function RelationshipHeatmap() {
  const { globalData, setGlobalData } = useData();

  // ✅ Identify record keys
  const userId =
    globalData?.user_id ||
    localStorage.getItem("user_id") ||
    localStorage.getItem("userid") ||
    "101";

  const companyName =
    globalData?.company_name ||
    globalData?.account_name ||
    localStorage.getItem("company_name") ||
    localStorage.getItem("account_name") ||
    "";

  const backendRows = Array.isArray(globalData?.relationship_heatmap)
    ? globalData.relationship_heatmap
    : [];

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning",
  });

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
  const tableConfig = {
    headers,
    rows: editable.draftData.map(row => [
      row.stakeholder_number,
      row.client_stakeholder,
      row.role,
      row.reports_to,
      row.level,
      row.client_relationship,
      row.engagement_plan_next_action,
    ]),
    rowStyle: (row) => {
      const rel = String(row[5]).toLowerCase();
      if (rel.includes("promoter")) return { fillColor: [144, 201, 120] };
      if (rel.includes("neutral")) return { fillColor: [217, 164, 65] };
      if (rel.includes("detractor")) return { fillColor: [224, 102, 102] };
      return {};
    },
  };


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

  // STEP 1: Load data from database
  useEffect(() => {
    const loadDataFromDB = async () => {
      if (dataLoadedFromDB.current) return;

      setInitialLoading(true);

      if (!userId) {
        console.warn("Skipping DB fetch: missing userId");
        setInitialLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/relationship-heatmap/?user_id=${encodeURIComponent(userId)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const dbData = await response.json();
          if (dbData && dbData.data && dbData.data.length > 0) {
            setGlobalData((prev: any) => ({
              ...prev,
              relationship_heatmap: dbData.data,
            }));

            const padded = [...dbData.data];
            while (padded.length < 5) {
              padded.push({
                stakeholder_number: padded.length + 1,
                client_stakeholder: "",
                role: "",
                reports_to: "",
                level: "",
                client_relationship: "",
                engagement_plan_next_action: "",
              });
            }
            editable.updateDraft(padded);
            dataLoadedFromDB.current = true;
          }
        }
      } catch (error) {
        console.error("Error loading relationship heatmap from DB:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadDataFromDB();
  }, [userId]);

  // STEP 2: Auto-save logic
  useEffect(() => {
    const autoSaveToDatabase = async () => {
      if (dataLoadedFromDB.current && !autoSaveAttempted.current) return;

      const hasValidData = backendRows && backendRows.length > 0;
      const isNewDataFromChatbot = backendRows && backendRows.length > 0 && !backendRows[0]?.id;

      if (hasValidData && isNewDataFromChatbot && !autoSaveAttempted.current) {
        // ✅ Allow save with userId even if companyName is empty
        if (!userId) return;

        autoSaveAttempted.current = true;
        try {
          const payload = {
            user_id: userId,
            company_name: companyName, // Can be empty string
            data: backendRows,
          };

          const response = await fetch(
            `${API_BASE_URL}/relationship-heatmap/save_heatmap/`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            }
          );

          const result = await response.json();
          if (response.ok && result.success) {
            const savedRows = result?.payload?.data?.stakeholder_list || result?.data || [];
            setGlobalData((prev: any) => ({ ...prev, relationship_heatmap: savedRows }));
            setSnackbar({ open: true, message: "✅ Auto-saved to database", severity: "success" });
            dataLoadedFromDB.current = true;
          }
        } catch (error) {
          console.error("Auto-save error:", error);
          autoSaveAttempted.current = false;
        }
      }
    };

    const timeoutId = setTimeout(() => autoSaveToDatabase(), 500);
    return () => clearTimeout(timeoutId);
  }, [backendRows, userId, companyName]);

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

  // STEP 3: Manual save - FIXED TO REMOVE "MISSING COMPANY" BLOCKER
  const handleManualSave = async () => {
    setLoading(true);
    try {
      // ✅ Now only userId is strictly required
      if (!userId) {
        setSnackbar({
          open: true,
          message: "❌ Missing User ID. Cannot save.",
          severity: "error",
        });
        return;
      }

      const payload = {
        user_id: userId,
        company_name: companyName, // Sending empty string if not found
        data: editable.draftData,
      };

      const response = await fetch(
        `${API_BASE_URL}/relationship-heatmap/save_heatmap/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": userId,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      if (response.ok && result.success) {
        const savedRows = result?.payload?.data?.stakeholder_list || result?.data || [];
        setGlobalData((prev: any) => ({ ...prev, relationship_heatmap: savedRows }));
        editable.saveEdit(() => { });
        setSnackbar({ open: true, message: "✅ Relationship Heatmap saved", severity: "success" });
        dataLoadedFromDB.current = true;
      } else {
        throw new Error(result.message || "Failed to save");
      }
    } catch (error) {
      console.error("Manual save error:", error);
      setSnackbar({ open: true, message: "❌ Failed to save changes", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
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
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Box sx={{ maxWidth: 1800, mx: "auto", px: 4, py: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mb: 2 }}>
          <DownloadTemplates templateName={TEMPLATE_NAME} tableConfig={tableConfig} />
          {!editable.isEditing ? (
            <Button
              variant="outlined"
              onClick={editable.startEdit}
              disabled={loading}
              sx={{ borderColor: PRIMARY_TEAL, color: PRIMARY_TEAL, ml: 2, "&:hover": { borderColor: "#006d6d", backgroundColor: "#e6f4f4" } }}
            >
              Edit
            </Button>
          ) : (
            <>
              <Button
                variant="contained"
                onClick={handleManualSave}
                disabled={loading}
                sx={{ backgroundColor: PRIMARY_TEAL, ml: 2, color: "#fff", "&:hover": { backgroundColor: "#006d6d" } }}
              >
                {loading ? <CircularProgress size={24} /> : "Save"}
              </Button>
              <Button
                variant="outlined"
                onClick={editable.cancelEdit}
                disabled={loading}
                sx={{ borderColor: PRIMARY_TEAL, color: PRIMARY_TEAL, ml: 2, "&:hover": { borderColor: "#006d6d", backgroundColor: "#e6f4f4" } }}
              >
                Cancel
              </Button>
            </>
          )}
        </Box>

        <Box id="template-to-download" className="template-section">
          <Typography variant="h4" sx={{ fontWeight: 700, color: PRIMARY_TEAL, mb: 2 }}>
            Relationship heatmap
          </Typography>

          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  {headers.map((h) => (
                    <StyledTableCell key={h} className="header">{h}</StyledTableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {editable.draftData.map((row: any, index: number) => (
                  <TableRow
                    key={index}
                    sx={{ backgroundColor: getRowColorByRelationship(row.client_relationship) }}
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
                        {editable.isEditing ? (
                          field === "client_relationship" ? (
                            <TextField
                              select
                              fullWidth
                              size="small"
                              value={row[field]}
                              onChange={(e) => updateCell(index, field, e.target.value)}
                              SelectProps={{ displayEmpty: true }}
                            >
                              <MenuItem value=""><em>None</em></MenuItem>
                              {RELATIONSHIP_OPTIONS.map((option) => (
                                <MenuItem key={option} value={option}>{option}</MenuItem>
                              ))}
                            </TextField>
                          ) : (
                            <TextField
                              fullWidth
                              size="small"
                              value={row[field]}
                              onChange={(e) => updateCell(index, field, e.target.value)}
                            />
                          )
                        ) : (
                          row[field]
                        )}
                      </StyledTableCell>
                    ))}
                  </TableRow>
                ))}
                {editable.isEditing && (
                  <TableRow>
                    <StyledTableCell colSpan={7}>
                      <Button onClick={addRow} sx={{ color: PRIMARY_TEAL, textTransform: "none", "&:hover": { backgroundColor: "#e6f4f4" } }}>
                        + Add stakeholder
                      </Button>
                    </StyledTableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
            {[["Promoter", COLOR_PROMOTER], ["Neutral", COLOR_NEUTRAL], ["Detractor", COLOR_DETRACTOR]].map(([label, color]) => (
              <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box sx={{ width: 20, height: 20, backgroundColor: color, border: "1px solid #000" }} />
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