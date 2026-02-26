import React, { useState } from "react";
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
} from "@mui/material";
import DownloadTemplates from "../components/DownloadTemplates";
import { useEditableTable } from "../hooks/useEditableTable";
import { useData } from "../context/DataContext";
 
interface APIPartnershipRow {
  id?: number;
  partner_name: string;
  internal_poc: string;
  partner_type: string;
  sell_with_revenue_fy25_actuals_forecast: string;
  sell_with_revenue_fy26_target: string;
  key_engagements: string;
  support_needed: string;
}
 
const TEMPLATE_NAME = "Strategic_Partnerships";
 
const headerCell = {
  backgroundColor: "#022D36",
  color: "white",
  fontSize: 11,
  fontWeight: 700,
  border: "1px solid #ccc",
  verticalAlign: "middle",
};
 
const subHeaderCell = {
  ...headerCell,
  fontSize: 10,
  textAlign: "center",
};
 
const bodyCell = {
  fontSize: 11,
  border: "1px solid #ccc",
  verticalAlign: "top",
  whiteSpace: "normal",
  wordBreak: "break-word",
};
 
const partnerCell = {
  ...bodyCell,
  backgroundColor: "#177E89",
  color: "white",
  fontWeight: 700,
};
 
// Used ONLY for view & PDF
const PrintBox = ({ value }: { value: string }) => (
  <Box
    sx={{
      whiteSpace: "pre-wrap",
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
 
const AutoGrowTextField = ({ value, onChange }: any) => (
  <TextField
    fullWidth
    multiline
    minRows={1}
    size="small"
    value={value}
    onChange={onChange}
    InputProps={{
      style: {
        fontSize: "0.75rem",
        lineHeight: "1.4",
        overflow: "hidden",
        resize: "none",
      },
    }}
    sx={{ "& textarea": { overflow: "hidden" } }}
  />
);
 
export default function StrategicPartnershipsPage() {
  const { globalData, setGlobalData } = useData();
  const contextData = globalData?.strategic_partnerships || null;
  const [isPrinting, setIsPrinting] = useState(false);
 
  const partnershipsData: APIPartnershipRow[] = contextData?.partnerships || [];
 
  // Pad to ensure minimum 5 rows
  const initialRows: APIPartnershipRow[] = [...partnershipsData];
  while (initialRows.length < 5) {
    initialRows.push({
      partner_name: "", internal_poc: "", partner_type: "",
      sell_with_revenue_fy25_actuals_forecast: "", sell_with_revenue_fy26_target: "",
      key_engagements: "", support_needed: "",
    });
  }
 
  // Hooked up to custom editable hook
  const editable = useEditableTable(initialRows);
 
  const handleFieldChange = (index: number, field: keyof APIPartnershipRow, value: string) => {
    const updatedData = [...editable.draftData];
    updatedData[index] = { ...updatedData[index], [field]: value };
    editable.updateDraft(updatedData);
  };
 
  const handleSave = () => {
    editable.saveEdit((updatedData) => {
      setGlobalData((prev: any) => ({
        ...prev,
        strategic_partnerships: { partnerships: updatedData },
      }));
    });
  };
 
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mb: 2, gap: 2 }}>
        <DownloadTemplates
          templateName={TEMPLATE_NAME}
          beforeDownload={() => setIsPrinting(true)}
          afterDownload={() => setIsPrinting(false)}
        />
 
        {!editable.isEditing ? (
          <Button
            variant="outlined"
            onClick={editable.startEdit}
            sx={{ borderColor: "#008080", color: "#008080", "&:hover": { borderColor: "#006d6d", backgroundColor: "#e6f4f4" } }}
          >
            Edit
          </Button>
        ) : (
          <>
            <Button
              variant="contained"
              onClick={handleSave}
              sx={{ backgroundColor: "#008080", color: "#fff", "&:hover": { backgroundColor: "#006d6d" } }}
            >
              Save
            </Button>
            <Button
              variant="outlined"
              onClick={editable.cancelEdit}
              sx={{ borderColor: "#008080", color: "#008080", "&:hover": { borderColor: "#006d6d", backgroundColor: "#e6f4f4" } }}
            >
              Cancel
            </Button>
          </>
        )}
      </Box>
 
      <Box id="template-to-download" className="template-section">
        <Box class="pdf-section">
        {isPrinting && (
          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0 }}>
            <Table sx={{ width: "100%", tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "14%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "19%" }} />
                <col style={{ width: "19%" }} />
              </colgroup>
              <TableHead sx={{ display: "table-header-group" }}>
                <TableRow>
                  <TableCell sx={headerCell}>Partner *</TableCell>
                  <TableCell sx={headerCell}>Internal POC</TableCell>
                  <TableCell sx={headerCell}>Partner type</TableCell>
                  <TableCell sx={headerCell}>Sell-with Revenue<br />FY25 (Actuals + Forecast)</TableCell>
                  <TableCell sx={headerCell}>Sell-with Revenue<br />FY26 (Target)</TableCell>
                  <TableCell sx={headerCell}>Key Engagements</TableCell>
                  <TableCell sx={headerCell}>Support needed</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {editable.draftData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell sx={partnerCell}><PrintBox value={row.partner_name} /></TableCell>
                    <TableCell sx={bodyCell}><PrintBox value={row.internal_poc} /></TableCell>
                    <TableCell sx={bodyCell}><PrintBox value={row.partner_type} /></TableCell>
                    <TableCell sx={bodyCell}><PrintBox value={row.sell_with_revenue_fy25_actuals_forecast} /></TableCell>
                    <TableCell sx={bodyCell}><PrintBox value={row.sell_with_revenue_fy26_target} /></TableCell>
                    <TableCell sx={bodyCell}><PrintBox value={row.key_engagements} /></TableCell>
                    <TableCell sx={bodyCell}><PrintBox value={row.support_needed} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
 
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, color: "#008080" }}>
          Strategic partnerships
        </Typography>
 
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0 }}>
          <Table sx={{ tableLayout: "fixed", width: "100%" }}>
            <colgroup>
              <col style={{ width: "14%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "19%" }} />
              <col style={{ width: "19%" }} />
            </colgroup>
            <TableHead sx={{ display: "table-header-group" }}>
              <TableRow>
                <TableCell sx={headerCell}>Partner *</TableCell>
                <TableCell sx={headerCell}>Internal POC</TableCell>
                <TableCell sx={headerCell}>Partner type</TableCell>
                <TableCell sx={headerCell} colSpan={2} align="center">Sell-with Revenue</TableCell>
                <TableCell sx={headerCell}>Key Engagements</TableCell>
                <TableCell sx={headerCell}>Support needed</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={subHeaderCell} />
                <TableCell sx={subHeaderCell} />
                <TableCell sx={subHeaderCell} />
                <TableCell sx={subHeaderCell}>FY25<br />(Actuals + Forecast)</TableCell>
                <TableCell sx={subHeaderCell}>FY26<br />(Target)</TableCell>
                <TableCell sx={subHeaderCell} />
                <TableCell sx={subHeaderCell} />
              </TableRow>
            </TableHead>
            <TableBody>
              {editable.draftData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell sx={partnerCell}>
                    {editable.isEditing && !isPrinting ? (
                      <AutoGrowTextField
                        value={row.partner_name}
                        onChange={(e: any) => handleFieldChange(index, "partner_name", e.target.value)}
                      />
                    ) : ( <PrintBox value={row.partner_name} /> )}
                  </TableCell>
                  <TableCell sx={bodyCell}>
                    {editable.isEditing && !isPrinting ? (
                      <TextField fullWidth size="small" multiline minRows={1} value={row.internal_poc} onChange={(e) => handleFieldChange(index, "internal_poc", e.target.value)} />
                    ) : ( <PrintBox value={row.internal_poc} /> )}
                  </TableCell>
                  <TableCell sx={bodyCell}>
                    {editable.isEditing && !isPrinting ? (
                      <TextField fullWidth size="small" multiline minRows={1} value={row.partner_type} onChange={(e) => handleFieldChange(index, "partner_type", e.target.value)} />
                    ) : ( <PrintBox value={row.partner_type} /> )}
                  </TableCell>
                  <TableCell sx={bodyCell}>
                    {editable.isEditing && !isPrinting ? (
                      <TextField fullWidth size="small" multiline minRows={1} value={row.sell_with_revenue_fy25_actuals_forecast} onChange={(e) => handleFieldChange(index, "sell_with_revenue_fy25_actuals_forecast", e.target.value)} InputProps={{ style: { overflow: "hidden", resize: "none" } }} />
                    ) : ( <PrintBox value={row.sell_with_revenue_fy25_actuals_forecast} /> )}
                  </TableCell>
                  <TableCell sx={bodyCell}>
                    {editable.isEditing && !isPrinting ? (
                      <TextField fullWidth size="small" multiline minRows={1} value={row.sell_with_revenue_fy26_target} onChange={(e) => handleFieldChange(index, "sell_with_revenue_fy26_target", e.target.value)} InputProps={{ style: { overflow: "hidden", resize: "none" } }} />
                    ) : ( <PrintBox value={row.sell_with_revenue_fy26_target} /> )}
                  </TableCell>
                  <TableCell sx={bodyCell}>
                    {editable.isEditing && !isPrinting ? (
                      <TextField fullWidth size="small" multiline value={row.key_engagements} onChange={(e) => handleFieldChange(index, "key_engagements", e.target.value)} />
                    ) : ( <PrintBox value={row.key_engagements} /> )}
                  </TableCell>
                  <TableCell sx={bodyCell}>
                    {editable.isEditing && !isPrinting ? (
                      <TextField fullWidth size="small" multiline minRows={1} value={row.support_needed} onChange={(e) => handleFieldChange(index, "support_needed", e.target.value)} InputProps={{ style: { overflow: "hidden", resize: "none" } }} />
                    ) : ( <PrintBox value={row.support_needed} /> )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
       
        <style>
          {`
            @media print {
              textarea, input { display: none !important; }
              table { table-layout: fixed !important; width: 100% !important; }
              th, td { white-space: pre-wrap !important; word-break: break-word !important; overflow: visible !important; height: auto !important; max-height: none !important; vertical-align: top !important; }
              thead { display: table-header-group !important; }
              tr { page-break-inside: avoid !important; }
            }
          `}
        </style>
      </Box>
      </Box>
    </Box>
  );
}
 