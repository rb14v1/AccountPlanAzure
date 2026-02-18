import React from "react";
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  MenuItem,
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

const TEMPLATE_NAME = "Implementation_Plan_Operational_Excellence";

// Define interfaces
interface ImplementationAction {
  category: string;
  subcategory: string;
  action_number: number;
  action_description: string;
  primary_owner: string;
  support_team: string;
  timeline: string;
  status: string;
  help_required: string;
  investment_needed: string;
  impact: string;
}

interface ActionRow {
  id: number;
  action: string;
  status: string;
  primary_owner: string;
  support_team: string;
  timeline: string;
  help_required: string;
  investment_needed: string;
  impact: string;
}

interface GroupData {
  subCategory: string;
  rows: ActionRow[];
}

interface PlanData {
  planDate: string;
  mainCategory: string;
  groups: GroupData[];
}

const STATUS_OPTIONS = [
  "Completed",
  "On-track",
  "Critical",
  "Delayed",
  "To be initiated",
];


const getStatusColor = (status: string) => {
  switch (status) {
    case "Completed":
      return "#8CC63F";
    case "On-track":
      return "#0070C0";
    case "Critical to fast-track":
    case "Critical":
      return "#FFC000";
    case "Delayed":
      return "#C00000";
    case "To be initiated":
      return "#D9D9D9";
    default:
      return "transparent";
  }
};

const HeaderCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: "#011E26",
  color: "#ffffff",
  fontWeight: 700,
  fontSize: theme.typography.pxToRem(11),
  border: "1px solid #ccc",
  padding: "8px 4px",
}));

const BodyCell = styled(TableCell)(({ theme }) => ({
  border: "1px solid #ccc",
  fontSize: theme.typography.pxToRem(11),
  padding: "6px 8px",
  verticalAlign: "top",
  whiteSpace: "normal",
  wordBreak: "break-word",
  height: "auto",       // ✅ allow growth
}));


const MainCategoryCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: "#011E26",
  color: "#ffffff",
  fontWeight: 700,
  textAlign: "center",
  width: 100,
  border: "1px solid #ccc",
  fontSize: theme.typography.pxToRem(11),
}));

const SubCategoryCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: "#177E89",
  color: "#ffffff",
  fontWeight: 700,
  textAlign: "center",
  width: 100,
  border: "1px solid #ccc",
  fontSize: theme.typography.pxToRem(11),
}));

const NumberCell = styled(BodyCell)({
  textAlign: "center",
  width: 30,
});

const StatusCell = styled(TableCell)({
  padding: 0,
  width: 60,
  border: "1px solid #ccc",
});

const InvestmentCell = styled(BodyCell)({
  backgroundColor: "#E6E6E6",
});

const multilineInputProps = {
  style: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    overflow: "hidden",
    lineHeight: 1.4,
  },
};

