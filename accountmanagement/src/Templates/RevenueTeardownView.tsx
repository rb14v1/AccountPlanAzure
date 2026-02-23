import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Typography,
  Grid,
  styled,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Paper,
  Button,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { useData } from "../context/DataContext";
import { useEditableTable } from "../hooks/useEditableTable";
import DownloadTemplates from "../components/DownloadTemplates";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const TEMPLATE_NAME = "revenue_teardown";

// --- STYLED COMPONENTS ---

const PageWrapper = styled(Box)({
  display: "flex",
  flexDirection: "column",
  height: "calc(100vh - 110px)",
  backgroundColor: "#fff",
  padding: "4px 16px",
  overflow: "hidden",
  color: "#000",
  width: "100%",
});

const DarkHeader = styled(Box)({
  backgroundColor: "#001a1a",
  color: "#fff",
  padding: "4px 12px",
  fontSize: "0.75rem",
  fontWeight: 700,
  width: "100%",
  display: "flex",
  alignItems: "center",
});

const SubTableHeader = styled(Box)({
  backgroundColor: "#002a2e",
  color: "#fff",
  padding: "2px 0px",
  fontSize: "0.7rem",
  fontWeight: 700,
  display: "flex",
  width: "100%",
});

const StyledTableHeader = styled(TableCell)({
  backgroundColor: "#005f6b",
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.65rem",
  padding: "2px 4px",
  border: "0.5px solid #fff",
  textAlign: "center",
  lineHeight: 1.1,
});

const StyledCell = styled(TableCell)({
  fontSize: "0.65rem",
  padding: "4px", // Increased padding to prevent line merging
  border: "1px solid #ccc",
  color: "#000",
  height: "clamp(24px, 4vh, 32px)",
  position: "relative"
});

const InsightBox = styled(Box)({
  border: "1.5px solid #002a2e",
  flex: 1,
  backgroundColor: "#fff",
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  padding: "8px", // Added padding to separate the edit box from the container border
});

// Format-locked input for cells
// 1. Gray Table Cell Inputs
const FormatLockedInput = styled(TextField)({
  width: '100%',
  '& .MuiInputBase-input': {
    fontSize: "0.65rem",
    padding: "4px",
    color: "#000",
    textAlign: 'center',
    fontWeight: 500
  },
  '& .MuiInputBase-root': {
    padding: 0,
    margin: 0,
    backgroundColor: '#f2f2f2', // Light gray background
    borderRadius: '2px',
    // Subtle inner shadow to make it look "sunken" like your image
    boxShadow: 'inset 0px 1px 2px rgba(0,0,0,0.1)',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    // Hide the default teal/blue border entirely
    border: 'none !important',
  },
  '&:hover .MuiInputBase-root': {
    backgroundColor: '#ebebeb', // Slightly darker on hover
  }
});

// 2. Gray Multiline Insight Inputs
const InsightInput = styled(TextField)({
  flex: 1,
  width: '100%',
  backgroundColor: "#f2f2f2", // Matching light gray
  borderRadius: '4px',
  boxShadow: 'inset 0px 1px 3px rgba(0,0,0,0.1)',
  "& .MuiInputBase-root": {
    height: "100%",
    alignItems: "flex-start",
    fontSize: "0.7rem",
    lineHeight: 1.4,
    padding: "8px",
  },
  "& .MuiInputBase-input": {
    height: "100% !important",
    overflow: "auto !important",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    // Remove the border to match the "flat gray" look
    border: "none !important",
  },
});

// --- SAFE EXTRACTOR ---
const defaultData = {
  eeRows: [
    { id: 1, name: "EE / EER", fy25Act: "", fy26Tar: "", fy25Share: "", fy26Share: "" },
    { id: 2, name: "EN", fy25Act: "", fy26Tar: "", fy25Share: "", fy26Share: "" },
  ],
  geoRows: [
    { id: 1, name: "Americas", fy25Act: "", fy26Tar: "", fy25Share: "", fy26Share: "" },
    { id: 2, name: "Europe", fy25Act: "", fy26Tar: "", fy25Share: "", fy26Share: "" },
    { id: 3, name: "APAC", fy25Act: "", fy26Tar: "", fy25Share: "", fy26Share: "" },
  ],
  insights: {
    top: "• Key takeaway 1\n• Key takeaway 2",
    bottom: "• Geography highlight 1\n• Geography highlight 2"
  }
};

