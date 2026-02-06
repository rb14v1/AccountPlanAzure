import React, { useEffect, useMemo, useState } from 'react';
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
  Stack,
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

const TEMPLATE_NAME = "Account_Dashboard";
const TEMPLATE_KEY = "account_dashboard"; // backend template_name
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

const AccountDashboard: React.FC = () => {
  const { globalData } = useData();

  // 1) Define initial structure
  const initialValues = useMemo(() => {
    return DATA.reduce((acc: any, group) => {
      group.metrics.forEach(m => {
        acc[m.metric] = QUARTERS.reduce((qAcc: any, q) => ({ ...qAcc, [q]: "" }), {});
      });
      return acc;
    }, {});
  }, []);

  // 2) State to hold the saved data (persists after clicking Save)
  const [savedData, setSavedData] = useState<any>(initialValues);

  // 3) Hook initialized with savedData
  const editable = useEditableTable(savedData);

  // 4) Company input for Auto-Fill
  const [companyName, setCompanyName] = useState<string>("");

  const applyFilledData = (filled: any) => {
    if (!filled || typeof filled !== "object") return;

    const merged = { ...initialValues } as any;
    Object.keys(initialValues).forEach((metric) => {
      const row = (filled as any)[metric];
      if (row && typeof row === "object") {
        QUARTERS.forEach((q) => {
          const v = (row as any)[q];
          if (v !== undefined && v !== null && String(v).trim() !== "") {
            merged[metric][q] = String(v).trim();
          }
        });
      }
    });

    setSavedData(merged);
    editable.updateDraft(merged);
  };

  // ✅ If chatbot fills Account Dashboard, auto-apply here
  useEffect(() => {
    const filled = (globalData as any)?.account_dashboard;
    applyFilledData(filled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalData]);

  // ✅ Manual Auto-Fill (calls backend fill-template directly)
  const handleAutoFill = async () => {
    const userId = (localStorage.getItem("user_id") || "").trim() || "101";
    const company = companyName.trim();
    if (!company) {
      alert("Please enter Company Name (e.g., NatWest)");
      return;
    }

    try {
      const res = await fetch("/api/fill-template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": userId,
        },
        body: JSON.stringify({
          user_id: userId,
          template_name: TEMPLATE_KEY,
          company_name: company,
        }),
      });

      const text = await res.text();
      let payload: any = null;

      try {
        payload = text ? JSON.parse(text) : null;
      } catch (e) {
        console.error("Non-JSON response from backend:", text);
        alert("Backend returned non-JSON. Check Django logs.\n\n" + text.slice(0, 500));
        return;
      }

      if (!res.ok) {
        console.error("fill-template error:", payload);
        alert(payload?.error || "Failed to fill template");
        return;
      }


      if (!res.ok) {
        console.error("fill-template error:", payload);
        alert(payload?.error || "Failed to fill template");
        return;
      }

      // payload = { template_type, data: {...} }
      applyFilledData(payload?.data);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Error calling fill-template");
    }
  };

  const handleCellChange = (metric: string, quarter: string, value: string) => {
    editable.updateDraft({
      ...editable.draftData,
      [metric]: {
        ...editable.draftData[metric],
        [quarter]: value
      }
    });
  };

  const handleSave = () => {
    editable.saveEdit((data: any) => {
      setSavedData(data);
      console.log("Saved Account Dashboard:", data);
    });
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#fff', minHeight: '100vh' }}>

      {/* TOP BAR */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <TextField
            size="small"
            label="Company Name"
            placeholder="NatWest"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
          <Button
            variant="contained"
            onClick={handleAutoFill}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Auto-Fill
          </Button>
          <Typography variant="body2" sx={{ color: "#555" }}>
            Tip: You can also fill via chatbot which sets <code>globalData.account_dashboard</code>.
          </Typography>
        </Stack>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <DownloadTemplates templateName={TEMPLATE_NAME} />
          {!editable.isEditing ? (
            <Button
              variant="outlined"
              onClick={() => editable.startEdit(savedData)}
              sx={{
                borderColor: "#00b5ad", color: "#00b5ad", fontWeight: 600,
                borderRadius: 2,
              }}
            >
              Edit
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleSave}
              sx={{
                backgroundColor: "#00b5ad", fontWeight: 700,
                borderRadius: 2,
              }}
            >
              Save
            </Button>
          )}
        </Box>
      </Box>

      {/* TABLE */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Theme</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Metric</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Unit</TableCell>
              {QUARTERS.map((q) => (
                <TableCell key={q} align="center" sx={{ fontWeight: 800 }}>{q}</TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {DATA.map((group) => (
              group.metrics.map((m, idx) => (
                <TableRow key={`${group.theme}-${m.metric}`}>
                  {idx === 0 && (
                    <TableCell
                      rowSpan={group.metrics.length}
                      sx={{
                        fontWeight: 800,
                        color: "#fff",
                        backgroundColor: group.color,
                        width: 140,
                      }}
                    >
                      {group.theme}
                    </TableCell>
                  )}

                  <TableCell sx={{ fontWeight: 700 }}>{m.metric}</TableCell>
                  <TableCell sx={{ color: "#666" }}>{m.unit}</TableCell>

                  {QUARTERS.map((q) => (
                    <TableCell key={q} align="center" sx={{ minWidth: 90 }}>
                      {editable.isEditing ? (
                        <TextField
                          value={editable.draftData?.[m.metric]?.[q] ?? ""}
                          onChange={(e) => handleCellChange(m.metric, q, e.target.value)}
                          size="small"
                          variant="outlined"
                          sx={{ width: 90 }}
                        />
                      ) : (
                        <Typography variant="body2">
                          {savedData?.[m.metric]?.[q] ?? ""}
                        </Typography>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AccountDashboard;
