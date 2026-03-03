import React, { useEffect, useState, useRef } from "react";
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
const TEMPLATE_NAME = "margin_improvement";

/* ---------------- TYPES ---------------- */
type MarginRow = {
  id: number;
  keyMetrics: string;
  fy24: string;
  q424: string;
  q125: string;
  q225A: string;
  q325C: string;
  q325P: string;
  q425C: string;
  q425P: string;
  fy25C: string;
  fy25P: string;
  q126P: string;
  q226P: string;
  q326P: string;
  q426P: string;
  fy26P: string;
};

type WaterfallRow = {
  id: number;
  item: string;
  q323: string;
  q423: string;
  q124: string;
  q224: string;
};

type ChartRow = {
  quarter: string;
  actuals_projections: string;
  target: string;
};

/* ---------------- STYLES ---------------- */
const PageContainer = styled(Box)({
  padding: "24px",
  backgroundColor: "#fff",
  minHeight: "100vh",
});

const PageTitle = styled(Typography)({
  fontSize: 24,
  fontWeight: 700,
  color: "#00BCD4",
  marginBottom: 16,
});

const SectionHeader = styled(Box)({
  backgroundColor: "#022D36",
  color: "#fff",
  padding: "8px 12px",
  fontSize: 14,
  fontWeight: 700,
  marginTop: 16,
});

const HeaderCell = styled(TableCell)({
  backgroundColor: "#022D36",
  color: "#fff",
  fontWeight: 700,
  fontSize: 11,
  border: "1px solid #666",
  padding: "6px 8px",
  textAlign: "center",
});

const SubHeaderCell = styled(TableCell)({
  backgroundColor: "#0D7F8C",
  color: "#fff",
  fontWeight: 600,
  fontSize: 10,
  border: "1px solid #666",
  padding: "4px 6px",
  textAlign: "center",
});

const BodyCell = styled(TableCell)({
  fontSize: 11,
  border: "1px solid #d0d0d0",
  padding: "4px 6px",
  verticalAlign: "middle",
  textAlign: "center",
  backgroundColor: "#fff",
});

const MetricsLabelCell = styled(TableCell)({
  fontSize: 11,
  border: "1px solid #d0d0d0",
  padding: "4px 8px",
  verticalAlign: "middle",
  textAlign: "left",
  backgroundColor: "#fff",
  fontWeight: 500,
  minWidth: 180,
});

const CategoryCell = styled(TableCell)({
  color: "#fff",
  fontWeight: 700,
  fontSize: 11,
  border: "1px solid #666",
  padding: "8px 4px",
  verticalAlign: "middle",
  textAlign: "center",
  writingMode: "vertical-rl",
  transform: "rotate(180deg)",
  whiteSpace: "nowrap",
  width: 40,
});

const WaterfallItemCell = styled(TableCell)({
  fontSize: 11,
  borderBottom: "1px dotted #999",
  borderLeft: "1px solid #d0d0d0",
  borderRight: "1px solid #d0d0d0",
  padding: "8px 12px",
  verticalAlign: "middle",
  textAlign: "left",
  backgroundColor: "#fff",
});

const WaterfallDataCell = styled(TableCell)({
  fontSize: 11,
  borderBottom: "1px dotted #999",
  borderLeft: "1px solid #d0d0d0",
  borderRight: "1px solid #d0d0d0",
  padding: "6px 8px",
  verticalAlign: "middle",
  textAlign: "center",
  backgroundColor: "#fff",
  minWidth: 70,
});

const WaterfallHeaderCell = styled(TableCell)({
  backgroundColor: "transparent",
  color: "#000",
  fontWeight: 700,
  fontSize: 11,
  padding: "8px",
  textAlign: "center",
  borderBottom: "2px solid #022D36",
});

/* ---------------- HELPERS & EXTRACTORS ---------------- */
const emptyMarginRow = (id: number, keyMetrics: string = ""): MarginRow => ({
  id, keyMetrics, fy24: "", q424: "", q125: "", q225A: "", q325C: "", q325P: "",
  q425C: "", q425P: "", fy25C: "", fy25P: "", q126P: "", q226P: "", q326P: "", q426P: "", fy26P: "",
});

