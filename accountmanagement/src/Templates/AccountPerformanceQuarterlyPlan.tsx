import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
} from '@mui/material';
import { useEditableTable } from "../hooks/useEditableTable";
import DownloadTemplates from "../components/DownloadTemplates";
import { useData } from "../context/DataContext";

interface MetricRow {
  metric: string;
  unit: string;
}
 
interface ThemeGroup {
  theme: string;
  color: string;
  metrics: MetricRow[];
}
 
const TEMPLATE_NAME = "account_performance_quarterly_plan";
const QUARTERS = ['Q1 FY25', 'Q2 FY25', 'Q3 FY25', 'Q4 FY25', 'Q1 FY26', 'Q2 FY26', 'Q3 FY26', 'Q4 FY26'];
 
const DATA: ThemeGroup[] = [
  {
    theme: 'Revenue',
    color: '#006d87',
    metrics: [
      { metric: 'Revenue Budget', unit: '€ Mn' },
      { metric: 'Revenue Actuals / Forecast', unit: '€ Mn' },
      { metric: 'TCV won', unit: '€ Mn' },
      { metric: 'Win rate (YTD)', unit: '%' },
      { metric: 'Book to bill ratio', unit: '#' },
      { metric: 'SL revenue penetration %', unit: '%' },
      { metric: '# of SLs present in the account*', unit: '#' },
    ],
  },
  {
    theme: 'Delivery Ops',
    color: '#006d87',
    metrics: [
      { metric: 'Gross Margin %', unit: '%' },
      { metric: 'Revenue / FTE (ONS)', unit: '€ K' },
      { metric: 'Revenue / FTE (OFS)', unit: '€ K' },
      { metric: 'Cost / FTE (ONS)', unit: '#' },
      { metric: 'Cost / FTE (OFS)', unit: '#' },
    ],
  },
  {
    theme: 'Talent',
    color: '#006d87',
    metrics: [
      { metric: 'Attrition %', unit: '%' },
      { metric: 'Fulfilment %', unit: '%' },
      { metric: 'Delivery on time %', unit: '%' },
    ],
  },
];
 