export default function OperationalImplementationPlan() {
  const [isPrinting, setIsPrinting] = React.useState(false);

  const { globalData, setGlobalData } = useData();
  const implementationData = globalData?.Implementation_Plan || null;

  // Transform data into the structure needed for rendering
  const initialPlanData = React.useMemo(() => {
    if (!implementationData || !implementationData.data) {
      // Return structure with 5 empty placeholder rows
      return {
        planDate: "xx",
        mainCategory: "Operational Excellence",
        groups: [
          {
            subCategory: "",
            rows: Array(5)
              .fill(null)
              .map((_, idx) => ({
                id: idx + 1,
                action: "",
                status: "",
                primary_owner: "",
                support_team: "",
                timeline: "",
                help_required: "",
                investment_needed: "",
                impact: "",
              })),
          },
        ],
      };
    }

    // Group by category and subcategory
    const categoryMap: Record<string, Record<string, ImplementationAction[]>> = {};
    implementationData.data.forEach((action: ImplementationAction) => {
      if (!categoryMap[action.category]) {
        categoryMap[action.category] = {};
      }
      if (!categoryMap[action.category][action.subcategory]) {
        categoryMap[action.category][action.subcategory] = [];
      }
      categoryMap[action.category][action.subcategory].push(action);
    });

    // Get the first category as main category (usually "Operational Excellence")
    const mainCategory = Object.keys(categoryMap)[0] || "Operational Excellence";

    // Transform into groups structure
    const groups = Object.entries(categoryMap[mainCategory] || {}).map(
      ([subCategory, actions]) => ({
        subCategory,
        rows: actions.map((action) => ({
          id: action.action_number,
          action: action.action_description,
          status: action.status,
          primary_owner: action.primary_owner,
          support_team: action.support_team,
          timeline: action.timeline,
          help_required: action.help_required,
          investment_needed: action.investment_needed,
          impact: action.impact,
        })),
      })
    );

    return {
      planDate: implementationData.plan_date || "xx",
      mainCategory,
      groups,
    };
  }, [implementationData]);

  // Initialize editable table hook
  const editable = useEditableTable<PlanData>(initialPlanData);

  // Handle plan date change
  const handlePlanDateChange = (value: string) => {
    editable.updateDraft({
      ...editable.draftData,
      planDate: value,
    });
  };

  // Handle main category change
  const handleMainCategoryChange = (value: string) => {
    editable.updateDraft({
      ...editable.draftData,
      mainCategory: value,
    });
  };

  // Handle subcategory change
  const handleSubCategoryChange = (groupIndex: number, value: string) => {
    const updatedGroups = [...editable.draftData.groups];
    updatedGroups[groupIndex] = {
      ...updatedGroups[groupIndex],
      subCategory: value,
    };
    editable.updateDraft({
      ...editable.draftData,
      groups: updatedGroups,
    });
  };

  // Handle row field change
  const handleRowChange = (
    groupIndex: number,
    rowIndex: number,
    field: keyof ActionRow,
    value: string | number
  ) => {
    const updatedGroups = [...editable.draftData.groups];
    const updatedRows = [...updatedGroups[groupIndex].rows];
    updatedRows[rowIndex] = {
      ...updatedRows[rowIndex],
      [field]: value,
    };
    updatedGroups[groupIndex] = {
      ...updatedGroups[groupIndex],
      rows: updatedRows,
    };
    editable.updateDraft({
      ...editable.draftData,
      groups: updatedGroups,
    });
  };

  const totalRows = editable.draftData.groups.reduce((acc, g) => acc + g.rows.length, 0);

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "#ffffff", p: 2 }}>
      <Box sx={{ maxWidth: 1600, mx: "auto", px: 4, py: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 3,
          }}
        >
          <Typography fontSize={35} fontWeight={700} sx={{ color: "teal" }}>
            Implementation plan for operational excellence, delivery, and talent
          </Typography>

          <Box sx={{ display: "flex", gap: 2 }}>
            <DownloadTemplates
  templateName={TEMPLATE_NAME}
  onBeforeDownload={() => setIsPrinting(true)}
  onAfterDownload={() => setIsPrinting(false)}
