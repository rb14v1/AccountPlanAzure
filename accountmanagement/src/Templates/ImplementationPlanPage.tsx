import React from "react";
import {
  Box,
  Button,
  Typography,
  MenuItem,
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

const TEMPLATE_NAME = "Implementation_Plan_For_Growth";
const STATUS_OPTIONS = [
  "Completed",
  "On-track",
  "Critical to fast-track",
  "Delayed",
  "To be initiated",
];

const legendItems = [
  { label: "Completed", color: "#7EAA55" },
  { label: "On-track", color: "#0070C0" },
  { label: "Critical to fast-track", color: "#FFC000" },
  { label: "Delayed", color: "#C00000" },
  { label: "To be initiated", color: "#D9D9D9" },
];

const getStatusColor = (status: string): string => {
  const normalized = status.toLowerCase().trim();
  if (normalized === "completed") return "#7EAA55";
  if (normalized === "on-track" || normalized === "on track") return "#0070C0";
  if (normalized === "critical to fast-track" || normalized.includes("critical"))
    return "#FFC000";
  if (normalized === "delayed") return "#C00000";
  if (normalized === "to be initiated" || normalized.includes("initiated"))
    return "#D9D9D9";
  return "";
};

const HeaderCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: "#022D36",
  color: "#ffffff",
  fontWeight: 600,
  fontSize: theme.typography.pxToRem(11),
  border: "1px solid #ccc",
  padding: "10px 4px",
}));

const BodyCell = styled(TableCell)(({ theme }) => ({
  border: "1px solid #ccc",
  fontSize: theme.typography.pxToRem(11),
  padding: "6px 8px",
  verticalAlign: "top",

  /* 🔑 CRITICAL FOR PDF */
  whiteSpace: "normal",
  wordBreak: "break-word",
  overflow: "visible",
  height: "auto",
}));



const CategoryCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: "#0B5D66",
  color: "#ffffff",
  fontWeight: 700,
  textAlign: "center",
  fontSize: theme.typography.pxToRem(12),
  border: "1px solid #ccc",

  /* 🔑 ADD THESE 3 LINES */
  verticalAlign: "top",
  whiteSpace: "normal",
  wordBreak: "break-word",
}));


const StatusCell = styled(TableCell)({
  padding: 0,
  border: "1px solid #ccc",
});

// ✅ Used ONLY when printing / downloading
const PrintBox = ({ value }: { value: string }) => (
  <Box
    sx={{
      whiteSpace: "pre-wrap",   // VERY IMPORTANT (same as RelationshipHeatmap)
      wordBreak: "break-word",
      overflow: "visible",
      height: "auto",
      lineHeight: 1.4,
      fontSize: "0.75rem",
    }}
  >
    {value || ""}
  </Box>
);

interface ActionRow {
  id: number;
  category: string;
  action: string;
  primary_owner: string;
  support_team: string;
  timeline: string;
  status: string;
  help_required: string;
  investment_needed: string;
  impact: string;
}

interface ImplementationPlanData {
  plan_date: string;
  actions: ActionRow[];
}

export default function ImplementationPlanPage() {
  const { globalData, setGlobalData } = useData();
  const contextData = globalData?.implementation_plan_for_growth || null;

  const [isPrinting, setIsPrinting] = React.useState(false);

  // Fallback rows (only used when no chatbot data yet)
  const defaultRows: ActionRow[] = [
    {
      id: 1,
      category: "Commercial Excellence",
      action: "Setup a SASVA POC with CTO",
      primary_owner: "",
      support_team: "",
      timeline: "",
      status: "Completed",
      help_required: "",
      investment_needed: "",
      impact: "",
    },
    {
      id: 2,
      category: "Commercial Excellence",
      action: "Discuss rate revision for tenured/ aging roles",
      primary_owner: "",
      support_team: "",
      timeline: "",
      status: "On-track",
      help_required: "",
      investment_needed: "",
      impact: "",
    },
    {
      id: 3,
      category: "Commercial Excellence",
      action: "Collate unbilled CRs delivered",
      primary_owner: "",
      support_team: "",
      timeline: "",
      status: "Critical to fast-track",
      help_required: "",
      investment_needed: "",
      impact: "",
    },
  ];

  const actionsData = contextData?.actions || [];
  const mappedRows: ActionRow[] =
    actionsData.length > 0
      ? actionsData.map((action: any, index: number) => ({
        id: index + 1,
        category: action.category || "Not available",
        action: action.action || "",
        primary_owner: action.primary_owner || "",
        support_team: action.support_team || "",
        timeline: action.timeline || "",
        status: action.status || "",
        help_required: action.help_required || "",
        investment_needed: action.investment_needed_eur_k || "",
        impact: action.impact || "",
      }))
      : defaultRows;

  const initialData: ImplementationPlanData = {
    plan_date: contextData?.plan_date || "xx",
    actions: mappedRows,
  };

  // Initialize editable table hook
  const editable = useEditableTable(initialData);

  // Handle plan date change
  const handlePlanDateChange = (value: string) => {
    editable.updateDraft({
      ...editable.draftData,
      plan_date: value,
    });
  };

  // Handle action row changes
  const handleActionChange = (
    index: number,
    field: keyof ActionRow,
    value: string | number
  ) => {
    const updatedActions = [...editable.draftData.actions];
    updatedActions[index] = {
      ...updatedActions[index],
      [field]: value,
    };
    editable.updateDraft({
      ...editable.draftData,
      actions: updatedActions,
    });
  };

  // Group actions by category for rowspan
  const groupedActions: { [key: string]: ActionRow[] } = {};
  editable.draftData.actions.forEach((action) => {
    if (!groupedActions[action.category]) {
      groupedActions[action.category] = [];
    }
    groupedActions[action.category].push(action);
  });

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "#ffffff", p: 2 }}>
      <Box sx={{ maxWidth: 1600, mx: "auto", px: 4, py: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            mb: 2,
          }}
        >
          <DownloadTemplates
  templateName={TEMPLATE_NAME}
  beforeDownload={() => setIsPrinting(true)}
  afterDownload={() => setIsPrinting(false)}
