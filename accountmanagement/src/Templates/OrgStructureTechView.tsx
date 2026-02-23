import React, { useEffect, useState, useRef } from "react";
import {
  Box, Button, Typography, styled, TextField, Divider, MenuItem,
  CircularProgress, Snackbar, Alert
} from "@mui/material";
import DownloadTemplates from "../components/DownloadTemplates";
import { useEditableTable } from "../hooks/useEditableTable";
import { useData } from "../context/DataContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const TEMPLATE_NAME = "org_structure_tech_view";

// --- STYLED COMPONENTS ---
const PRIMARY_TEAL = "#008080";
const DARK_BG = "#0b1e26";
const COLOR_GREEN = "#90c978";
const COLOR_ORANGE = "#e6a935";
const COLOR_PINK = "#e66c7d";

const NodeBox = styled(Box, { shouldForwardProp: (prop) => prop !== "bgColor" })<{ bgColor?: string }>(({ bgColor }) => ({
  backgroundColor: bgColor || DARK_BG,
  color: "#fff",
  padding: "10px 5px",
  textAlign: "center",
  width: "190px",
  minHeight: "80px",
  fontSize: "0.75rem",
  fontWeight: 500,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  boxShadow: "0px 3px 6px rgba(0,0,0,0.1)",
}));

const StyledInput = styled(TextField)({
  "& .MuiInputBase-input": {
    fontSize: "0.75rem", padding: "4px", textAlign: "center", color: "#000", backgroundColor: "#fff", borderRadius: 4, marginBottom: 4
  },
});

const ConnectorLine = styled(Box)(() => ({
  width: "2px", height: "30px", backgroundColor: "#ccc", margin: "0 auto",
}));

const HorizontalLine = styled(Box)(() => ({
  height: "2px", backgroundColor: "#ccc", margin: "0 auto",
}));

// --- SAFE EXTRACTOR ---
const defaultData = {
  group_ceo: { name: "", role: "Group CEO" },
  cdio: { name: "", role: "CDIO" },
  key_functions: [
    { function: "Function 1", leader_name: "", leader_role: "", presence_type: "Green" },
    { function: "Function 2", leader_name: "", leader_role: "", presence_type: "Orange" },
    { function: "Function 3", leader_name: "", leader_role: "", presence_type: "Pink" },
    { function: "Function 4", leader_name: "", leader_role: "", presence_type: "Green" }
  ]
};

const extractData = (source: any) => {
  const data = source?.data || source || {};
  const safeObj = (obj: any, def: any) => (obj && typeof obj === 'object' ? { ...def, ...obj } : def);
  
  return {
    group_ceo: safeObj(data.group_ceo, defaultData.group_ceo),
    cdio: safeObj(data.cdio, defaultData.cdio),
    key_functions: Array.isArray(data.key_functions) && data.key_functions.length > 0 
      ? data.key_functions 
      : defaultData.key_functions,
    id: data.id
  };
};

const getColorFromType = (type: string) => {
  const t = (type || "").toLowerCase();
  if (t.includes("green") || t.includes("deep")) return COLOR_GREEN;
  if (t.includes("orange") || t.includes("focus")) return COLOR_ORANGE;
  if (t.includes("pink") || t.includes("not")) return COLOR_PINK;
  return DARK_BG; // Default
};


