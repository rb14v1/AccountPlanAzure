import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  styled,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { useData } from "../context/DataContext";
import { useEditableTable } from "../hooks/useEditableTable";
import DownloadTemplates from "../components/DownloadTemplates";

const API_BASE_URL = "http://localhost:8000/api";

/* ---------- TYPES ---------- */
export interface StrategySection {
  id: number;
  question: string;
  points: string[];
  fieldName: string;
}

/* ---------- STYLES ---------- */
const TEAL_COLOR = "#008080";
const SECTION_HEADER_BG = "#001f2b";
const SECTION_BODY_BG = "#F5F5F5";

const SectionContainer = styled(Paper)(() => ({
  marginBottom: 24,
  overflow: "hidden",
  border: "1px solid #ddd",
  borderRadius: 0,
}));

const QuestionHeader = styled(Box)(() => ({
  backgroundColor: SECTION_HEADER_BG,
  color: "#ffffff",
  padding: "12px 16px",
  fontWeight: 600,
  fontSize: "1rem",
}));

const AnswerBody = styled(Box)(() => ({
  backgroundColor: SECTION_BODY_BG,
  padding: 16,
  minHeight: 60,
}));

/* ---------- MAIN COMPONENT ---------- */
const GrowthStrategy: React.FC = () => {
  const { globalData, setGlobalData } = useData();
  const data = globalData?.growth_strategy;
  const TEMPLATE_NAME = "Growth Strategy";

  // ✅ Keep your ID logic exactly as is
  const userId =
    globalData?.user_id ||
    localStorage.getItem("user_id") ||
    localStorage.getItem("userid") ||
    "101";

  const companyName =
    globalData?.company_name ||
    globalData?.account_name ||
    localStorage.getItem("company_name") ||
    localStorage.getItem("account_name") ||
    "";

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingChatbotData, setPendingChatbotData] = useState<any>(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning",
  });

  const dataLoadedFromDB = useRef(false);
  const previousDataRef = useRef<string | null>(null);

  const editable = useEditableTable(
    data || {
      growth_aspiration: [],
      key_vectors_for_driving_growth: [],
      improve_quality_sustainability_revenues: [],
      potential_inorganic_opportunities: [],
    }
  );

  // ✅ STEP 1: Load data from database and FORCE UI to fill
  useEffect(() => {
    const loadDataFromDB = async () => {
      if (dataLoadedFromDB.current) return;

      setInitialLoading(true);

      if (!userId) {
        setInitialLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/growth-strategy/?user_id=${encodeURIComponent(userId)}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const dbData = await response.json();
          // Backend returns data inside 'data' key
          const actualData = dbData.data || {};

          if (actualData && Object.keys(actualData).length > 0) {
            setGlobalData((prev: any) => ({
              ...prev,
              growth_strategy: actualData,
            }));
            
            // ✅ This is the fix: Update the editable table state so the UI fills up
            editable.updateDraft(actualData);
            previousDataRef.current = JSON.stringify(actualData);
            dataLoadedFromDB.current = true;
          }
        }
      } catch (error) {
        console.error("Error loading growth strategy from DB:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadDataFromDB();
  }, [userId]);

  // STEP 2: Logic for "First Time Auto-save" vs "Subsequent Update Prompt"
  useEffect(() => {
    const checkAndProcessData = async () => {
        const hasValidData =
            data &&
            (data.growth_aspiration?.length > 0 ||
            data.key_vectors_for_driving_growth?.length > 0 ||
            data.improve_quality_sustainability_revenues?.length > 0 ||
            data.potential_inorganic_opportunities?.length > 0);

        if (!hasValidData) return;

        const currentDataString = JSON.stringify(data);
        if (currentDataString === previousDataRef.current) return;

        const isFirstTime = !previousDataRef.current || previousDataRef.current === "" || previousDataRef.current === "{}";

        if (isFirstTime) {
            await performSave(data);
        } else {
            setPendingChatbotData(data);
            setShowConfirmDialog(true);
        }
    };

    if (!initialLoading && dataLoadedFromDB.current) {
        const timeoutId = setTimeout(checkAndProcessData, 500);
        return () => clearTimeout(timeoutId);
    }
  }, [data, initialLoading]);

  const performSave = async (dataToSave: any) => {
      try {
        const response = await fetch(`${API_BASE_URL}/growth-strategy/save/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: userId,
                company_name: companyName,
                data: dataToSave
            }),
        });
        const result = await response.json();
        if (response.ok && result.success) {
            setGlobalData((prev: any) => ({ ...prev, growth_strategy: result.payload.data }));
            previousDataRef.current = JSON.stringify(result.payload.data);
            setSnackbar({ open: true, message: "✅ Strategy saved", severity: "success" });
        }
      } catch (error) {
          console.error("Save error:", error);
      }
  };

  const handleOverwrite = async () => {
      if (pendingChatbotData) await performSave(pendingChatbotData);
      setShowConfirmDialog(false);
  };

  const handleKeepExisting = () => {
      if (previousDataRef.current) {
          try {
            const oldData = JSON.parse(previousDataRef.current);
            setGlobalData((prev: any) => ({ ...prev, growth_strategy: oldData }));
          } catch (e) { console.error(e); }
      }
      setShowConfirmDialog(false);
  };

  // ✅ STEP 3: Manual save
  const handleManualSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/growth-strategy/save/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              user_id: userId,
              company_name: companyName,
              data: editable.draftData
          }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setGlobalData((prev: any) => ({ ...prev, growth_strategy: result.payload.data }));
        editable.saveEdit(() => {});
        previousDataRef.current = JSON.stringify(result.payload.data);
        setSnackbar({ open: true, message: "✅ Growth strategy saved", severity: "success" });
      }
    } catch (error) {
      setSnackbar({ open: true, message: "❌ Failed to save", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Keep your original bullet point structure
  // ✅ Updated strategyData with Array safety checks
  const strategyData: StrategySection[] = [
    {
      id: 1,
      question: "What is the growth aspiration for the account?",
      // ✅ Force into array if it's a string
      points: Array.isArray(editable.draftData.growth_aspiration) 
        ? editable.draftData.growth_aspiration 
        : [editable.draftData.growth_aspiration || ""],
      fieldName: "growth_aspiration",
    },
    {
      id: 2,
      question: "What are key vectors for driving growth?",
      points: Array.isArray(editable.draftData.key_vectors_for_driving_growth)
        ? editable.draftData.key_vectors_for_driving_growth
        : [editable.draftData.key_vectors_for_driving_growth || ""],
      fieldName: "key_vectors_for_driving_growth",
    },
    {
      id: 3,
      question: "How can we improve quality and sustainability of revenues?",
      points: Array.isArray(editable.draftData.improve_quality_sustainability_revenues)
        ? editable.draftData.improve_quality_sustainability_revenues
        : [editable.draftData.improve_quality_sustainability_revenues || ""],
      fieldName: "improve_quality_sustainability_revenues",
    },
    {
      id: 4,
      question: "What are potential inorganic opportunities to grow the account?",
      points: Array.isArray(editable.draftData.potential_inorganic_opportunities)
        ? editable.draftData.potential_inorganic_opportunities
        : [editable.draftData.potential_inorganic_opportunities || ""],
      fieldName: "potential_inorganic_opportunities",
    },
  ];
  
  if (initialLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading growth strategy...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "#fff", p: 2 }}>
      
      <Dialog open={showConfirmDialog} disableEscapeKeyDown>
        <DialogTitle sx={{ fontWeight: 700 }}>Update Strategy?</DialogTitle>
        <DialogContent>
          <DialogContentText>
             The chatbot has generated a new strategy. Do you want to **Overwrite** or **Keep**?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
           <Button onClick={handleKeepExisting} variant="outlined" color="inherit">Keep My Data</Button>
           <Button onClick={handleOverwrite} variant="contained" sx={{ bgcolor: TEAL_COLOR }}>Overwrite</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>

      <Box sx={{ maxWidth: 1600, mx: "auto", px: 4, py: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mb: 2 }}>
          <DownloadTemplates templateName={TEMPLATE_NAME} />
          {!editable.isEditing ? (
            <Button variant="outlined" onClick={editable.startEdit} sx={{ borderColor: TEAL_COLOR, color: TEAL_COLOR, ml: 2 }}>Edit</Button>
          ) : (
            <>
              <Button variant="contained" onClick={handleManualSave} sx={{ backgroundColor: TEAL_COLOR, ml: 2, color: "#fff" }}>
                {loading ? <CircularProgress size={24} /> : "Save"}
              </Button>
              <Button variant="outlined" onClick={editable.cancelEdit} sx={{ borderColor: TEAL_COLOR, color: TEAL_COLOR, ml: 2 }}>Cancel</Button>
            </>
          )}
        </Box>

        <Box id="template-to-download" className="template-section">
          <Typography variant="h4" sx={{ fontWeight: 700, color: TEAL_COLOR, mb: 3 }}>Growth Strategy</Typography>

          {strategyData.map((section) => (
            <SectionContainer key={section.id} elevation={0}>
              <QuestionHeader>{section.question}</QuestionHeader>
              <AnswerBody>
                <Box component="ul" sx={{ m: 0, pl: 3, listStyleType: "disc" }}>
                  {(section.points.length > 0 ? section.points : ["▪"]).map((point, index) => (
                    <Box component="li" key={index} sx={{ mb: 0.5 }}>
                      {editable.isEditing ? (
                        <TextField
                          fullWidth
                          multiline
                          size="small"
                          value={point}
                          onChange={(e) => {
                            const updated = [...section.points];
                            updated[index] = e.target.value;
                            editable.updateDraft({
                              ...editable.draftData,
                              [section.fieldName]: updated,
                            });
                          }}
                        />
                      ) : (
                        <Typography sx={{ fontSize: 14 }}>{point}</Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              </AnswerBody>
            </SectionContainer>
          ))}

          <Typography sx={{ fontSize: 10, color: "#6b7280", mt: 3 }}>
            Classification: Controlled. Copyright ©2025 Version 1.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default GrowthStrategy;