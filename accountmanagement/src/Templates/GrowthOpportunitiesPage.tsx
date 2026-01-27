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

const TEMPLATE_NAME = "Key_Growth_Opportunities";

/* ---------------- STYLES ---------------- */
const HeaderCell = styled(TableCell)({
  backgroundColor: "#022D36",
  color: "#fff",
  fontWeight: 600,
  fontSize: 11,
  border: "1px solid #bdbdbd",
  padding: 6,
});

const BodyCell = styled(TableCell)({
  fontSize: 11,
  border: "1px solid #c9c9c9",
  padding: "5px 6px",
  verticalAlign: "top",
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

/* ---------------- MAIN ---------------- */
export default function GrowthOpportunitiesPage() {
  const { globalData, setGlobalData } = useData();

  const backendData = globalData?.key_growth_opportunities || [];

  /* Map backend → table rows */
  const initialRows: OpportunityRow[] =
    backendData.length > 0
      ? backendData.map((o: any, i: number) => ({
        id: i + 1,
        deal: o.deal_name || "",
        type: o.deal_type || "",
        stage: o.stage || "",
        offering: o.service_offering || "",
        tcv: o.tcv_eur_mn || "",
        acv: o.acv_eur_mn || "",
        timeline: o.closure_timeline || "",
        winProb: o.win_probability || "",
        stakeholders: o.key_stakeholders || "",
        competition: o.competition || "",
        differentiator: o.key_differentiator || "",
        support: o.support_required || "",
      }))
      : [];

  /* Ensure minimum 5 rows */
  while (initialRows.length < 5) {
    initialRows.push(emptyRow(initialRows.length + 1));
  }

  const editable = useEditableTable<OpportunityRow[]>(initialRows);

  const updateCell = (id: number, field: keyof OpportunityRow, value: string) => {
    editable.updateDraft(
      editable.draftData.map((r) =>
        r.id === id ? { ...r, [field]: value } : r
      )
    );
  };

  const handleSave = () => {
    editable.saveEdit((rows) => {
      const cleaned = rows.filter(
        (r) =>
          r.deal ||
          r.stage ||
          r.offering ||
          r.winProb
      );

      setGlobalData((prev: any) => ({
        ...prev,
        key_growth_opportunities: cleaned.map((r: OpportunityRow) => ({
          deal_name: r.deal,
          deal_type: r.type,
          stage: r.stage,
          service_offering: r.offering,
          tcv_eur_mn: r.tcv,
          acv_eur_mn: r.acv,
          closure_timeline: r.timeline,
          win_probability: r.winProb,
          key_stakeholders: r.stakeholders,
          competition: r.competition,
          key_differentiator: r.differentiator,
          support_required: r.support,
        })),
      }));
    });
  };

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "#ffffff", p: 2 }}>
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

          <DownloadTemplates templateName={TEMPLATE_NAME} />

          {!editable.isEditing ? (
            <Button variant="outlined" onClick={editable.startEdit} sx={{
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
              <Button variant="contained" onClick={handleSave}>
                Save
              </Button>
              <Button variant="outlined" onClick={editable.cancelEdit} sx={{
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
      <Typography variant="h4" fontWeight={700} color="teal">
        Summary of key growth opportunities
      </Typography>

      {/* TABLE */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {[
                "#", "Deal", "Deal Type", "Stage", "Service offerings",
                "TCV (€)", "ACV (€)", "Closure timeline", "Win",
                "Key stakeholders", "Competition",
                "Key differentiator", "Support required",
              ].map((h) => (
                <HeaderCell key={h}>{h}</HeaderCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {editable.draftData.map((row) => (
              <TableRow key={row.id}>
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
                      {editable.isEditing ? (
                        <TextField
                          size="small"
                          fullWidth
                          value={row[field]}
                          onChange={(e) =>
                            updateCell(row.id, field, e.target.value)
                          }
                        />
                      ) : (
                        row[field]
                      )}
                    </BodyCell>
                  )
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography sx={{ fontSize: 10, mt: 1 }}>
        Classification: Controlled. Copyright ©2025 Version 1.
      </Typography>
    </Box>
    </Box >
    </Box>
  );
}