/>

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
              <Button
                variant="contained"
                onClick={() =>
                  editable.saveEdit((updatedData) => {
                    setGlobalData((prev: any) => ({
                      ...prev,
                      implementation_plan_for_growth: updatedData,
                    }));
                  })
                }
                sx={{
                  backgroundColor: "#008080",
                  ml: 2,
                  color: "#fff",
                  "&:hover": {
                    backgroundColor: "#006d6d",
                  },
                }}
              >
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
        <Box id="template-to-download" className="template-section">
          <Typography fontSize={35} fontWeight={700} sx={{ color: "teal" }}>
            Implementation plan for growth
          </Typography>


          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
              Plan date:
            </Typography>
            {editable.isEditing && !isPrinting ? (
              <TextField
                size="small"
                value={editable.draftData.plan_date}
                onChange={(e) => handlePlanDateChange(e.target.value)}
                sx={{ width: 150 }}
              />
            ) : (
              <Typography sx={{ fontSize: 14 }}>
                {editable.draftData.plan_date}
              </Typography>
            )}
          </Box>

          {/* Legend */}
          <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
            {legendItems.map((item) => (
              <Box
                key={item.label}
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    bgcolor: item.color,
                    border: "1px solid #ccc",
                  }}
                />
                <Typography sx={{ fontSize: 12 }}>{item.label}</Typography>
              </Box>
            ))}
          </Box>

          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table
  size="small"
  sx={{
    borderCollapse: "collapse",
    width: "100%",
    tableLayout: "fixed",     // 🔑 LOCK layout (same as RelationshipHeatmap)
    pageBreakInside: "auto",
  }}
>


  <colgroup>
  <col style={{ width: "12%" }} />  {/* Category */}
  <col style={{ width: "4%" }} />   {/* # */}
  <col style={{ width: "16%" }} />  {/* Action */}
  <col style={{ width: "12%" }} />  {/* Primary Owner */}
  <col style={{ width: "12%" }} />  {/* Support Team */}
  <col style={{ width: "10%" }} />  {/* Timeline */}
  <col style={{ width: "6%" }} />   {/* Status */}
  <col style={{ width: "12%" }} />  {/* Help Required */}
  <col style={{ width: "8%" }} />   {/* Investment */}
  <col style={{ width: "8%" }} />   {/* Impact */}
</colgroup>


              <TableHead
  sx={{
    display: "table-header-group", // 🔑 REQUIRED FOR PDF
  }}