const extractData = (source: any) => {
  const d = source?.data || source || {};
  const mergeArr = (defArr: any[], srcArr: any[]) =>
    defArr.map((defRow, i) => ({ ...defRow, ...(Array.isArray(srcArr) && srcArr[i] ? srcArr[i] : {}) }));
  
  return {
    eeRows: mergeArr(defaultData.eeRows, d.eeRows),
    geoRows: mergeArr(defaultData.geoRows, d.geoRows),
    insights: {
      top: d.insights?.top || defaultData.insights.top,
      bottom: d.insights?.bottom || defaultData.insights.bottom
    },
    id: d.id
  };
};

// --- SUB-COMPONENTS ---

const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
    <Box sx={{ width: 25, height: 10, bgcolor: color }} />
    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700 }}>{label}</Typography>
  </Box>
);

const StackedBar = ({ label, values, colors }: { label: string; values: number[]; colors: string[] }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
    <Stack spacing={0} sx={{ width: '85%', height: 'clamp(40px, 8vh, 60px)', justifyContent: 'flex-end', borderBottom: '1px solid #ccc' }}>
      {[...values].reverse().map((v, i) => (
        <Box
          key={i}
          sx={{
            width: '100%',
            height: `${(v / 45) * 100}%`,
            bgcolor: [...colors].reverse()[i],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.55rem',
            fontWeight: 700,
            border: '0.1px solid rgba(0,0,0,0.1)'
          }}
        >
          {v}
        </Box>
      ))}
    </Stack>
    <Typography sx={{ fontSize: '0.5rem', mt: 0.2, fontWeight: 700 }}>{label}</Typography>
  </Box>
);

