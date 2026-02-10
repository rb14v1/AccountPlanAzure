import React, { useEffect } from "react";
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
  Paper,
  Button,
  TextField,
  MenuItem,
} from "@mui/material";
import { useData } from "../context/DataContext";
import { useEditableTable } from "../hooks/useEditableTable";
import DownloadTemplates from "../components/DownloadTemplates";

// --- STYLED COMPONENTS ---

const PageWrapper = styled(Box)({
  display: "flex",
  flexDirection: "column",
  height: "calc(100vh - 100px)",
  backgroundColor: "#fff",
  padding: "4px 16px",
  overflow: "hidden",
  color: "#000",
  width: "100%",
});

const StyledTableHeader = styled(TableCell)({
  backgroundColor: "#002b2e",
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.65rem",
  padding: "4px 6px",
  border: "0.5px solid #fff",
  textAlign: "center",
  lineHeight: 1.1,
});

const StyledCell = styled(TableCell)({
  fontSize: "0.62rem",
  padding: "1px 6px",
  border: "1px solid #ccc",
  color: "#000",
  height: "clamp(18px, 2.5vh, 22px)",
});

// RECTIFIED: Gray Inset Input for Table Cells
const FormatLockedInput = styled(TextField)({
  width: '100%',
  '& .MuiInputBase-input': {
    fontSize: "0.62rem",
    padding: "2px",
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

// RECTIFIED: Gray Multiline Input for Key Insights
const InsightInput = styled(TextField)({
  width: '100%',
  height: '100%',
  backgroundColor: "#f2f2f2",
  "& .MuiInputBase-root": {
    height: "100%",
    alignItems: "flex-start",
    fontSize: "0.62rem",
    lineHeight: 1.3,
    padding: "8px",
    boxShadow: 'inset 0px 1px 3px rgba(0,0,0,0.1)',
  },
  "& .MuiOutlinedInput-notchedOutline": {
    border: "none !important",
  },
});
const API_BASE_URL = "http://localhost:8000/api";
const TEMPLATE_NAME = "Talent_Excellence_Overview";

const STATUS_COLORS: Record<string, string> = {
  "Above target": "#92d050",
  "Meets Target": "#ffc000",
  "Below Target": "#e05a6d",
};

const STATUS_OPTIONS = ["Above target", "Meets Target", "Below Target"];


const TalentExcellenceOverview: React.FC = () => {
  const { globalData, setGlobalData } = useData();

  const defaultData = {
    overviewRows: [
      { id: 1, metric: "Overall headcount", target: "#", q1: "#", q2: "#", q3: "#", q4: "#", q1Status: "Meets Target", q2Status: "Meets Target", q3Status: "Above target", q4Status: "Above target" },
      { id: 2, metric: "% gender representation", target: "#", q1: "xx%", q2: "xx%", q3: "xx%", q4: "xx%", q1Status: "Meets Target", q2Status: "Meets Target", q3Status: "Above target", q4Status: "Above target" },
      { id: 3, metric: "Attrition % LTM", target: "#", q1: "xx%", q2: "xx%", q3: "xx%", q4: "xx%", q1Status: "Meals Target", q2Status: "Meets Target", q3Status: "Above target", q4Status: "Above target" },
      { id: 4, metric: "Average tenure (no. of years)", target: "#", q1: "#", q2: "#", q3: "#", q4: "#", q1Status: "Meets Target", q2Status: "Meets Target", q3Status: "Above target", q4Status: "Above target" },
      { id: 5, metric: "# of associates with tenure >18 months", target: "#", q1: "#", q2: "#", q3: "#", q4: "#", q1Status: "Meets Target", q2Status: "Meets Target", q3Status: "Above target", q4Status: "Above target" },
      { id: 6, metric: "ESAT", target: "xx%", q1: "#", q2: "#", q3: "#", q4: "#", q1Status: "Meets Target", q2Status: "Meets Target", q3Status: "Above target", q4Status: "Above target" },
    ],
    demandRows: [
      { id: 1, metric: "Total open demand", target: "#", q1: "#", q2: "#", q3: "#", q4: "#", q1Status: "Below Target", q2Status: "Below Target", q3Status: "Above target", q4Status: "Above target" },
      { id: 2, metric: "Overdue demand", target: "xx%", q1: "xx%", q2: "xx%", q3: "xx%", q4: "xx%", q1Status: "Below Target", q2Status: "Below Target", q3Status: "Above target", q4Status: "Above target" },
      { id: 3, metric: "Fulfilment % ONS", target: "#", q1: "xx%", q2: "xx%", q3: "xx%", q4: "xx%", q1Status: "Below Target", q2Status: "Below Target", q3Status: "Above target", q4Status: "Above target" },
      { id: 4, metric: "Fulfilment % OFS", target: "xx%", q1: "xx%", q2: "xx%", q3: "xx%", q4: "xx%", q1Status: "Below Target", q2Status: "Below Target", q3Status: "Above target", q4Status: "Above target" },
      { id: 5, metric: "% external fulfilment", target: "#", q1: "xx%", q2: "xx%", q3: "xx%", q4: "xx%", q1Status: "Below Target", q2Status: "Below Target", q3Status: "Above target", q4Status: "Above target" },
      { id: 6, metric: "Fulfilment", target: "#", q1: "#", q2: "#", q3: "#", q4: "#", q1Status: "Below Target", q2Status: "Below Target", q3Status: "Above target", q4Status: "Above target" },
      { id: 7, metric: "Delivery on time %", target: "xx%", q1: "xx%", q2: "xx%", q3: "xx%", q4: "xx%", q1Status: "Below Target", q2Status: "Below Target", q3Status: "Above target", q4Status: "Above target" },
      { id: 8, metric: "SLA %", target: "xx%", q1: "xx%", q2: "xx%", q3: "xx%", q4: "xx%", q1Status: "Below Target", q2Status: "Below Target", q3Status: "Above target", q4Status: "Above target" },
      { id: 9, metric: "Average time to billability", target: "#", q1: "xx%", q2: "xx%", q3: "xx%", q4: "xx%", q1Status: "Below Target", q2Status: "Below Target", q3Status: "Above target", q4Status: "Above target" },
      { id: 10, metric: "Client interview %", target: "Xx%", q1: "xx%", q2: "xx%", q3: "xx%", q4: "xx%", q1Status: "Below Target", q2Status: "Below Target", q3Status: "Above target", q4Status: "Above target" },
    ],
    insights: "Key insights & Actions\n\nInstructions:\nPlease list all the metrics in red here, with a brief explanation of why it is red. Please provide all key drivers that impact each metric, as well as rationale for each of those drivers."
  };

  const talentData = globalData?.Talent_Excellence_Overview || defaultData;
  const editable = useEditableTable(talentData);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/talent-excellence/?user_id=101`
        );
        const dbData = await res.json();

        if (dbData && (dbData.overviewRows || dbData.demandRows)) {
          editable.updateDraft(dbData);
          setGlobalData((prev: any) => ({
            ...prev,
            Talent_Excellence_Overview: dbData,
          }));
        }
      } catch (e) {
        console.error("Talent Excellence fetch failed", e);
      }
    };

    fetchData();
  }, []);

  const handleRowChange = (section: 'overviewRows' | 'demandRows', index: number, field: string, value: string) => {
    const updated = [...editable.draftData[section]];
    updated[index] = { ...updated[index], [field]: value };
    editable.updateDraft({ ...editable.draftData, [section]: updated });
  };
  const handleSave = async () => {
    try {
      const payload = {
        user_id: "101",
        overviewRows: editable.draftData.overviewRows,
        demandRows: editable.draftData.demandRows,
        insights: editable.draftData.insights
      };

      const res = await fetch(
        `${API_BASE_URL}/talent-excellence/save/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Save failed");

      setGlobalData((prev: any) => ({
        ...prev,
        Talent_Excellence_Overview: payload
      }));

      editable.saveEdit(() => { });
      alert("✅ Saved successfully");
    } catch (e) {
      console.error(e);
      alert("❌ Save failed");
    }
  };
  const renderQuarterCell = (section: 'overviewRows' | 'demandRows', index: number, q: 'q1' | 'q2' | 'q3' | 'q4') => {
    const row = editable.draftData[section][index];
    const val = row[q];
    const statusKey = `${q}Status`;
    const currentStatus = row[statusKey];

    return (
      <StyledCell sx={{ bgcolor: STATUS_COLORS[currentStatus] || "#fff", p: 0 }}>
        {editable.isEditing ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <FormatLockedInput
              variant="outlined"
              value={val}
              onChange={(e) => handleRowChange(section, index, q, e.target.value)}
              sx={{ flex: 1 }}
            />
            <TextField
              select
              size="small"
              value={currentStatus}
              onChange={(e) => handleRowChange(section, index, statusKey, e.target.value)}
              sx={{
                height: '12px',
                '& .MuiInputBase-root': { fontSize: '0.4rem', height: '12px', bgcolor: 'rgba(255,255,255,0.3)' },
                '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
              }}
            >
              {STATUS_OPTIONS.map(opt => <MenuItem key={opt} value={opt} sx={{ fontSize: '0.6rem' }}>{opt}</MenuItem>)}
            </TextField>
          </Box>
        ) : (
          val
        )}
      </StyledCell>
    );
  };

  return (
    <Box sx={{ bgcolor: "#fff", minHeight: "100vh" }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1, gap: 2 }}>
        <DownloadTemplates templateName={TEMPLATE_NAME} />
        {!editable.isEditing ? (
          <Button variant="outlined" onClick={editable.startEdit} sx={{ borderColor: "#00a99d", color: "#00a99d" }}>Edit</Button>
        ) : (
          <><Button variant="contained" onClick={handleSave} sx={{ backgroundColor: "#00a99d", color: "#fff" }}>Save</Button>
            <Button variant="outlined" onClick={editable.cancelEdit} sx={{ borderColor: "#00a99d", color: "#00a99d" }}>Cancel</Button></>
        )}
      </Box>

      <PageWrapper id="template-to-download">
        <Typography variant="h5" sx={{ color: "#00a99d", fontWeight: 800, mb: 0.5, fontSize: "1.2rem" }}>
          Talent excellence overview
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 0.5 }}>
          {[{ l: "Above target", c: "#92d050" }, { l: "Meets Target", c: "#ffc000" }, { l: "Below Target", c: "#e05a6d" }].map(t => (
            <Box key={t.l} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 25, height: 10, bgcolor: t.c }} />
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 600 }}>{t.l}</Typography>
            </Box>
          ))}
        </Box>

        <Grid container wrap="nowrap" spacing={1.5} sx={{ flex: 1, minHeight: 0, width: "100%" }}>
          <Grid item sx={{ width: '72%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1.5px solid #002b2e', flex: 1, overflow: 'hidden' }}>
              <Table size="small" stickyHeader sx={{ tableLayout: 'fixed', height: '100%' }}>
                <TableHead>
                  <TableRow>
                    <StyledTableHeader sx={{ width: '85px' }}>Themes</StyledTableHeader>
                    <StyledTableHeader sx={{ width: '25px' }}>#</StyledTableHeader>
                    <StyledTableHeader sx={{ textAlign: 'left' }}>Metric</StyledTableHeader>
                    <StyledTableHeader sx={{ width: '75px' }}>Target/ Benchmark</StyledTableHeader>
                    <StyledTableHeader sx={{ width: '60px' }}>FY25 Q1</StyledTableHeader>
                    <StyledTableHeader sx={{ width: '60px' }}>FY25 Q2</StyledTableHeader>
                    <StyledTableHeader sx={{ width: '60px' }}>FY25 Q3</StyledTableHeader>
                    <StyledTableHeader sx={{ width: '60px' }}>FY25 Q4</StyledTableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {editable.draftData.overviewRows.map((row: any, i: number) => (
                    <TableRow key={`ov-${i}`}>
                      {i === 0 && <StyledCell rowSpan={6} sx={{ bgcolor: '#005f6b', color: '#fff', fontWeight: 700, textAlign: 'center' }}>Overall Workforce Overview</StyledCell>}
                      <StyledCell align="center">{row.id}</StyledCell>
                      <StyledCell sx={{ textAlign: 'left' }}>{row.metric}</StyledCell>
                      <StyledCell sx={{ bgcolor: '#d9d9d9' }}>
                        {editable.isEditing ? <FormatLockedInput variant="outlined" value={row.target} onChange={(e) => handleRowChange('overviewRows', i, 'target', e.target.value)} /> : row.target}
                      </StyledCell>
                      {renderQuarterCell('overviewRows', i, 'q1')}
                      {renderQuarterCell('overviewRows', i, 'q2')}
                      {renderQuarterCell('overviewRows', i, 'q3')}
                      {renderQuarterCell('overviewRows', i, 'q4')}
                    </TableRow>
                  ))}
                  {editable.draftData.demandRows.map((row: any, i: number) => (
                    <TableRow key={`dm-${i}`}>
                      {i === 0 && <StyledCell rowSpan={10} sx={{ bgcolor: '#005f6b', color: '#fff', fontWeight: 700, textAlign: 'center' }}>Demand and Fulfilment</StyledCell>}
                      <StyledCell align="center">{row.id}</StyledCell>
                      <StyledCell sx={{ textAlign: 'left' }}>{row.metric}</StyledCell>
                      <StyledCell sx={{ bgcolor: '#d9d9d9' }}>
                        {editable.isEditing ? <FormatLockedInput variant="outlined" value={row.target} onChange={(e) => handleRowChange('demandRows', i, 'target', e.target.value)} /> : row.target}
                      </StyledCell>
                      {renderQuarterCell('demandRows', i, 'q1')}
                      {renderQuarterCell('demandRows', i, 'q2')}
                      {renderQuarterCell('demandRows', i, 'q3')}
                      {renderQuarterCell('demandRows', i, 'q4')}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          <Grid item sx={{ width: '28%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ bgcolor: '#001a1a', color: '#fff', px: 1, py: 0.5, fontWeight: 700, fontSize: '0.75rem' }}>Key insights & Actions</Box>
            <Box sx={{ flex: 1, border: '1.5px solid #000', bgcolor: '#fff', display: 'flex', overflow: 'hidden' }}>
              {editable.isEditing ? (
                <InsightInput
                  multiline
                  fullWidth
                  variant="outlined"
                  value={editable.draftData.insights}
                  onChange={(e) => editable.updateDraft({ ...editable.draftData, insights: e.target.value })}
                />
              ) : (
                <Typography sx={{ p: 1, fontSize: '0.62rem', whiteSpace: 'pre-wrap', lineHeight: 1.3 }}>{editable.draftData.insights}</Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </PageWrapper>
    </Box>
  );
};

export default TalentExcellenceOverview;