export default function OrgStructureTechView() {
  const { globalData, setGlobalData } = useData();
  const rawData = extractData(globalData?.org_structure_tech_view);
  const editable = useEditableTable(rawData);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as any });

  const dataLoadedFromDB = useRef(false);
  const autoSaveAttempted = useRef(false);
  const userId = globalData?.user_id || localStorage.getItem("user_id") || "101";

  // 1. Sync from Chatbot
  useEffect(() => {
    if (globalData?.org_structure_tech_view && !editable.isEditing) {
      editable.updateDraft(extractData(globalData.org_structure_tech_view));
    }
  }, [globalData?.org_structure_tech_view]);

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
            setGlobalData((prev: any) => ({ ...prev, org_structure_tech_view: parsed }));
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
              setGlobalData((prev: any) => ({ ...prev, org_structure_tech_view: extractData(result.data) }));
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
        setGlobalData((prev: any) => ({ ...prev, org_structure_tech_view: extractData(result.data) }));
        editable.saveEdit(() => {});
        setSnackbar({ open: true, message: "✅ Saved successfully", severity: "success" });
      } else throw new Error("Save failed");
    } catch (e) {
      setSnackbar({ open: true, message: "❌ Save failed", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const updateNode = (field: "group_ceo" | "cdio", subfield: string, value: string) => {
    editable.updateDraft({
      ...editable.draftData,
      [field]: { ...editable.draftData[field], [subfield]: value }
    });
  };

  const updateFunction = (index: number, subfield: string, value: string) => {
    const arr = [...editable.draftData.key_functions];
    arr[index] = { ...arr[index], [subfield]: value };
    editable.updateDraft({ ...editable.draftData, key_functions: arr });
  };

  const addFunction = () => {
    editable.updateDraft({
      ...editable.draftData,
      key_functions: [...editable.draftData.key_functions, { function: "New Function", leader_name: "", leader_role: "", presence_type: "Green" }]
    });
  };

  if (initialLoading) return <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "#fff", p: 2 }}>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>

      <Box sx={{ maxWidth: 1200, mx: "auto", px: 4, py: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mb: 2 }}>
          <DownloadTemplates templateName={TEMPLATE_NAME} />
          {!editable.isEditing ? (
            <Button variant="outlined" onClick={editable.startEdit} disabled={loading} sx={{ borderColor: PRIMARY_TEAL, color: PRIMARY_TEAL, ml: 2 }}>Edit</Button>
          ) : (
            <>
              <Button variant="contained" onClick={handleSave} disabled={loading} sx={{ backgroundColor: PRIMARY_TEAL, ml: 2, color: "#fff" }}>
                {loading ? <CircularProgress size={24} color="inherit" /> : "Save"}
              </Button>
              <Button variant="outlined" onClick={editable.cancelEdit} disabled={loading} sx={{ borderColor: PRIMARY_TEAL, color: PRIMARY_TEAL, ml: 2 }}>Cancel</Button>
            </>
          )}
        </Box>

        <Box id="template-to-download" className="template-section">
          <Typography variant="h4" sx={{ fontWeight: 700, color: PRIMARY_TEAL, mb: 4, textAlign: "left" }}>
            Org Structure: Tech View
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            {/* CEO */}
            <NodeBox bgColor={DARK_BG}>
              {editable.isEditing ? (
                <>
                  <StyledInput value={editable.draftData.group_ceo.name} onChange={(e) => updateNode("group_ceo", "name", e.target.value)} placeholder="Name" />
                  <StyledInput value={editable.draftData.group_ceo.role} onChange={(e) => updateNode("group_ceo", "role", e.target.value)} placeholder="Role" />
                </>
              ) : (
                <>
                  <Typography sx={{ fontWeight: 700 }}>{editable.draftData.group_ceo.name || "[Name]"}</Typography>
                  <Typography sx={{ fontSize: "0.65rem", color: "#ccc" }}>{editable.draftData.group_ceo.role || "Group CEO"}</Typography>
                </>
              )}
            </NodeBox>

            <ConnectorLine />

            {/* CDIO */}
            <NodeBox bgColor={DARK_BG}>
              {editable.isEditing ? (
                <>
                  <StyledInput value={editable.draftData.cdio.name} onChange={(e) => updateNode("cdio", "name", e.target.value)} placeholder="Name" />
                  <StyledInput value={editable.draftData.cdio.role} onChange={(e) => updateNode("cdio", "role", e.target.value)} placeholder="Role" />
                </>
              ) : (
                <>
                  <Typography sx={{ fontWeight: 700 }}>{editable.draftData.cdio.name || "[Name]"}</Typography>
                  <Typography sx={{ fontSize: "0.65rem", color: "#ccc" }}>{editable.draftData.cdio.role || "CDIO"}</Typography>
                </>
              )}
            </NodeBox>

            <ConnectorLine />
            
            {/* Horizontal Line logic */}
            <Box sx={{ width: "100%", position: "relative", height: "20px" }}>
              <HorizontalLine sx={{ width: "80%", position: "absolute", top: "0", left: "10%" }} />
              <Box sx={{ display: "flex", justifyContent: "space-around", width: "80%", margin: "0 auto" }}>
                {editable.draftData.key_functions.map((_: any, i: number) => (
                  <Box key={i} sx={{ width: "2px", height: "20px", backgroundColor: "#ccc" }} />
                ))}
              </Box>
            </Box>

            {/* Key Functions Row */}
            <Box sx={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap", width: "100%" }}>
              {editable.draftData.key_functions.map((fn: any, i: number) => (
                <NodeBox key={i} bgColor={getColorFromType(fn.presence_type)}>
                  {editable.isEditing ? (
                    <>
                      <StyledInput value={fn.function} onChange={(e) => updateFunction(i, "function", e.target.value)} placeholder="Function" />
                      <StyledInput value={fn.leader_name} onChange={(e) => updateFunction(i, "leader_name", e.target.value)} placeholder="Leader Name" />
                      <StyledInput value={fn.leader_role} onChange={(e) => updateFunction(i, "leader_role", e.target.value)} placeholder="Role" />
                      <TextField
                        select size="small" value={fn.presence_type || "Green"}
                        onChange={(e) => updateFunction(i, "presence_type", e.target.value)}
                        sx={{ bgcolor: "#fff", borderRadius: 1, width: "100%", "& .MuiInputBase-input": { fontSize: "0.65rem", padding: "4px" } }}
                      >
                        <MenuItem value="Green">Deep Presence (Green)</MenuItem>
                        <MenuItem value="Orange">Focus Area (Orange)</MenuItem>
                        <MenuItem value="Pink">Not Priority (Pink)</MenuItem>
                      </TextField>
                    </>
                  ) : (
                    <>
                      <Typography sx={{ fontWeight: 800, mb: 0.5, fontSize: "0.8rem", color: "#000" }}>{fn.function || "Function"}</Typography>
                      <Typography sx={{ fontWeight: 700, color: "#111" }}>{fn.leader_name || "[Name]"}</Typography>
                      <Typography sx={{ fontSize: "0.65rem", color: "#333" }}>{fn.leader_role || "[Role]"}</Typography>
                    </>
                  )}
                </NodeBox>
              ))}
            </Box>
            
            {editable.isEditing && (
              <Button onClick={addFunction} sx={{ mt: 2, color: PRIMARY_TEAL }}>+ Add Function</Button>
            )}
          </Box>

          {/* Legend */}
          <Box sx={{ mt: 6, display: "flex", alignItems: "center", gap: 2, justifyContent: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 20, height: 20, bgcolor: COLOR_GREEN }} />
              <Typography sx={{ fontSize: 13 }}>Deep presence</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 20, height: 20, bgcolor: COLOR_ORANGE }} />
              <Typography sx={{ fontSize: 13 }}>Focus area for growth</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 20, height: 20, bgcolor: COLOR_PINK }} />
              <Typography sx={{ fontSize: 13 }}>Not a priority / synergistic with Client focus</Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography sx={{ fontSize: 10, color: "#6b7280" }}>
            Source: Company website, LinkedIn, General Web Search and Capital IQ
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}