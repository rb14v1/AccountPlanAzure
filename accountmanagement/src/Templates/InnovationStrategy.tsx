import React, { useState, useEffect, useRef } from 'react';
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
  Snackbar,
  Alert
} from '@mui/material';
import { useData } from "../context/DataContext";
import { useEditableTable } from "../hooks/useEditableTable";
import DownloadTemplates from "../components/DownloadTemplates";

const API_BASE_URL = "http://localhost:8000/api";
const TEMPLATE_NAME = "Innovation_Strategy";

interface StrategyRow {
  id: string;
  keyConnection: string;
  subText?: string;
}

const STRATEGY_DATA: StrategyRow[] = [
  {
    id: '1',
    keyConnection: "What is the customer's current outlook on AI/ GenAI, and where do they position themselves in their adoption journey—are they a leader, laggard, or fence-sitter?"
  },
  {
    id: '2',
    keyConnection: "What are the top motivations for the client to pursue GenAI strategy?",
    subText: "(E.g., Driver of growth, productivity gains, improving customer satisfaction, etc. )"
  },
  {
    id: '3a',
    keyConnection: "What are the top GenAI projects/ investments client is making?"
  },
  {
    id: '3b',
    keyConnection: "What are the other innovation projects/ investments client is making?"
  },
  {
    id: '4',
    keyConnection: "Basis your understanding of client's GenAI strategy, which use-cases can offer the most value (e.g., customer service, personalization, content creation) in the near future?"
  },
];

const InnovationStrategy: React.FC = () => {
  const { globalData, setGlobalData } = useData();
  const userId = globalData?.user_id || localStorage.getItem("user_id") || "101";
  const dataLoaded = useRef(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as any });

  // 1. Initialize empty values
  const initialValues = STRATEGY_DATA.reduce((acc: any, row) => {
    acc[row.id] = "";
    return acc;
  }, {});

  const [savedData, setSavedData] = useState(initialValues);
  const editable = useEditableTable(savedData);

  // 2. Fetch Data from DB
  useEffect(() => {
    const fetchData = async () => {
      if (dataLoaded.current) return;
      try {
        const res = await fetch(`${API_BASE_URL}/innovation-strategy/?user_id=${userId}`);
        const dbData = await res.json();

        if (dbData && Object.keys(dbData).length > 0) {
          setSavedData(dbData);
          editable.updateDraft(dbData);
          setGlobalData((prev: any) => ({ ...prev, innovation_strategy: dbData }));
          dataLoaded.current = true;
        }
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };
    fetchData();
  }, [userId]);

  // 3. Sync with Chatbot
  const backendData = globalData?.innovation_strategy;
  useEffect(() => {
    if (backendData) {
      // The backend sends { "data": { "1": "...", "2": "..." } } but sometimes just the inner obj
      // We normalize in views, so we should receive the inner object here.
      const dataToLoad = backendData.data || backendData;
      setSavedData(dataToLoad);
      editable.updateDraft(dataToLoad);
      setSnackbar({ open: true, message: "Updated from Chatbot", severity: "info" });
    }
  }, [backendData]);

  // 4. Save Logic
  const handleSave = async () => {
    try {
      const payload = {
        user_id: userId,
        ...editable.draftData
      };

      const response = await fetch(`${API_BASE_URL}/innovation-strategy/save/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save");

      // Commit to local state
      setSavedData(editable.draftData);
      editable.saveEdit(() => { });

      // Update global
      setGlobalData((prev: any) => ({
        ...prev,
        innovation_strategy: editable.draftData
      }));

      setSnackbar({ open: true, message: "✅ Saved successfully", severity: "success" });
    } catch (e) {
      console.error("Save error:", e);
      setSnackbar({ open: true, message: "❌ Failed to save", severity: "error" });
    }
  };

  const handleCellChange = (id: string, value: string) => {
    editable.updateDraft({
      ...editable.draftData,
      [id]: value
    });
  };

  const tableConfig = {
    headers: ["#", "Key Connections", "Our understanding"],
    rows: STRATEGY_DATA.map((row) => [
      row.id,
      `${row.keyConnection}${row.subText ? "\n" + row.subText : ""}`,
      editable.draftData[row.id] || "TBD",
    ]),
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#fff', minHeight: '100vh' }}>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <DownloadTemplates templateName={TEMPLATE_NAME} tableConfig={tableConfig} />
          {!editable.isEditing ? (
            <Button
              variant="outlined"
              onClick={() => editable.startEdit(savedData)}
              sx={{
                borderColor: "#008080", color: "#008080", fontWeight: 600,
                borderRadius: 2,
                "&:hover": { borderColor: "#008080", backgroundColor: "#e0f7f6" }
              }}
            >
              EDIT
            </Button>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                onClick={handleSave}
                sx={{ backgroundColor: "#008080", fontWeight: 600, borderRadius: 2, "&:hover": { backgroundColor: "#008a84" } }}
              >
                SAVE
              </Button>
              <Button
                variant="outlined"
                onClick={editable.cancelEdit}
                sx={{ borderColor: "#008080", color: "#008080", fontWeight: 600, borderRadius: 2 }}
              >
                CANCEL
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      <Box id="template-to-download" sx={{ backgroundColor: '#fff' }}>
        <Box className="pdf-section">
          <Typography variant="h4" sx={{ color: '#008080', fontWeight: 'bold', mb: 3, px: 1 }}>
            Innovation excellence overview: Our understanding of client’s AI strategy
          </Typography>

          <Paper sx={{ borderRadius: 0, boxShadow: '0px 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #dee2e6' }}>
            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#001e28' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #333', width: '50px', textAlign: 'center' }}>#</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #333', width: '40%' }}>Key Connections</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #333' }}>Our understanding</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {STRATEGY_DATA.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell sx={{ border: '1px solid #dee2e6', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'top', py: 2 }}>
                        {row.id}
                      </TableCell>
                      <TableCell sx={{ border: '1px solid #dee2e6', py: 2, verticalAlign: 'top' }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {row.keyConnection}
                        </Typography>
                        {row.subText && (
                          <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 1 }}>
                            {row.subText}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ border: '1px solid #dee2e6', p: editable.isEditing ? 1 : 2, verticalAlign: 'top' }}>
                        {editable.isEditing ? (
                          <TextField
                            multiline
                            rows={3}
                            fullWidth
                            variant="outlined"
                            value={editable.draftData[row.id] || ""}
                            onChange={(e) => handleCellChange(row.id, e.target.value)}
                            sx={{
                              "& .MuiOutlinedInput-root": { fontSize: '0.9rem' }
                            }}
                          />
                        ) : (
                          <Typography sx={{ fontSize: '0.9rem', minHeight: '60px', whiteSpace: 'pre-wrap' }}>
                            {savedData[row.id] || "TBD"}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default InnovationStrategy;