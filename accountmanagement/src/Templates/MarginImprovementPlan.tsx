import React from "react";
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
} from "@mui/material";
import DownloadTemplates from "../components/DownloadTemplates";
import { useEditableTable } from "../hooks/useEditableTable";
import { useData } from "../context/DataContext";

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

const TEMPLATE_NAME = "Margin_Improvement_Plan";

/* ---------------- STYLES ---------------- */
const PageTitle = styled(Typography)({
  fontSize: 20,
  fontWeight: 700,
  color: "#00BCD4",
  marginBottom: 16,
  backgroundColor: "#FFFF00",
  padding: "8px 16px",
});

const SectionHeader = styled(Box)({
  backgroundColor: "#022D36",
  color: "#fff",
  padding: "8px 12px",
  fontSize: 14,
  fontWeight: 700,
  marginTop: 0,
  marginBottom: 0,
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
  backgroundColor: "#E8E8E8",
  fontWeight: 500,
});

const CategoryCell = styled(TableCell)({
  backgroundColor: "#00838F",
  color: "#fff",
  fontWeight: 700,
  fontSize: 12,
  border: "1px solid #666",
  padding: "12px 8px",
  verticalAlign: "middle",
  textAlign: "center",
  writingMode: "vertical-rl",
  transform: "rotate(180deg)",
  whiteSpace: "nowrap",
  width: 50,
});

const WaterfallItemCell = styled(TableCell)({
  fontSize: 11,
  borderTop: "1px dotted #999",
  borderBottom: "1px dotted #999",
  borderLeft: "1px solid #d0d0d0",
  borderRight: "1px solid #d0d0d0",
  padding: "8px 12px",
  verticalAlign: "middle",
  textAlign: "left",
  backgroundColor: "#fff",
  fontWeight: 400,
  color: "#000",
});

const WaterfallDataCell = styled(TableCell)({
  fontSize: 11,
  borderTop: "1px dotted #999",
  borderBottom: "1px dotted #999",
  borderLeft: "1px solid #d0d0d0",
  borderRight: "1px solid #d0d0d0",
  padding: "6px 8px",
  verticalAlign: "middle",
  textAlign: "center",
  backgroundColor: "#fff",
  minWidth: 70,
});

const DeniersCategoryCell = styled(CategoryCell)({
  backgroundColor: "#9E9E9E",
});

const SalesLeversCategoryCell = styled(CategoryCell)({
  backgroundColor: "#00897B",
});

const WaterfallHeaderCell = styled(TableCell)({
  backgroundColor: "#022D36",
  color: "#fff",
  fontWeight: 700,
  fontSize: 11,
  border: "1px solid #666",
  padding: "6px 8px",
  textAlign: "center",
});

/* ---------------- HELPERS ---------------- */
const emptyMarginRow = (id: number, keyMetrics: string = ""): MarginRow => ({
  id,
  keyMetrics,
  fy24: "",
  q424: "",
  q125: "",
  q225A: "",
  q325C: "",
  q325P: "",
  q425C: "",
  q425P: "",
  fy25C: "",
  fy25P: "",
  q126P: "",
  q226P: "",
  q326P: "",
  q426P: "",
  fy26P: "",
});

const emptyWaterfallRow = (id: number, item: string = ""): WaterfallRow => ({
  id,
  item,
  q323: "",
  q423: "",
  q124: "",
  q224: "",
});

