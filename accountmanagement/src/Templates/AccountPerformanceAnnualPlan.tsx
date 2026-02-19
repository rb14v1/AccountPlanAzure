import React, { useState, useEffect, useRef } from "react";
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
    Button,
    TextField,
} from "@mui/material";
// ✅ We use this, NOT useOutletContext
import { useData } from "../context/DataContext";
import { useEditableTable } from "../hooks/useEditableTable";
import DownloadTemplates from "../components/DownloadTemplates";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

// --- STYLED COMPONENTS ---
const PageWrapper = styled(Box)({
    display: "flex",
    flexDirection: "column",
    height: "calc(100vh - 80px)",
    backgroundColor: "#fff",
    padding: "4px 16px",
    overflow: "auto",
    color: "#000",
    width: "100%",
});

const DarkHeader = styled(Box)({
    backgroundColor: "#001a1a",
    color: "#fff",
    padding: "4px 12px",
    fontSize: "0.9rem",
    fontWeight: 700,
    width: "100%",
});

const StyledTableHeader = styled(TableCell)({
    backgroundColor: "#000",
    color: "#fff",
    fontWeight: 700,
    fontSize: "0.7rem",
    padding: "4px 8px",
    border: "0.5px solid #fff",
    textAlign: "center",
    lineHeight: 1.1,
});

const StyledCell = styled(TableCell)({
    fontSize: "0.7rem",
    padding: "2px 8px",
    border: "1px solid #ccc",
    color: "#000",
    height: "24px",
});

const FormatLockedInput = styled(TextField)({
    '& .MuiInputBase-input': {
        fontSize: "0.7rem",
        padding: "0px",
        color: "inherit",
        textAlign: 'center',
    },
    '& .MuiInputBase-root': { padding: 0, margin: 0, backgroundColor: 'transparent' },
    '& fieldset': { border: 'none' }
});

const TEMPLATE_NAME = "account_performance_annual_plan";

