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
    styled,
    CircularProgress,
    Snackbar,
    Alert
} from "@mui/material";
import DownloadTemplates from "../components/DownloadTemplates";
import { useEditableTable } from "../hooks/useEditableTable";
import { useData } from "../context/DataContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const TEMPLATE_NAME = "margin_improvement_plan_2";

/* ---------------- TYPES ---------------- */
type ChartRow = {
    quarter: string;
    actuals_projections: string;
    target: string;
};

type PyramidRow = {
    id: number;
    category: "Offshore" | "Onsite";
    label: string;
    fy24: string;
    q424: string;
    q125: string;
    q225A: string;
    q325C: string;
    q325P: string;
    q425C: string;
    q425P: string;
    fy25C: string;
    fy25P: string;
};

/* ---------------- STYLES ---------------- */
const PageContainer = styled(Box)({
    padding: "24px",
    backgroundColor: "#fff",
    minHeight: "100vh",
});

const PageTitle = styled(Typography)({
    fontSize: 30,
    fontWeight: 700,
    color: "#008080",
    marginBottom: 16,
});

const HeaderCell = styled(TableCell)<{ boldright?: string }>(({ boldright }) => ({
    backgroundColor: "#022D36",
    color: "#fff",
    fontWeight: 700,
    fontSize: 11,
    border: "1px solid #444",
    borderBottom: "1.5px solid #fff",
    borderRight: boldright === "true" ? "3px solid #fff" : "1px solid #444",
    textAlign: "center",
    padding: "6px 4px",
}));

const SubHeaderCell = styled(TableCell)<{ boldright?: string }>(({ boldright }) => ({
    backgroundColor: "#0D7F8C",
    color: "#fff",
    fontWeight: 600,
    fontSize: 10,
    border: "1px solid #ffffff",
    borderRight: boldright === "true" ? "2.5px solid #ffffff" : "1px solid #b9b9b9",
    textAlign: "center",
    padding: "4px 2px",
}));

const CategoryHeaderCell = styled(TableCell)({
    backgroundColor: "#E0F7FA",
    fontWeight: 700,
    fontSize: 11,
    color: "#000",
    padding: "6px 12px",
    border: "1px solid #d0d0d0",
});

const LabelCell = styled(TableCell)({
    fontSize: 11,
    fontWeight: 700,
    padding: "4px 12px",
    border: "1px solid #d0d0d0",
    borderRight: "3px solid #022D36",
    backgroundColor: "#fff",
});

const DataCell = styled(TableCell)<{ boldright?: string }>(({ boldright }) => ({
    fontSize: 11,
    border: "1px solid #d0d0d0",
    borderRight: boldright === "true" ? "3px solid #022D36" : "1px solid #d0d0d0",
    padding: "2px 4px",
    textAlign: "center",
    backgroundColor: "#fff",
}));

const InputField = styled(TextField)({
  width: '100%',
  '& .MuiInputBase-input': {
    fontSize: "0.75rem",
    padding: "8px",
    color: "#333",
    lineHeight: 1.4,
  },
  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
  backgroundColor: 'transparent'
});

