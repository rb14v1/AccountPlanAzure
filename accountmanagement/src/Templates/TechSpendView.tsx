import React from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  styled,
  Button,
  TextField,
} from "@mui/material";
import { useData } from "../context/DataContext";
import { useEditableTable } from "../hooks/useEditableTable";
import DownloadTemplates from "../components/DownloadTemplates";
 
// --- STYLED COMPONENTS ---
 
const PageWrapper = styled(Box)({
  display: "flex",
  flexDirection: "column",
  height: "calc(100vh - 120px)",
  backgroundColor: "#fff",
  padding: "8px 16px",
  overflow: "hidden",
  color: "#000",
  width: "100%",
});
 
const SectionTitle = styled(Typography)({
  color: "#00a99d",
  fontWeight: 800,
  fontSize: "1.3rem",
  marginBottom: "8px",
});
 
const StyledTableCell = styled(TableCell)<{ head?: boolean }>(({ head }) => ({
  border: "1px solid #333",
  padding: "4px 6px",
  fontSize: "0.75rem",
  fontWeight: head ? 700 : 400,
  backgroundColor: head ? "#002b2e" : "transparent",
  color: head ? "#fff" : "#000",
  textAlign: "center",
  lineHeight: 1.1,
}));
 
const StatusCell = styled(Box)<{ color: string }>(({ color }) => ({
  width: "100%",
  height: "100%",
  minHeight: "24px",
  backgroundColor: color,
}));
 
// Format-locked input to prevent layout shifting
// Format-locked input to prevent layout shifting
const FormatLockedInput = styled(TextField)({
  width: '100%',
  '& .MuiInputBase-input': {
    fontSize: "0.65rem",
    padding: "4px", // Added padding for better readability
    color: "inherit",
    textAlign: 'inherit',
    fontWeight: 'inherit'
  },
  '& .MuiInputBase-root': {
    padding: 0,
    margin: 0,
    backgroundColor: '#f2f2f2', // Light gray background
    borderRadius: '2px',
    boxShadow: 'inset 0px 1px 2px rgba(0,0,0,0.1)', // Inset shadow for depth
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none !important', // Remove default border to match reference
  },
  '&:hover .MuiInputBase-root': {
    backgroundColor: '#ebebeb', // Subtle hover effect
  }
});
 
const TEMPLATE_NAME = "Tech_Spend_Breakdown";
 
// --- MAIN COMPONENT ---
 
