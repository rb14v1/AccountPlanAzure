import React, { useState, useEffect, useRef } from "react";
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
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useData } from "../context/DataContext";
import { useEditableTable } from "../hooks/useEditableTable";
import DownloadTemplates from "../components/DownloadTemplates";
 
// --- API CONFIGURATION ---
const API_BASE_URL = "http://localhost:8000/api";
 
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
 
const StyledTableHeader = styled(TableCell)({
  backgroundColor: "#005f6b",
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.6rem",
  padding: "2px 4px",
  border: "0.5px solid #fff",
  textAlign: "center",
  lineHeight: 1.1,
});
 
const GroupHeaderCell = styled(TableCell)({
  backgroundColor: "#001a1a",
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.65rem",
  padding: "2px 4px",
  border: "0.5px solid #fff",
  textAlign: "center",
  lineHeight: 1.1,
});
 
const StyledCell = styled(TableCell)({
  fontSize: "0.6rem",
  padding: "4px",
  border: "1px solid #ccc",
  color: "#000",
  height: "24px",
});
 
const GrayInsetInput = styled(TextField)({
  width: '100%',
  '& .MuiInputBase-input': {
    fontSize: "0.6rem",
    padding: "4px",
    color: "#000",
    textAlign: 'center',
    fontWeight: 500
  },
  '& .MuiInputBase-root': {
    padding: 0,
    margin: 0,
    backgroundColor: '#f2f2f2',
    borderRadius: '2px',
    boxShadow: 'inset 0px 1px 2px rgba(0,0,0,0.1)',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none !important',
  },
  '&:hover .MuiInputBase-root': {
    backgroundColor: '#ebebeb',
  }
});
 
const InsightInput = styled(TextField)({
  width: '100%',
  height: '100%',
  backgroundColor: "#f2f2f2",
  "& .MuiInputBase-root": {
    height: "100%",
    alignItems: "flex-start",
    fontSize: "0.75rem",
    lineHeight: 1.4,
    padding: "8px",
    boxShadow: 'inset 0px 1px 3px rgba(0,0,0,0.1)',
  },
  "& .MuiOutlinedInput-notchedOutline": {
    border: "none !important",
  },
});
 
const TEMPLATE_NAME = "Service_Line_Penetration";
 
// --- SUB-COMPONENTS ---
 
const LegendItem = ({ color, label, circle }: { color: string; label: string; circle?: boolean }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
    <Box sx={{ width: circle ? 12 : 10, height: 10, bgcolor: color, borderRadius: circle ? '50%' : 0 }} />
    <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{label}</Typography>
  </Box>
);
 
const SLStackedBar = ({
  label,
  values,
  colors,
  xxVal,
  index,
  onXXChange,
  isEditing,
  onBarValueChange
}: any) => {
 
  const total = values.reduce((sum: number, val: number) => sum + val, 0);
 
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
      <Stack spacing={0} sx={{ width: '85%', height: '110px', justifyContent: 'flex-end', mb: 0.5 }}>
        {[...values].reverse().map((v: number, i: number) => {
          const realIndex = values.length - 1 - i;
          const percentage = total === 0 ? 0 : (v / total) * 100;
 
          return (
            <Box
              key={i}
              sx={{
                width: '100%',
                height: `${percentage}%`,
                bgcolor: [...colors].reverse()[i],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.6rem',
                fontWeight: 700,
                color: '#fff',
                border: '0.1px solid rgba(255,255,255,0.2)'
              }}
            >
              {isEditing ? (
                <TextField
                  value={v}
                  onChange={(e) =>
                    onBarValueChange(index, realIndex, e.target.value)
                  }
                  variant="standard"
                  inputProps={{
                    style: {
                      color: "white",
                      fontSize: "0.6rem",
                      textAlign: "center",
                      width: "35px"
                    }
                  }}
                />
              ) : (
                v
              )}
            </Box>
          );
        })}
      </Stack>
 
      <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, mb: 0.5 }}>
        {label}
      </Typography>
 
      <Box sx={{ width: '100%', bgcolor: isEditing ? '#f2f2f2' : '#00adef', textAlign: 'center', py: 0.2 }}>
        {isEditing ? (
          <GrayInsetInput
            value={xxVal}
            onChange={(e) => onXXChange(index, e.target.value)}
          />
        ) : (
          <Typography sx={{ fontSize: '0.55rem', fontStyle: 'italic' }}>
            {xxVal}
          </Typography>
        )}
      </Box>
    </Box>
  );
};
 
 
 
 
 