/* ---------------- HELPERS & EXTRACTORS ---------------- */
const defaultData = {
    gross_profit_chart: [
      { quarter: "Q1 FY25", actuals_projections: "", target: "" }, { quarter: "Q2 FY25", actuals_projections: "", target: "" },
      { quarter: "Q3 FY25", actuals_projections: "", target: "" }, { quarter: "Q4 FY25", actuals_projections: "", target: "" },
      { quarter: "Q1 FY26", actuals_projections: "", target: "" }, { quarter: "Q2 FY26", actuals_projections: "", target: "" },
      { quarter: "Q3 FY26", actuals_projections: "", target: "" }, { quarter: "Q4 FY26", actuals_projections: "", target: "" }
    ],
    pyramid_teardown: [
        { id: 1, category: "Offshore" as const, label: "L1", fy24: "", q424: "", q125: "", q225A: "", q325C: "", q325P: "", q425C: "", q425P: "", fy25C: "", fy25P: "" },
        { id: 2, category: "Offshore" as const, label: "L2", fy24: "", q424: "", q125: "", q225A: "", q325C: "", q325P: "", q425C: "", q425P: "", fy25C: "", fy25P: "" },
        { id: 3, category: "Offshore" as const, label: "L3", fy24: "", q424: "", q125: "", q225A: "", q325C: "", q325P: "", q425C: "", q425P: "", fy25C: "", fy25P: "" },
        { id: 4, category: "Offshore" as const, label: "L4", fy24: "", q424: "", q125: "", q225A: "", q325C: "", q325P: "", q425C: "", q425P: "", fy25C: "", fy25P: "" },
        { id: 5, category: "Offshore" as const, label: "L5", fy24: "", q424: "", q125: "", q225A: "", q325C: "", q325P: "", q425C: "", q425P: "", fy25C: "", fy25P: "" },
        { id: 6, category: "Offshore" as const, label: "Sub-con", fy24: "", q424: "", q125: "", q225A: "", q325C: "", q325P: "", q425C: "", q425P: "", fy25C: "", fy25P: "" },
        { id: 7, category: "Onsite" as const, label: "L1", fy24: "", q424: "", q125: "", q225A: "", q325C: "", q325P: "", q425C: "", q425P: "", fy25C: "", fy25P: "" },
        { id: 8, category: "Onsite" as const, label: "L2", fy24: "", q424: "", q125: "", q225A: "", q325C: "", q325P: "", q425C: "", q425P: "", fy25C: "", fy25P: "" },
        { id: 9, category: "Onsite" as const, label: "L3", fy24: "", q424: "", q125: "", q225A: "", q325C: "", q325P: "", q425C: "", q425P: "", fy25C: "", fy25P: "" },
        { id: 10, category: "Onsite" as const, label: "L4", fy24: "", q424: "", q125: "", q225A: "", q325C: "", q325P: "", q425C: "", q425P: "", fy25C: "", fy25P: "" },
        { id: 11, category: "Onsite" as const, label: "L5", fy24: "", q424: "", q125: "", q225A: "", q325C: "", q325P: "", q425C: "", q425P: "", fy25C: "", fy25P: "" },
        { id: 12, category: "Onsite" as const, label: "Sub-con", fy24: "", q424: "", q125: "", q225A: "", q325C: "", q325P: "", q425C: "", q425P: "", fy25C: "", fy25P: "" }
    ],
    pyramid_improvement_plan: ""
};

const extractData = (source: any) => {
    const d = source?.data || source || {};

    const mappedChart = defaultData.gross_profit_chart.map((defRow, i) => {
        const srcRow = Array.isArray(d.gross_profit_chart) && d.gross_profit_chart[i] ? d.gross_profit_chart[i] : {};
        return {
          quarter: srcRow?.quarter || defRow.quarter,
          actuals_projections: srcRow?.actuals_projections || defRow.actuals_projections,
          target: srcRow?.target || defRow.target,
        };
    });

    const mappedPyramid = defaultData.pyramid_teardown.map((defRow, i) => {
        const srcRow = Array.isArray(d.pyramid_teardown) && d.pyramid_teardown[i] ? d.pyramid_teardown[i] : {};
        return {
            ...defRow,
            fy24: srcRow?.fy24 || defRow.fy24,
            q424: srcRow?.q424 || defRow.q424,
            q125: srcRow?.q125 || defRow.q125,
            q225A: srcRow?.q225A || defRow.q225A,
            q325C: srcRow?.q325C || defRow.q325C,
            q325P: srcRow?.q325P || defRow.q325P,
            q425C: srcRow?.q425C || defRow.q425C,
            q425P: srcRow?.q425P || defRow.q425P,
            fy25C: srcRow?.fy25C || defRow.fy25C,
            fy25P: srcRow?.fy25P || defRow.fy25P,
        };
    });

    return {
        gross_profit_chart: mappedChart,
        pyramid_teardown: mappedPyramid,
        pyramid_improvement_plan: d.pyramid_improvement_plan || "",
        id: d.id
    };
};

