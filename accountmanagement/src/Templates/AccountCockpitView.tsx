import React from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  styled,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
} from "@mui/material";
import { useData } from "../context/DataContext";
import { useEditableTable } from "../hooks/useEditableTable";
import DownloadTemplates from "../components/DownloadTemplates";
 
// --- STYLED COMPONENTS ---
 
const CockpitCard = styled(Paper)(({ theme }) => ({
  height: "100%",
  padding: theme.spacing(1),
  border: "1px solid #d1d1d1",
  borderRadius: 0,
  boxShadow: "none",
  backgroundColor: "#fff",
}));
 
const CardHeader = styled(Box)<{ bgcolor?: string }>(({ bgcolor }) => ({
  backgroundColor: bgcolor || "#009A44",
  color: "#fff",
  padding: "4px 8px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "8px",
}));
 
const TargetPill = styled(Box)({
  border: "1px solid #777",
  borderRadius: "12px",
  padding: "2px 10px",
  fontSize: "0.65rem",
  color: "#555",
  minWidth: "40px",
  textAlign: "center",
});
 
const LabelSmall = styled(Typography)({
  fontSize: "0.65rem",
  fontWeight: 700,
  fontStyle: "italic",
  color: "#333",
});
 
// Gray Inset Input for the "sunken" edit look
const GrayInsetInput = styled(TextField)({
  width: 'auto',   // ✅ not full width
  minWidth: 40,
  '& .MuiInputBase-input': {
    fontSize: "0.55rem",
    padding: "2px",
    color: "#000",
    fontWeight: 500,
    textAlign: "center"
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
  }
});
 
 
// Constants for functionality
const TEMPLATE_NAME = "Account_Cockpit";
 
// --- SUB-COMPONENTS ---
 
const PerformanceBlock = ({ title, color, data, setData, qoqData, editable }: any) => {
  const [editIndex, setEditIndex] = React.useState<number | null>(null);
  const maxValue = Math.max(...data.map((d: any) => d.v));
 
  const handleChange = (index: number, value: string) => {
    const newData = [...data];
    newData[index].v = Number(value);
    setData(newData);
  };
 
  return (
    <CockpitCard>
      <CardHeader bgcolor={color}>
        <Typography variant="caption" fontWeight={700}>{title}</Typography>
      </CardHeader>
 
      <Box sx={{ px: 0.5 }}>
        <LabelSmall sx={{ mb: 1 }}>YoY, € Mn</LabelSmall>
 
        <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 80, mb: 2, borderBottom: '1px solid #ccc' }}>
          {data.map((d: any, i: number) => {
            const heightPercent = (d.v / maxValue) * 60;
 
            return (
              <Box key={i} sx={{ textAlign: 'center', width: '25%' }}>
                {editable && editIndex === i ? (
                  <GrayInsetInput
                    type="number"
                    size="small"
                    value={d.v}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onBlur={() => setEditIndex(null)}
                  />
                ) : (
                  <Typography
                    sx={{ fontSize: '0.6rem', cursor: editable ? "pointer" : "default" }}
                    onClick={() => editable && setEditIndex(i)}
                  >
                    {d.v}
                  </Typography>
                )}
 
                <Box
                  sx={{
                    height: `${heightPercent}px`,
                    bgcolor: '#b2b2b2',
                    mx: 'auto',
                    width: '70%',
                    transition: "0.3s"
                  }}
                />
 
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700 }}>{d.y}</Typography>
              </Box>
            );
          })}
        </Box>
 
        <LabelSmall sx={{ mb: 1 }}>QoQ, € Mn</LabelSmall>
        <Stack spacing={0.5}>
          {qoqData.map((q: any) => (
            <Box key={q.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: '0.6rem', width: 45 }}>{q.label}</Typography>
              <Box sx={{ flex: 1, height: 12, bgcolor: '#eee' }}>
                <Box sx={{ width: `${q.percent}%`, height: '100%', bgcolor: '#e85c00' }} />
              </Box>
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 700 }}>{q.val}</Typography>
              <TargetPill sx={{ fontSize: '0.55rem' }}>€ xx Mn</TargetPill>
            </Box>
          ))}
        </Stack>
      </Box>
    </CockpitCard>
  );
};
 