const TechSpendView: React.FC = () => {
  const { globalData, setGlobalData } = useData();
 
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
      { l: "Americas", v: "40", h: "75%" },
      { l: "EMEA", v: "30", h: "60%" },
      { l: "APAC", v: "10", h: "20%" },
      { l: "Others", v: "8", h: "15%" },
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
 
  const techData = globalData?.Tech_Spend_Breakdown || defaultData;
  const editable = useEditableTable(techData);
 
  // Persistence handlers
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
 
  return (
    <Box sx={{ bgcolor: "#fff", minHeight: "100vh" }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', p: 1, gap: 2 }}>
        <DownloadTemplates templateName={TEMPLATE_NAME} />
        {!editable.isEditing ? (
          <Button variant="outlined" onClick={editable.startEdit} sx={{ borderColor: "#00a99d", color: "#00a99d" }}>Edit</Button>
        ) : (
          <>
            <Button
              variant="contained"
              onClick={() => editable.saveEdit((updated) => setGlobalData((prev: any) => ({ ...prev, Tech_Spend_Breakdown: updated })))}
              sx={{ backgroundColor: "#00a99d", color: "#fff" }}
            >Save</Button>
            <Button variant="outlined" onClick={editable.cancelEdit} sx={{ borderColor: "#00a99d", color: "#00a99d" }}>Cancel</Button>
          </>
        )}
      </Box>
 
      <PageWrapper id="template-to-download">
        <SectionTitle>Tech spend breakdown by client BU and Geography</SectionTitle>
 
        <Grid container wrap="nowrap" spacing={2} sx={{ flex: 1, minHeight: 0, width: "100%", m: 0 }}>
         
          {/* LEFT SECTION */}
          <Grid item sx={{ width: "70%", display: "flex", flexDirection: "column", height: "100%" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Business unit view: Key highlights</Typography>
            <TableContainer component={Paper} elevation={0} sx={{ flex: 1, border: "1px solid #333", display: 'flex', overflow: 'hidden' }}>
              <Table size="small" stickyHeader sx={{ height: '100%', tableLayout: 'fixed' }}>
                <TableHead>
                  <TableRow>
                    <StyledTableCell head sx={{ width: "40px" }}>#</StyledTableCell>
                    <StyledTableCell head sx={{ width: "15%" }}>Business unit</StyledTableCell>
                    <StyledTableCell head>Description</StyledTableCell>
                    <StyledTableCell head sx={{ width: "10%" }}>Size (€Mn)</StyledTableCell>
                    <StyledTableCell head sx={{ width: "10%" }}>Growth (%)</StyledTableCell>
                    <StyledTableCell head sx={{ width: "12%" }}>O/S Services spend</StyledTableCell>
                    <StyledTableCell head>Priorities</StyledTableCell>
                    <StyledTableCell head sx={{ width: "10%" }}>client presence</StyledTableCell>
                    <StyledTableCell head sx={{ width: "10%" }}>Incumbent</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {editable.draftData.rows.map((row: any, i: number) => (
                    <TableRow key={row.id} sx={{ height: "calc(100% / 6)" }}>
                      <StyledTableCell sx={{ bgcolor: "#007a83", color: "#fff", fontWeight: 700 }}>{row.id}</StyledTableCell>
                      <StyledTableCell sx={{ bgcolor: "#007a83", color: "#fff", fontWeight: 700, textAlign: 'left' }}>
                        {editable.isEditing ? <FormatLockedInput variant="standard" InputProps={{ disableUnderline: true }} sx={{ color: '#fff' }} value={row.name} onChange={(e) => handleRowChange(i, 'name', e.target.value)} /> : row.name}
                      </StyledTableCell>
                      <StyledTableCell>{editable.isEditing ? <FormatLockedInput variant="standard" InputProps={{ disableUnderline: true }} value={row.desc} onChange={(e) => handleRowChange(i, 'desc', e.target.value)} /> : row.desc}</StyledTableCell>
                      <StyledTableCell>{editable.isEditing ? <FormatLockedInput variant="standard" InputProps={{ disableUnderline: true }} value={row.size} onChange={(e) => handleRowChange(i, 'size', e.target.value)} /> : row.size}</StyledTableCell>
                      <StyledTableCell>{editable.isEditing ? <FormatLockedInput variant="standard" InputProps={{ disableUnderline: true }} value={row.growth} onChange={(e) => handleRowChange(i, 'growth', e.target.value)} /> : row.growth}</StyledTableCell>
                      <StyledTableCell>{editable.isEditing ? <FormatLockedInput variant="standard" InputProps={{ disableUnderline: true }} value={row.spend} onChange={(e) => handleRowChange(i, 'spend', e.target.value)} /> : row.spend}</StyledTableCell>
                      <StyledTableCell>{editable.isEditing ? <FormatLockedInput variant="standard" InputProps={{ disableUnderline: true }} value={row.priorities} onChange={(e) => handleRowChange(i, 'priorities', e.target.value)} /> : row.priorities}</StyledTableCell>
                      <StyledTableCell sx={{ p: 0 }}>{row.presence && <StatusCell color={row.presence} />}</StyledTableCell>
                      <StyledTableCell>{editable.isEditing ? <FormatLockedInput variant="standard" InputProps={{ disableUnderline: true }} value={row.incumbent} onChange={(e) => handleRowChange(i, 'incumbent', e.target.value)} /> : row.incumbent}</StyledTableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
 
          {/* RIGHT SECTION: Geography Highlights (Now Fully Editable) */}
          <Grid item sx={{ width: "30%", display: "flex", flexDirection: "column", height: "100%", gap: 0.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Geography view: Key highlights</Typography>
            <Box sx={{ border: "1px solid #333", flex: 1, display: "flex", flexDirection: "column", overflow: 'hidden' }}>
             
              {/* 1. Revenue breakdown bar chart */}
              <Box sx={{ bgcolor: "#002b2e", color: "#fff", p: 0.5 }}>
                <Typography sx={{ fontSize: "0.7rem", fontWeight: 700 }}>Client's revenue breakdown by geo (€Mn)</Typography>
              </Box>
              <Box sx={{ flex: 1.5, display: "flex", alignItems: "flex-end", justifyContent: "space-around", p: 1, bgcolor: "#f9f9f9" }}>
                {editable.draftData.geoRevenue.map((g: any, i: number) => (
                  <Box key={g.l} sx={{ textAlign: "center", width: "22%" }}>
                    <Box sx={{ fontSize: "0.6rem", mb: 0.5, fontWeight: 700 }}>
                      {editable.isEditing ? <FormatLockedInput variant="standard" InputProps={{ disableUnderline: true }} sx={{ '& .MuiInputBase-input': { textAlign: 'center' } }} value={g.v} onChange={(e) => handleGeoChange('geoRevenue', i, 'v', e.target.value)} /> : g.v}
                    </Box>
                    <Box sx={{ height: g.h, bgcolor: "#00c1b4", mx: "auto", width: "80%", border: '1px solid #333' }} />
                    <Typography sx={{ fontSize: "0.6rem", fontWeight: 800 }}>{g.l}</Typography>
                  </Box>
                ))}
              </Box>
 
              {/* 2. Talent split table */}
              <Box sx={{ bgcolor: "#002b2e", color: "#fff", p: 0.5, borderTop: "1px solid #333" }}>
                <Typography sx={{ fontSize: "0.7rem", fontWeight: 700 }}>Client's Talent split across geos</Typography>
              </Box>
              <Table size="small" sx={{ flex: 1 }}>
                <TableHead><TableRow sx={{ "& th": { bgcolor: "#002b2e", color: "#fff", fontSize: "0.65rem", p: 0.5 } }}><TableCell sx={{ border: "1px solid #333" }}>#</TableCell><TableCell sx={{ border: "1px solid #333" }}>Geography</TableCell><TableCell sx={{ border: "1px solid #333" }}>% Headcount</TableCell></TableRow></TableHead>
                <TableBody>
                  {editable.draftData.geoTalent.map((row: any, i: number) => (
                    <TableRow key={row.geo} sx={{ "& td": { fontSize: "0.65rem", p: 0.5, border: "1px solid #333" } }}>
                      <TableCell sx={{ bgcolor: "#007a83", color: "#fff", textAlign: 'center' }}>{i + 1}</TableCell>
                      <TableCell sx={{ bgcolor: "#007a83", color: "#fff" }}>{row.geo}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        {editable.isEditing ? <FormatLockedInput variant="standard" InputProps={{ disableUnderline: true }} sx={{ '& .MuiInputBase-input': { textAlign: 'center' } }} value={row.val} onChange={(e) => handleGeoChange('geoTalent', i, 'val', e.target.value)} /> : row.val}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
 
              {/* 3. Business priorities table */}
              <Box sx={{ bgcolor: "#002b2e", color: "#fff", p: 0.5, borderTop: "1px solid #333" }}>
                <Typography sx={{ fontSize: "0.7rem", fontWeight: 700 }}>Business priorities across geos</Typography>
              </Box>
              <Table size="small" sx={{ flex: 1 }}>
                <TableHead><TableRow sx={{ "& th": { bgcolor: "#002b2e", color: "#fff", fontSize: "0.65rem", p: 0.5 } }}><TableCell sx={{ border: "1px solid #333" }}>#</TableCell><TableCell sx={{ border: "1px solid #333" }}>Geography</TableCell><TableCell sx={{ border: "1px solid #333" }}>Key Priorities</TableCell></TableRow></TableHead>
                <TableBody>
                  {editable.draftData.geoPriorities.map((row: any, i: number) => (
                    <TableRow key={row.geo} sx={{ "& td": { fontSize: "0.65rem", p: 0.5, border: "1px solid #333" } }}>
                      <TableCell sx={{ bgcolor: "#007a83", color: "#fff", textAlign: 'center' }}>{i + 1}</TableCell>
                      <TableCell sx={{ bgcolor: "#007a83", color: "#fff" }}>{row.geo}</TableCell>
                      <TableCell sx={{ textAlign: 'left' }}>
                        {editable.isEditing ? <FormatLockedInput variant="standard" InputProps={{ disableUnderline: true }} value={row.val} onChange={(e) => handleGeoChange('geoPriorities', i, 'val', e.target.value)} /> : row.val}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Grid>
        </Grid>
      </PageWrapper>
    </Box>
  );
};
 
export default TechSpendView;
 