/* ---------------- MAIN ---------------- */
export default function MarginImprovementPlan2() {
    const { globalData, setGlobalData } = useData();
    const userId = globalData?.user_id || localStorage.getItem("user_id") || "101";

    const rawData = extractData(globalData?.margin_improvement_plan_2);

    const chartEditable = useEditableTable(rawData.gross_profit_chart);
    const pyramidEditable = useEditableTable(rawData.pyramid_teardown);
    const [improvementPlanText, setImprovementPlanText] = useState(rawData.pyramid_improvement_plan);

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as any });

    const dataLoadedFromDB = useRef(false);
    const autoSaveAttempted = useRef(false);

    // 1. Sync from Chatbot
    useEffect(() => {
        if (globalData?.margin_improvement_plan_2 && !pyramidEditable.isEditing && !chartEditable.isEditing) {
            const parsed = extractData(globalData.margin_improvement_plan_2);
            chartEditable.updateDraft(parsed.gross_profit_chart);
            pyramidEditable.updateDraft(parsed.pyramid_teardown);
            setImprovementPlanText(parsed.pyramid_improvement_plan);
        }
    }, [globalData?.margin_improvement_plan_2]);

    // 2. Load from DB
    useEffect(() => {
        const fetchData = async () => {
            if (dataLoadedFromDB.current) return;
            setInitialLoading(true);
            try {
                const res = await fetch(`${API_BASE_URL}/template-payload/${TEMPLATE_NAME}/?user_id=${userId}`);
                if (res.ok) {
                    const dbData = await res.json();
                    if (Object.keys(dbData).length > 0) {
                        const parsed = extractData(dbData);
                        chartEditable.updateDraft(parsed.gross_profit_chart);
                        pyramidEditable.updateDraft(parsed.pyramid_teardown);
                        setImprovementPlanText(parsed.pyramid_improvement_plan);
                        setGlobalData((prev: any) => ({ ...prev, margin_improvement_plan_2: parsed }));
                        dataLoadedFromDB.current = true;
                    }
                }
            } catch (e) {
                console.error("Fetch failed", e);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchData();
    }, [userId, setGlobalData]);

    // 3. Auto-Save
    useEffect(() => {
        const autoSave = async () => {
            if (dataLoadedFromDB.current && !autoSaveAttempted.current) {
                const rawGlobal = globalData?.margin_improvement_plan_2;
                const isNew = rawGlobal && !rawGlobal.id;
                if (isNew && !autoSaveAttempted.current) {
                    autoSaveAttempted.current = true;
                    try {
                        const payload = { user_id: userId, data: rawData };
                        const res = await fetch(`${API_BASE_URL}/template-payload/${TEMPLATE_NAME}/`, {
                            method: "POST", headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payload)
                        });
                        const result = await res.json();
                        if (res.ok && result.success) {
                            setGlobalData((prev: any) => ({ ...prev, margin_improvement_plan_2: extractData(result.data) }));
                            setSnackbar({ open: true, message: "✅ Auto-saved to database", severity: "success" });
                        }
                    } catch (e) {
                        autoSaveAttempted.current = false;
                    }
                }
            }
        };
        const t = setTimeout(autoSave, 500);
        return () => clearTimeout(t);
    }, [rawData, userId, setGlobalData]);

    // 4. Manual Save
    const handleSave = async () => {
        setLoading(true);
        try {
            const payloadData = {
                gross_profit_chart: chartEditable.draftData,
                pyramid_teardown: pyramidEditable.draftData,
                pyramid_improvement_plan: improvementPlanText
            };

            const res = await fetch(`${API_BASE_URL}/template-payload/${TEMPLATE_NAME}/`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: userId, data: payloadData })
            });
            const result = await res.json();
            if (res.ok && result.success) {
                setGlobalData((prev: any) => ({ ...prev, margin_improvement_plan_2: extractData(result.data) }));
                chartEditable.saveEdit(() => {});
                pyramidEditable.saveEdit(() => {});
                setSnackbar({ open: true, message: "✅ Saved successfully", severity: "success" });
            } else throw new Error("Save failed");
        } catch (e) {
            setSnackbar({ open: true, message: "❌ Save failed", severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    const updatePyramidCell = (id: number, field: keyof PyramidRow, value: string) => {
        pyramidEditable.updateDraft(pyramidEditable.draftData.map((r: PyramidRow) => (r.id === id ? { ...r, [field]: value } : r)));
    };

    const isEditing = chartEditable.isEditing || pyramidEditable.isEditing;
    const offshoreRows = pyramidEditable.draftData.filter((r: PyramidRow) => r.category === "Offshore");
    const onsiteRows = pyramidEditable.draftData.filter((r: PyramidRow) => r.category === "Onsite");
    const isBoldColumn = (field: string) => ["q225A", "q325P", "q425P"].includes(field);

    if (initialLoading) return <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}><CircularProgress /></Box>;

    return (
        <PageContainer>
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
                <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>

            {/* BUTTONS PUSHED TO RIGHT */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mb: 2 }}>
                <DownloadTemplates templateName="Margin Improvement Plan 2" />
                {!isEditing ? (
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                            chartEditable.startEdit();
                            pyramidEditable.startEdit();
                        }}
                        sx={{ backgroundColor: "#008080", "&:hover": { backgroundColor: "#115858" } }}
                    >
                        Edit
                    </Button>
                ) : (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="contained"
                            size="small"
                            disabled={loading}
                            onClick={handleSave}
                            sx={{ backgroundColor: "#008080", "&:hover": { backgroundColor: "#115858" } }}
                        >
                            {loading ? <CircularProgress size={20} color="inherit" /> : "Save"}
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            disabled={loading}
                            onClick={() => {
                                chartEditable.cancelEdit();
                                pyramidEditable.cancelEdit();
                                setImprovementPlanText(rawData.pyramid_improvement_plan);
                            }}
                            sx={{ color: "#6c757d", borderColor: "#6c757d", "&:hover": { borderColor: "#5a6268" } }}
                        >
                            Cancel
                        </Button>
                    </Box>
                )}
            </Box>

            {/* DOWNLOAD WRAPPER START */}
            <Box id="template-to-download">
                {/* PDF SECTION 1: TITLE */}
                <Box className="pdf-section">
                    <PageTitle>Margin improvement plan 2</PageTitle>
                </Box>

                {/* PDF SECTION 2: GRID ROW (SIDE-BY-SIDE) */}
                <Box className="pdf-section" sx={{
                    display: 'grid',
                    gridTemplateColumns: '3fr 1fr',
                    gap: 3,
                    width: '100%',
                    bgcolor: '#fff'
                }}>
                    {/* LEFT COLUMN */}
                    <Box>
                        <Typography sx={{ backgroundColor: "#022D36", color: "#fff", p: "6px 12px", fontSize: 13, fontWeight: 700, mb: 1 }}>
                            Gross Profit, (%)
                        </Typography>

                        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 3, mb: 1 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Box sx={{ width: 20, height: 12, backgroundColor: "#00BCD4" }} />
                                <Typography sx={{ fontSize: 10 }}>Actuals + Projections</Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Box sx={{ width: 20, height: 12, backgroundColor: "#C49000" }} />
                                <Typography sx={{ fontSize: 10 }}>Target</Typography>
                            </Box>
                        </Box>

                        <Box sx={{ display: "flex", gap: 1, height: 60, alignItems: 'flex-end', mb: 4 }}>
                            {chartEditable.draftData.map((data: any, index: number) => {
                                const bgColor = index < 4 ? "#00BCD4" : "#C49000";
                                const field = index < 4 ? "actuals_projections" : "target";
                                const val = data[field];

                                return (
                                    <Box key={data.quarter} sx={{ flex: 1, textAlign: 'center' }}>
                                        <Box sx={{ backgroundColor: bgColor, color: "#fff", fontSize: 10, py: 1, fontWeight: 700 }}>
                                            {isEditing ? (
                                                <TextField 
                                                    value={val} 
                                                    onChange={(e) => {
                                                        const newChart = [...chartEditable.draftData];
                                                        newChart[index] = { ...newChart[index], [field]: e.target.value };
                                                        chartEditable.updateDraft(newChart);
                                                    }}
                                                    variant="standard"
                                                    InputProps={{ disableUnderline: true, style: { fontSize: 10, textAlign: 'center', color: '#fff', fontWeight: 700 } }}
                                                />
                                            ) : (
                                                val || "10"
                                            )}
                                        </Box>
                                        <Typography sx={{ fontSize: 9, fontWeight: 700, mt: 0.5 }}>{data.quarter}</Typography>
                                    </Box>
                                )
                            })}
                        </Box>

                        <TableContainer component={Paper} sx={{ boxShadow: "none", border: "2px solid #000000" }}>
                            <Table size="small" sx={{ borderCollapse: 'collapse' }}>
                                <TableHead>
                                    <TableRow>
                                        <HeaderCell rowSpan={2} boldright="true" sx={{ fontSize: 13, width: 180 }}>Full Pyramid<br />Teardown</HeaderCell>
                                        <HeaderCell colSpan={4} boldright="true">System View</HeaderCell>
                                        <HeaderCell colSpan={2} boldright="true">Current Quarter</HeaderCell>
                                        <HeaderCell colSpan={2} boldright="true">Latest Projection</HeaderCell>
                                        <HeaderCell colSpan={2}>Latest Projection</HeaderCell>
                                    </TableRow>
                                    <TableRow>
                                        <SubHeaderCell>FY'24</SubHeaderCell>
                                        <SubHeaderCell>Q4'24</SubHeaderCell>
                                        <SubHeaderCell>Q1'25</SubHeaderCell>
                                        <SubHeaderCell boldright="true">Q2'25 (A)</SubHeaderCell>
                                        <SubHeaderCell>Q3'25 (C)</SubHeaderCell>
                                        <SubHeaderCell boldright="true">Q3'25 (P)</SubHeaderCell>
                                        <SubHeaderCell>Q4'25 (C)</SubHeaderCell>
                                        <SubHeaderCell boldright="true">Q4'25 (P)</SubHeaderCell>
                                        <SubHeaderCell>FY25 (C)</SubHeaderCell>
                                        <SubHeaderCell>FY25 (P)</SubHeaderCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    <TableRow><CategoryHeaderCell colSpan={11}>Offshore</CategoryHeaderCell></TableRow>
                                    {offshoreRows.map((row: PyramidRow) => (
                                        <TableRow key={row.id}>
                                            <LabelCell>{row.label}</LabelCell>
                                            {["fy24", "q424", "q125", "q225A", "q325C", "q325P", "q425C", "q425P", "fy25C", "fy25P"].map((f) => (
                                                <DataCell key={f} boldright={isBoldColumn(f) ? "true" : "false"}>
                                                    {isEditing ? <TextField variant="standard" fullWidth value={row[f as keyof PyramidRow]} onChange={(e) => updatePyramidCell(row.id, f as keyof PyramidRow, e.target.value)} InputProps={{ disableUnderline: true, style: { fontSize: 10, textAlign: 'center' } }} /> : row[f as keyof PyramidRow] || "-"}
                                                </DataCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                    <TableRow><CategoryHeaderCell colSpan={11}>Onsite</CategoryHeaderCell></TableRow>
                                    {onsiteRows.map((row: PyramidRow) => (
                                        <TableRow key={row.id}>
                                            <LabelCell>{row.label}</LabelCell>
                                            {["fy24", "q424", "q125", "q225A", "q325C", "q325P", "q425C", "q425P", "fy25C", "fy25P"].map((f) => (
                                                <DataCell key={f} boldright={isBoldColumn(f) ? "true" : "false"}>
                                                    {isEditing ? <TextField variant="standard" fullWidth value={row[f as keyof PyramidRow]} onChange={(e) => updatePyramidCell(row.id, f as keyof PyramidRow, e.target.value)} InputProps={{ disableUnderline: true, style: { fontSize: 10, textAlign: 'center' } }} /> : row[f as keyof PyramidRow] || "-"}
                                                </DataCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>

                    {/* RIGHT COLUMN */}
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        border: '1.5px solid #022D36',
                        backgroundColor: '#fff',
                        height: '100%',
                        minHeight: 500
                    }}>
                        <Box sx={{ backgroundColor: "#022D36", color: "#fff", p: "6px 12px", fontWeight: 700, fontSize: 13 }}>
                            Pyramid Improvement Plan
                        </Box>
                        <Box sx={{ p: 0, flexGrow: 1, display: 'flex' }}>
                            {isEditing ? (
                                <InputField 
                                    multiline 
                                    value={improvementPlanText} 
                                    onChange={(e) => setImprovementPlanText(e.target.value)} 
                                    sx={{ height: '100%', flexGrow: 1 }}
                                />
                            ) : (
                                <Typography sx={{ p: 2, fontSize: "0.75rem", whiteSpace: "pre-wrap" }}>
                                    {improvementPlanText}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Box>

            
        </PageContainer>
    );
}