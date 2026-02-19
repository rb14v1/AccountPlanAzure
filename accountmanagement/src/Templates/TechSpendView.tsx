import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Dialog,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  styled,
  Button,
  TextField,
  Snackbar,
  Alert,
  MenuItem
} from "@mui/material";
import { useData } from "../context/DataContext";
import { useEditableTable } from "../hooks/useEditableTable";
import DownloadTemplates from "../components/DownloadTemplates";

const API_BASE_URL = "http://localhost:8000/api";
const TEMPLATE_NAME = "tech_spend_view";

// --- STYLED COMPONENTS ---

const PageWrapper = styled(Box)({
  display: "flex",
  flexDirection: "column",
  height: "auto",
  minHeight: "100vh",
  backgroundColor: "#fff",
  padding: "16px 24px",
  overflow: "auto",
  color: "#000",
  width: "100%",
  paddingBottom: "50px"
});

const SectionTitle = styled(Typography)({
  color: "#00a99d",
  fontWeight: 800,
  fontSize: "1.4rem",
  marginBottom: "16px",
});

const StyledTableCell = styled(TableCell)<{ head?: boolean }>(({ head }) => ({
  border: "1px solid #333",
  // ✅ FIX: padding set to 0 for body cells to allow color fill to touch borders
  padding: head ? "4px 6px" : "0px",
  fontSize: "0.75rem",
  fontWeight: head ? 700 : 400,
  backgroundColor: head ? "#002b2e" : "transparent",
  color: head ? "#fff" : "#000",
  textAlign: "center",
  lineHeight: 1.1,
}));

