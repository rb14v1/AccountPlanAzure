import React, { useState, useEffect, useRef } from "react";
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
  Alert,
} from "@mui/material";
import DownloadTemplates from "../components/DownloadTemplates";
import { useEditableTable } from "../hooks/useEditableTable";
import { useData } from "../context/DataContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const TEMPLATE_NAME = "key_growth_opportunities"; // Backend mapped name

/* ---------------- TYPES ---------------- */
type OpportunityRow = {
  id: number;
  deal: string;
  type: string;
  stage: string;
  offering: string;
  tcv: string;
  acv: string;
  timeline: string;
  winProb: string;
  stakeholders: string;
  competition: string;
  differentiator: string;
  support: string;
};


/* ---------------- STYLES ---------------- */
const HeaderCell = styled(TableCell)({
  backgroundColor: "#022D36",
  color: "#fff",
  fontWeight: 600,
  fontSize: 11,
  border: "1px solid #bdbdbd",
  padding: 6,
  whiteSpace: "normal",        // ✅ allow wrapping
  wordBreak: "break-word",     // ✅ wrap words, not letters
  textAlign: "center",         // ✅ keeps layout same
  verticalAlign: "middle",     // ✅ prevents header stretching
});

const BodyCell = styled(TableCell)({
  fontSize: 11,
  border: "1px solid #c9c9c9",
  padding: "5px 6px",
  verticalAlign: "top",
  whiteSpace: "normal",
  wordBreak: "break-word",
});

const CenterCell = styled(BodyCell)({
  textAlign: "center",
});

const WinCell = styled(TableCell)({
  width: 14,
  border: "1px solid #c9c9c9",
  padding: 0,
});

/* ---------------- HELPERS ---------------- */
const getWinColor = (prob?: string) => {
  if (!prob) return "transparent";
  if (prob.includes("70")) return "#00B050";
  if (prob.includes("50")) return "#92D050";
  if (prob.includes("30")) return "#FFC000";
  return "#F4CCCC";
};

const emptyRow = (id: number): OpportunityRow => ({
  id,
  deal: "",
  type: "",
  stage: "",
  offering: "",
  tcv: "",
  acv: "",
  timeline: "",
  winProb: "",
  stakeholders: "",
  competition: "",
  differentiator: "",
  support: "",
});

// --- SAFE EXTRACTOR BRIDGES ---
const extractData = (source: any): OpportunityRow[] => {
  const rawArray = Array.isArray(source?.data) ? source.data : (Array.isArray(source) ? source : []);
  
  const mapped = rawArray.map((item: any, index: number) => ({
    id: index + 1,
    deal: item.deal_name || item.deal || "",
    type: item.deal_type || item.type || "",
    stage: item.stage || "",
    offering: item.service_offering || item.offering || "",
    tcv: item.tcv_eur_mn || item.tcv || "",
    acv: item.acv_eur_mn || item.acv || "",
    timeline: item.closure_timeline || item.timeline || "",
    winProb: item.win_probability || item.winProb || "",
    stakeholders: item.key_stakeholders || item.stakeholders || "",
    competition: item.competition || "",
    differentiator: item.key_differentiator || item.differentiator || "",
    support: item.support_required || item.support || ""
  }));

  while (mapped.length < 5) {
    mapped.push(emptyRow(mapped.length + 1));
  }
  return mapped;
};

const reverseExtractData = (uiData: OpportunityRow[]) => {
  return uiData.map(item => ({
    deal_name: item.deal,
    deal_type: item.type,
    stage: item.stage,
    service_offering: item.offering,
    tcv_eur_mn: item.tcv,
    acv_eur_mn: item.acv,
    closure_timeline: item.timeline,
    win_probability: item.winProb,
    key_stakeholders: item.stakeholders,
    competition: item.competition,
    key_differentiator: item.differentiator,
    support_required: item.support
  }));
};

/* ---------- PRINT FIX (PDF ONLY) ---------- */
const printStyles = `
@media print {
  #template-to-download {
    width: 1800px !important;
    max-width: 1800px !important;
  }

  table {
    table-layout: fixed !important;
    width: 1800px !important;
  }

  th, td {
    white-space: normal !important;
    overflow-wrap: break-word !important;
    vertical-align: top !important;
  }

  /* 🚫 PREVENT LETTER-BY-LETTER BREAKING */
  th {
    word-break: keep-all !important;
  }

  /* 🔑 FIX Key Stakeholders column */
  th:nth-child(10),
  td:nth-child(10) {
    min-width: 220px !important;
  }
}
`;

