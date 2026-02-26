import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableRow,
  styled,
  Button,
  TextField,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import DownloadTemplates from "../components/DownloadTemplates";
import { useEditableTable } from "../hooks/useEditableTable";
import { useData } from "../context/DataContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const TEMPLATE_NAME = "opportunity_deep_dive";

/* ---------- THEME COLORS ---------- */
const COLORS = {
  navyHeader: '#002129',
  tealSubHeader: '#007a82',
  border: '#c4c4c4',
  textMain: '#000000',
  tealButton: '#008080',
};

/* ---------- STYLED COMPONENTS ---------- */
const SectionHeader = styled(Box)({
  backgroundColor: COLORS.navyHeader,
  color: '#ffffff',
  padding: '4px 10px',
  fontWeight: 700,
  fontSize: '0.75rem',
  border: `1px solid ${COLORS.border}`,
  textTransform: 'uppercase',
});

const TealHeaderCell = styled(TableCell)({
  backgroundColor: COLORS.tealSubHeader,
  color: '#ffffff',
  fontWeight: 700,
  fontSize: '0.65rem',
  padding: '4px 8px',
  border: `1px solid ${COLORS.border}`,
  textAlign: 'center',
  width: '100px',
});

const DataValueCell = styled(TableCell)({
  fontSize: '0.7rem',
  padding: '4px 8px',
  border: `1px solid ${COLORS.border}`,
  color: COLORS.textMain,
  verticalAlign: 'top',
  wordBreak: 'break-word',  // ✅ FIX: Forces long text to wrap instead of stretching the table
  whiteSpace: 'normal',     // ✅ FIX: Ensures text wraps naturally
});

const InputField = styled(TextField)({
  width: '100%',
  '& .MuiInputBase-input': {
    fontSize: '0.7rem',
    padding: '2px 4px',
    color: COLORS.textMain,
    lineHeight: 1.3,
  },
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    backgroundColor: '#f9f9f9',
    padding: 0,
  },
});

// --- SAFE EXTRACTOR ---
const defaultData = {
  deal_details: { opportunity_name: "", crm_id: "", deal_type: "", service_lines: "", partners: "" },
  deal_size: { tcv: "", acv: "" },
  deal_context: ["", "", ""],
  deal_team: { sponsor: "", director: "", bd: "", spoc: "", presales: "" },
  client_priorities: ["", "", ""],
  win_themes: ["", "", ""],
  competitors: [
    { name: "Competitor 1", strengths: "", weaknesses: "" },
    { name: "Competitor 2", strengths: "", weaknesses: "" },
    { name: "Competitor 3", strengths: "", weaknesses: "" }
  ],
  stakeholders: [
    { stance: "Promoter", name: "", priorities: "" },
    { stance: "Neutral", name: "", priorities: "" },
    { stance: "Detractor", name: "", priorities: "" }
  ],
  meetings: [
    { event: "INTERNAL : CEO Review", status: "Done", date: "", outcomes: "" },
    { event: "CLIENT : Workshop with key tech leads", status: "Pending", date: "", outcomes: "" },
    { event: "CLIENT : CIO walkthrough of solution", status: "Delayed", date: "", outcomes: "" }
  ]
};

const extractData = (source: any) => {
  const d = source?.data || source || {};

  const padArray = (arr: any[], min: number, emptyObj: any) => {
    const res = Array.isArray(arr) ? [...arr] : [];
    while (res.length < min) res.push({ ...emptyObj });
    return res;
  };

  const padStrArray = (arr: any[], min: number) => {
    const res = Array.isArray(arr) ? [...arr] : [];
    while (res.length < min) res.push("");
    return res;
  };

  const dt = d.deal_team || {};

  return {
    deal_details: { ...defaultData.deal_details, ...(d.deal_details || {}) },
    deal_size: { ...defaultData.deal_size, ...(d.deal_size || {}) },
    deal_context: padStrArray(d.deal_context, 3),
    deal_team: {
      sponsor: dt.sponsor || "",
      director: dt.director || "",
      bd: dt.business_development || dt.bd || "",
      spoc: dt.service_line_spoc || dt.spoc || "",
      presales: dt.presales_lead || dt.presales || ""
    },
    client_priorities: padStrArray(d.client_priorities, 3),
    win_themes: padStrArray(d.win_themes, 3),
    competitors: padArray(d.competitors, 3, { name: "", strengths: "", weaknesses: "" }),
    stakeholders: padArray(d.stakeholders, 3, { stance: "Neutral", name: "", priorities: "" }),
    meetings: padArray(d.meetings, 3, { event: "", status: "Pending", date: "", outcomes: "" }),
    id: d.id
  };
};

