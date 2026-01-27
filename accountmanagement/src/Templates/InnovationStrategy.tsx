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
 
interface StrategyRow {
  id: string;
  keyConnection: string;
  subText?: string;
}
 
const TEMPLATE_NAME = "Innovation_Strategy";
 
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
  // 1. Initialize the base values
  const initialValues = STRATEGY_DATA.reduce((acc: any, row) => {
    acc[row.id] = "";
    return acc;
  }, {});
 
  // 2. State to track the permanently saved data in this component
  const [savedData, setSavedData] = useState(initialValues);
 
  // 3. Initialize the hook with current savedData
  const editable = useEditableTable(savedData);
 
  const handleCellChange = (id: string, value: string) => {
    editable.updateDraft({
      ...editable.draftData,
      [id]: value
    });
  };
 
  const handleSave = () => {
    editable.saveEdit((data) => {
      setSavedData(data); // Store the changes so they persist for the next edit
      console.log("Saved Innovation Strategy:", data);
    });
  };
 
  return (
    <Box sx={{ p: 3, backgroundColor: '#fff', minHeight: '100vh' }}>
     
      {/* 1. TOP SECTION: Buttons only */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <DownloadTemplates templateName={TEMPLATE_NAME} />
          {!editable.isEditing ? (
            <Button
              variant="outlined"
              // Pass current savedData to startEdit so text remains
              onClick={() => editable.startEdit(savedData)}
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
      <Box id="template-to-download" className="template-section" sx={{ backgroundColor: '#fff' }}>
       
        <Typography variant="h4" sx={{ color: '#00b5ad', fontWeight: 'bold', mb: 3, px: 1 }}>
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
                          placeholder="..."
                          value={editable.draftData[row.id]}
                          onChange={(e) => handleCellChange(row.id, e.target.value)}
                          sx={{
                            "& .MuiOutlinedInput-root": { fontSize: '0.9rem' }
                          }}
                        />
                      ) : (
                        <Typography sx={{ fontSize: '0.9rem', minHeight: '60px' }}>
                          {savedData[row.id] || "..."}
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
  );
};
 
export default InnovationStrategy;
 