>

                <TableRow>
                  <HeaderCell>Category</HeaderCell>
                  <HeaderCell>#</HeaderCell>
                  <HeaderCell>Action</HeaderCell>
                  <HeaderCell>Primary Owner</HeaderCell>
                  <HeaderCell>Support Team</HeaderCell>
                  <HeaderCell>Timeline</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell>Help Required</HeaderCell>
                  <HeaderCell>Investment Needed (€K)</HeaderCell>
                  <HeaderCell>Impact</HeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(groupedActions).map(([category, actions]) =>
                  actions.map((row, idx) => {
                    const globalIndex = editable.draftData.actions.findIndex(
                      (a) => a.id === row.id
                    );
                    return (
                      <TableRow key={row.id}>
                        {/* Category column — PRINT SAFE */}
{idx === 0 ? (
  <CategoryCell rowSpan={actions.length}>
    {editable.isEditing && !isPrinting ? (
      <TextField
        size="small"
        fullWidth
        value={row.category}
        onChange={(e) =>
          handleActionChange(globalIndex, "category", e.target.value)
        }
        sx={{
          "& .MuiInputBase-root": { color: "white" },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255,255,255,0.3)",
          },
        }}
      />
    ) : (
      category
    )}
  </CategoryCell>
) : isPrinting ? (
  // 🔑 PRINT-ONLY placeholder cell (DOES NOT affect UI)
  <CategoryCell
    sx={{
      backgroundColor: "transparent",
      border: "1px solid #ccc",
    }}
  />
) : null}


                        <BodyCell>{row.id}</BodyCell>

                        <BodyCell>
                          {editable.isEditing && !isPrinting ? (
  <TextField
    size="small"
    fullWidth
    multiline
    minRows={1}
    value={row.action}
    onChange={(e) =>
      handleActionChange(globalIndex, "action", e.target.value)
    }
    sx={{
      "& textarea": { overflow: "hidden" },
    }}
  />
) : (
  <PrintBox value={row.action} />
)
}

                        </BodyCell>

                        <BodyCell>
  {editable.isEditing && !isPrinting ? (
  <TextField
    size="small"
    fullWidth
    multiline
    minRows={1}
    value={row.primary_owner}
    onChange={(e) =>
      handleActionChange(globalIndex, "primary_owner", e.target.value)
    }
    sx={{ "& textarea": { overflow: "hidden" } }}
  />
) : (
  <PrintBox value={row.primary_owner} />
)
}

</BodyCell>


                        <BodyCell>
  {editable.isEditing && !isPrinting ? (
  <TextField
    size="small"
    fullWidth
    multiline
    minRows={1}
    value={row.support_team}
    onChange={(e) =>
      handleActionChange(globalIndex, "support_team", e.target.value)
    }
    sx={{ "& textarea": { overflow: "hidden" } }}
  />
) : (
  <PrintBox value={row.support_team} />
)
}

</BodyCell>


                        <BodyCell>
  {editable.isEditing && !isPrinting ? (
  <TextField
    size="small"
    fullWidth
    multiline
    minRows={1}
    value={row.timeline}
    onChange={(e) =>
      handleActionChange(globalIndex, "timeline", e.target.value)
    }
    sx={{ "& textarea": { overflow: "hidden" } }}
  />
) : (
  <PrintBox value={row.timeline} />
)
}

</BodyCell>


                        <StatusCell>
                          {editable.isEditing && !isPrinting ? (
                            <TextField
                              select
                              size="small"
                              fullWidth
                              value={row.status}
                              onChange={(e) =>
                                handleActionChange(
                                  globalIndex,
                                  "status",
                                  e.target.value
                                )
                              }
                              SelectProps={{
                                displayEmpty: true,
                              }}
                            >
                              {STATUS_OPTIONS.map((status) => (
                                <MenuItem key={status} value={status}>
                                  {status}
                                </MenuItem>
                              ))}
                            </TextField>
                          ) : (
                            row.status && (
                              <Box
                                sx={{
                                  backgroundColor: getStatusColor(row.status),
                                  width: "100%",
                                  height: "100%",
                                  minHeight: 35,
                                }}
                              />
                            )
                          )}
                        </StatusCell>
                        <BodyCell>
                          {editable.isEditing && !isPrinting ? (
  <TextField
    size="small"
    fullWidth
    multiline
    minRows={1}
    value={row.help_required}
    onChange={(e) =>
      handleActionChange(globalIndex, "help_required", e.target.value)
    }
    sx={{ "& textarea": { overflow: "hidden" } }}
  />
) : (
  <PrintBox value={row.help_required} />
)
}

                        </BodyCell>

                        <BodyCell>
  {editable.isEditing && !isPrinting ? (
  <TextField
    size="small"
    fullWidth
    multiline
    minRows={1}
    value={row.investment_needed}
    onChange={(e) =>
      handleActionChange(globalIndex, "investment_needed", e.target.value)
    }
    sx={{ "& textarea": { overflow: "hidden" } }}
  />
) : (
  <PrintBox value={row.investment_needed} />
)
}

</BodyCell>


                        <BodyCell>
                          {editable.isEditing && !isPrinting ? (
  <TextField
    size="small"
    fullWidth
    multiline
    minRows={1}
    value={row.impact}
    onChange={(e) =>
      handleActionChange(globalIndex, "impact", e.target.value)
    }
    sx={{ "& textarea": { overflow: "hidden" } }}
  />
) : (
  <PrintBox value={row.impact} />
)
}

                        </BodyCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography sx={{ fontSize: 10, color: "#6b7280", mt: 2 }}>
            Classification: Controlled. Copyright ©2025 Version 1. All rights
            reserved.
          </Typography>

          <style>
{`
@media print {
  textarea,
  input {
    display: none !important;
  }

  

  td,
  th {
    white-space: normal !important;
    word-break: break-word !important;
    overflow: visible !important;
    height: auto !important;
    max-height: none !important;
  }

  tr {
    page-break-inside: avoid !important;
  }
}

`}
</style>

        </Box>
      </Box>
    </Box>
  );
}