const RevenueTeardownView: React.FC = () => {
  const { globalData, setGlobalData } = useData();
  const userId = globalData?.user_id || localStorage.getItem("user_id") || "101";
  
  const rawData = extractData(globalData?.revenue_teardown);
  const editable = useEditableTable(rawData);

  // Backend States
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as any });

  const dataLoadedFromDB = useRef(false);
  const autoSaveAttempted = useRef(false);

  // 1. Sync from Chatbot
  useEffect(() => {
    if (globalData?.revenue_teardown && !editable.isEditing) {
      editable.updateDraft(extractData(globalData.revenue_teardown));
    }
  }, [globalData?.revenue_teardown]);

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
            editable.updateDraft(parsed);
            setGlobalData((prev: any) => ({ ...prev, revenue_teardown: parsed }));
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
        const isNew = rawData && !rawData.id;
        if (isNew && !autoSaveAttempted.current) {
          autoSaveAttempted.current = true;
          try {
            const res = await fetch(`${API_BASE_URL}/template-payload/${TEMPLATE_NAME}/`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ user_id: userId, data: rawData })
            });
            const result = await res.json();
            if (res.ok && result.success) {
              setGlobalData((prev: any) => ({ ...prev, revenue_teardown: extractData(result.data) }));
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
      const res = await fetch(`${API_BASE_URL}/template-payload/${TEMPLATE_NAME}/`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, data: editable.draftData })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setGlobalData((prev: any) => ({ ...prev, revenue_teardown: extractData(result.data) }));
        editable.saveEdit(() => {});
        setSnackbar({ open: true, message: "✅ Saved successfully", severity: "success" });
      } else throw new Error("Save failed");
    } catch (e) {
      setSnackbar({ open: true, message: "❌ Save failed", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (section: 'eeRows' | 'geoRows', index: number, field: string, value: string) => {
    const updated = [...editable.draftData[section]];
    updated[index] = { ...updated[index], [field]: value };
    editable.updateDraft({ ...editable.draftData, [section]: updated });
  };

  const handleInsightChange = (section: 'top' | 'bottom', value: string) => {
    editable.updateDraft({
        ...editable.draftData,
        insights: { ...editable.draftData.insights, [section]: value }
    });
  };

  const chartLabels = ["Q1 FY25", "Q2 FY25", "Q3 FY25", "Q4 FY25", "Q1 FY26", "Q2 FY26", "Q3 FY26", "Q4 FY26"];

  if (initialLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "#fff", minHeight: "100vh" }}>
      {/* ADDED SNACKBAR FOR FEEDBACK */}
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', p: 1, gap: 2 }}>
        <DownloadTemplates templateName={TEMPLATE_NAME} />
        {!editable.isEditing ? (
          <Button variant="outlined" onClick={editable.startEdit} disabled={loading} sx={{ borderColor: "#00a99d", color: "#00a99d" }}>Edit</Button>
        ) : (
          <>
            <Button
              variant="contained"
              onClick={handleSave} // POINTED TO BACKEND SAVE FUNCTION
              disabled={loading}
              sx={{ backgroundColor: "#00a99d", color: "#fff" }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Save"}
            </Button>
            <Button variant="outlined" onClick={editable.cancelEdit} disabled={loading} sx={{ borderColor: "#00a99d", color: "#00a99d" }}>Cancel</Button>
          </>
        )}
      </Box>

      <PageWrapper id="template-to-download">
        <Typography variant="h5" sx={{ color: "#00c1b1", fontWeight: 800, mb: 0.5, fontSize: "clamp(1.4rem, 3vh, 2rem)" }}>
          Revenue Teardown: EE vs. EN & Geo teardown
        </Typography>

        <Grid container wrap="nowrap" spacing={2} sx={{ flex: 1, minHeight: 0, width: "100%" }}>
          <Grid item sx={{ width: "72%", display: "flex", flexDirection: "column", height: "100%", gap: 0.5 }}>
            
            {/* Section 1 */}
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.2 }}>
                <DarkHeader sx={{ flex: 1 }}>EE vs. EN Teardown</DarkHeader>
                <Box sx={{ display: 'flex', gap: 2, ml: 2 }}><LegendItem color="#00c1b1" label="EE" /><LegendItem color="#e8c170" label="EN" /></Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', py: 0.5, bgcolor: '#f9f9f9', minHeight: '60px' }}>
                {chartLabels.map((label, i) => (<StackedBar key={i} label={label} values={[10, 12]} colors={["#00c1b1", "#e8c170"]} />))}
              </Box>
              <SubTableHeader>
                <Box sx={{ width: "40.5%", pl: 1.5 }}><Typography sx={{ fontSize: '0.6rem', fontWeight: 700 }}>Breakdown by EE vs. EN</Typography></Box>
                <Box sx={{ width: "29.5%", textAlign: "center" }}><Typography sx={{ fontSize: '0.6rem', fontWeight: 700 }}>Total (€ K)</Typography></Box>
                <Box sx={{ width: "30%", textAlign: "center" }}><Typography sx={{ fontSize: '0.6rem', fontWeight: 700 }}>Share of Revenue (%)</Typography></Box>
              </SubTableHeader>
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #333', overflow: "hidden", flex: 1 }}>
                <Table size="small" stickyHeader>
                  <TableHead><TableRow><StyledTableHeader sx={{ width: "25px" }}>#</StyledTableHeader><StyledTableHeader sx={{ textAlign: 'left' }}>Revenue classification</StyledTableHeader><StyledTableHeader sx={{ width: "15%" }}>FY25 Act. + For.</StyledTableHeader><StyledTableHeader sx={{ width: "15%" }}>FY26 Target</StyledTableHeader><StyledTableHeader sx={{ width: "15%" }}>FY25 Act. + For.</StyledTableHeader><StyledTableHeader sx={{ width: "15%" }}>FY26 Target</StyledTableHeader></TableRow></TableHead>
                  <TableBody>
                    {editable.draftData.eeRows.map((row: any, i: number) => (
                      <TableRow key={i}>
                        <StyledCell align="center">{row.id}</StyledCell>
                        <StyledCell sx={{ fontWeight: 700 }}>{row.name}</StyledCell>
                        <StyledCell>{editable.isEditing ? <FormatLockedInput variant="outlined" value={row.fy25Act} onChange={(e) => handleTableChange('eeRows', i, 'fy25Act', e.target.value)} /> : row.fy25Act}</StyledCell>
                        <StyledCell>{editable.isEditing ? <FormatLockedInput variant="outlined" value={row.fy26Tar} onChange={(e) => handleTableChange('eeRows', i, 'fy26Tar', e.target.value)} /> : row.fy26Tar}</StyledCell>
                        <StyledCell>{editable.isEditing ? <FormatLockedInput variant="outlined" value={row.fy25Share} onChange={(e) => handleTableChange('eeRows', i, 'fy25Share', e.target.value)} /> : row.fy25Share}</StyledCell>
                        <StyledCell>{editable.isEditing ? <FormatLockedInput variant="outlined" value={row.fy26Share} onChange={(e) => handleTableChange('eeRows', i, 'fy26Share', e.target.value)} /> : row.fy26Share}</StyledCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* Section 2 */}
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1.2, minHeight: 0, mt: 0.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.2 }}>
                <DarkHeader sx={{ flex: 1 }}>Geographic breakdown</DarkHeader>
                <Box sx={{ display: 'flex', gap: 2, ml: 2 }}><LegendItem color="#00c1b1" label="Americas" /><LegendItem color="#e8c170" label="EMEA" /><LegendItem color="#008cba" label="APAC" /></Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', py: 0.5, bgcolor: '#f9f9f9', minHeight: '60px' }}>
                {chartLabels.map((label, i) => (<StackedBar key={i} label={label} values={[10, 12, 15]} colors={["#00c1b1", "#e8c170", "#008cba"]} />))}
              </Box>
              <SubTableHeader>
                <Box sx={{ width: "40.5%", pl: 1.5 }}><Typography sx={{ fontSize: '0.6rem', fontWeight: 700 }}>Breakdown by Geography</Typography></Box>
                <Box sx={{ width: "29.5%", textAlign: "center" }}><Typography sx={{ fontSize: '0.6rem', fontWeight: 700 }}>Total (€ K)</Typography></Box>
                <Box sx={{ width: "30%", textAlign: "center" }}><Typography sx={{ fontSize: '0.6rem', fontWeight: 700 }}>Share of Revenue (%)</Typography></Box>
              </SubTableHeader>
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #333', overflow: "hidden", flex: 1 }}>
                <Table size="small" stickyHeader>
                  <TableHead><TableRow><StyledTableHeader sx={{ width: "25px" }}>#</StyledTableHeader><StyledTableHeader sx={{ textAlign: 'left' }}>Geo</StyledTableHeader><StyledTableHeader sx={{ width: "15%" }}>FY25 Act. + For.</StyledTableHeader><StyledTableHeader sx={{ width: "15%" }}>FY26 Target</StyledTableHeader><StyledTableHeader sx={{ width: "15%" }}>FY25 Act. + For.</StyledTableHeader><StyledTableHeader sx={{ width: "15%" }}>FY26 Target</StyledTableHeader></TableRow></TableHead>
                  <TableBody>
                    {editable.draftData.geoRows.map((row: any, i: number) => (
                      <TableRow key={i}>
                        <StyledCell align="center">{row.id}</StyledCell>
                        <StyledCell sx={{ fontWeight: 700 }}>{row.name}</StyledCell>
                        <StyledCell>{editable.isEditing ? <FormatLockedInput variant="outlined" value={row.fy25Act} onChange={(e) => handleTableChange('geoRows', i, 'fy25Act', e.target.value)} /> : row.fy25Act}</StyledCell>
                        <StyledCell>{editable.isEditing ? <FormatLockedInput variant="outlined" value={row.fy26Tar} onChange={(e) => handleTableChange('geoRows', i, 'fy26Tar', e.target.value)} /> : row.fy26Tar}</StyledCell>
                        <StyledCell>{editable.isEditing ? <FormatLockedInput variant="outlined" value={row.fy25Share} onChange={(e) => handleTableChange('geoRows', i, 'fy25Share', e.target.value)} /> : row.fy25Share}</StyledCell>
                        <StyledCell>{editable.isEditing ? <FormatLockedInput variant="outlined" value={row.fy26Share} onChange={(e) => handleTableChange('geoRows', i, 'fy26Share', e.target.value)} /> : row.fy26Share}</StyledCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Grid>

          {/* RIGHT PANEL: Insights */}
          <Grid item sx={{ width: "28%", display: "flex", flexDirection: "column", height: "100%", gap: 1 }}>
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
              <DarkHeader>Key insights</DarkHeader>
              <InsightBox>
                {editable.isEditing ? (
                  <InsightInput
                    multiline
                    variant="outlined"
                    value={editable.draftData.insights.top}
                    onChange={(e) => handleInsightChange("top", e.target.value)}
                    fullWidth
                    sx={{ height: "100%" }}
                  />
                ) : (
                  <Typography sx={{ p: 1, fontSize: "0.7rem", whiteSpace: "pre-wrap" }}>
                    {editable.draftData.insights.top}
                  </Typography>
                )}
              </InsightBox>
            </Box>

            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
              <DarkHeader>Key insights</DarkHeader>
              <InsightBox>
                {editable.isEditing ? (
                  <InsightInput
                    multiline
                    variant="outlined"
                    value={editable.draftData.insights.bottom}
                    onChange={(e) => handleInsightChange("bottom", e.target.value)}
                    fullWidth
                    sx={{ height: "100%" }}
                  />
                ) : (
                  <Typography sx={{ p: 1, fontSize: "0.7rem", whiteSpace: "pre-wrap" }}>
                    {editable.draftData.insights.bottom}
                  </Typography>
                )}
              </InsightBox>
            </Box>
          </Grid>
        </Grid>
      </PageWrapper>
    </Box>
  );
};

export default RevenueTeardownView;