// ✅ FIX: Updated to fill the whole box height/width
const StatusCell = styled(Box)<{ color: string }>(({ color }) => ({
  width: "100%",
  height: "100%",
  minHeight: "35px",
  backgroundColor: color || "transparent",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const FormatLockedInput = styled(TextField)({
  width: '100%',
  '& .MuiInputBase-input': {
    fontSize: "0.7rem",
    padding: "8px 4px",
    color: "inherit",
    textAlign: 'inherit',
    fontWeight: 'inherit'
  },
  '& .MuiInputBase-root': {
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none !important',
  },
  '&:hover .MuiInputBase-root': {
    backgroundColor: '#f5f5f5',
  }
});

// --- NEW STYLED COMPONENTS FOR LEGEND ---
const LegendWrapper = styled(Box)({
  display: "flex",
  gap: "32px",
  marginTop: "24px",
  paddingLeft: "10px",
  alignItems: "center"
});

const LegendItem = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  "& .box": {
    width: "20px",
    height: "20px",
    border: "1px solid #333"
  },
  "& .text": {
    fontSize: "0.75rem",
    color: "#000",
    fontWeight: 500
  }
});

const PRESENCE_OPTIONS = [
  { label: 'Deep presence', color: '#92d050' },
  { label: 'Focus area for growth', color: '#e5a51a' },
  { label: 'Not a priority / synergistic with client focus', color: '#e05a6d' },
];

const TechSpendView: React.FC = () => {
  const { globalData, setGlobalData } = useData();
  const userId = globalData?.user_id || localStorage.getItem("user_id");
  const dataLoaded = useRef(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as any });

  const [graphDialogOpen, setGraphDialogOpen] = useState(false);
  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);
  const [tempGraphValue, setTempGraphValue] = useState({ l: "", v: "" });

  const handleBarClick = (index: number) => {
    if (!editable.isEditing) return;
    const bar = editable.draftData.geoRevenue[index];
    setSelectedBarIndex(index);
    setTempGraphValue({ l: bar.l, v: bar.v });
    setGraphDialogOpen(true);
  };

  const handleGraphSave = () => {
    if (selectedBarIndex === null) return;

    const updated = [...editable.draftData.geoRevenue];
    updated[selectedBarIndex] = {
      ...updated[selectedBarIndex],
      l: tempGraphValue.l,
      v: tempGraphValue.v,
    };

    editable.updateDraft({
      ...editable.draftData,
      geoRevenue: updated,
    });

    setGraphDialogOpen(false);
  };

  const defaultData = {
    rows: [
      { id: 1, name: "BU1", desc: "", size: "", growth: "", spend: "", priorities: "", presence: "#92d050", incumbent: "" },
      { id: 2, name: "BU2", desc: "", size: "", growth: "", spend: "", priorities: "", presence: "#e5a51a", incumbent: "" },
      { id: 3, name: "BU3", desc: "", size: "", growth: "", spend: "", priorities: "", presence: "#e05a6d", incumbent: "" },
      { id: 4, name: "BU4", desc: "", size: "", growth: "", spend: "", priorities: "", presence: "", incumbent: "" },
      { id: 5, name: "BU5", desc: "", size: "", growth: "", spend: "", priorities: "", presence: "", incumbent: "" },
      { id: 6, name: "BU6", desc: "", size: "", growth: "", spend: "", priorities: "", presence: "", incumbent: "" },
    ],
    geoRevenue: [
      { l: "Americas", v: "40" },
      { l: "EMEA", v: "30" },
      { l: "APAC", v: "10" },
      { l: "Others", v: "8" },
    ],
    geoTalent: [
      { geo: "Americas", val: "%" },
      { geo: "EMEA", val: "%" },
      { geo: "APAC", val: "%" },
    ],
    geoPriorities: [
      { geo: "Americas", val: "• XX" },
      { geo: "EMEA", val: "• XX" },
      { geo: "APAC", val: "• XX" },
    ]
  };

  const techData = globalData?.tech_spend_view || defaultData;
  const editable = useEditableTable(techData);

  const getGraphData = () => {
    const data = editable.draftData.geoRevenue || [];
    const values = data.map((d: any) => parseFloat(d.v) || 0);
    const max = Math.max(...values, 10);

    return data.map((d: any) => ({
      ...d,
      heightPercent: `${((parseFloat(d.v) || 0) / max) * 100}%`
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      if (dataLoaded.current) return;
      try {
        const res = await fetch(`${API_BASE_URL}/tech-spend/?user_id=${userId}`);
        const dbData = await res.json();

        if (dbData && dbData.rows) {
          editable.updateDraft(dbData);
          setGlobalData((prev: any) => ({ ...prev, tech_spend_view: dbData }));
          dataLoaded.current = true;
        }
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };
    fetchData();
  }, [userId]);

  const EditableOutlinedBox = styled(Box)<{ editing?: boolean }>(({ editing }) => ({
    border: editing ? "1px solid #cfcfcf" : "none",
    borderRadius: 6,
    padding: editing ? "4px 6px" : 0,
    backgroundColor: "#fff",
    transition: "all 0.2s ease",
  }));


  const handleSave = async () => {
    try {
      const payload = {
        user_id: userId,
        ...editable.draftData
      };

      const response = await fetch(`${API_BASE_URL}/tech-spend/save/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save");

      setGlobalData((prev: any) => ({
        ...prev,
        [TEMPLATE_NAME]: editable.draftData
      }));

      editable.saveEdit(() => { });
      setSnackbar({ open: true, message: "✅ Saved successfully", severity: "success" });
    } catch (e) {
      console.error("Save error:", e);
      setSnackbar({ open: true, message: "❌ Failed to save", severity: "error" });
    }
  };

  const handleRowChange = (index: number, field: string, value: string) => {
    const updated = [...editable.draftData.rows];
    updated[index] = { ...updated[index], [field]: value };
    editable.updateDraft({ ...editable.draftData, rows: updated });
  };

  const handleGeoChange = (section: string, index: number, field: string, value: string) => {
    const updated = [...editable.draftData[section]];
    updated[index] = { ...updated[index], [field]: value };
    editable.updateDraft({ ...editable.draftData, [section]: updated });
  };

  const graphData = getGraphData();

  return (
    <Box sx={{ bgcolor: "#fff", minHeight: "100vh" }}>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', p: 1, gap: 2 }}>
        <DownloadTemplates templateName={TEMPLATE_NAME} />
        {!editable.isEditing ? (
          <Button
            variant="outlined"
            onClick={editable.startEdit}
            sx={{
              borderColor: "#008080",
              color: "#008080",
              "&:hover": {
                borderColor: "#008080",
                backgroundColor: "rgba(0, 128, 128, 0.04)",
              },
              "&.Mui-focusVisible": {
                outline: "none",
              },
            }}
          >
            Edit
          </Button>
        ) : (
          <>
            <Button variant="contained" onClick={handleSave} sx={{ backgroundColor: "#008080", color: "#fff" }}>Save</Button>
            <Button
              variant="outlined"
              onClick={editable.cancelEdit}
              sx={{
                borderColor: "#008080",
                color: "#008080",
                "&:hover": {
                  borderColor: "#008080",
                  backgroundColor: "rgba(0, 128, 128, 0.04)",
                },
                "&.Mui-focusVisible": {
                  outline: "none",
                },
              }}
            >
              Cancel
            </Button>
          </>
        )}
      </Box>

      <PageWrapper id="template-to-download">
        <Box className="pdf-section">
        <SectionTitle>Tech spend breakdown by client BU and Geography</SectionTitle>

        <Box sx={{ display: "flex", flexDirection: "row", width: "100%", gap: 2, alignItems: "flex-start" }}>

          <Box sx={{ width: "70%", display: "flex", flexDirection: "column" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Business unit view: Key highlights</Typography>

            <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #333", borderRadius: 0, overflow: "visible" }}>
              <Table size="small" sx={{ tableLayout: 'fixed' }}>
                <TableHead>
                  <TableRow>
                    <StyledTableCell head sx={{ width: "40px" }}>#</StyledTableCell>
                    <StyledTableCell head sx={{ width: "18%" }}>Business unit</StyledTableCell>
                    <StyledTableCell head>Description</StyledTableCell>
                    <StyledTableCell head sx={{ width: "8%" }}>Size (€Mn)</StyledTableCell>
                    <StyledTableCell head sx={{ width: "8%" }}>Growth (%)</StyledTableCell>
                    <StyledTableCell head sx={{ width: "12%" }}>O/S Services spend</StyledTableCell>
                    <StyledTableCell head>Priorities</StyledTableCell>
                    <StyledTableCell head sx={{ width: "10%" }}>client presence</StyledTableCell>
                    <StyledTableCell head sx={{ width: "12%" }}>Incumbent</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {editable.draftData.rows.map((row: any, i: number) => (
                    <TableRow key={row.id}>
                      <StyledTableCell sx={{ bgcolor: "#007a83", color: "#fff", fontWeight: 700 }}>{row.id}</StyledTableCell>
                      <StyledTableCell sx={{ bgcolor: "#007a83", color: "#fff", fontWeight: 700, textAlign: 'left', px: "4px" }}>
                        {editable.isEditing ? (
                          <EditableOutlinedBox editing>
                            <FormatLockedInput
                              value={row.name}
                              onChange={(e) => handleRowChange(i, "name", e.target.value)}
                            />
                          </EditableOutlinedBox>
                        ) : (
                          row.name
                        )}
                      </StyledTableCell>
                      <StyledTableCell sx={{ px: "4px" }}>{editable.isEditing ? (<EditableOutlinedBox editing> <FormatLockedInput value={row.desc} onChange={(e) => handleRowChange(i, 'desc', e.target.value)} /> </EditableOutlinedBox>) : row.desc}</StyledTableCell>
                      <StyledTableCell sx={{ px: "4px" }}>{editable.isEditing ? (<EditableOutlinedBox editing> <FormatLockedInput value={row.size} onChange={(e) => handleRowChange(i, 'size', e.target.value)} /> </EditableOutlinedBox>) : row.size}</StyledTableCell>
                      <StyledTableCell sx={{ px: "4px" }}>{editable.isEditing ? (<EditableOutlinedBox editing> <FormatLockedInput value={row.growth} onChange={(e) => handleRowChange(i, 'growth', e.target.value)} /> </EditableOutlinedBox>) : row.growth}</StyledTableCell>
                      <StyledTableCell sx={{ px: "4px" }}>{editable.isEditing ? (<EditableOutlinedBox editing> <FormatLockedInput value={row.spend} onChange={(e) => handleRowChange(i, 'spend', e.target.value)} /> </EditableOutlinedBox>) : row.spend}</StyledTableCell>
                      <StyledTableCell sx={{ px: "4px" }}>{editable.isEditing ? (<EditableOutlinedBox editing> <FormatLockedInput value={row.priorities} onChange={(e) => handleRowChange(i, 'priorities', e.target.value)} /> </EditableOutlinedBox>) : row.priorities}</StyledTableCell>

                      {/* CLIENT PRESENCE: FULL COLOR FILL */}
                      <StyledTableCell sx={{ padding: 0, height: '1px' }}>
                        {/* height: '1px' on the cell allows the child Box to fill 100% of the actual row height */}
                        {editable.isEditing ? (
                          <Box
                            sx={{
                              height: '100%',
                              width: '100%',
                              bgcolor: row.presence || 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <EditableOutlinedBox editing>
                              <TextField
                                select
                                fullWidth
                                variant="standard"
                                value={row.presence}
                                onChange={(e) => handleRowChange(i, 'presence', e.target.value)}
                                InputProps={{ disableUnderline: true }}
                                sx={{
                                  height: '100%',
                                  width: '100%',
                                  '& .MuiSelect-select': {
                                    py: '12px',
                                    textAlign: 'center',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }
                                }}
                              >


                                <MenuItem value=""><em>None</em></MenuItem>
                                {PRESENCE_OPTIONS.map((opt) => (
                                  <MenuItem key={opt.color} value={opt.color}>{opt.label}</MenuItem>
                                ))}
                              </TextField>
                            </EditableOutlinedBox>
                          </Box>
                        ) : (
                          <StatusCell color={row.presence} />
                        )}
                      </StyledTableCell>

                      <StyledTableCell sx={{ px: "4px" }}>{editable.isEditing ? (<EditableOutlinedBox editing> <FormatLockedInput value={row.incumbent} onChange={(e) => handleRowChange(i, 'incumbent', e.target.value)} /> </EditableOutlinedBox>) : row.incumbent}</StyledTableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* LEGEND SECTION */}
            <LegendWrapper>
              {PRESENCE_OPTIONS.map((opt) => (
                <LegendItem key={opt.label}>
                  <Box className="box" sx={{ bgcolor: opt.color }} />
                  <Typography className="text">{opt.label}</Typography>
                </LegendItem>
              ))}
            </LegendWrapper>
          </Box>

          <Box sx={{ width: "30%", display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Geography view: Key highlights</Typography>
            <Box sx={{ border: "1px solid #333", display: "flex", flexDirection: "column" }}>
              <Box sx={{ bgcolor: "#002b2e", color: "#fff", p: 0.5 }}>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, textAlign: "center" }}>Client's revenue breakdown by geo (€Mn)</Typography>
              </Box>
              <Box sx={{ height: "160px", display: "flex", alignItems: "flex-end", justifyContent: "space-around", p: 1, bgcolor: "#f9f9f9" }}>
                {graphData.map((g: any, i: number) => (
                  <Box
                    key={g.l}
                    sx={{
                      textAlign: "center",
                      width: "22%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      height: "100%",
                      cursor: editable.isEditing ? "pointer" : "default",
                    }}
                    onClick={() => handleBarClick(i)}
                  >
                    <Box sx={{ fontSize: "0.7rem", fontWeight: 700, mb: 0.5 }}>
                      {g.v}
                    </Box>

                    <Box
                      sx={{
                        height: g.heightPercent,
                        bgcolor: "#00c1b4",
                        width: "100%",
                        border: "1px solid #333",
                        transition: "height 0.3s ease",
                        outline: editable.isEditing ? "2px dashed #00a99d" : "none",
                      }}
                    />

                    <Typography sx={{ fontSize: "0.65rem", fontWeight: 800, mt: 0.5 }}>
                      {g.l}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Box sx={{ bgcolor: "#002b2e", color: "#fff", p: 0.5, borderTop: "1px solid #333" }}>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, textAlign: "center" }}>Client's Talent split across geos</Typography>
              </Box>
              <Table size="small">
                <TableHead><TableRow sx={{ "& th": { bgcolor: "#002b2e", color: "#fff", fontSize: "0.7rem", p: 0.5 } }}><TableCell sx={{ border: "1px solid #333" }}>#</TableCell><TableCell sx={{ border: "1px solid #333" }}>Geography</TableCell><TableCell sx={{ border: "1px solid #333" }}>% Headcount</TableCell></TableRow></TableHead>
                <TableBody>
                  {editable.draftData.geoTalent.map((row: any, idx: number) => (
                    <TableRow key={row.geo} sx={{ "& td": { fontSize: "0.7rem", p: 0.5, border: "1px solid #333" } }}>
                      <TableCell sx={{ bgcolor: "#007a83", color: "#fff", textAlign: 'center' }}>{idx + 1}</TableCell>
                      <TableCell sx={{ bgcolor: "#007a83", color: "#fff" }}>{row.geo}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        {editable.isEditing ? <EditableOutlinedBox editing={editable.isEditing}><FormatLockedInput sx={{ '& .MuiInputBase-input': { textAlign: 'center' } }} value={row.val} onChange={(e) => handleGeoChange('geoTalent', idx, 'val', e.target.value)} /></EditableOutlinedBox> : row.val}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Box sx={{ bgcolor: "#002b2e", color: "#fff", p: 0.5, borderTop: "1px solid #333" }}>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, textAlign: "center" }}>Business priorities across geos</Typography>
              </Box>
              <Table size="small">
                <TableHead><TableRow sx={{ "& th": { bgcolor: "#002b2e", color: "#fff", fontSize: "0.7rem", p: 0.5 } }}><TableCell sx={{ border: "1px solid #333" }}>#</TableCell><TableCell sx={{ border: "1px solid #333" }}>Geography</TableCell><TableCell sx={{ border: "1px solid #333" }}>Key Priorities</TableCell></TableRow></TableHead>
                <TableBody>
                  {editable.draftData.geoPriorities.map((row: any, idx: number) => (
                    <TableRow key={row.geo} sx={{ "& td": { fontSize: "0.7rem", p: 0.5, border: "1px solid #333" } }}>
                      <TableCell sx={{ bgcolor: "#007a83", color: "#fff", textAlign: 'center' }}>{idx + 1}</TableCell>
                      <TableCell sx={{ bgcolor: "#007a83", color: "#fff" }}>{row.geo}</TableCell>
                      <TableCell sx={{ textAlign: 'left' }}>
                        {editable.isEditing ? <EditableOutlinedBox editing={editable.isEditing}><FormatLockedInput value={row.val} onChange={(e) => handleGeoChange('geoPriorities', idx, 'val', e.target.value)} /></EditableOutlinedBox> : row.val}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Box>
        </Box>
        <Dialog
          open={graphDialogOpen}
          onClose={() => setGraphDialogOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <Box sx={{ p: 3 }}>
            <Typography fontWeight={700} mb={2}>
              Edit Graph Data
            </Typography>

            <TextField
              label="X-axis (Label)"
              fullWidth
              size="small"
              sx={{ mb: 2 }}
              value={tempGraphValue.l}
              onChange={(e) =>
                setTempGraphValue({ ...tempGraphValue, l: e.target.value })
              }
            />

            <TextField
              label="Y-axis (Value)"
              fullWidth
              size="small"
              type="number"
              value={tempGraphValue.v}
              onChange={(e) =>
                setTempGraphValue({ ...tempGraphValue, v: e.target.value })
              }
            />

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 3 }}>
              <Button
                onClick={() => setGraphDialogOpen(false)}
                sx={{
                  color: "#008080",
                  borderColor: "#008080",
                }}
                variant="outlined"
              >
                Cancel
              </Button>

              <Button
                variant="contained"
                onClick={handleGraphSave}
                sx={{
                  bgcolor: "#008080",
                  "&:hover": {
                    bgcolor: "#006d6d",
                  },
                }}
              >
                Save
              </Button>
            </Box>
          </Box>
        </Dialog>
        </Box>
      </PageWrapper>
    </Box>
  );
};

export default TechSpendView;