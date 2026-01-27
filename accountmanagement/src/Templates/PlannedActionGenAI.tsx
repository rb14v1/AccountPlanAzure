// src/Templates/PlannedActionGenAI.tsx
import React, { useState } from "react";
import DownloadTemplates from "../components/DownloadTemplates";
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
  TextField,
  Paper,
  styled,
  MenuItem,
  Select,
} from "@mui/material";
 
// --- Constants & Types ---
 
export interface ActionRow {
  id: number;
  key: string;
}
 
const AI_INVESTMENT_ROWS: ActionRow[] = [
  { id: 1, key: "AI_Inv_1" },
  { id: 2, key: "AI_Inv_2" },
  { id: 3, key: "AI_Inv_3" },
  { id: 4, key: "AI_Inv_4" },
];
 
const OTHER_ROWS: ActionRow[] = [
  { id: 5, key: "Other_1" },
  { id: 6, key: "Other_2" },
  { id: 7, key: "Other_3" },
  { id: 8, key: "Other_4" },
];
 
const STATUS_OPTIONS = [
  { value: "Completed", color: "#00B050", label: "Completed" },
  { value: "On-track", color: "#FFC000", label: "On-track" },
  { value: "Delayed", color: "#E84C60", label: "Delayed" },
  { value: "To be initiated", color: "#A5A5A5", label: "To be initiated" },
];
 
const TEMPLATE_NAME = "Planned_Action_GenAI";
const HEADER_BG = "#0D2E38";
const TEAL_COLOR = "#0F6674";
 
// --- Styled Components ---
 
const Banner = styled(Box)({
  backgroundColor: "#FFFF00",
  color: "#000",
  fontWeight: "bold",
  textAlign: "center",
  padding: "8px",
  fontSize: "1.2rem",
  marginBottom: "16px",
  textTransform: "uppercase",
});
 
const HeaderCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: HEADER_BG,
  color: "#FFFFFF",
  fontWeight: "bold",
  fontSize: theme.typography.pxToRem(12),
  borderRight: "1px solid #555",
  textAlign: "center",
  padding: theme.spacing(1),
  verticalAlign: "middle",
}));
 
const FocusAreaCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: TEAL_COLOR,
  color: "#fff",
  fontWeight: "bold",
  fontSize: theme.typography.pxToRem(14),
  borderRight: "1px solid #ffffff",
  borderBottom: "1px solid #ffffff",
  padding: theme.spacing(2),
  textAlign: "center",
  verticalAlign: "middle",
  width: "150px",
}));
 
const DataCell = styled(TableCell)({
  borderRight: "1px solid #ddd",
  borderBottom: "1px solid #ddd",
  padding: "4px 8px",
});
 
const StatusBox = styled(Box)<{ bgcolor: string }>(({ bgcolor }) => ({
  width: "100%",
  height: "32px",
  backgroundColor: bgcolor,
  borderRadius: "2px",
}));
 
// --- Main Table Component ---
 
interface GenAITableProps {
  dataSource: any;
  isEditing: boolean;
  onChange: (rowKey: string, field: string, value: string) => void;
}
 