const AccountPerformanceAnnualPlan: React.FC = () => {
    // ✅ FIX: Use Global Data Context, NOT useOutletContext
    const { globalData, setGlobalData } = useData();
    const [loading, setLoading] = useState(false);
    const userId = globalData?.user_id || localStorage.getItem("user_id");
    const dataLoaded = useRef(false);


    const defaultData = {
        revenueRows: [
            { metric: "Revenue Budget", unit: "€ Mn", fy24: "", fy25: "", fy26: "" },
            { metric: "Revenue Actuals / Forecast", unit: "€ Mn", fy24: "", fy25: "", fy26: "" },
            { metric: "TCV won", unit: "€ Mn", fy24: "", fy25: "", fy26: "" },
            { metric: "Win rate (YTD)", unit: "%", fy24: "", fy25: "", fy26: "" },
            { metric: "Book to bill ratio", unit: "#", fy24: "", fy25: "", fy26: "" },
            { metric: "SL revenue penetration %", unit: "%", fy24: "", fy25: "", fy26: "" },
            { metric: "# of SLs present in the account*", unit: "#", fy24: "", fy25: "", fy26: "" },
        ],
        deliveryRows: [
            { metric: "Gross Margin %", unit: "%", fy24: "", fy25: "", fy26: "" },
            { metric: "Revenue / FTE (ONS)", unit: "€ K", fy24: "", fy25: "", fy26: "" },
            { metric: "Revenue / FTE (OFS)", unit: "€ K", fy24: "", fy25: "", fy26: "" },
            { metric: "Cost / FTE (ONS)", unit: "#", fy24: "", fy25: "", fy26: "" },
            { metric: "Cost / FTE (OFS)", unit: "#", fy24: "", fy25: "", fy26: "" },
        ],
        talentRows: [
            { metric: "Attrition %", unit: "%", fy24: "", fy25: "", fy26: "" },
            { metric: "Fulfilment %", unit: "%", fy24: "", fy25: "", fy26: "" },
            { metric: "Delivery on time %", unit: "%", fy24: "", fy25: "", fy26: "" },
        ]
    };

    // Safely access data or fallback to default
    const annualData = globalData?.account_performance_annual_plan || defaultData;

    // Hook for handling edits
    const editable = useEditableTable(annualData);

    // --- INSERT THIS BLOCK HERE ---
    // 1. Fetch Data from DB on Mount
    useEffect(() => {
        const fetchData = async () => {
            if (dataLoaded.current) return;
            try {
                const res = await fetch(`${API_BASE_URL}/account-performance/?user_id=${userId}`);
                const dbData = await res.json();

                if (dbData && (dbData.financials || dbData.delivery)) {
                    // Map Backend Keys (financials) -> Frontend Keys (revenueRows)
                    const mappedData = {
                        revenueRows: dbData.financials || defaultData.revenueRows,
                        deliveryRows: dbData.delivery || defaultData.deliveryRows,
                        talentRows: dbData.talent || defaultData.talentRows
                    };

                    // Update Table and Global Store
                    editable.updateDraft(mappedData);
                    setGlobalData((prev: any) => ({ ...prev, account_performance_annual_plan: mappedData }));
                    dataLoaded.current = true;
                }
            } catch (err) {
                console.error("Fetch error:", err);
            }
        };
        fetchData();
    }, [userId]);

    // 2. Sync with Chatbot (if user asks chatbot while on this page)
    const backendData = globalData?.account_performance_annual_plan;
    useEffect(() => {
        if (backendData) {
            const mappedData = {
                revenueRows: backendData.financials || defaultData.revenueRows,
                deliveryRows: backendData.delivery || defaultData.deliveryRows,
                talentRows: backendData.talent || defaultData.talentRows
            };
            editable.updateDraft(mappedData);
        }
    }, [backendData]);
    // -----------------------------

    const handleRowChange = (section: any, index: number, field: string, value: string) => {
        // Safety check to ensure the section array exists
        if (!editable.draftData[section]) return;

        const updated = [...editable.draftData[section]];
        updated[index] = { ...updated[index], [field]: value };
        editable.updateDraft({ ...editable.draftData, [section]: updated });
    };

    // ✅ NEW: Saves to Database AND Local Memory
    // ✅ FIXED SAVE FUNCTION
    const handleSave = async () => {
        try {
            // 1. Prepare Backend Format (The "Bridge")
            // We map your Frontend names (revenueRows) to Backend names (financials)
            const payload = {
                user_id: userId,
                financials: editable.draftData.revenueRows,
                delivery: editable.draftData.deliveryRows,
                talent: editable.draftData.talentRows
            };

            // 2. Send to API
            const response = await fetch(`${API_BASE_URL}/account-performance/save/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error("Failed to save");

            // 3. Update Global State using BACKEND keys
            // ✅ CRITICAL FIX: We store 'payload' (financials), NOT 'updatedData' (revenueRows)
            // This ensures the useEffect listener finds the keys it expects.
            setGlobalData((prev: any) => ({
                ...prev,
                [TEMPLATE_NAME]: payload
            }));

            // 4. Commit edits locally to exit edit mode
            editable.saveEdit(() => { });

            alert("✅ Saved successfully!");

        } catch (e) {
            console.error("Save error:", e);
            alert("❌ Failed to save. Check console.");
        }
    };

    // SAFETY CHECK: Ensure data arrays exist before mapping
    const revenueRows = editable.draftData.revenueRows || defaultData.revenueRows;
    const deliveryRows = editable.draftData.deliveryRows || defaultData.deliveryRows;
    const talentRows = editable.draftData.talentRows || defaultData.talentRows;

    return (
        <Box sx={{ bgcolor: "#fff", minHeight: "100vh" }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1, gap: 2 }}>
                <DownloadTemplates templateName={TEMPLATE_NAME}  />
                {!editable.isEditing ? (
                    <Button
                        variant="outlined"
                        onClick={editable.startEdit}
                        disabled={loading}
                        sx={{
                            borderColor: "#008080",
                            color: "#008080",
                            ml: 0,
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
                        <Button variant="contained" size="small" onClick={handleSave} sx={{
                            backgroundColor: "#008080",
                            ml: 0,
                            color: "#fff",
                            "&:hover": {
                                backgroundColor: "#006d6d",
                            },
                        }}>Save</Button>
                        <Button
                            variant="outlined"
                            onClick={editable.cancelEdit}
                            disabled={loading}
                            sx={{
                                borderColor: "#008080",
                                color: "#008080",
                                ml: 0,
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

            <PageWrapper id="template-to-download">
                <Typography className="pdf-section" variant="h5" sx={{ color: "#00c1b1", fontWeight: 800, mb: 1 }}>
                    Account performance : Annual Plan
                </Typography>

                <DarkHeader>Account Summary Dashboard</DarkHeader>

                <TableContainer className="pdf-section" component={Paper} elevation={0} sx={{ border: '1px solid #333', flex: 1, overflow: 'hidden', mt: 1 }}>
                    <Table size="small" sx={{ tableLayout: 'fixed', height: '100%' }}>
                        <TableHead>
                            <TableRow>
                                <StyledTableHeader sx={{ width: '12%' }}>Theme</StyledTableHeader>
                                <StyledTableHeader sx={{ textAlign: 'left', width: '38%' }}>Metrics</StyledTableHeader>
                                <StyledTableHeader sx={{ width: '10%' }}>Unit</StyledTableHeader>
                                <StyledTableHeader sx={{ bgcolor: '#005f6b' }}>FY24</StyledTableHeader>
                                <StyledTableHeader sx={{ bgcolor: '#005f6b' }}>FY25</StyledTableHeader>
                                <StyledTableHeader sx={{ bgcolor: '#e8c170', color: '#000' }}>FY26</StyledTableHeader>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {/* REVENUE SECTION */}
                            {revenueRows.map((row: any, i: number) => (
                                <TableRow key={row.metric || i}>
                                    {i === 0 && <StyledCell rowSpan={revenueRows.length} sx={{ bgcolor: '#005f6b', color: '#fff', fontWeight: 700, textAlign: 'center' }}>Revenue</StyledCell>}
                                    <StyledCell sx={{ fontWeight: 600 }}>{row.metric}</StyledCell>
                                    <StyledCell align="center">{row.unit}</StyledCell>
                                    {['fy24', 'fy25', 'fy26'].map(f => (
                                        <StyledCell key={f} align="center">
                                            {editable.isEditing ? <FormatLockedInput value={row[f]} onChange={(e) => handleRowChange('revenueRows', i, f, e.target.value)} /> : row[f]}
                                        </StyledCell>
                                    ))}
                                </TableRow>
                            ))}

                            {/* DELIVERY OPS SECTION */}
                            {deliveryRows.map((row: any, i: number) => (
                                <TableRow key={row.metric || i}>
                                    {i === 0 && <StyledCell rowSpan={deliveryRows.length} sx={{ bgcolor: '#005f6b', color: '#fff', fontWeight: 700, textAlign: 'center' }}>Delivery Ops</StyledCell>}
                                    <StyledCell sx={{ fontWeight: 600 }}>{row.metric}</StyledCell>
                                    <StyledCell align="center">{row.unit}</StyledCell>
                                    {['fy24', 'fy25', 'fy26'].map(f => (
                                        <StyledCell key={f} align="center">
                                            {editable.isEditing ? <FormatLockedInput value={row[f]} onChange={(e) => handleRowChange('deliveryRows', i, f, e.target.value)} /> : row[f]}
                                        </StyledCell>
                                    ))}
                                </TableRow>
                            ))}

                            {/* TALENT SECTION */}
                            {talentRows.map((row: any, i: number) => (
                                <TableRow key={row.metric || i}>
                                    {i === 0 && <StyledCell rowSpan={talentRows.length} sx={{ bgcolor: '#005f6b', color: '#fff', fontWeight: 700, textAlign: 'center' }}>Talent</StyledCell>}
                                    <StyledCell sx={{ fontWeight: 600 }}>{row.metric}</StyledCell>
                                    <StyledCell align="center">{row.unit}</StyledCell>
                                    {['fy24', 'fy25', 'fy26'].map(f => (
                                        <StyledCell key={f} align="center">
                                            {editable.isEditing ? <FormatLockedInput value={row[f]} onChange={(e) => handleRowChange('talentRows', i, f, e.target.value)} /> : row[f]}
                                        </StyledCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </PageWrapper>
        </Box>
    );
};

export default AccountPerformanceAnnualPlan;