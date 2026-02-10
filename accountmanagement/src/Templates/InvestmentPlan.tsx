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

const API_BASE_URL = "http://localhost:8000/api";
const TEMPLATE_NAME = "Investment_Plan"; // Display name for PDF

// Define interfaces matching backend normalization
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

// Styled Components
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

  // ✅ 1. Consistent User ID Logic
  const userId =
    globalData?.user_id ||
    localStorage.getItem("user_id") ||
    "101";

  const companyName =
    globalData?.company_name ||
    localStorage.getItem("company_name") ||
    "";

  // Access using snake_case to match backend
  const investmentData = globalData?.investment_plan || null;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning",
  });

  const dataLoadedFromDB = useRef(false);

  // Transform backend data into UI rows
  const initialData = React.useMemo(() => {
    let rows: InvestmentRow[];
    // Check if data exists and has the 'data' array (from normalizer)
    if (!investmentData || !investmentData.data || !Array.isArray(investmentData.data)) {
      rows = [
        { id: 1, type: "Billing investment", desc: "", val: "", outcome: "", owner: "", status: "Approved", remarks: "" },
        { id: 2, type: "Buffers", desc: "", val: "", outcome: "", owner: "", status: "Delayed", remarks: "" },
        { id: 3, type: "Innovation", desc: "", val: "", outcome: "", owner: "", status: "At Risk", remarks: "" },
        { id: 4, type: "Free resources", desc: "", val: "", outcome: "", owner: "", status: "On-track", remarks: "" },
        { id: 5, type: "Marketing investments / relationship building", desc: "", val: "", outcome: "", owner: "", status: "Approved", remarks: "" },
        { id: 6, type: "Travel investments", desc: "", val: "", outcome: "", owner: "", status: "Delayed", remarks: "" },
      ];
    } else {
      // Map backend fields to UI fields
      rows = investmentData.data.map((item: any) => ({
        id: item.investment_number,
        type: item.investment_type,
        desc: item.investment_description,
        val: item.investment_value_eur,
        outcome: item.targeted_outcome,
        owner: item.primary_owner,
        status: item.timeline_status,
        remarks: item.remarks,
      }));
    }

    return {
      rows,
      totalValue: investmentData?.total_investment_value || "XX",
    };
  }, [investmentData]);

  // Initialize editable table hook
  const editable = useEditableTable(initialData);

  // Sync draft when global data changes (e.g. after Chatbot update)
  useEffect(() => {
    if (investmentData && !editable.isEditing) {
      // Re-run the mapping logic to update UI
      const rows = (investmentData.data && Array.isArray(investmentData.data))
        ? investmentData.data.map((item: any) => ({
          id: item.investment_number,
          type: item.investment_type,
          desc: item.investment_description,
          val: item.investment_value_eur,
          outcome: item.targeted_outcome,
          owner: item.primary_owner,
          status: item.timeline_status,
          remarks: item.remarks,
        }))
        : initialData.rows;

      editable.updateDraft({
        rows: rows,
        totalValue: investmentData.total_investment_value || "XX",
      });
    }
  }, [investmentData]);

  useEffect(() => {
    const total = calculateTotalInvestment(editable.draftData.rows);
    editable.updateDraft({
      ...editable.draftData,
      totalValue: total.toString(),
    });
  }, [editable.draftData.rows]);

  // ✅ STEP 2: Load data from database (With User ID)
  useEffect(() => {
    const loadDataFromDB = async () => {
      if (dataLoadedFromDB.current) return;
      setInitialLoading(true);

      try {
        // ✅ Added ?user_id=${userId}
        const response = await fetch(`${API_BASE_URL}/investment-plan/?user_id=${userId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
          const dbData = await response.json();
          // Backend returns { "data": [...], "total_investment_value": "..." } directly
          if (dbData && (dbData.data || dbData.total_investment_value)) {
            setGlobalData((prev: any) => ({
              ...prev,
              investment_plan: dbData, // Save to snake_case key
            }));
            dataLoadedFromDB.current = true;
          }
        }
      } catch (error) {
        console.error("Error loading investment plan:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadDataFromDB();
  }, [userId, setGlobalData]);

  const STATUS_OPTIONS = ["Approved", "On-track", "Delayed", "At Risk", "To be discussed"];

  // Handle row field change
  const handleRowChange = (index: number, field: keyof InvestmentRow, value: string | number) => {
    const updatedRows = [...editable.draftData.rows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };
    editable.updateDraft({ ...editable.draftData, rows: updatedRows });
  };

  // Handle total value change
  const handleTotalValueChange = (value: string) => {
    editable.updateDraft({ ...editable.draftData, totalValue: value });
  };
  const calculateTotalInvestment = (rows: InvestmentRow[]) => {
    return rows.reduce((sum, row) => {
      const value = parseFloat(row.val);
      return sum + (isNaN(value) ? 0 : value);
    }, 0);
  };


  // ✅ STEP 3: Manual save (With User ID)
  const handleManualSave = async () => {
    setLoading(true);
    try {
      const backendFormattedData = editable.draftData.rows.map((row) => ({
        investment_number: row.id,
        investment_type: row.type,
        investment_description: row.desc,
        investment_value_eur: row.val,
        targeted_outcome: row.outcome,
        primary_owner: row.owner,
        timeline_status: row.status,
        remarks: row.remarks,
      }));

      const payload = {
        user_id: userId,
        company_name: companyName,
        data: backendFormattedData,
        total_investment_value: editable.draftData.totalValue,
      };

      const response = await fetch(
        `${API_BASE_URL}/investment-plan/save_plan/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        setGlobalData((prev: any) => ({
          ...prev,
          investment_plan: result.data,
        }));
        editable.saveEdit(() => { });
        setSnackbar({
          open: true,
          message: "✅ Investment Plan saved successfully",
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
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading investment plan...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "#fff", p: 2 }}>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Box sx={{ maxWidth: 1800, mx: "auto", px: 4, py: 2 }}>
        {/* HEADER */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mb: 2 }}>
          <DownloadTemplates templateName={TEMPLATE_NAME} />
          {!editable.isEditing ? (
            <Button variant="outlined" onClick={editable.startEdit} disabled={loading} sx={{ borderColor: PRIMARY_TEAL, color: PRIMARY_TEAL, ml: 2 }}>
              Edit
            </Button>
          ) : (
            <>
              <Button variant="contained" onClick={handleManualSave} disabled={loading} sx={{ backgroundColor: PRIMARY_TEAL, ml: 2, color: "#fff" }}>
                {loading ? <CircularProgress size={24} /> : "Save"}
              </Button>
              <Button variant="outlined" onClick={editable.cancelEdit} disabled={loading} sx={{ borderColor: PRIMARY_TEAL, color: PRIMARY_TEAL, ml: 2 }}>
                Cancel
              </Button>
            </>
          )}
        </Box>

        {/* TABLE */}
        <Box id="template-to-download">
          <Box className="pdf-section">
            <Typography variant="h4" sx={{ fontWeight: 700, color: PRIMARY_TEAL, mb: 2 }}>
              Investment plan for next 12 months
            </Typography>

            {/* Status Legend */}
            <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
              {Object.entries(STATUS_COLORS).map(([label, color]) => (
                <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box sx={{ width: 20, height: 20, backgroundColor: color, border: "1px solid #000" }} />
                  <Typography fontSize={12}>{label}</Typography>
                </Box>
              ))}
            </Box>

            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    {headers.map((head, idx) => (
                      <StyledTableCell key={idx} className="header">{head}</StyledTableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {editable.draftData.rows.map((row, index) => (
                    <TableRow key={row.id}>
                      <StyledTableCell>{row.id}</StyledTableCell>
                      <StyledTableCell>{row.type}</StyledTableCell>

                      <StyledTableCell>
                        {editable.isEditing ? <TextField fullWidth multiline size="small" value={row.desc} onChange={(e) => handleRowChange(index, "desc", e.target.value)} /> : row.desc}
                      </StyledTableCell>

                      <StyledTableCell>
                        {editable.isEditing ? <TextField fullWidth size="small" value={row.val} onChange={(e) => handleRowChange(index, "val", e.target.value)} /> : row.val}
                      </StyledTableCell>

                      <StyledTableCell>
                        {editable.isEditing ? <TextField fullWidth multiline size="small" value={row.outcome} onChange={(e) => handleRowChange(index, "outcome", e.target.value)} /> : row.outcome}
                      </StyledTableCell>

                      <StyledTableCell>
                        {editable.isEditing ? <TextField fullWidth size="small" value={row.owner} onChange={(e) => handleRowChange(index, "owner", e.target.value)} /> : row.owner}
                      </StyledTableCell>

                      <StyledTableCell className="status-cell" sx={{ backgroundColor: STATUS_COLORS[row.status] || "#d9d9d9" }}>
                        {editable.isEditing ? (
                          <TextField select fullWidth size="small" value={row.status} onChange={(e) => handleRowChange(index, "status", e.target.value)} sx={{ "& .MuiInputBase-root": { color: "#fff", fontWeight: 700 }, "& svg": { color: "#fff" } }}>
                            {STATUS_OPTIONS.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                          </TextField>
                        ) : row.status}
                      </StyledTableCell>

                      <StyledTableCell>
                        {editable.isEditing ? <TextField fullWidth multiline size="small" value={row.remarks} onChange={(e) => handleRowChange(index, "remarks", e.target.value)} /> : row.remarks}
                      </StyledTableCell>
                    </TableRow>
                  ))}

                  {/* Total Row */}
                  <TableRow>
                    <StyledTableCell colSpan={3} className="total-label">Total</StyledTableCell>
                    <StyledTableCell className="total-value">
                      {editable.draftData.totalValue}
                    </StyledTableCell>
                    <StyledTableCell colSpan={4}></StyledTableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default InvestmentPlan;