/* ---------------- MAIN ---------------- */
export default function GrowthOpportunitiesPage() {
  const { globalData, setGlobalData } = useData();
  const userId = globalData?.user_id || localStorage.getItem("user_id") || "101";

  const rawData = extractData(globalData?.key_growth_opportunities);
  const editable = useEditableTable<OpportunityRow[]>(rawData);

  const [isPrinting, setIsPrinting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as any });

  const dataLoadedFromDB = useRef(false);
  const autoSaveAttempted = useRef(false);

  // 1. Sync from Chatbot
  useEffect(() => {
    if (globalData?.key_growth_opportunities && !editable.isEditing) {
      editable.updateDraft(extractData(globalData.key_growth_opportunities));
    }
  }, [globalData?.key_growth_opportunities]);

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
            setGlobalData((prev: any) => ({ ...prev, key_growth_opportunities: parsed }));
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
        const rawGlobal = globalData?.key_growth_opportunities;
        // Verify it is fresh chatbot data (it has data array but no db id yet)
        const isNew = rawGlobal && !rawGlobal.id && (Array.isArray(rawGlobal.data) || Array.isArray(rawGlobal)); 
        
        if (isNew && !autoSaveAttempted.current) {
          autoSaveAttempted.current = true;
          try {
            const payload = { user_id: userId, data: reverseExtractData(rawData) };
            const res = await fetch(`${API_BASE_URL}/template-payload/${TEMPLATE_NAME}/`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (res.ok && result.success) {
              setGlobalData((prev: any) => ({ ...prev, key_growth_opportunities: result.data }));
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
      // Clean empty rows from being saved if desired
      const cleaned = editable.draftData.filter(
        (r) => r.deal || r.stage || r.offering || r.winProb
      );

      const payload = { user_id: userId, data: reverseExtractData(cleaned) };
      const res = await fetch(`${API_BASE_URL}/template-payload/${TEMPLATE_NAME}/`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      if (res.ok && result.success) {
        setGlobalData((prev: any) => ({ ...prev, key_growth_opportunities: result.data }));
        editable.saveEdit(() => {});
        setSnackbar({ open: true, message: "✅ Saved successfully", severity: "success" });
      } else {
        throw new Error("Save failed");
      }
    } catch (e) {
      setSnackbar({ open: true, message: "❌ Save failed", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const updateCell = (id: number, field: keyof OpportunityRow, value: string) => {
    editable.updateDraft(
      editable.draftData.map((r) =>
        r.id === id ? { ...r, [field]: value } : r
      )
    );
  };

  if (initialLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "#ffffff", p: 2 }}>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>

      <Box sx={{ maxWidth: 1600, mx: "auto", px: 4, py: 2 }}>
        {/* HEADER */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            mb: 2,
          }}
        >

          <DownloadTemplates
            templateName="Key Growth Opportunities"
            beforeDownload={() => setIsPrinting(true)}
            afterDownload={() => setIsPrinting(false)}
          />

          {!editable.isEditing ? (
            <Button variant="outlined" onClick={editable.startEdit} disabled={loading} sx={{
              borderColor: "#008080",
              color: "#008080",
              ml: 2,
              "&:hover": {
                borderColor: "#006d6d",
                backgroundColor: "#e6f4f4",
              },
            }}>
              Edit
            </Button>
          ) : (
            <>
              <Button variant="contained" onClick={handleSave} disabled={loading} sx={{
                backgroundColor: "#008080",
                ml: 2,
                color: "#fff",
                "&:hover": {
                  backgroundColor: "#006d6d",
                },
              }}>
                {loading ? <CircularProgress size={24} color="inherit" /> : "Save"}
              </Button>
              <Button variant="outlined" onClick={editable.cancelEdit} disabled={loading} sx={{
                borderColor: "#008080",
                color: "#008080",
                ml: 2,
                "&:hover": {
                  borderColor: "#006d6d",
                  backgroundColor: "#e6f4f4",
                },
              }}>
                Cancel
              </Button>
            </>
          )}
        </Box>
      
      <Box id="template-to-download" className="template-section" sx={{ mt: 2, mx: "auto" }}>

        <style>{printStyles}</style>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 1 }}>
          <Typography variant="h4" fontWeight={700} color="teal">
            Summary of key growth opportunities
          </Typography>

          {/* ✅ COLOR LEGEND ADDED HERE */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {[
              { label: "70% +", color: "#00B050" },
              { label: "50% - 70%", color: "#92D050" },
              { label: "30% - 50%", color: "#FFC000" },
              { label: "<30%", color: "#F4CCCC" },
            ].map((item, idx) => (
              <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box sx={{ width: 14, height: 14, bgcolor: item.color, border: "1px solid #ccc", borderRadius: "2px" }} />
                <Typography sx={{ fontSize: "0.75rem", color: "#333", fontWeight: 600 }}>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>


      {/* TABLE */}
      <TableContainer
        component={Paper}
        sx={{ overflowX: "hidden" }}
      >

        <Table
          size="small"
          sx={{
            tableLayout: "fixed",
            width: "100%",
            pageBreakInside: "auto",   // ✅ allow breaking only BETWEEN rows
          }}
        >

          <colgroup>
            <col style={{ width: "3%" }} />   {/* # */}
            <col style={{ width: "8%" }} />   {/* Deal */}
            <col style={{ width: "8%" }} />   {/* Deal Type */}
            <col style={{ width: "7%" }} />   {/* Stage */}
            <col style={{ width: "10%" }} />  {/* Service offerings */}
            <col style={{ width: "6%" }} />   {/* TCV */}
            <col style={{ width: "6%" }} />   {/* ACV */}
            <col style={{ width: "8%" }} />   {/* Closure timeline */}
            <col style={{ width: "4%" }} />   {/* Win */}
            <col style={{ width: "12%" }} />  {/* Key Stakeholders */}

            <col style={{ width: "8%" }} />   {/* Competition */}
            <col style={{ width: "10%" }} />  {/* Differentiator */}
            <col style={{ width: "12%" }} />  {/* Support */}
          </colgroup>


          <TableHead
            sx={{
              display: "table-header-group", // ✅ REQUIRED for repeated headers
            }}
          >

            <TableRow>
              <HeaderCell>#</HeaderCell>
              <HeaderCell>Deal</HeaderCell>
              <HeaderCell>Deal Type</HeaderCell>
              <HeaderCell>Stage</HeaderCell>
              <HeaderCell>Service Offerings</HeaderCell>
              <HeaderCell>TCV (€)</HeaderCell>
              <HeaderCell>ACV (€)</HeaderCell>
              <HeaderCell>Closure Timeline</HeaderCell>
              <HeaderCell>Win</HeaderCell>
              <HeaderCell>Key Stakeholders</HeaderCell>
              <HeaderCell>Competition</HeaderCell>
              <HeaderCell>Key Differentiator</HeaderCell>
              <HeaderCell>Support Required</HeaderCell>
            </TableRow>



          </TableHead>

          <TableBody>
            {editable.draftData.map((row) => (
              <TableRow
                key={row.id}
                sx={{
                  pageBreakInside: "avoid", // ✅ keeps full row on same page
                }}
              >

                <CenterCell>{row.id}</CenterCell>

                {(
                  [
                    "deal", "type", "stage", "offering", "tcv", "acv",
                    "timeline", "winProb", "stakeholders",
                    "competition", "differentiator", "support",
                  ] as (keyof OpportunityRow)[]
                ).map((field, i) =>
                  field === "winProb" ? (
                    <WinCell key={i} sx={{ bgcolor: getWinColor(row.winProb) }} />
                  ) : (
                    <BodyCell key={i}>
                      {editable.isEditing && !isPrinting ? (
                        <TextField
                          fullWidth
                          multiline
                          minRows={1}
                          maxRows={6}
                          size="small"
                          value={row[field]}
                          onChange={(e) =>
                            updateCell(row.id, field, e.target.value)
                          }
                          InputProps={{
                            style: {
                              fontSize: 11,
                              lineHeight: 1.4,
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                              overflow: "hidden",   // 🔑 no scrollbar
                              resize: "none",       // 🔑 prevent manual resize
                            },
                          }}
                        />

                      ) : (
                        <Box
                          data-pdf-value={row[field] || ""}
                          sx={{
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            fontSize: 11,
                            lineHeight: 1.4,
                          }}
                        >
                          {row[field] || ""}
                        </Box>

                      )}

                    </BodyCell>
                  )
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

    </Box>
    </Box>
    </Box>
  );
}