const LargeDealsBlock = ({ data, setData, editable }: any) => {
  const [editIndex, setEditIndex] = React.useState<number | null>(null);
  const maxValue = Math.max(...data.map((d: any) => d.v));
 
  const handleChange = (index: number, value: string) => {
    const newData = [...data];
    newData[index].v = Number(value);
    setData(newData);
  };
 
  return (
    <CockpitCard>
      <CardHeader bgcolor="#c00000">
        <Typography variant="caption" fontWeight={700}>Large Deals</Typography>
      </CardHeader>
 
      <LabelSmall>TCV of LD wins, € Mn</LabelSmall>
 
      <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around", height: 80, mt: 1, mb: 2 }}>
        {data.map((d: any, i: number) => {
          const height = (d.v / maxValue) * 60;
 
          return (
            <Box key={i} sx={{ textAlign: "center", width: "22%" }}>
              {editable && editIndex === i ? (
                <GrayInsetInput
                  type="number"
                  size="small"
                  value={d.v}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onBlur={() => setEditIndex(null)}
                />
              ) : (
                <Typography
                  sx={{ fontSize: "0.65rem", cursor: editable ? "pointer" : "default" }}
                  onClick={() => editable && setEditIndex(i)}
                >
                  {d.v}
                </Typography>
              )}
 
              <Box
                sx={{
                  height: `${height}px`,
                  bgcolor: "#0b2b2e",
                  mx: "auto",
                  width: "70%",
                  transition: "0.3s"
                }}
              />
 
              <Typography sx={{ fontSize: "0.55rem", fontWeight: 700 }}>
                {d.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
 
      <LabelSmall># of LD wins</LabelSmall>
      <Box sx={{ display: "flex", gap: 0.5, mt: 0.5 }}>
        {[1, 2, 3, 4].map(i => (
          <TargetPill key={i} sx={{ flex: 1 }}>xx</TargetPill>
        ))}
      </Box>
    </CockpitCard>
  );
};
 
 
const AccountCockpitView: React.FC = () => {
  const { globalData, setGlobalData } = useData();
  const cockpitData = globalData?.Account_Cockpit || {};
  const editable = useEditableTable(cockpitData);
 
  const [revenueYoyData, setRevenueYoyData] = React.useState([
  { y: "FY24", v: 15 },
  { y: "FY25", v: 22 },
  { y: "FY26", v: 24 },
]);
 
const [bookingYoyData, setBookingYoyData] = React.useState([
  { y: "FY24", v: 15 },
  { y: "FY25", v: 22 },
  { y: "FY26", v: 24 },
]);
 
// ✅ ADD THIS
const [marginYoyData, setMarginYoyData] = React.useState([
  { y: "FY24", v: 10 },
  { y: "FY25", v: 14 },
  { y: "FY26", v: 18 },
]);
 
const [largeDealsData, setLargeDealsData] = React.useState([
  { label: "FY24", v: 28 },
  { label: "FY25", v: 30 },
  { label: "FY26", v: 45 },
  { label: "FY27", v: 50 },
]);
 
 
 
  const [slPenetrationData, setSlPenetrationData] = React.useState([
  { label: 'FY25 Q1', val: 13 },
  { label: 'FY25 Q2', val: 15 },
  { label: 'FY25 Q3', val: 20 },
  { label: 'FY25 Q4', val: 24 },
  { label: 'FY26 Q1', val: 25 },
  { label: 'FY26 Q2', val: 30 },
  { label: 'FY26 Q3', val: 32 },
  { label: 'FY26 Q4', val: 32 },
]);
 
  const mockQoq = [
  { label: 'FY25 Q1', percent: 40, val: 13 },
  { label: 'FY25 Q2', percent: 45, val: 15 },
  { label: 'FY25 Q3', percent: 60, val: 20 },
  { label: 'FY25 Q4', percent: 70, val: 24 },
  { label: 'FY26 Q1', percent: 75, val: 25 },
  { label: 'FY26 Q2', percent: 85, val: 30 },
  { label: 'FY26 Q3', percent: 90, val: 32 },
  { label: 'FY26 Q4', percent: 90, val: 32 },
];
 
 
const [editSlIndex, setEditSlIndex] = React.useState<number | null>(null);
 
const handleSlChange = (index: number, value: string) => {
  const newData = [...slPenetrationData];
  newData[index].val = Number(value);
  setSlPenetrationData(newData);
};
 
 
  const handleTableChange = (index: number, field: string, value: string) => {
    const currentPartners = [...(editable.draftData.partners || [{},{},{},{},{}])];
    currentPartners[index] = { ...currentPartners[index], [field]: value };
    editable.updateDraft({ ...editable.draftData, partners: currentPartners });
  };
 
  return (
    <Box sx={{ bgcolor: "#f4f6f8", p: 1, minHeight: "100vh" }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2, px: 2 }}>
        <DownloadTemplates templateName={TEMPLATE_NAME} />
        {!editable.isEditing ? (
          <Button variant="outlined" onClick={editable.startEdit} sx={{ borderColor: "#00a99d", color: "#00a99d", ml: 2 }}>
            Edit
          </Button>
        ) : (
          <>
            <Button
              variant="contained"
              onClick={() => editable.saveEdit((updated) => setGlobalData((prev: any) => ({ ...prev, Account_Cockpit: updated })))}
              sx={{ backgroundColor: "#00a99d", ml: 2, color: "#fff" }}
            >
              Save
            </Button>
            <Button variant="outlined" onClick={editable.cancelEdit} sx={{ borderColor: "#00a99d", color: "#00a99d", ml: 2 }}>
              Cancel
            </Button>
          </>
        )}
      </Box>
 
      <Box id="template-to-download" sx={{ p: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#00a99d" }}>Account Cockpit View</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {['Above target', 'Meeting target', 'Below target'].map((t, i) => (
              <Box key={t} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 12, height: 12, bgcolor: i === 0 ? '#92d050' : i === 1 ? '#ffc000' : '#c00000' }} />
                <Typography variant="caption" sx={{ color: 'black', fontWeight: 500 }}>{t}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
 
        <Grid container spacing={1}>
          <Grid item xs={12} md={2.4}>
            <PerformanceBlock
  title="Revenue Performance"
  color="#92d050"
  data={revenueYoyData}
  setData={setRevenueYoyData}
  qoqData={mockQoq}
  editable={editable.isEditing}
/>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <PerformanceBlock
  title="Booking Performance"
  color="#ffc000"
  data={bookingYoyData}
  setData={setBookingYoyData}
  qoqData={mockQoq}
  editable={editable.isEditing}
/>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <PerformanceBlock
  title="Margin Performance"
  color="#92d050"
  data={marginYoyData}
  setData={setMarginYoyData}
  qoqData={mockQoq}
  editable={editable.isEditing}
/>
 
          </Grid>
 
          <Grid item xs={12} md={2.4}>
            <Stack spacing={1}>
              <LargeDealsBlock
  data={largeDealsData}
  setData={setLargeDealsData}
  editable={editable.isEditing}
/>
 
 
              <CockpitCard>
                <CardHeader bgcolor="#c00000"><Typography variant="caption" fontWeight={700}>Presence across Service Lines</Typography></CardHeader>
                <Grid container spacing={0.5}>
                  {['Data & Cloud', 'DATS', 'Infra', 'ERP'].map(s => (
                    <Grid item xs={6} key={s} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 14, height: 14, border: '1px solid #000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px' }}>✓</Box>
                      <Typography sx={{ fontSize: '0.6rem' }}>{s}</Typography>
                    </Grid>
                  ))}
                </Grid>
              </CockpitCard>
 
              <CockpitCard>
  <CardHeader bgcolor="#92d050">
    <Typography variant="caption" fontWeight={700}>SL Penetration</Typography>
  </CardHeader>
 
  <LabelSmall>% SL revenue, QoQ, %</LabelSmall>
 
  <Stack spacing={0.6} sx={{ mt: 1 }}>
    {slPenetrationData.map((q, i) => {
      const maxValue = Math.max(...slPenetrationData.map(d => d.val));
      const widthPercent = (q.val / maxValue) * 100;
 
      return (
        <Box key={q.label}>
 
          {/* Row 1: Label + Value/Input */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 0.2
            }}
          >
            <Typography sx={{ fontSize: "0.55rem" }}>
              {q.label}
            </Typography>
 
            {editable.isEditing && editSlIndex === i ? (
              <GrayInsetInput
                type="number"
                value={q.val}
                onChange={(e) => handleSlChange(i, e.target.value)}
                onBlur={() => setEditSlIndex(null)}
                sx={{
                  width: 40,            // ✅ fixed width
                  flexShrink: 0,        // ✅ prevents shrinking bar
                  height: 18,
                  '& input': {
                    fontSize: '0.55rem',
                    padding: '2px',
                    textAlign: 'center'
                  }
                }}
              />
            ) : (
              <Typography
                sx={{
                  fontSize: "0.55rem",
                  cursor: editable.isEditing ? "pointer" : "default"
                }}
                onClick={() => editable.isEditing && setEditSlIndex(i)}
              >
                {q.val}
              </Typography>
            )}
          </Box>
 
          {/* Row 2: Bar */}
          <Box sx={{ width: "100%", height: 8, bgcolor: "#eee" }}>
            <Box
              sx={{
                width: `${widthPercent}%`,
                height: "100%",
                bgcolor: "#e85c00",
                transition: "0.3s"
              }}
            />
          </Box>
 
        </Box>
      );
    })}
  </Stack>
</CockpitCard>
 
 
            </Stack>
          </Grid>
 
          <Grid item xs={12} md={2.4}>
            <Stack spacing={1}>
              <CockpitCard>
                <CardHeader bgcolor="#92d050"><Typography variant="caption" fontWeight={700}>Partnership Revenue</Typography></CardHeader>
                <TableContainer sx={{ maxHeight: 150 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { fontSize: '0.55rem', p: 0.2, fontWeight: 700 } }}>
                        <TableCell>Partner</TableCell>
                        <TableCell>FY25 revenue</TableCell>
                        <TableCell>FY26 Target</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[0, 1, 2, 3, 4].map(i => {
                        const partnerRow = editable.draftData.partners?.[i] || {};
                        return (
                          <TableRow key={i} sx={{ '& td': { fontSize: '0.55rem', p: 0.2 } }}>
                            <TableCell>
                              {editable.isEditing ? (
                                <GrayInsetInput size="small" variant="outlined" value={partnerRow.name || ""} onChange={(e) => handleTableChange(i, "name", e.target.value)} />
                              ) : (partnerRow.name || "...")}
                            </TableCell>
                            <TableCell>
                              {editable.isEditing ? (
                                <GrayInsetInput size="small" variant="outlined" value={partnerRow.revenue || ""} onChange={(e) => handleTableChange(i, "revenue", e.target.value)} />
                              ) : (partnerRow.revenue || "€Mn")}
                            </TableCell>
                            <TableCell>
                              {editable.isEditing ? (
                                <GrayInsetInput size="small" variant="outlined" value={partnerRow.target || ""} onChange={(e) => handleTableChange(i, "target", e.target.value)} />
                              ) : (
                                <TargetPill sx={{ p: 0, fontSize: '0.5rem' }}>{partnerRow.target || "€Mn"}</TargetPill>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CockpitCard>
 
              <CockpitCard>
                <CardHeader bgcolor="#ffc000"><Typography variant="caption" fontWeight={700}>Revenue across Geos</Typography></CardHeader>
                <LabelSmall>YTD FY25, € Mn</LabelSmall>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 60, mt: 1 }}>
                  {[{l: 'Americas', v: 150, h: '100%'}, {l: 'EMEA', v: 120, h: '80%'}, {l: 'APAC', v: 90, h: '60%'}, {l: 'Others', v: 40, h: '30%'}].map(g => (
                    <Box key={g.l} sx={{ textAlign: 'center', width: '22%' }}>
                      <Typography sx={{ fontSize: '0.6rem' }}>{g.v}</Typography>
                      <Box sx={{ height: g.h, bgcolor: '#0b2b2e', mx: 'auto', width: '80%' }} />
                      <Typography sx={{ fontSize: '0.5rem' }}>{g.l}</Typography>
                    </Box>
                  ))}
                </Box>
              </CockpitCard>
 
              <CockpitCard>
                <CardHeader bgcolor="#92d050"><Typography variant="caption" fontWeight={700}>CSAT Trajectory</Typography></CardHeader>
                <LabelSmall>Quarterly</LabelSmall>
                <Box sx={{ height: 60, position: 'relative', mt: 1, borderLeft: '1px solid #ccc', borderBottom: '1px solid #ccc' }}>
                  <svg width="100%" height="100%" style={{ position: 'absolute' }}>
                    <polyline points="0,40 40,40 80,40 120,40" fill="none" stroke="#0b2b2e" strokeWidth="1" />
                    {[0, 40, 80, 120].map(x => <circle key={x} cx={x} cy="40" r="3" fill="#0b2b2e" />)}
                  </svg>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 6 }}>
                    {['H1 FY24', 'H2 FY24', 'H1 FY25', 'H2 FY25'].map(t => <Typography key={t} sx={{ fontSize: '0.5rem' }}>{t}</Typography>)}
                  </Box>
                </Box>
              </CockpitCard>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};
 
export default AccountCockpitView;
 
 