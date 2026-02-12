import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  MenuItem,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  styled,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Snackbar,
  Alert
} from "@mui/material";
import DownloadTemplates from "../components/DownloadTemplates";
import { useEditableTable } from "../hooks/useEditableTable";
import { useData } from "../context/DataContext";

const API_BASE_URL = "http://localhost:8000/api";
const TEMPLATE_NAME = "Implementation_Plan_Operational_Excellence";
const TEAL_COLOR = "#008080";

// Define interfaces
interface ImplementationAction {
  category: string;
  subcategory: string;
  action_number: number;
  action_description: string;
  primary_owner: string;
  support_team: string;
  timeline: string;
  status: string;
  help_required: string;
  investment_needed: string;
  impact: string;
}

interface ActionRow {
  id: number;
  action: string;
  status: string;
  primary_owner: string;
  support_team: string;
  timeline: string;
  help_required: string;
  investment_needed: string;
  impact: string;
}

interface GroupData {
  subCategory: string;
  rows: ActionRow[];
}

interface PlanData {
  planDate: string;
  mainCategory: string;
  groups: GroupData[];
}

const STATUS_OPTIONS = [
  "Completed",
  "On-track",
  "Critical",
  "Delayed",
  "To be initiated",
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Completed": return "#8CC63F";
    case "On-track": return "#0070C0";
    case "Critical to fast-track":
    case "Critical": return "#FFC000";
    case "Delayed": return "#C00000";
    case "To be initiated": return "#D9D9D9";
    default: return "transparent";
  }
};

const HeaderCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: "#011E26",
  color: "#ffffff",
  fontWeight: 700,
  fontSize: theme.typography.pxToRem(11),
  border: "1px solid #ccc",
  padding: "8px 4px",
}));

const BodyCell = styled(TableCell)(({ theme }) => ({
  border: "1px solid #ccc",
  fontSize: theme.typography.pxToRem(11),
  padding: "4px 6px",
  height: 30,
}));

const MainCategoryCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: "#011E26",
  color: "#ffffff",
  fontWeight: 700,
  textAlign: "center",
  width: 100,
  border: "1px solid #ccc",
  fontSize: theme.typography.pxToRem(11),
}));

const SubCategoryCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: "#177E89",
  color: "#ffffff",
  fontWeight: 700,
  textAlign: "center",
  width: 100,
  border: "1px solid #ccc",
  fontSize: theme.typography.pxToRem(11),
}));

const NumberCell = styled(BodyCell)({
  textAlign: "center",
  width: 30,
});

const StatusCell = styled(TableCell)({
  padding: 0,
  width: 60,
  border: "1px solid #ccc",
});

const InvestmentCell = styled(BodyCell)({
  backgroundColor: "#E6E6E6",
});