const defaultData = {
  gross_profit_chart: [
    { quarter: "Q1 FY25", actuals_projections: "", target: "" }, { quarter: "Q2 FY25", actuals_projections: "", target: "" },
    { quarter: "Q3 FY25", actuals_projections: "", target: "" }, { quarter: "Q4 FY25", actuals_projections: "", target: "" },
    { quarter: "Q1 FY26", actuals_projections: "", target: "" }, { quarter: "Q2 FY26", actuals_projections: "", target: "" },
    { quarter: "Q3 FY26", actuals_projections: "", target: "" }, { quarter: "Q4 FY26", actuals_projections: "", target: "" }
  ],
  key_metrics: [
    emptyMarginRow(1, "Revenue (€ Mn)"), emptyMarginRow(2, "Onsite (%)"), emptyMarginRow(3, "Offshore (%)"),
    emptyMarginRow(4, "GM (%)"), emptyMarginRow(5, "EBITDA (%)"), emptyMarginRow(6, "Cost / FTE - ONS (€)"),
    emptyMarginRow(7, "Cost / FTE - OFS (€)")
  ],
  gp_waterfall_opex: [
    { id: 1, item: "Subcon reduction", q323: "", q423: "", q124: "", q224: "" },
    { id: 2, item: "Pyramid optimisation", q323: "", q423: "", q124: "", q224: "" },
    { id: 3, item: "Lean & Automation", q323: "", q423: "", q124: "", q224: "" },
    { id: 4, item: "Bill Utilisation", q323: "", q423: "", q124: "", q224: "" }
  ],
  gp_waterfall_sales: [
    { id: 5, item: "Pricing", q323: "", q423: "", q124: "", q224: "" },
    { id: 6, item: "FP - New deals & CRs", q323: "", q423: "", q124: "", q224: "" }
  ],
  drainers: [
    { id: 1, item: "Higher Cost Hiring", q323: "", q423: "", q124: "", q224: "" },
    { id: 2, item: "Increments", q323: "", q423: "", q124: "", q224: "" },
    { id: 3, item: "Inv. Deals & Onsite Hiring", q323: "", q423: "", q124: "", q224: "" },
    { id: 4, item: "Healthcare SME at Onsite", q323: "", q423: "", q124: "", q224: "" }
  ]
};

const extractData = (source: any) => {
  const d = source?.data || source || {};

  const mappedChart = defaultData.gross_profit_chart.map((defRow, i) => {
    const srcRow = Array.isArray(d.gross_profit_chart) && d.gross_profit_chart[i] ? d.gross_profit_chart[i] : {};
    return {
      quarter: srcRow?.quarter || defRow.quarter,
      actuals_projections: srcRow?.actuals_projections !== undefined ? srcRow.actuals_projections : defRow.actuals_projections,
      target: srcRow?.target !== undefined ? srcRow.target : defRow.target,
    };
  });

  const mapMetrics = (m: any, i: number) => ({
    id: i + 1, keyMetrics: m.key_metrics || m.keyMetrics || "",
    fy24: m.fy24 || "", q424: m.q4_24 || m.q424 || "", q125: m.q1_25 || m.q125 || "", q225A: m.q2_25_a || m.q225A || "",
    q325C: m.q3_25_c || m.q325C || "", q325P: m.q3_25_p || m.q325P || "", q425C: m.q4_25_c || m.q425C || "", q425P: m.q4_25_p || m.q425P || "",
    fy25C: m.fy25_c || m.fy25C || "", fy25P: m.fy25_p || m.fy25P || "", q126P: m.q1_26_p || m.q126P || "", q226P: m.q2_26_p || m.q226P || "",
    q326P: m.q3_26_p || m.q326P || "", q426P: m.q4_26_p || m.q426P || "", fy26P: m.fy26_p || m.fy26P || ""
  });

  const mapWaterfall = (w: any, i: number, idOffset: number) => ({
    id: i + idOffset, item: w.item || "",
    q323: w.q323 || "", q423: w.q423 || "", q124: w.q124 || "", q224: w.q224 || ""
  });

  return {
    gross_profit_chart: mappedChart,
    key_metrics: Array.isArray(d.key_metrics) && d.key_metrics.length > 0 ? d.key_metrics.map(mapMetrics) : defaultData.key_metrics,
    gp_waterfall_opex: Array.isArray(d.gp_waterfall_opex) && d.gp_waterfall_opex.length > 0 ? d.gp_waterfall_opex.map((x:any, i:number) => mapWaterfall(x,i,1)) : defaultData.gp_waterfall_opex,
    gp_waterfall_sales: Array.isArray(d.gp_waterfall_sales) && d.gp_waterfall_sales.length > 0 ? d.gp_waterfall_sales.map((x:any, i:number) => mapWaterfall(x,i,5)) : defaultData.gp_waterfall_sales,
    drainers: Array.isArray(d.drainers) && d.drainers.length > 0 ? d.drainers.map((x:any, i:number) => mapWaterfall(x,i,1)) : defaultData.drainers,
    id: d.id
  };
};