/>


            {!editable.isEditing ? (
              <Button
                variant="outlined"
                onClick={editable.startEdit}
                sx={{
                  borderColor: "#008080",
                  color: "#008080",
                  "&:hover": {
                    borderColor: "#006d6d",
                    backgroundColor: "#e6f4f4",
                  },
                }}
              >
                Edit
              </Button>
            ) : (
              <>
                <Button
                  variant="contained"
                  onClick={() =>
                    editable.saveEdit((data) => {
                      const flattenedActions = data.groups.flatMap((group) =>
                        group.rows.map((row) => ({
                          category: data.mainCategory,
                          subcategory: group.subCategory,
                          action_number: row.id,
                          action_description: row.action,
                          primary_owner: row.primary_owner,
                          support_team: row.support_team,
                          timeline: row.timeline,
                          status: row.status,
                          help_required: row.help_required,
                          investment_needed: row.investment_needed,
                          impact: row.impact,
                        }))
                      );

                      setGlobalData((prev: any) => ({
                        ...prev,
                        Implementation_Plan: {
                          plan_date: data.planDate,
                          data: flattenedActions,
                        },
                      }));
                    })
                  }
                  sx={{
                    backgroundColor: "#008080",
                    color: "#fff",
                    "&:hover": {
                      backgroundColor: "#006d6d",
                    },
                  }}
                >
                  Save
                </Button>

                <Button
                  variant="outlined"
                  onClick={editable.cancelEdit}
                  sx={{
                    borderColor: "#008080",
                    color: "#008080",
                    "&:hover": {
                      borderColor: "#006d6d",
                      backgroundColor: "#e6f4f4",
                    },
                  }}
                >
                  Cancel
                </Button>
              </>
            )}
          </Box>
        </Box>

        <Box id="template-to-download" className="template-section">
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Plan date:</Typography>
            {editable.isEditing ? (
              <TextField
                size="small"
                value={editable.draftData.planDate}
                onChange={(e) => handlePlanDateChange(e.target.value)}
                sx={{ width: 150 }}
              />
            ) : (
              <Typography sx={{ fontSize: 14 }}>
                {editable.draftData.planDate}
              </Typography>
            )}
          </Box>

          {/* Legend */}
          <Box sx={{ color:"#111111",display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
            {[
              { l: "Completed", c: "#8CC63F" },
              { l: "On-track", c: "#0070C0" },
              { l: "Critical", c: "#FFC000" },
              { l: "Delayed", c: "#C00000" },
              { l: "To be initiated", c: "#D9D9D9" },
            ].map((i) => (
              <Box
                key={i.l}
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    bgcolor: i.c,
                    border: "1px solid #ccc",
                  }}
                />
                <Typography sx={{ fontSize: 12 }}>{i.l}</Typography>
              </Box>
            ))}
          </Box>

          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table
  size="small"
  sx={{
    borderCollapse: "collapse",
    tableLayout: "fixed",
    width: "100%",
    minWidth: 1200, // ✅ IMPORTANT for PDF
  }}
>

  <colgroup>
  <col style={{ width: "10%" }} /> {/* Main Category */}
  <col style={{ width: "10%" }} /> {/* Sub Category */}
  <col style={{ width: "4%" }} />  {/* # */}
  <col style={{ width: "16%" }} /> {/* Action */}
  <col style={{ width: "12%" }} /> {/* Primary Owner */}
  <col style={{ width: "12%" }} /> {/* Support Team */}
  <col style={{ width: "10%" }} /> {/* Timeline */}
  <col style={{ width: "8%" }} />  {/* Status */}
  <col style={{ width: "12%" }} /> {/* Help Required */}
  <col style={{ width: "8%" }} />  {/* Investment Needed */}
  <col style={{ width: "8%" }} />  {/* Impact */}
</colgroup>


              <TableHead>
  <TableRow>
    <HeaderCell>Category</HeaderCell>
    <HeaderCell>Sub Category</HeaderCell>
    <HeaderCell>#</HeaderCell>
    <HeaderCell>Action</HeaderCell>
    <HeaderCell>Primary Owner</HeaderCell>
    <HeaderCell>Support Team</HeaderCell>
    <HeaderCell>Timeline</HeaderCell>
    <HeaderCell>Status</HeaderCell>
    <HeaderCell>Help Required</HeaderCell>
    <HeaderCell>Investment Needed</HeaderCell>
    <HeaderCell>Impact</HeaderCell>
  </TableRow>