export default function OpportunityDeepDive() {
  const { globalData, setGlobalData } = useData();
  const userId = globalData?.user_id || localStorage.getItem("user_id") || "101";
  const companyName = globalData?.company_name || localStorage.getItem("company_name") || "";

  const rawData = extractData(globalData?.opportunity_deep_dive);
  const editable = useEditableTable(rawData);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as any });

  const dataLoadedFromDB = useRef(false);
  const autoSaveAttempted = useRef(false);

  // 1. Sync from Chatbot
  useEffect(() => {
    if (globalData?.opportunity_deep_dive && !editable.isEditing) {
      editable.updateDraft(extractData(globalData.opportunity_deep_dive));
    }
  }, [globalData?.opportunity_deep_dive]);

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
            setGlobalData((prev: any) => ({ ...prev, opportunity_deep_dive: parsed }));
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
        const rawGlobal = globalData?.opportunity_deep_dive;
        const isNew = rawGlobal && !rawGlobal.id;
        
        if (isNew && !autoSaveAttempted.current) {
          autoSaveAttempted.current = true;
          try {
            const payload = { user_id: userId, company_name: companyName, data: rawData };
            const res = await fetch(`${API_BASE_URL}/template-payload/${TEMPLATE_NAME}/`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (res.ok && result.success) {
              setGlobalData((prev: any) => ({ ...prev, opportunity_deep_dive: extractData(result.data) }));
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
  }, [rawData, userId, companyName, setGlobalData]);

  // 4. Manual Save
  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        user_id: userId,
        company_name: companyName,
        data: editable.draftData
      };
      const res = await fetch(`${API_BASE_URL}/template-payload/${TEMPLATE_NAME}/`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setGlobalData((prev: any) => ({ ...prev, opportunity_deep_dive: extractData(result.data) }));
        editable.saveEdit(() => {});
        setSnackbar({ open: true, message: "✅ Saved successfully", severity: "success" });
      } else throw new Error("Save failed");
    } catch (e) {
      setSnackbar({ open: true, message: "❌ Save failed", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  /* ----- STATE UPDATE HANDLERS ----- */
  const updateDeep = (section: string, field: string, val: string) => {
    editable.updateDraft({
      ...editable.draftData,
      [section]: { ...editable.draftData[section as keyof typeof editable.draftData], [field]: val }
    });
  };

  const updateArray = (section: string, index: number, val: string) => {
    const arr = [...editable.draftData[section as keyof typeof editable.draftData] as string[]];
    arr[index] = val;
    editable.updateDraft({ ...editable.draftData, [section]: arr });
  };

  const updateObjectArray = (section: string, index: number, field: string, val: string) => {
    const arr = [...editable.draftData[section as keyof typeof editable.draftData] as any[]];
    arr[index] = { ...arr[index], [field]: val };
    editable.updateDraft({ ...editable.draftData, [section]: arr });
  };

  const d = editable.draftData; 

  if (initialLoading) return <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 2, bgcolor: '#ffffff', minHeight: '100vh' }}>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2 }}>
        <DownloadTemplates templateName="Opportunity Deep Dive" />
        {!editable.isEditing ? (
          <Button variant="outlined" onClick={editable.startEdit} sx={{ borderColor: COLORS.tealButton, color: COLORS.tealButton, ml: 2 }}>Edit</Button>
        ) : (
          <>
            <Button variant="contained" onClick={handleSave} disabled={loading} sx={{ backgroundColor: COLORS.tealButton, ml: 2, color: "#fff" }}>
              {loading ? <CircularProgress size={24} color="inherit"/> : "Save"}
            </Button>
            <Button variant="outlined" onClick={editable.cancelEdit} sx={{ borderColor: COLORS.tealButton, color: COLORS.tealButton, ml: 2 }}>Cancel</Button>
          </>
        )}
      </Box>

      <Box id="template-to-download">
        <Typography sx={{ mb: 1, fontSize: '1.1rem', fontWeight: 700, color: '#00b3b8' }}>
          Deep Dive: {d.deal_details?.opportunity_name || "OPPORTUNITY NAME"}
        </Typography>

        {/* ================= DEAL DETAILS ================= */}
        <Box sx={{ mb: 1 }}>
          <SectionHeader>Deal Details</SectionHeader>
          <Table size="small" sx={{ tableLayout: 'fixed', borderCollapse: 'collapse' }}>
            <TableBody>
              <TableRow>
                {['Opportunity Name', 'CRM ID', 'Deal Type', 'Key Service Lines involved', 'Key Partners to engage'].map(h => <TealHeaderCell key={h}>{h}</TealHeaderCell>)}
              </TableRow>
              <TableRow>
                {['opportunity_name', 'crm_id', 'deal_type', 'service_lines', 'partners'].map((key) => (
                  <DataValueCell key={key}>
                    {/* ✅ FIX: Added multiline so long text wraps beautifully */}
                    {editable.isEditing ? <InputField multiline value={(d.deal_details as any)[key]} onChange={(e) => updateDeep('deal_details', key, e.target.value)} /> : (d.deal_details as any)[key]}
                  </DataValueCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </Box>

        {/* ================= ROW 1: SIZE & CONTEXT vs TEAM & PRIORITIES ================= */}
        <Box sx={{ display: 'flex', gap: '8px', mb: 1 }}>
          <Box sx={{ width: '25%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <SectionHeader>Deal Size</SectionHeader>
              {/* ✅ FIX: Changed height: 25 to minHeight: 28, and allowed wrapping if values are huge */}
              <Box sx={{ display: 'flex', border: `1px solid ${COLORS.border}`, borderTop: 'none', minHeight: 28, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, px: 1, py: 0.5, display: 'flex', alignItems: 'center', borderRight: `1px solid ${COLORS.border}` }}>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', width: '100%', flexWrap: 'wrap' }}>
                    <span style={{ marginRight: '4px' }}>TCV ($ Mn) -</span>
                    {editable.isEditing ? <InputField sx={{ flex: 1, minWidth: 40 }} value={d.deal_size.tcv} onChange={(e) => updateDeep('deal_size', 'tcv', e.target.value)} /> : <span>{d.deal_size.tcv}</span>}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, px: 1, py: 0.5, display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', width: '100%', flexWrap: 'wrap' }}>
                    <span style={{ marginRight: '4px' }}>ACV ($ Mn) -</span>
                    {editable.isEditing ? <InputField sx={{ flex: 1, minWidth: 40 }} value={d.deal_size.acv} onChange={(e) => updateDeep('deal_size', 'acv', e.target.value)} /> : <span>{d.deal_size.acv}</span>}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <SectionHeader>Deal Context</SectionHeader>
              {/* ✅ FIX: Changed height: 100 to minHeight: 100 and removed overflow: 'auto' so it stretches */}
              <Box sx={{ border: `1px solid ${COLORS.border}`, borderTop: 'none', minHeight: 100, flex: 1, p: 1 }}>
                {d.deal_context.map((line: string, i: number) => (
                  <Box key={i} sx={{display: 'flex', mb: 0.5}}>
                    <Typography sx={{fontSize: '0.7rem', mr: 0.5}}>•</Typography>
                    {/* ✅ FIX: Added multiline so text grows downwards instead of sideways */}
                    {editable.isEditing ? 
                      <InputField multiline value={line} onChange={(e) => updateArray('deal_context', i, e.target.value)} /> : 
                      <Typography sx={{ fontSize: '0.7rem' }}>{line}</Typography>
                    }
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>

          <Box sx={{ width: '75%', display: 'flex', flexDirection: 'column' }}>
            <SectionHeader>Deal Team</SectionHeader>
            <Table size="small" sx={{ tableLayout: 'fixed', borderCollapse: 'collapse', border: `1px solid ${COLORS.border}`, borderTop: 'none' }}>
              <TableBody>
                <TableRow>
                  {['Deal Sponsor', 'Deal Director', 'Business Development', 'Service Line SPOC', 'Pre-sales Lead'].map(h => <TealHeaderCell key={h}>{h}</TealHeaderCell>)}
                </TableRow>
                <TableRow>
                  {['sponsor', 'director', 'bd', 'spoc', 'presales'].map((key) => (
                    <DataValueCell key={key}>
                      {editable.isEditing ? <InputField multiline value={(d.deal_team as any)[key]} onChange={(e) => updateDeep('deal_team', key, e.target.value)} /> : (d.deal_team as any)[key]}
                    </DataValueCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>

            <Box sx={{ display: 'flex', gap: '8px', mt: 1, flex: 1 }}>
              <Box sx={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
                <SectionHeader>Business priorities of the client</SectionHeader>
                {/* ✅ FIX: Changed height: 75 to minHeight: 75 and removed overflow: auto */}
                <Box sx={{ border: `1px solid ${COLORS.border}`, borderTop: 'none', minHeight: 75, flex: 1, p: 1 }}>
                  {d.client_priorities.map((line: string, i: number) => (
                    <Box key={i} sx={{display: 'flex', mb: 0.5}}>
                      <Typography sx={{fontSize: '0.7rem', mr: 0.5}}>•</Typography>
                      {editable.isEditing ? <InputField multiline value={line} onChange={(e) => updateArray('client_priorities', i, e.target.value)} /> : <Typography sx={{ fontSize: '0.7rem' }}>{line}</Typography>}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box sx={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
                <SectionHeader>Win themes for the deal</SectionHeader>
                {/* ✅ FIX: Changed height: 75 to minHeight: 75 and removed overflow: auto */}
                <Box sx={{ border: `1px solid ${COLORS.border}`, borderTop: 'none', minHeight: 75, flex: 1, p: 1 }}>
                  {d.win_themes.map((line: string, i: number) => (
                    <Box key={i} sx={{display: 'flex', mb: 0.5}}>
                      <Typography sx={{fontSize: '0.7rem', mr: 0.5}}>•</Typography>
                      {editable.isEditing ? <InputField multiline value={line} onChange={(e) => updateArray('win_themes', i, e.target.value)} /> : <Typography sx={{ fontSize: '0.7rem' }}>{line}</Typography>}
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* ================= ROW 3: COMPETITORS & STAKEHOLDERS ================= */}
        <Box sx={{ display: 'flex', gap: '8px', mb: 1 }}>
          <Box sx={{ width: '64%' }}>
            <SectionHeader>Competitor intel</SectionHeader>
            <Table size="small" sx={{ tableLayout: 'fixed', borderCollapse: 'collapse', border: `1px solid ${COLORS.border}`, borderTop: 'none' }}>
              <TableBody>
                <TableRow>
                  <TealHeaderCell sx={{ width: '30%' }}>Competitor Name</TealHeaderCell>
                  <TealHeaderCell>Competitor strengths and weaknesses</TealHeaderCell>
                </TableRow>
                {/* ✅ FIX: Removed fixed height: 40px so rows can grow natively */}
                {d.competitors.map((c: any, i: number) => (
                  <TableRow key={i}>
                    <DataValueCell sx={{ fontWeight: 700 }}>
                      {editable.isEditing ? <InputField multiline value={c.name} onChange={(e) => updateObjectArray('competitors', i, 'name', e.target.value)} /> : c.name}
                    </DataValueCell>
                    <DataValueCell>
                      <Box>
                        <Box sx={{display: 'flex', mb: 0.5 }}>
                          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, mr: 1, width: 80, flexShrink: 0 }}>Strengths:</Typography>
                          {editable.isEditing ? <InputField multiline value={c.strengths} onChange={(e) => updateObjectArray('competitors', i, 'strengths', e.target.value)} /> : <Typography sx={{fontSize: '0.7rem'}}>{c.strengths}</Typography>}
                        </Box>
                        <Box sx={{display: 'flex'}}>
                          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, mr: 1, width: 80, flexShrink: 0 }}>Weaknesses:</Typography>
                          {editable.isEditing ? <InputField multiline value={c.weaknesses} onChange={(e) => updateObjectArray('competitors', i, 'weaknesses', e.target.value)} /> : <Typography sx={{fontSize: '0.7rem'}}>{c.weaknesses}</Typography>}
                        </Box>
                      </Box>
                    </DataValueCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          <Box sx={{ width: '37.5%' }}>
            <Table size="small" sx={{ tableLayout: 'fixed', borderCollapse: 'collapse', border: `1px solid ${COLORS.border}`, borderTop: 'none' }}>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ backgroundColor: '#000', color: '#fff', fontWeight: 700, fontSize: '0.7rem', border: `1px solid ${COLORS.border}`, padding: '4px 8px' }}>Key client stakeholders</TableCell>
                  <TableCell sx={{ backgroundColor: '#000', color: '#fff', fontWeight: 700, fontSize: '0.7rem', textAlign: 'center', border: `1px solid ${COLORS.border}`, padding: '4px 8px' }}>Stance<br />Towards client</TableCell>
                  <TableCell sx={{ backgroundColor: '#000', color: '#fff', fontWeight: 700, fontSize: '0.7rem', border: `1px solid ${COLORS.border}`, padding: '4px 8px' }}>Top priorities</TableCell>
                </TableRow>
                {/* ✅ FIX: Removed fixed height: 47px so rows can grow natively */}
                {d.stakeholders.map((s: any, i: number) => (
                  <TableRow key={i}>
                    <DataValueCell>
                      {editable.isEditing ? <InputField multiline value={s.name} placeholder="Name, Role" onChange={(e) => updateObjectArray('stakeholders', i, 'name', e.target.value)} /> : (s.name || "<Name, Designation>")}
                    </DataValueCell>
                    <TableCell sx={{ backgroundColor: s.stance === 'Promoter' ? '#92D050' : s.stance === 'Neutral' ? '#FFC000' : '#E85C70', fontWeight: 700, textAlign: 'center', border: `1px solid ${COLORS.border}`, verticalAlign: 'middle', fontSize: '0.7rem' }}>
                      {s.stance}
                    </TableCell>
                    <DataValueCell>
                      <Box sx={{display: 'flex'}}>
                        <Typography sx={{mr: 0.5}}>•</Typography>
                        {editable.isEditing ? <InputField multiline value={s.priorities} onChange={(e) => updateObjectArray('stakeholders', i, 'priorities', e.target.value)} /> : <Typography sx={{fontSize: '0.7rem'}}>{s.priorities}</Typography>}
                      </Box>
                    </DataValueCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Box>

        {/* ================= MEETINGS ================= */}
        <Box>
          <Table size="small" sx={{ tableLayout: 'fixed', borderCollapse: 'collapse', border: `1px solid ${COLORS.border}`, borderTop: 'none' }}>
            <TableBody>
              <TableRow>
                <TableCell sx={{ backgroundColor: '#000000', color: '#ffffff', fontWeight: 700, fontSize: '0.75rem', padding: '4px 10px', border: `1px solid ${COLORS.border}`, textTransform: 'uppercase' }}>Key upcoming meetings / milestones</TableCell>
                <TableCell sx={{ backgroundColor: '#000000', color: '#ffffff', textAlign: 'center', width: '100px', fontWeight: 700, fontSize: '0.75rem', border: `1px solid ${COLORS.border}` }}>Status</TableCell>
                <TableCell sx={{ backgroundColor: '#000000', color: '#ffffff', width: '150px', fontWeight: 700, fontSize: '0.75rem', border: `1px solid ${COLORS.border}` }}>Date</TableCell>
                <TableCell sx={{ backgroundColor: '#000000', color: '#ffffff', fontWeight: 700, fontSize: '0.75rem', border: `1px solid ${COLORS.border}` }}>Target outcomes</TableCell>
              </TableRow>
              {/* ✅ FIX: Removed fixed height: 30px so rows can grow natively */}
              {d.meetings.map((m: any, i: number) => (
                <TableRow key={i}>
                  <DataValueCell sx={{ fontWeight: 700 }}>
                    {editable.isEditing ? <InputField multiline value={m.event} onChange={(e) => updateObjectArray('meetings', i, 'event', e.target.value)} /> : m.event}
                  </DataValueCell>
                  <TableCell sx={{ backgroundColor: m.status === 'Done' ? '#92D050' : m.status === 'Pending' ? '#FFC000' : '#E85C70', fontWeight: 700, textAlign: 'center', fontSize: '0.7rem', border: `1px solid ${COLORS.border}`, padding: 0 }}>
                    {editable.isEditing ? <InputField sx={{textAlign: 'center'}} value={m.status} onChange={(e) => updateObjectArray('meetings', i, 'status', e.target.value)} /> : m.status}
                  </TableCell>
                  <DataValueCell>
                    {editable.isEditing ? <InputField value={m.date} onChange={(e) => updateObjectArray('meetings', i, 'date', e.target.value)} /> : m.date}
                  </DataValueCell>
                  <DataValueCell>
                    <Box sx={{display: 'flex'}}>
                        <Typography sx={{mr: 0.5}}>•</Typography>
                        {editable.isEditing ? <InputField multiline value={m.outcomes} onChange={(e) => updateObjectArray('meetings', i, 'outcomes', e.target.value)} /> : <Typography sx={{fontSize: '0.7rem'}}>{m.outcomes}</Typography>}
                    </Box>
                  </DataValueCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Box>
    </Box>
  );
}