/* ---------------- MAIN ---------------- */
export default function MarginImprovementPage() {
  const { globalData, setGlobalData } = useData();
  const userId = globalData?.user_id || localStorage.getItem("user_id") || "101";

  const rawData = extractData(globalData?.margin_improvement);

  const chartEditable = useEditableTable(rawData.gross_profit_chart);
  const metricsEditable = useEditableTable(rawData.key_metrics);
  const opexEditable = useEditableTable(rawData.gp_waterfall_opex);
  const salesEditable = useEditableTable(rawData.gp_waterfall_sales);
  const drainersEditable = useEditableTable(rawData.drainers);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as any });

  const dataLoadedFromDB = useRef(false);
  const autoSaveAttempted = useRef(false);

  // 1. Sync from Chatbot
  useEffect(() => {
    if (globalData?.margin_improvement && !metricsEditable.isEditing && !opexEditable.isEditing && !salesEditable.isEditing && !drainersEditable.isEditing && !chartEditable.isEditing) {
      const parsed = extractData(globalData.margin_improvement);
      chartEditable.updateDraft(parsed.gross_profit_chart);
      metricsEditable.updateDraft(parsed.key_metrics);
      opexEditable.updateDraft(parsed.gp_waterfall_opex);
      salesEditable.updateDraft(parsed.gp_waterfall_sales);
      drainersEditable.updateDraft(parsed.drainers);
    }
  }, [globalData?.margin_improvement]);

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
            chartEditable.updateDraft(parsed.gross_profit_chart);
            metricsEditable.updateDraft(parsed.key_metrics);
            opexEditable.updateDraft(parsed.gp_waterfall_opex);
            salesEditable.updateDraft(parsed.gp_waterfall_sales);
            drainersEditable.updateDraft(parsed.drainers);
            setGlobalData((prev: any) => ({ ...prev, margin_improvement: parsed }));
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
        const rawGlobal = globalData?.margin_improvement;
        const isNew = rawGlobal && !rawGlobal.id;
        if (isNew && !autoSaveAttempted.current) {
          autoSaveAttempted.current = true;
          try {
            const payload = { user_id: userId, data: rawData };
            const res = await fetch(`${API_BASE_URL}/template-payload/${TEMPLATE_NAME}/`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (res.ok && result.success) {
              setGlobalData((prev: any) => ({ ...prev, margin_improvement: extractData(result.data) }));
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
      const payloadData = {
        gross_profit_chart: chartEditable.draftData,
        key_metrics: metricsEditable.draftData.map((r: MarginRow) => ({
          key_metrics: r.keyMetrics,
          fy24: r.fy24, q4_24: r.q424, q1_25: r.q125, q2_25_a: r.q225A,
          q3_25_c: r.q325C, q3_25_p: r.q325P, q4_25_c: r.q425C, q4_25_p: r.q425P,
          fy25_c: r.fy25C, fy25_p: r.fy25P, q1_26_p: r.q126P, q2_26_p: r.q226P,
          q3_26_p: r.q326P, q4_26_p: r.q426P, fy26_p: r.fy26P,
        })),
        gp_waterfall_opex: opexEditable.draftData,
        gp_waterfall_sales: salesEditable.draftData,
        drainers: drainersEditable.draftData
      };

      const res = await fetch(`${API_BASE_URL}/template-payload/${TEMPLATE_NAME}/`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, data: payloadData })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setGlobalData((prev: any) => ({ ...prev, margin_improvement: extractData(result.data) }));
        chartEditable.saveEdit(() => {});
        metricsEditable.saveEdit(() => {});
        opexEditable.saveEdit(() => {});
        salesEditable.saveEdit(() => {});
        drainersEditable.saveEdit(() => {});
        setSnackbar({ open: true, message: "✅ Saved successfully", severity: "success" });
      } else throw new Error("Save failed");
    } catch (e) {
      setSnackbar({ open: true, message: "❌ Save failed", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const updateMetricsCell = (id: number, field: keyof MarginRow, value: string) => {
    metricsEditable.updateDraft(metricsEditable.draftData.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const updateWaterfallCell = (editable: any, id: number, field: keyof WaterfallRow, value: string) => {
    editable.updateDraft(editable.draftData.map((r: WaterfallRow) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const isEditing = metricsEditable.isEditing || opexEditable.isEditing || salesEditable.isEditing || drainersEditable.isEditing || chartEditable.isEditing;

  if (initialLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <PageContainer>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>

      {/* HEADER */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <PageTitle>Margin improvement plan</PageTitle>
        <Box sx={{ display: "flex", gap: 2 }}>
          <DownloadTemplates templateName="Margin Improvement Plan" />
          {!isEditing ? (
            <Button variant="contained" size="small" onClick={() => {
              metricsEditable.startEdit(); opexEditable.startEdit();
              salesEditable.startEdit(); drainersEditable.startEdit();
              chartEditable.startEdit();
            }}>Edit</Button>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" color="primary" size="small" disabled={loading} onClick={handleSave}>
                {loading ? <CircularProgress size={20} color="inherit" /> : "Save"}
              </Button>
              <Button variant="outlined" size="small" disabled={loading} onClick={() => {
                metricsEditable.cancelEdit(); opexEditable.cancelEdit();
                salesEditable.cancelEdit(); drainersEditable.cancelEdit();
                chartEditable.cancelEdit();
              }}>Cancel</Button>
            </Box>
          )}
        </Box>
      </Box>

      <Box id="template-to-download">
        {/* GROSS PROFIT SECTION */}
        <SectionHeader>Gross Profit, (%)</SectionHeader>
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 3, my: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 30, height: 15, backgroundColor: "#00BCD4" }} />
              <Typography sx={{ fontSize: 11 }}>Actuals + Projections</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 30, height: 15, backgroundColor: "#C49000" }} />
              <Typography sx={{ fontSize: 11 }}>Target</Typography>
            </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1, mb: 4, height: 80, alignItems: 'flex-end' }}>
          {chartEditable.draftData.map((data: ChartRow, index: number) => {
              const bgColor = index < 4 ? "#00BCD4" : "#C49000";
              const field = index < 4 ? "actuals_projections" : "target";
              const val = data[field as keyof ChartRow];
              // Explicit TBD logic
              const displayVal = (val === "" || val === null || val === undefined) ? "TBD" : val;

              return (
                <Box key={data.quarter} sx={{ flex: 1, textAlign: 'center' }}>
                  <Box sx={{ backgroundColor: bgColor, color: "#fff", py: 1, fontWeight: 700, mb: 0.5 }}>
                    {isEditing ? (
                        <TextField 
                            value={val} 
                            onChange={(e) => {
                                const newChart = [...chartEditable.draftData];
                                newChart[index] = { ...newChart[index], [field]: e.target.value };
                                chartEditable.updateDraft(newChart);
                            }}
                            variant="standard"
                            InputProps={{ disableUnderline: true, style: { fontSize: 11, textAlign: 'center', color: '#fff', fontWeight: 700 } }}
                        />
                    ) : displayVal}
                  </Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 700 }}>{data.quarter}</Typography>
                </Box>
              )
          })}
        </Box>

        {/* KEY METRICS TABLE */}
        <TableContainer component={Paper} sx={{ boxShadow: "none", mb: 4 }}>
          <Table size="small" sx={{ borderCollapse: 'collapse' }}>
            <TableHead>
              <TableRow>
                <HeaderCell rowSpan={2}>Key Metrics</HeaderCell>
                <HeaderCell colSpan={4}>System View</HeaderCell>
                <HeaderCell colSpan={2}>Current Quarter</HeaderCell>
                <HeaderCell colSpan={2}>Latest Projection</HeaderCell>
                <HeaderCell colSpan={2}>Latest Projection</HeaderCell>
                <HeaderCell colSpan={5}>Plan for FY26</HeaderCell>
              </TableRow>
              <TableRow>
                {["FY'24", "Q4'24", "Q1'25", "Q2'25 (A)", "Q3'25 (C)", "Q3'25 (P)", "Q4'25 (C)", "Q4'25 (P)", "FY25 (C)", "FY25 (P)", "Q1'26 (P)", "Q2'26 (P)", "Q3'26 (P)", "Q4'26 (P)", "FY26 (P)"].map((h) => (
                  <SubHeaderCell key={h}>{h}</SubHeaderCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {metricsEditable.draftData.map((row) => (
                <TableRow key={row.id}>
                  <MetricsLabelCell>{row.keyMetrics}</MetricsLabelCell>
                  {[
                    "fy24", "q424", "q125", "q225A", "q325C", "q325P",
                    "q425C", "q425P", "fy25C", "fy25P",
                    "q126P", "q226P", "q326P", "q426P", "fy26P"
                  ].map((field) => {
                    const cellVal = row[field as keyof MarginRow];
                    const displayCellVal = (cellVal === "" || cellVal === null || cellVal === undefined) ? "TBD" : cellVal;
                    return (
                      <BodyCell key={field}>
                        {isEditing ? (
                          <TextField
                            value={cellVal}
                            onChange={(e) => updateMetricsCell(row.id, field as keyof MarginRow, e.target.value)}
                            variant="standard"
                            InputProps={{ disableUnderline: true, style: { fontSize: 11, textAlign: 'center' } }}
                          />
                        ) : displayCellVal}
                      </BodyCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* WATERFALL SECTION */}
        <Box sx={{ display: "flex", gap: 4 }}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 1 }}>GP waterfall</Typography>
            <Table size="small" sx={{ borderCollapse: 'collapse' }}>
              <TableHead>
                <TableRow>
                  <TableCell colSpan={2} sx={{ borderBottom: 'none' }} />
                  {["Q3 23", "Q4 23", "Q1 24", "Q2 24"].map(q => <WaterfallHeaderCell key={q}>{q}</WaterfallHeaderCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {opexEditable.draftData.map((row, idx) => (
                  <TableRow key={row.id}>
                    {idx === 0 && <CategoryCell rowSpan={opexEditable.draftData.length} sx={{ backgroundColor: "#00838F" }}>Ops / Delivery levers</CategoryCell>}
                    <WaterfallItemCell>{row.item}</WaterfallItemCell>
                    {["q323", "q423", "q124", "q224"].map(f => {
                      const val = row[f as keyof WaterfallRow];
                      const display = (val === "" || val === null || val === undefined) ? "TBD" : val;
                      return (
                        <WaterfallDataCell key={f} sx={{ color: "#D4A017", fontWeight: 600 }}>
                          {isEditing ? <TextField value={val} onChange={(e) => updateWaterfallCell(opexEditable, row.id, f as keyof WaterfallRow, e.target.value)} variant="standard" InputProps={{ disableUnderline: true, style: { fontSize: 11, textAlign: 'center', color: '#D4A017' } }} /> : display}
                        </WaterfallDataCell>
                      );
                    })}
                  </TableRow>
                ))}
                {salesEditable.draftData.map((row, idx) => (
                  <TableRow key={row.id}>
                    {idx === 0 && <CategoryCell rowSpan={salesEditable.draftData.length} sx={{ backgroundColor: "#00897B" }}>Sales levers</CategoryCell>}
                    <WaterfallItemCell>{row.item}</WaterfallItemCell>
                    {["q323", "q423", "q124", "q224"].map(f => {
                      const val = row[f as keyof WaterfallRow];
                      const display = (val === "" || val === null || val === undefined) ? "TBD" : val;
                      return (
                        <WaterfallDataCell key={f} sx={{ color: "#4CAF50", fontWeight: 600 }}>
                          {isEditing ? <TextField value={val} onChange={(e) => updateWaterfallCell(salesEditable, row.id, f as keyof WaterfallRow, e.target.value)} variant="standard" InputProps={{ disableUnderline: true, style: { fontSize: 11, textAlign: 'center', color: '#4CAF50' } }} /> : display}
                        </WaterfallDataCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          <Box sx={{ flex: 1, pt: 4 }}>
            <Table size="small" sx={{ borderCollapse: 'collapse' }}>
              <TableHead>
                <TableRow>
                  <TableCell colSpan={2} sx={{ borderBottom: 'none' }} />
                  {["Q3 23", "Q4 23", "Q1 24", "Q2 24"].map(q => <WaterfallHeaderCell key={q}>{q}</WaterfallHeaderCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {drainersEditable.draftData.map((row, idx) => (
                  <TableRow key={row.id}>
                    {idx === 0 && <CategoryCell rowSpan={drainersEditable.draftData.length} sx={{ backgroundColor: "#9E9E9E" }}>Drainers</CategoryCell>}
                    <WaterfallItemCell>{row.item}</WaterfallItemCell>
                    {["q323", "q423", "q124", "q224"].map(f => {
                       const val = row[f as keyof WaterfallRow];
                       const display = (val === "" || val === null || val === undefined) ? "TBD" : val;
                       return (
                        <WaterfallDataCell key={f} sx={{ color: "#D32F2F", fontWeight: 600 }}>
                          {isEditing ? <TextField value={val} onChange={(e) => updateWaterfallCell(drainersEditable, row.id, f as keyof WaterfallRow, e.target.value)} variant="standard" InputProps={{ disableUnderline: true, style: { fontSize: 11, textAlign: 'center', color: '#D32F2F' } }} /> : display}
                        </WaterfallDataCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Box>
      </Box>
    </PageContainer>
  );
}