// --- MAIN COMPONENT ---
 
const ServiceLinePenetration: React.FC = () => {
  const { globalData, setGlobalData } = useData();
 
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

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning",
  });

  const autoSaveAttempted = useRef(false);
  const dataLoadedFromDB = useRef(false);
 
  const defaultData = {
  tableRows: [
    { id: '1', name: "Secured Order Book", v1: "", v2: "", v3: "", v4: "" },
    { id: '1a', name: "- Gross Order Book", v1: "", v2: "", v3: "", v4: "", indent: true },
    { id: '1b', name: "- Expiry / run-off", v1: "", v2: "", v3: "", v4: "", indent: true },
    { id: '2', name: "Open TCV", v1: "", v2: "", v3: "", v4: "", disabled: true },
    { id: '3', name: "TCV Won", v1: "", v2: "", v3: "", v4: "", disabled: true },
    { id: '4', name: "TCV dropped / lost", v1: "", v2: "", v3: "", v4: "", disabled: true },
  ],
  xxValues: ["XX","XX","XX","XX","XX","XX","XX","XX"],
 
  barValues: [
    [10,12,14,16],
    [10,12,14,16],
    [10,12,14,16],
    [10,12,14,16],
    [10,12,14,16],
    [10,12,14,16],
    [10,12,14,16],
    [10,12,14,16],
  ],
 
  insights: ""
};
 
 
  const slData = globalData?.Service_Line_Penetration || defaultData;
  const editable = useEditableTable(slData);
 
  // STEP 1: Load data from database when component mounts
  useEffect(() => {
    const loadDataFromDB = async () => {
      if (dataLoadedFromDB.current) return;

      console.log("Loading service line penetration from database...");
      setInitialLoading(true);

      if (!userId) {
        console.warn("Skipping DB fetch: missing userId");
        setInitialLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/service-line-penetration/?user_id=${encodeURIComponent(userId)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const dbData = await response.json();
          console.log("Service line penetration loaded from DB:", dbData);

          if (dbData && Object.keys(dbData).length > 0) {
            setGlobalData((prev: any) => ({
              ...prev,
              Service_Line_Penetration: dbData,
            }));
            editable.updateDraft(dbData);
            dataLoadedFromDB.current = true;
          }
        }
      } catch (error) {
        console.error("Error loading service line penetration from DB:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadDataFromDB();
  }, [userId]);

  // STEP 2: Auto-save logic when NEW data arrives from chatbot
  useEffect(() => {
    const autoSaveToDatabase = async () => {
      if (dataLoadedFromDB.current && !autoSaveAttempted.current) {
        console.log("Service line penetration already in DB, skipping auto-save");
        return;
      }

      const hasValidData = slData && 
        (slData.tableRows?.length > 0 || slData.xxValues?.length > 0 || slData.insights);

      const isNewDataFromChatbot = slData && !slData.id;

      if (hasValidData && isNewDataFromChatbot && !autoSaveAttempted.current) {
        if (!userId) return;

        autoSaveAttempted.current = true;

        try {
          console.log("Sending service line penetration to backend:", slData);

          const payload = {
            user_id: userId,
            company_name: companyName,
            tableRows: slData.tableRows,
            xxValues: slData.xxValues,
            insights: slData.insights,
          };

          const response = await fetch(
            `${API_BASE_URL}/service-line-penetration/save_penetration/`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            }
          );

          const result = await response.json();
          console.log("Auto-save response:", result);

          if (response.ok && result.success) {
            setGlobalData((prev: any) => ({
              ...prev,
              Service_Line_Penetration: result.data,
            }));
            dataLoadedFromDB.current = true;
            setSnackbar({
              open: true,
              message: "✅ Service Line Penetration auto-saved to database",
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

    const timeoutId = setTimeout(() => autoSaveToDatabase(), 500);
    return () => clearTimeout(timeoutId);
  }, [slData, userId, companyName]);
 
  const handleTableChange = (index: number, field: string, value: string) => {
    const updated = [...editable.draftData.tableRows];
    updated[index] = { ...updated[index], [field]: value };
    editable.updateDraft({ ...editable.draftData, tableRows: updated });
  };
 
  const handleXXChange = (index: number, value: string) => {
    const updated = [...editable.draftData.xxValues];
    updated[index] = value;
    editable.updateDraft({ ...editable.draftData, xxValues: updated });
  };

  // STEP 3: Manual save - update global state and persist to backend
  const handleManualSave = async () => {
    setLoading(true);
    try {
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
        company_name: companyName,
        tableRows: editable.draftData.tableRows,
        xxValues: editable.draftData.xxValues,
        insights: editable.draftData.insights,
      };

      const response = await fetch(
        `${API_BASE_URL}/service-line-penetration/save_penetration/`,
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
        setGlobalData((prev: any) => ({
          ...prev,
          Service_Line_Penetration: result.data || editable.draftData,
        }));
        editable.saveEdit(() => {});
        setSnackbar({
          open: true,
          message: "✅ Service Line Penetration saved",
          severity: "success",
        });
        dataLoadedFromDB.current = true;
      } else {
        throw new Error(result.message || "Failed to save");
      }
    } catch (error) {
      console.error("Manual save error:", error);
      setSnackbar({
        open: true,
        message: "❌ Failed to save changes",
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
        <Typography sx={{ ml: 2 }}>Loading service line penetration...</Typography>
      </Box>
    );
  }
 
  const handleBarValueChange = (barIndex: number, segmentIndex: number, value: string) => {
  const updated = [...editable.draftData.barValues];
  updated[barIndex][segmentIndex] = Number(value);
  editable.updateDraft({ ...editable.draftData, barValues: updated });
};
 
  const slColors = ["#001a1a", "#00c1b1", "#efefe9", "#d8d3cf"];
  const slLabels = ["App Mod", "Data & AI", "EA", "Managed Services", "SAM", "Security", "Exp. Design"];
 
  return (
    <Box sx={{ bgcolor: "#fff", minHeight: "100vh" }}>
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

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1, gap: 2 }}>
        <DownloadTemplates templateName={TEMPLATE_NAME} />
        {!editable.isEditing ? (
          <Button variant="outlined" onClick={editable.startEdit} sx={{ borderColor: "#00a99d", color: "#00a99d" }}>Edit</Button>
        ) : (
          <><Button variant="contained" onClick={handleManualSave} disabled={loading} sx={{ backgroundColor: "#00a99d", color: "#fff" }}>{loading ? "Saving..." : "Save"}</Button>
          <Button variant="outlined" onClick={editable.cancelEdit} sx={{ borderColor: "#00a99d", color: "#00a99d" }}>Cancel</Button></>
        )}
      </Box>
 
      <PageWrapper id="template-to-download">
        <Typography variant="h4" sx={{ color: "#00c1b1", fontWeight: 800, mb: 1, fontSize: "1.8rem" }}>
          Revenue teardown: Service Line Penetration
        </Typography>
 
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 1 }}>
         
          <Box sx={{ display: 'flex', gap: 2, flex: '0 0 auto', alignItems: 'flex-start' }}>
           
            <Box sx={{ flex: '0 0 55%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.8rem' }}>SL Penetration</Typography>
                    <LegendItem color="#00adef" label="Overall SL penetration %" circle />
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                    {slLabels.map((label, i) => (<LegendItem key={label} color={slColors[i % 4]} label={label} />))}
                </Box>
                {/* RECTIFICATION: height flex and alignItems adjusted to remove top space */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', mt: 1 }}>
                  {["Q1 FY25","Q2 FY25","Q3 FY25","Q4 FY25","Q1 FY26","Q2 FY26","Q3 FY26","Q4 FY26"].map((label, i) => (
  <SLStackedBar
    key={i}
    index={i}
    label={label}
    values={editable.draftData.barValues[i]}
    colors={slColors}
    xxVal={editable.draftData.xxValues[i]}
    onXXChange={handleXXChange}
    onBarValueChange={handleBarValueChange}
    isEditing={editable.isEditing}
  />
))}
 
                </Box>
            </Box>
 
            <Box sx={{ flex: '0 0 43%', display: 'flex', flexDirection: 'column', mt: 2 }}>
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #333', overflow: 'hidden' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <GroupHeaderCell colSpan={2}>Breakdown by order book and pipeline</GroupHeaderCell>
                      <GroupHeaderCell colSpan={2}>Total (€ K)</GroupHeaderCell>
                      <GroupHeaderCell colSpan={2}>Share of Revenue (%)</GroupHeaderCell>
                    </TableRow>
                    <TableRow>
                      <StyledTableHeader sx={{ width: '25px' }}>#</StyledTableHeader>
                      <StyledTableHeader sx={{ textAlign: 'left' }}>Revenue classification</StyledTableHeader>
                      <StyledTableHeader sx={{ width: '15%' }}>FY25 Actuals + Forecast</StyledTableHeader>
                      <StyledTableHeader sx={{ width: '15%' }}>FY26 Target</StyledTableHeader>
                      <StyledTableHeader sx={{ width: '15%' }}>FY25 Actuals + Forecast</StyledTableHeader>
                      <StyledTableHeader sx={{ width: '15%' }}>FY26 Target</StyledTableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {editable.draftData.tableRows.map((row: any, i: number) => (
                      <TableRow key={row.id} sx={{ height: '26px' }}>
                        <StyledCell align="center" sx={{ bgcolor: row.disabled ? '#f4f4f4' : 'inherit' }}>{row.id}</StyledCell>
                        <StyledCell sx={{ fontWeight: 600, pl: row.indent ? 3 : 1, bgcolor: row.disabled ? '#f4f4f4' : 'inherit', textAlign: 'left' }}>{row.name}</StyledCell>
                        <StyledCell sx={{ bgcolor: row.disabled ? '#f4f4f4' : 'inherit' }}>{editable.isEditing ? <GrayInsetInput variant="outlined" value={row.v1} onChange={(e) => handleTableChange(i, 'v1', e.target.value)} /> : row.v1}</StyledCell>
                        <StyledCell sx={{ bgcolor: row.disabled ? '#d9d9d9' : 'inherit' }}>{editable.isEditing ? <GrayInsetInput variant="outlined" value={row.v2} onChange={(e) => handleTableChange(i, 'v2', e.target.value)} /> : row.v2}</StyledCell>
                        <StyledCell sx={{ bgcolor: row.disabled ? '#f4f4f4' : 'inherit' }}>{editable.isEditing ? <GrayInsetInput variant="outlined" value={row.v3} onChange={(e) => handleTableChange(i, 'v3', e.target.value)} /> : row.v3}</StyledCell>
                        <StyledCell sx={{ bgcolor: row.disabled ? '#d9d9d9' : 'inherit' }}>{editable.isEditing ? <GrayInsetInput variant="outlined" value={row.v4} onChange={(e) => handleTableChange(i, 'v4', e.target.value)} /> : row.v4}</StyledCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
 
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '140px', flex: '0 0 auto', mt: 1 }}>
            <DarkHeader>Key insights</DarkHeader>
            <Box sx={{ flex: 1, border: '1.5px solid #000', bgcolor: '#fff', display: 'flex', overflow: 'hidden' }}>
              {editable.isEditing ? (
                  <InsightInput multiline fullWidth variant="outlined" value={editable.draftData.insights} onChange={(e) => editable.updateDraft({ ...editable.draftData, insights: e.target.value })} />
              ) : (
                  <Typography sx={{ p: 1, fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>{editable.draftData.insights}</Typography>
              )}
            </Box>
          </Box>
        </Box>
      </PageWrapper>
    </Box>
  );
};
 
export default ServiceLinePenetration;
 
 