export default function OperationalImplementationPlan() {
  const { globalData, setGlobalData } = useData();
  const dataFromContext = globalData?.operational_implementation_plan || null;

  const userId = globalData?.user_id || localStorage.getItem("user_id") || "101";
  const companyName = globalData?.company_name || localStorage.getItem("company_name") || "";

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingChatbotData, setPendingChatbotData] = useState<any>(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning",
  });

  const dataLoadedFromDB = useRef(false);
  const previousDataRef = useRef<string | null>(null);

  // ✅ 1. SAFE DATA MAPPING: Failsafe grouping so it never crashes
  const initialPlanData = React.useMemo(() => {
    if (!dataFromContext || !dataFromContext.data || !Array.isArray(dataFromContext.data) || dataFromContext.data.length === 0) {
      return {
        planDate: "xx",
        mainCategory: "Operational Excellence",
        groups: [
          {
            subCategory: "",
            rows: Array(5).fill(null).map((_, idx) => ({
              id: idx + 1, action: "", status: "To be initiated", primary_owner: "",
              support_team: "", timeline: "", help_required: "", investment_needed: "", impact: "",
            })),
          },
        ],
      };
    }

    const categoryMap: Record<string, Record<string, any[]>> = {};
    
    dataFromContext.data.forEach((action: any) => {
      const cat = action.category || "Operational Excellence";
      const sub = action.subcategory || "General";
      
      if (!categoryMap[cat]) categoryMap[cat] = {};
      if (!categoryMap[cat][sub]) categoryMap[cat][sub] = [];
      categoryMap[cat][sub].push(action);
    });

    const mainCategory = Object.keys(categoryMap)[0] || "Operational Excellence";

    const groups = Object.entries(categoryMap[mainCategory] || {}).map(
      ([subCategory, actions]) => ({
        subCategory,
        rows: actions.map((action: any, idx: number) => ({
          id: action.action_number || idx + 1,
          action: action.action_description || "",
          status: action.status || "To be initiated",
          primary_owner: action.primary_owner || "",
          support_team: action.support_team || "",
          timeline: action.timeline || "",
          help_required: action.help_required || "",
          investment_needed: action.investment_needed || "",
          impact: action.impact || "",
        })),
      })
    );

    return {
      planDate: dataFromContext.plan_date || "xx",
      mainCategory,
      groups,
    };
  }, [dataFromContext]);

  const editable = useEditableTable<PlanData>(initialPlanData);

  // ✅ 2. FORCE SYNC: Pushes new AI data into the visual UI state immediately
  useEffect(() => {
    if (!editable.isEditing) {
      editable.updateDraft(initialPlanData);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPlanData]);

  // ✅ 3. INITIAL LOAD: Unlock DB flag even if DB is empty
  useEffect(() => {
    const loadDataFromDB = async () => {
      if (dataLoadedFromDB.current) return;
      setInitialLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/operational-implementation-plan/?user_id=${encodeURIComponent(userId)}`);
        if (response.ok) {
          const dbData = await response.json();
          // Unlock the flag so the Chatbot overwrite listener can run
          dataLoadedFromDB.current = true; 
          
          if (dbData && dbData.data && dbData.data.length > 0) {
            setGlobalData((prev: any) => ({ ...prev, operational_implementation_plan: dbData }));
            previousDataRef.current = JSON.stringify(dbData);
          }
        }
      } catch (error) {
        console.error("Error loading plan:", error);
        dataLoadedFromDB.current = true; // Failsafe unlock
      } finally {
        setInitialLoading(false);
      }
    };
    loadDataFromDB();
  }, [userId, setGlobalData]);

  // STEP 4: Chatbot Overwrite / Auto-save
  useEffect(() => {
    const checkAndProcessData = async () => {
      if (!dataFromContext?.data?.length) return;

      const currentDataString = JSON.stringify(dataFromContext);
      if (currentDataString === previousDataRef.current) return;

      const isFirstTime = !previousDataRef.current || previousDataRef.current === "" || previousDataRef.current === "{}";

      if (isFirstTime) {
        await performSave(dataFromContext);
      } else {
        setPendingChatbotData(dataFromContext);
        setShowConfirmDialog(true);
      }
    };

    if (!initialLoading && dataLoadedFromDB.current) {
      const timeoutId = setTimeout(checkAndProcessData, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [dataFromContext, initialLoading]);

  const flattenData = (data: PlanData) => {
    return data.groups.flatMap((group) =>
      group.rows.map((row) => ({
        category: data.mainCategory,
        subcategory: group.subCategory,
        action_number: row.id,
        action_description: row.action,
        primary_owner: row.primary_owner,
        support_team: row.support_team,
        timeline: row.timeline,
        status: row.status,
        help_required: row.help_required,
        investment_needed: row.investment_needed,
        impact: row.impact,
      }))
    );
  };

  const performSave = async (dataToSave: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/operational-implementation-plan/save/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          company_name: companyName,
          ...dataToSave
        }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setGlobalData((prev: any) => ({ ...prev, operational_implementation_plan: result.payload }));
        previousDataRef.current = JSON.stringify(result.payload);
        setSnackbar({ open: true, message: "✅ Plan saved", severity: "success" });
      }
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const handleOverwrite = async () => {
    if (pendingChatbotData) await performSave(pendingChatbotData);
    setShowConfirmDialog(false);
  };

  const handleKeepExisting = () => {
    if (previousDataRef.current) {
      try {
        const oldData = JSON.parse(previousDataRef.current);
        setGlobalData((prev: any) => ({ ...prev, operational_implementation_plan: oldData }));
      } catch (e) { console.error(e); }
    }
    setShowConfirmDialog(false);
  };

  // STEP 5: Manual Save
  const handleManualSave = async () => {
    setLoading(true);
    const payloadToSave = {
      plan_date: editable.draftData.planDate,
      data: flattenData(editable.draftData)
    };

    try {
      const response = await fetch(`${API_BASE_URL}/operational-implementation-plan/save/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          company_name: companyName,
          ...payloadToSave
        }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setGlobalData((prev: any) => ({ ...prev, operational_implementation_plan: result.payload }));
        editable.saveEdit(() => {});
        previousDataRef.current = JSON.stringify(result.payload);
        setSnackbar({ open: true, message: "✅ Plan saved", severity: "success" });
      }
    } catch (error) {
      setSnackbar({ open: true, message: "❌ Failed to save", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handlePlanDateChange = (value: string) => editable.updateDraft({ ...editable.draftData, planDate: value });
  const handleMainCategoryChange = (value: string) => editable.updateDraft({ ...editable.draftData, mainCategory: value });
  const handleSubCategoryChange = (groupIndex: number, value: string) => {
    const updatedGroups = [...editable.draftData.groups];
    updatedGroups[groupIndex] = { ...updatedGroups[groupIndex], subCategory: value };
    editable.updateDraft({ ...editable.draftData, groups: updatedGroups });
  };
  const handleRowChange = (groupIndex: number, rowIndex: number, field: keyof ActionRow, value: string | number) => {
    const updatedGroups = [...editable.draftData.groups];
    updatedGroups[groupIndex].rows[rowIndex] = { ...updatedGroups[groupIndex].rows[rowIndex], [field]: value };
    editable.updateDraft({ ...editable.draftData, groups: updatedGroups });
  };

  if (initialLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading Implementation Plan...</Typography>
      </Box>
    );
  }

  const totalRows = editable.draftData.groups.reduce((acc, g) => acc + g.rows.length, 0);

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "#ffffff", p: 2 }}>
      <Dialog open={showConfirmDialog} disableEscapeKeyDown>
        <DialogTitle sx={{ fontWeight: 700 }}>Update Plan?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The chatbot has generated a new implementation plan. Do you want to **Overwrite** or **Keep**?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
           <Button onClick={handleKeepExisting} variant="outlined" color="inherit">Keep My Data</Button>
           <Button onClick={handleOverwrite} variant="contained" sx={{ bgcolor: TEAL_COLOR }}>Overwrite</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>

      <Box sx={{ maxWidth: 1600, mx: "auto", px: 4, py: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
          <Typography fontSize={35} fontWeight={700} sx={{ color: TEAL_COLOR }}>
            Implementation plan for operational excellence, delivery, and talent
          </Typography>

          <Box sx={{ display: "flex", gap: 2 }}>
            <DownloadTemplates templateName={TEMPLATE_NAME} />
            {!editable.isEditing ? (
              <Button variant="outlined" onClick={editable.startEdit} sx={{ borderColor: TEAL_COLOR, color: TEAL_COLOR }}>Edit</Button>
            ) : (
              <>
                <Button variant="contained" onClick={handleManualSave} disabled={loading} sx={{ bgcolor: TEAL_COLOR, color: "#fff" }}>
                  {loading ? <CircularProgress size={20} color="inherit" /> : "Save"}
                </Button>
                <Button variant="outlined" onClick={editable.cancelEdit} sx={{ borderColor: TEAL_COLOR, color: TEAL_COLOR }}>Cancel</Button>
              </>
            )}
          </Box>
        </Box>

        <Box id="template-to-download" className="template-section">
          <Box className="pdf-section">
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Plan date:</Typography>
              {editable.isEditing ? (
                <TextField size="small" value={editable.draftData.planDate} onChange={(e) => handlePlanDateChange(e.target.value)} sx={{ width: 150 }} />
              ) : (
                <Typography sx={{ fontSize: 14 }}>{editable.draftData.planDate}</Typography>
              )}
            </Box>

            <Box sx={{ color:"#111111", display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
              {STATUS_OPTIONS.map((status) => (
                <Box key={status} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 20, height: 20, bgcolor: getStatusColor(status), border: "1px solid #ccc" }} />
                  <Typography sx={{ fontSize: 12 }}>{status}</Typography>
                </Box>
              ))}
            </Box>

            <TableContainer component={Paper} sx={{ mb: 4 }}>
              <Table size="small" sx={{ borderCollapse: "collapse" }}>
                <TableHead>
                  <TableRow>
                    <HeaderCell colSpan={2}>Category</HeaderCell>
                    <HeaderCell>#</HeaderCell>
                    <HeaderCell>Action</HeaderCell>
                    <HeaderCell>Primary Owner</HeaderCell>
                    <HeaderCell>Support Team</HeaderCell>
                    <HeaderCell>Timeline</HeaderCell>
                    <HeaderCell>Status</HeaderCell>
                    <HeaderCell>Help Required</HeaderCell>
                    <HeaderCell>Investment Needed</HeaderCell>
                    <HeaderCell>Impact</HeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {editable.draftData.groups.map((group, gi) =>
                    group.rows.map((row, ri) => (
                      <TableRow key={`${gi}-${ri}`}>
                        {gi === 0 && ri === 0 && (
                          <MainCategoryCell rowSpan={totalRows}>
                            {editable.isEditing ? (
                              <TextField size="small" fullWidth value={editable.draftData.mainCategory} onChange={(e) => handleMainCategoryChange(e.target.value)} sx={{ "& .MuiInputBase-root": { color: "white" } }} />
                            ) : (
                              editable.draftData.mainCategory
                            )}
                          </MainCategoryCell>
                        )}

                        {ri === 0 && (
                          <SubCategoryCell rowSpan={group.rows.length}>
                            {editable.isEditing ? (
                              <TextField size="small" fullWidth value={group.subCategory} onChange={(e) => handleSubCategoryChange(gi, e.target.value)} sx={{ "& .MuiInputBase-root": { color: "white" } }} />
                            ) : (
                              group.subCategory
                            )}
                          </SubCategoryCell>
                        )}

                        <NumberCell>{row.id}</NumberCell>
                        <BodyCell>{editable.isEditing ? <TextField size="small" fullWidth multiline value={row.action} onChange={(e) => handleRowChange(gi, ri, "action", e.target.value)} /> : row.action}</BodyCell>
                        <BodyCell>{editable.isEditing ? <TextField size="small" fullWidth value={row.primary_owner} onChange={(e) => handleRowChange(gi, ri, "primary_owner", e.target.value)} /> : row.primary_owner}</BodyCell>
                        <BodyCell>{editable.isEditing ? <TextField size="small" fullWidth value={row.support_team} onChange={(e) => handleRowChange(gi, ri, "support_team", e.target.value)} /> : row.support_team}</BodyCell>
                        <BodyCell>{editable.isEditing ? <TextField size="small" fullWidth value={row.timeline} onChange={(e) => handleRowChange(gi, ri, "timeline", e.target.value)} /> : row.timeline}</BodyCell>
                        <StatusCell>
                          {editable.isEditing ? (
                            <TextField select size="small" fullWidth value={row.status} onChange={(e) => handleRowChange(gi, ri, "status", e.target.value)} SelectProps={{ displayEmpty: true }}>
                              {STATUS_OPTIONS.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                            </TextField>
                          ) : (
                            <Box sx={{ backgroundColor: getStatusColor(row.status), width: "100%", height: "100%", minHeight: 30 }} />
                          )}
                        </StatusCell>
                        <BodyCell>{editable.isEditing ? <TextField size="small" fullWidth multiline value={row.help_required} onChange={(e) => handleRowChange(gi, ri, "help_required", e.target.value)} /> : row.help_required}</BodyCell>
                        <InvestmentCell>{editable.isEditing ? <TextField size="small" fullWidth value={row.investment_needed} onChange={(e) => handleRowChange(gi, ri, "investment_needed", e.target.value)} /> : row.investment_needed}</InvestmentCell>
                        <BodyCell>{editable.isEditing ? <TextField size="small" fullWidth multiline value={row.impact} onChange={(e) => handleRowChange(gi, ri, "impact", e.target.value)} /> : row.impact}</BodyCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          <Typography sx={{ fontSize: 10, color: "#6b7280", mt: 2 }}>
            Classification: Controlled. Copyright ©2025 Version 1. All rights reserved.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}