const AccountPerformanceQuarterlyPlan: React.FC = () => {
  // 1. Define initial structure
  const initialValues = DATA.reduce((acc: any, group) => {
    group.metrics.forEach(m => {
      acc[m.metric] = QUARTERS.reduce((qAcc: any, q) => ({ ...qAcc, [q]: "" }), {});
    });
    return acc;
  }, {});
 
  // 2. State to hold the saved data (persists after clicking Save)
  const { globalData, setGlobalData } = useData();

  // Get backend data
  const contextData = globalData?.account_performance_quarterly_plan || null;

  // If data exists, use it, else fallback
  const initialData = contextData || initialValues;

  // Editable hook
  const editable = useEditableTable(initialData);
 
  const handleCellChange = (metric: string, quarter: string, value: string) => {
    editable.updateDraft({
      ...editable.draftData,
      [metric]: {
        ...(editable.draftData[metric] || {}), // <-- 🚨 ADDED || {} fallback
        [quarter]: value
      }
    });
  };
 
  const handleSave = () => {
  editable.saveEdit((data) => {
    setGlobalData((prev: any) => ({
      ...prev,
      account_performance_quarterly_plan: data,
    }));
  });
};
 
  return (
    <Box sx={{ p: 3, backgroundColor: '#fff', minHeight: '100vh' }}>
     
      {/* 1. TOP SECTION: BUTTONS */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <DownloadTemplates templateName={TEMPLATE_NAME} />
          {!editable.isEditing ? (
            <Button
              variant="outlined"
              // PASS savedData to retain previous changes
              onClick={() => editable.startEdit(editable.draftData)}
              sx={{
                borderColor: "#00b5ad", color: "#00b5ad", fontWeight: 600,
                borderRadius: 2,
                "&:hover": { borderColor: "#008a84", backgroundColor: "#e0f7f6" }
              }}
            >
              EDIT
            </Button>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                onClick={handleSave}
                sx={{ backgroundColor: "#00b5ad", fontWeight: 600, borderRadius: 2, "&:hover": { backgroundColor: "#008a84" } }}
              >
                SAVE
              </Button>
              <Button
                variant="outlined"
                onClick={editable.cancelEdit}
                sx={{ borderColor: "#00b5ad", color: "#00b5ad", fontWeight: 600, borderRadius: 2 }}
              >
                CANCEL
              </Button>
            </Box>
          )}
        </Box>
      </Box>
 
      {/* 2. TEMPLATE CONTENT AREA */}
      <Box id="template-to-download" className="template-section">
       
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, px: 1 }}>
          <Typography variant="h4" sx={{ color: '#00b5ad', fontWeight: 'bold' }}>
            Account performance : Quarterly Plan
          </Typography>
         
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 18, height: 18, backgroundColor: '#00b5ad' }} />
              <Typography variant="caption" sx={{ fontWeight: 500, color: '#555' }}>Actuals + Forecast</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 18, height: 18, backgroundColor: '#f39c12' }} />
              <Typography variant="caption" sx={{ fontWeight: 500, color: '#555' }}>Target</Typography>
            </Box>
          </Box>
        </Box>
 
        <Paper sx={{ borderRadius: 0, boxShadow: '0px 2px 10px rgba(0,0,0,0.05)', backgroundColor: '#fff', overflow: 'hidden' }}>
          <Box sx={{ backgroundColor: '#001e28', color: 'white', p: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', px: 1 }}>
              Account Summary Dashboard
            </Typography>
          </Box>
 
          <Box sx={{ height: '4px', backgroundColor: '#fff' }} />
 
          <TableContainer>
            <Table size="small" sx={{ borderCollapse: 'collapse' }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#000' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #333', py: 1 }}>Theme</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #333', py: 1 }}>Metrics</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #333', width: '100px', py: 1 }}>Unit</TableCell>
                  {QUARTERS.map((q, index) => (
                    <TableCell
                      key={q} align="center"
                      sx={{
                        color: 'white', fontWeight: 'bold', border: '1px solid #333', fontSize: '0.75rem',
                        backgroundColor: index > 2 ? '#f39c12' : '#00b5ad', whiteSpace: 'nowrap'
                      }}
                    >
                      {q}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {DATA.map((group) => (
                  <React.Fragment key={group.theme}>
                    {group.metrics.map((row, index) => (
                      <TableRow key={row.metric}>
                        {index === 0 && (
                          <TableCell
                            rowSpan={group.metrics.length}
                            sx={{
                              backgroundColor: '#006d87', color: 'white', fontWeight: 'bold',
                              textAlign: 'center', border: '1px solid #dee2e6', verticalAlign: 'middle', width: '120px'
                            }}
                          >
                            {group.theme}
                          </TableCell>
                        )}
                        <TableCell sx={{ border: '1px solid #dee2e6', fontWeight: 500, py: 1 }}>{row.metric}</TableCell>
                        <TableCell sx={{ border: '1px solid #dee2e6', textAlign: 'center', width: '100px', whiteSpace: 'nowrap' }}>
                          {row.unit}
                        </TableCell>
                        {QUARTERS.map((q) => (
                          <TableCell key={q} sx={{ border: '1px solid #dee2e6', p: editable.isEditing ? 0.5 : 1, minWidth: 80 }}>
                            {editable.isEditing ? (
                              <TextField
                                size="small"
                                fullWidth
                                variant="standard"
                                value={editable.draftData[row.metric][q]}
                                onChange={(e) => handleCellChange(row.metric, q, e.target.value)}
                                InputProps={{ disableUnderline: true, sx: { fontSize: '0.85rem', textAlign: 'center' } }}
                              />
                            ) : (
                              <Typography sx={{ fontSize: '0.85rem', textAlign: 'center' }}>
                                {editable.draftData[row.metric]?.[q] || ""} {/* <-- 🚨 ADDED ?. and || "" fallback */}
                              </Typography>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
};
 
export default AccountPerformanceQuarterlyPlan;
 
 