/* ---------------- MAIN ---------------- */
export default function MarginImprovementPage() {
  const { globalData, setGlobalData } = useData();
  const backendData = globalData?.margin_improvement_plan || {};

  /* Initialize Key Metrics Table */
  const initialMetricsRows: MarginRow[] =
    backendData.key_metrics?.length > 0
      ? backendData.key_metrics.map((m: any, i: number) => ({
          id: i + 1,
          keyMetrics: m.key_metrics || "",
          fy24: m.fy24 || "",
          q424: m.q4_24 || "",
          q125: m.q1_25 || "",
          q225A: m.q2_25_a || "",
          q325C: m.q3_25_c || "",
          q325P: m.q3_25_p || "",
          q425C: m.q4_25_c || "",
          q425P: m.q4_25_p || "",
          fy25C: m.fy25_c || "",
          fy25P: m.fy25_p || "",
          q126P: m.q1_26_p || "",
          q226P: m.q2_26_p || "",
          q326P: m.q3_26_p || "",
          q426P: m.q4_26_p || "",
          fy26P: m.fy26_p || "",
        }))
      : [
          emptyMarginRow(1, "Revenue (€ Mn)"),
          emptyMarginRow(2, "Onsite (%)"),
          emptyMarginRow(3, "Offshore (%)"),
          emptyMarginRow(4, "GM (%)"),
          emptyMarginRow(5, "EBITDA (%)"),
          emptyMarginRow(6, "Cost / FTE - ONS (€)"),
          emptyMarginRow(7, "Cost / FTE - OFS (€)"),
        ];

  /* Initialize Waterfall Tables */
  const opexData = backendData.gp_waterfall_opex || [];
  const salesData = backendData.gp_waterfall_sales || [];
  const deniersData = backendData.deniers || [];

  const initialOpexRows: WaterfallRow[] =
    opexData.length > 0
      ? opexData.map((o: any, i: number) => ({
          id: i + 1,
          item: o.item || "",
          q323: o.q3_23 || "",
          q423: o.q4_23 || "",
          q124: o.q1_24 || "",
          q224: o.q2_24 || "",
        }))
      : [
          { id: 1, item: "Subcon reduction", q323: "0.0%", q423: "0.2%", q124: "0.2%", q224: "0.2%" },
          { id: 2, item: "Pyramid optimisation", q323: "0.4%", q423: "0.3%", q124: "0.3%", q224: "0.5%" },
          { id: 3, item: "Lean & Automation", q323: "0.2%", q423: "0.2%", q124: "0.2%", q224: "0.2%" },
          { id: 4, item: "Bill Utilisation", q323: "0.2%", q423: "0.2%", q124: "0.2%", q224: "0.2%" },
          { id: 5, item: "Pricing", q323: "", q423: "", q124: "0.2%", q224: "0.3%" },
        ];

  const initialSalesRows: WaterfallRow[] =
    salesData.length > 0
      ? salesData.map((s: any, i: number) => ({
          id: i + 1,
          item: s.item || "",
          q323: s.q3_23 || "",
          q423: s.q4_23 || "",
          q124: s.q1_24 || "",
          q224: s.q2_24 || "",
        }))
      : [{ id: 1, item: "FP - New deals & CRs", q323: "1.0%", q423: "1.2%", q124: "1.5%", q224: "1.6%" }];

  const initialDeniersRows: WaterfallRow[] =
    deniersData.length > 0
      ? deniersData.map((d: any, i: number) => ({
          id: i + 1,
          item: d.item || "",
          q323: d.q3_23 || "",
          q423: d.q4_23 || "",
          q124: d.q1_24 || "",
          q224: d.q2_24 || "",
        }))
      : [
          { id: 1, item: "Higher Cost Hiring", q323: "-0.0%", q423: "-0.2%", q124: "-0.2%", q224: "-0.2%" },
          { id: 2, item: "Increments", q323: "-0.4%", q423: "-0.3%", q124: "-0.3%", q224: "-0.5%" },
          { id: 3, item: "Inv. Deals & Onsite Hiring", q323: "-0.2%", q423: "-0.2%", q124: "-0.2%", q224: "-0.2%" },
          { id: 4, item: "Healthcare SME at Onsite", q323: "-0.2%", q423: "-0.2%", q124: "-0.2%", q224: "-0.2%" },
        ];

  const metricsEditable = useEditableTable(initialMetricsRows);
  const opexEditable = useEditableTable(initialOpexRows);
  const salesEditable = useEditableTable(initialSalesRows);
  const deniersEditable = useEditableTable(initialDeniersRows);

  const updateMetricsCell = (id: number, field: keyof MarginRow, value: string) => {
    metricsEditable.updateDraft(
      metricsEditable.draftData.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const updateWaterfallCell = (
    editable: any,
    id: number,
    field: keyof WaterfallRow,
    value: string
  ) => {
    editable.updateDraft(
      editable.draftData.map((r: WaterfallRow) =>
        r.id === id ? { ...r, [field]: value } : r
      )
    );
  };

  const handleSave = () => {
    metricsEditable.saveEdit((rows) => {
      opexEditable.saveEdit((opexRows) => {
        salesEditable.saveEdit((salesRows) => {
          deniersEditable.saveEdit((deniersRows) => {
            setGlobalData((prev: any) => ({
              ...prev,
              margin_improvement_plan: {
                key_metrics: rows.map((r: MarginRow) => ({
                  key_metrics: r.keyMetrics,
                  fy24: r.fy24,
                  q4_24: r.q424,
                  q1_25: r.q125,
                  q2_25_a: r.q225A,
                  q3_25_c: r.q325C,
                  q3_25_p: r.q325P,
                  q4_25_c: r.q425C,
                  q4_25_p: r.q425P,
                  fy25_c: r.fy25C,
                  fy25_p: r.fy25P,
                  q1_26_p: r.q126P,
                  q2_26_p: r.q226P,
                  q3_26_p: r.q326P,
                  q4_26_p: r.q426P,
                  fy26_p: r.fy26P,
                })),
                gp_waterfall_opex: opexRows.map((r: WaterfallRow) => ({
                  item: r.item,
                  q3_23: r.q323,
                  q4_23: r.q423,
                  q1_24: r.q124,
                  q2_24: r.q224,
                })),
                gp_waterfall_sales: salesRows.map((r: WaterfallRow) => ({
                  item: r.item,
                  q3_23: r.q323,
                  q4_23: r.q423,
                  q1_24: r.q124,
                  q2_24: r.q224,
                })),
                deniers: deniersRows.map((r: WaterfallRow) => ({
                  item: r.item,
                  q3_23: r.q323,
                  q4_23: r.q423,
                  q1_24: r.q124,
                  q2_24: r.q224,
                })),
              },
            }));
          });
        });
      });
    });
  };

  const handleCancel = () => {
    metricsEditable.cancelEdit();
    opexEditable.cancelEdit();
    salesEditable.cancelEdit();
    deniersEditable.cancelEdit();
  };

  const isEditing =
    metricsEditable.isEditing ||
    opexEditable.isEditing ||
    salesEditable.isEditing ||
    deniersEditable.isEditing;

  return (
    <Box sx={{ p: 3 }}>
      {/* HEADER */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0 }}>
        <PageTitle>Margin improvement plan</PageTitle>
        <Box sx={{ display: "flex", gap: 2 }}>
          <DownloadTemplates templateName={TEMPLATE_NAME} />
          {!isEditing ? (
            <Button
              variant="contained"
              size="small"
              onClick={() => {
                metricsEditable.startEdit();
                opexEditable.startEdit();
                salesEditable.startEdit();
                deniersEditable.startEdit();
              }}
            >
              Edit
            </Button>
          ) : (
            <>
              <Button variant="contained" color="primary" size="small" onClick={handleSave}>
                Save
              </Button>
              <Button variant="outlined" size="small" onClick={handleCancel}>
                Cancel
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* GROSS PROFIT SECTION */}
      <SectionHeader>Gross Profit, (%)</SectionHeader>

      {/* Gross Profit Bar Chart */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          gap: "4px",
          p: 2,
          backgroundColor: "#fff",
          position: "relative",
          height: 160,
          border: "1px solid #e0e0e0",
        }}
      >
        {/* Legend */}
        <Box sx={{ position: "absolute", top: 8, right: 16, display: "flex", gap: 3, border: "1px dotted #999", p: 1, backgroundColor: "#fff" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ width: 20, height: 12, backgroundColor: "#00BCD4" }} />
            <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#000" }}>Actuals + Projections</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ width: 20, height: 12, backgroundColor: "#C49000" }} />
            <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#000" }}>Target</Typography>
          </Box>
        </Box>

        {/* Bars */}
        {["Q1 FY25", "Q2 FY25", "Q3 FY25", "Q4 FY25"].map((quarter, idx) => (
          <Box
            key={idx}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flex: 1,
              height: "100%",
              justifyContent: "flex-end",
            }}
          >
            <Box
              sx={{
                width: "100%",
                height: 90,
                backgroundColor: "#00BCD4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              10
            </Box>
            <Typography sx={{ fontSize: 10, mt: 1, fontWeight: 700, color: "#000" }}>{quarter}</Typography>
          </Box>
        ))}
        {["Q1 FY26", "Q2 FY26", "Q3 FY26", "Q4 FY26"].map((quarter, idx) => (
          <Box
            key={idx}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flex: 1,
              height: "100%",
              justifyContent: "flex-end",
            }}
          >
            <Box
              sx={{
                width: "100%",
                height: 90,
                backgroundColor: "#C49000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              10
            </Box>
            <Typography sx={{ fontSize: 10, mt: 1, fontWeight: 700, color: "#000" }}>{quarter}</Typography>
          </Box>
        ))}
      </Box>

      {/* KEY METRICS TABLE */}
      <TableContainer component={Paper} sx={{ mt: 0, boxShadow: "none" }}>
        <Table size="small" sx={{ borderCollapse: "collapse" }}>
          <TableHead>
            <TableRow>
              <HeaderCell rowSpan={2} sx={{ minWidth: 140 }}>
                Key Metrics
              </HeaderCell>
              <HeaderCell colSpan={3}>System View</HeaderCell>
              <HeaderCell colSpan={2}>Current Quarter</HeaderCell>
              <HeaderCell colSpan={2}>Latest<br/>Projection</HeaderCell>
              <HeaderCell colSpan={2}>Latest<br/>Projection</HeaderCell>
              <HeaderCell colSpan={5}>Plan for FY26</HeaderCell>
            </TableRow>
            <TableRow>
              <SubHeaderCell>FY'24</SubHeaderCell>
              <SubHeaderCell>Q4'24</SubHeaderCell>
              <SubHeaderCell>Q1'25</SubHeaderCell>
              <SubHeaderCell>Q2'25<br/>(A)</SubHeaderCell>
              <SubHeaderCell>Q3'25<br/>(C)</SubHeaderCell>
              <SubHeaderCell>Q3'25<br/>(P)</SubHeaderCell>
              <SubHeaderCell>Q4'25<br/>(C)</SubHeaderCell>
              <SubHeaderCell>Q4'25<br/>(P)</SubHeaderCell>
              <SubHeaderCell>FY25 (C)</SubHeaderCell>
              <SubHeaderCell>FY25 (P)</SubHeaderCell>
              <SubHeaderCell>Q1'26<br/>(P)</SubHeaderCell>
              <SubHeaderCell>Q2'26<br/>(P)</SubHeaderCell>
              <SubHeaderCell>Q3'26<br/>(P)</SubHeaderCell>
              <SubHeaderCell>Q4'26<br/>(P)</SubHeaderCell>
              <SubHeaderCell>FY26 (P)</SubHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {metricsEditable.draftData.map((row) => (
              <TableRow key={row.id}>
                <MetricsLabelCell>{row.keyMetrics}</MetricsLabelCell>
                {(
                  [
                    "fy24",
                    "q424",
                    "q125",
                    "q225A",
                    "q325C",
                    "q325P",
                    "q425C",
                    "q425P",
                    "fy25C",
                    "fy25P",
                    "q126P",
                    "q226P",
                    "q326P",
                    "q426P",
                    "fy26P",
                  ] as (keyof MarginRow)[]
                ).map((field) => (
                  <BodyCell key={field}>
                    {isEditing ? (
                      <TextField
                        value={row[field]}
                        onChange={(e) => updateMetricsCell(row.id, field, e.target.value)}
                        variant="standard"
                        fullWidth
                        size="small"
                        sx={{ fontSize: 11 }}
                        InputProps={{ disableUnderline: true, style: { fontSize: 11, textAlign: 'center' } }}
                      />
                    ) : (
                      row[field]
                    )}
                  </BodyCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* GP WATERFALL SECTION */}
      <SectionHeader sx={{ mt: 2 }}>GP waterfall</SectionHeader>

      <Box sx={{ display: "flex", gap: 0, mt: 0 }}>
        {/* LEFT SIDE - OPEX DELIVERY & SALES LEVERS */}
        <Box sx={{ flex: 1 }}>
          <TableContainer component={Paper} sx={{ boxShadow: "none" }}>
            <Table size="small" sx={{ borderCollapse: "collapse" }}>
              <TableHead>
                <TableRow>
                  <WaterfallHeaderCell colSpan={2}></WaterfallHeaderCell>
                  <WaterfallHeaderCell>Q3 23</WaterfallHeaderCell>
                  <WaterfallHeaderCell>Q4 23</WaterfallHeaderCell>
                  <WaterfallHeaderCell>Q1 24</WaterfallHeaderCell>
                  <WaterfallHeaderCell>Q2 24</WaterfallHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* OPEX DELIVERY */}
                {opexEditable.draftData.map((row, idx) => (
                  <TableRow key={row.id}>
                    {idx === 0 && (
                      <CategoryCell rowSpan={opexEditable.draftData.length}>
                        Opex Delivery
                      </CategoryCell>
                    )}
                    <WaterfallItemCell sx={{ minWidth: 160 }}>
                      {isEditing ? (
                        <TextField
                          value={row.item}
                          onChange={(e) =>
                            updateWaterfallCell(opexEditable, row.id, "item", e.target.value)
                          }
                          variant="standard"
                          fullWidth
                          size="small"
                          InputProps={{ disableUnderline: true, style: { fontSize: 11 } }}
                        />
                      ) : (
                        row.item
                      )}
                    </WaterfallItemCell>
                    {(["q323", "q423", "q124", "q224"] as (keyof WaterfallRow)[]).map((field) => {
                      const value = row[field];
                      return (
                        <WaterfallDataCell key={field} sx={{ color: "#D4A017", fontWeight: 600 }}>
                          {isEditing ? (
                            <TextField
                              value={value}
                              onChange={(e) =>
                                updateWaterfallCell(opexEditable, row.id, field, e.target.value)
                              }
                              variant="standard"
                              fullWidth
                              size="small"
                              InputProps={{ disableUnderline: true, style: { fontSize: 11, textAlign: 'center', color: '#D4A017', fontWeight: 600 } }}
                            />
                          ) : (
                            value
                          )}
                        </WaterfallDataCell>
                      );
                    })}
                  </TableRow>
                ))}

                {/* SALES LEVERS */}
                {salesEditable.draftData.map((row, idx) => (
                  <TableRow key={row.id}>
                    {idx === 0 && (
                      <SalesLeversCategoryCell rowSpan={salesEditable.draftData.length}>
                        Sales Levers
                      </SalesLeversCategoryCell>
                    )}
                    <WaterfallItemCell>
                      {isEditing ? (
                        <TextField
                          value={row.item}
                          onChange={(e) =>
                            updateWaterfallCell(salesEditable, row.id, "item", e.target.value)
                          }
                          variant="standard"
                          fullWidth
                          size="small"
                          InputProps={{ disableUnderline: true, style: { fontSize: 11 } }}
                        />
                      ) : (
                        row.item
                      )}
                    </WaterfallItemCell>
                    {(["q323", "q423", "q124", "q224"] as (keyof WaterfallRow)[]).map((field) => {
                      const value = row[field];
                      return (
                        <WaterfallDataCell key={field} sx={{ color: "#4CAF50", fontWeight: 600 }}>
                          {isEditing ? (
                            <TextField
                              value={value}
                              onChange={(e) =>
                                updateWaterfallCell(salesEditable, row.id, field, e.target.value)
                              }
                              variant="standard"
                              fullWidth
                              size="small"
                              InputProps={{ disableUnderline: true, style: { fontSize: 11, textAlign: 'center', color: '#4CAF50', fontWeight: 600 } }}
                            />
                          ) : (
                            value
                          )}
                        </WaterfallDataCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* RIGHT SIDE - DENIERS */}
        <Box sx={{ flex: 1 }}>
          <TableContainer component={Paper} sx={{ boxShadow: "none" }}>
            <Table size="small" sx={{ borderCollapse: "collapse" }}>
              <TableHead>
                <TableRow>
                  <WaterfallHeaderCell colSpan={2}></WaterfallHeaderCell>
                  <WaterfallHeaderCell>Q3 23</WaterfallHeaderCell>
                  <WaterfallHeaderCell>Q4 23</WaterfallHeaderCell>
                  <WaterfallHeaderCell>Q1 24</WaterfallHeaderCell>
                  <WaterfallHeaderCell>Q2 24</WaterfallHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {deniersEditable.draftData.map((row, idx) => (
                  <TableRow key={row.id}>
                    {idx === 0 && (
                      <DeniersCategoryCell rowSpan={deniersEditable.draftData.length}>
                        Deniers
                      </DeniersCategoryCell>
                    )}
                    <WaterfallItemCell sx={{ minWidth: 200 }}>
                      {isEditing ? (
                        <TextField
                          value={row.item}
                          onChange={(e) =>
                            updateWaterfallCell(deniersEditable, row.id, "item", e.target.value)
                          }
                          variant="standard"
                          fullWidth
                          size="small"
                          InputProps={{ disableUnderline: true, style: { fontSize: 11 } }}
                        />
                      ) : (
                        row.item
                      )}
                    </WaterfallItemCell>
                    {(["q323", "q423", "q124", "q224"] as (keyof WaterfallRow)[]).map((field) => {
                      const value = row[field];
                      return (
                        <WaterfallDataCell key={field} sx={{ color: "#D32F2F", fontWeight: 600 }}>
                          {isEditing ? (
                            <TextField
                              value={value}
                              onChange={(e) =>
                                updateWaterfallCell(deniersEditable, row.id, field, e.target.value)
                              }
                              variant="standard"
                              fullWidth
                              size="small"
                              InputProps={{ disableUnderline: true, style: { fontSize: 11, textAlign: 'center', color: '#D32F2F', fontWeight: 600 } }}
                            />
                          ) : (
                            value
                          )}
                        </WaterfallDataCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>

      {/* FOOTER */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          mt: 2,
        }}
      >
        <Typography sx={{ fontSize: 9, color: "#666" }}>
          Classification: Controlled. Copyright ©2025 Version 1.
        </Typography>
      </Box>
    </Box>
  );
}