</TableHead>

              <TableBody>
                {editable.draftData.groups.map((group, gi) =>
                  group.rows.map((row, ri) => (
                    <TableRow key={`${gi}-${ri}`}>
                      {/* Main Category cell with rowspan */}
                      {(!isPrinting && gi === 0 && ri === 0) && (
  <MainCategoryCell rowSpan={totalRows}>

                          {editable.isEditing && !isPrinting ? (
  <TextField
    size="small"
    fullWidth
    multiline
    minRows={1}
    value={editable.draftData.mainCategory}
    onChange={(e) =>
      handleMainCategoryChange(e.target.value)
    }
    InputProps={multilineInputProps}
  />
) : (
  <Box sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
    {editable.draftData.mainCategory || ""}
  </Box>
)}

                        </MainCategoryCell>
                      )}

                      {/* SubCategory cell with rowspan */}
                      {!isPrinting && ri === 0 && (
  <SubCategoryCell rowSpan={group.rows.length}>
    {editable.isEditing && !isPrinting ? (
      <TextField
        size="small"
        fullWidth
        multiline
        minRows={1}
        value={group.subCategory}
        onChange={(e) =>
          handleSubCategoryChange(gi, e.target.value)
        }
        InputProps={multilineInputProps}
      />
    ) : (
      <Box sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {group.subCategory || ""}
      </Box>
    )}
  </SubCategoryCell>
)}


                      <NumberCell>{row.id}</NumberCell>

                      <BodyCell>
  {editable.isEditing && !isPrinting ? (
  <TextField
    size="small"
    fullWidth
    multiline
    minRows={1}
    value={row.action}
    onChange={(e) =>
      handleRowChange(gi, ri, "action", e.target.value)
    }
    InputProps={multilineInputProps}
  />
) : (
  <Box sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
    {row.action || ""}
  </Box>
)}

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
      handleRowChange(gi, ri, "primary_owner", e.target.value)
    }
    InputProps={multilineInputProps}
  />
) : (
  <Box sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
    {row.primary_owner || ""}
  </Box>
)}

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
      handleRowChange(gi, ri, "support_team", e.target.value)
    }
    InputProps={multilineInputProps}
  />
) : (
  <Box sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
    {row.support_team || ""}
  </Box>
)}

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
      handleRowChange(gi, ri, "timeline", e.target.value)
    }
    InputProps={multilineInputProps}
  />
) : (
  <Box sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
    {row.timeline || ""}
  </Box>
)}

</BodyCell>


                      <StatusCell>
                        {editable.isEditing ? (
                          <TextField
                            select
                            size="small"
                            fullWidth
                            value={row.status}
                            onChange={(e) =>
                              handleRowChange(gi, ri, "status", e.target.value)
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
                          <Box
                            sx={{
                              backgroundColor: getStatusColor(row.status),
                              width: "100%",
                              height: "100%",
                              minHeight: 30,
                            }}
                          />
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
      handleRowChange(gi, ri, "help_required", e.target.value)
    }
    InputProps={multilineInputProps}
  />
) : (
  <Box sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
    {row.help_required || ""}
  </Box>
)}

</BodyCell>


                      <InvestmentCell>
  {editable.isEditing && !isPrinting ? (
  <TextField
    size="small"
    fullWidth
    multiline
    minRows={1}
    value={row.investment_needed}
    onChange={(e) =>
      handleRowChange(gi, ri, "investment_needed", e.target.value)
    }
    InputProps={multilineInputProps}
  />
) : (
  <Box sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
    {row.investment_needed || ""}
  </Box>
)}

</InvestmentCell>


                      <BodyCell>
  {editable.isEditing && !isPrinting ? (
  <TextField
    size="small"
    fullWidth
    multiline
    minRows={1}
    value={row.impact}
    onChange={(e) =>
      handleRowChange(gi, ri, "impact", e.target.value)
    }
    InputProps={multilineInputProps}
  />
) : (
  <Box sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
    {row.impact || ""}
  </Box>
)}

</BodyCell>

                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography sx={{ fontSize: 10, color: "#6b7280", mt: 2 }}>
            Classification: Controlled. Copyright ©2025 Version 1. All rights
            reserved.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