const GenAITable: React.FC<GenAITableProps> = ({
  dataSource,
  isEditing,
  onChange,
}) => {
  const renderRow = (
    row: ActionRow,
    index: number,
    totalRows: number,
    focusAreaTitle: string
  ) => {
    const data = dataSource?.[row.key] || {};
   
    const currentStatus = STATUS_OPTIONS.find(s => s.value === data.Status);
    const statusColor = currentStatus ? currentStatus.color : "#FFFFFF";
 
    return (
      <TableRow key={row.key}>
        {index === 0 && (
          <FocusAreaCell rowSpan={totalRows}>
            {focusAreaTitle}
          </FocusAreaCell>
        )}
 
        <DataCell>
          {isEditing ? (
            <TextField
              size="small"
              fullWidth
              multiline
              value={data.Initiative_Description || ""}
              onChange={(e) => onChange(row.key, "Initiative_Description", e.target.value)}
            />
          ) : (
            data.Initiative_Description || "..."
          )}
        </DataCell>
 
        <DataCell align="center" sx={{ width: "100px" }}>
          {isEditing ? (
            <Select
              size="small"
              fullWidth
              value={data.Status || ""}
              onChange={(e) => onChange(row.key, "Status", e.target.value)}
              sx={{ height: 40, backgroundColor: statusColor, color: "#fff" }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 16, height: 16, bgcolor: opt.color }} />
                    {opt.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          ) : (
             <StatusBox bgcolor={statusColor} />
          )}
        </DataCell>
 
        <DataCell>
          {isEditing ? (
            <TextField
              size="small"
              fullWidth
              value={data.Owner || ""}
              onChange={(e) => onChange(row.key, "Owner", e.target.value)}
            />
          ) : (
            data.Owner || "..."
          )}
        </DataCell>
 
        <DataCell>
          {isEditing ? (
            <TextField
              size="small"
              fullWidth
              value={data.Timeline || ""}
              onChange={(e) => onChange(row.key, "Timeline", e.target.value)}
            />
          ) : (
            data.Timeline || "..."
          )}
        </DataCell>
 
        <DataCell>
          {isEditing ? (
            <TextField
              size="small"
              fullWidth
              value={data.Help_Required || ""}
              onChange={(e) => onChange(row.key, "Help_Required", e.target.value)}
            />
          ) : (
            data.Help_Required || "..."
          )}
        </DataCell>
 
        <DataCell>
          {isEditing ? (
            <TextField
              size="small"
              fullWidth
              value={data.Investments || ""}
              onChange={(e) => onChange(row.key, "Investments", e.target.value)}
            />
          ) : (
            data.Investments || "..."
          )}
        </DataCell>
 
        <DataCell>
          {isEditing ? (
            <TextField
              size="small"
              fullWidth
              value={data.Outcome || ""}
              onChange={(e) => onChange(row.key, "Outcome", e.target.value)}
            />
          ) : (
            data.Outcome || "..."
          )}
        </DataCell>
      </TableRow>
    );
  };
 
  return (
    <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #ccc" }}>
      <Table size="small" sx={{ minWidth: 800 }}>
        <TableHead>
          <TableRow>
            <HeaderCell>Focus Area</HeaderCell>
            <HeaderCell>Initiative Description</HeaderCell>
            <HeaderCell>Status</HeaderCell>
            <HeaderCell>Owner</HeaderCell>
            <HeaderCell>Timeline</HeaderCell>
            <HeaderCell>Help Required</HeaderCell>
            <HeaderCell>Investments needed (€ K)</HeaderCell>
            <HeaderCell>Outcome</HeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {AI_INVESTMENT_ROWS.map((row, index) =>
            renderRow(row, index, AI_INVESTMENT_ROWS.length, "AI + Generative AI investments")
          )}
          {OTHER_ROWS.map((row, index) =>
            renderRow(row, index, OTHER_ROWS.length, "Others")
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
 
// --- Legend ---
const Legend = () => (
  <Box sx={{ display: "flex", justifyContent: "center", gap: 3, mt: 2 }}>
    {STATUS_OPTIONS.map((opt) => (
      <Box key={opt.value} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box sx={{ width: 20, height: 20, bgcolor: opt.color, borderRadius: "2px" }} />
        <Typography variant="body2" sx={{ fontSize: 13 }}>{opt.label}</Typography>
      </Box>
    ))}
  </Box>
);
 
// --- Main Component ---
const PlannedActionGenAI: React.FC = () => {
  // REMOVED useData import. Using local state "savedData" to simulate global storage.
  const [savedData, setSavedData] = useState<any>({});
 
  const [isEditing, setIsEditing] = useState(false);
  const [draftData, setDraftData] = useState<any>({});
 
  const handleStartEdit = () => {
    setDraftData(savedData);
    setIsEditing(true);
  };
 
  const handleCancelEdit = () => {
    setIsEditing(false);
    setDraftData(savedData);
  };
 
  const handleSaveEdit = () => {
    setSavedData(draftData);
    setIsEditing(false);
  };
 
  const handleChange = (rowKey: string, field: string, value: string) => {
    setDraftData((prev: any) => ({
      ...prev,
      [rowKey]: {
        ...(prev[rowKey] || {}),
        [field]: value,
      },
    }));
  };
 
  return (
    <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "#ffffff", p: 2 }}>
      <Box sx={{ maxWidth: 1600, mx: "auto", px: { xs: 1, sm: 4 }, py: 2 }}>
       
        
 
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#008080" }}>
            Planned action for next 12 months: GenAI
          </Typography>
 
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <DownloadTemplates templateName={TEMPLATE_NAME} />
            {!isEditing ? (
              <Button
                variant="outlined"
                onClick={handleStartEdit}
                sx={{ borderColor: "#008080", color: "#008080", ml: 2, "&:hover": { bgcolor: "#e6f4f4" } }}
              >
                Edit
              </Button>
            ) : (
              <>
                <Button
                  variant="contained"
                  onClick={handleSaveEdit}
                  sx={{ bgcolor: "#008080", ml: 2, color: "#fff", "&:hover": { bgcolor: "#006d6d" } }}
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleCancelEdit}
                  sx={{ borderColor: "#008080", color: "#008080", ml: 2, "&:hover": { bgcolor: "#e6f4f4" } }}
                >
                  Cancel
                </Button>
              </>
            )}
          </Box>
        </Box>
 
        <Box id="template-to-download">
          <GenAITable
            dataSource={isEditing ? draftData : savedData}
            isEditing={isEditing}
            onChange={handleChange}
          />
          <Legend />
        </Box>
 
      </Box>
    </Box>
  );
};
 
export default PlannedActionGenAI;
 