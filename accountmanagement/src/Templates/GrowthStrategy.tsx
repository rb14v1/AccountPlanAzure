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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

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
  /* ---------- STORAGE LOGIC ---------- */
  const { globalData, setGlobalData } = useData();
  const data = globalData?.growth_strategy;
  const TEMPLATE_NAME = "Growth Strategy";

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // -- NEW STATES FOR DIALOG --
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

  // STEP 1: Load existing data from database on component mount
  useEffect(() => {
    const loadDataFromDB = async () => {
      if (dataLoadedFromDB.current) return;

      console.log("Loading growth strategy from database...");
      setInitialLoading(true);

      try {
        const response = await fetch(`${API_BASE_URL}/growth-strategy/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const dbData = await response.json();
          console.log("Growth strategy loaded from DB:", dbData);

          if (dbData && Object.keys(dbData).length > 0) {
            setGlobalData((prev: any) => ({
              ...prev,
              growth_strategy: dbData,
            }));
            // Store the loaded data as reference
            previousDataRef.current = JSON.stringify(dbData);
          } else {
            console.log("No growth strategy found in database");
            // Important: Explicitly set to empty string or null to mark as "empty DB"
            previousDataRef.current = ""; 
          }
        }
      } catch (error) {
        console.error("Error loading growth strategy from DB:", error);
      } finally {
        setInitialLoading(false);
        dataLoadedFromDB.current = true;
      }
    };

    loadDataFromDB();
  }, [setGlobalData]);

  // STEP 2: Logic for "First Time Auto-save" vs "Subsequent Update Prompt"
  useEffect(() => {
    const checkAndProcessData = async () => {
        // Check if we have valid data from chatbot/context
        const hasValidData =
            data &&
            (data.growth_aspiration?.length > 0 ||
            data.key_vectors_for_driving_growth?.length > 0 ||
            data.improve_quality_sustainability_revenues?.length > 0 ||
            data.potential_inorganic_opportunities?.length > 0);

        if (!hasValidData) return;

        // Check if data is different from what we last saved/loaded
        const currentDataString = JSON.stringify(data);
        if (currentDataString === previousDataRef.current) {
            return; // No change, do nothing
        }

        console.log("New/Updated chatbot data detected.");

        // LOGIC: Is this the first time (DB was empty)?
        const isFirstTime = !previousDataRef.current || previousDataRef.current === "" || previousDataRef.current === "{}";

        if (isFirstTime) {
            console.log("First time entry: Auto-saving...");
            await performSave(data);
        } else {
            console.log("Existing data found: Asking user for permission...");
            setPendingChatbotData(data);
            setShowConfirmDialog(true);
        }
    };

    // Only run after initial load
    if (!initialLoading && dataLoadedFromDB.current) {
        const timeoutId = setTimeout(checkAndProcessData, 500);
        return () => clearTimeout(timeoutId);
    }
  }, [data, initialLoading]);


  // -- HELPER: Shared Save Function --
  const performSave = async (dataToSave: any) => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/growth-strategy/save_strategy/`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dataToSave),
          }
        );
        const result = await response.json();
        if (response.ok && result.success) {
            // Update global state and reference
            setGlobalData((prev: any) => ({ ...prev, growth_strategy: result.data }));
            previousDataRef.current = JSON.stringify(result.data);
            setSnackbar({ open: true, message: "✅ Strategy saved", severity: "success" });
        }
      } catch (error) {
          console.error("Save error:", error);
          setSnackbar({ open: true, message: "⚠️ Save failed", severity: "warning" });
      }
  };

  // -- DIALOG ACTIONS --
  const handleOverwrite = async () => {
      if (pendingChatbotData) {
          await performSave(pendingChatbotData);
      }
      setShowConfirmDialog(false);
  };

  const handleKeepExisting = () => {
      // Revert the view to show the OLD data (from DB/Ref)
      if (previousDataRef.current) {
          try {
            const oldData = JSON.parse(previousDataRef.current);
            setGlobalData((prev: any) => ({
                ...prev,
                growth_strategy: oldData,
            }));
          } catch (e) {
              console.error("Error parsing old data", e);
          }
      }
      setShowConfirmDialog(false);
  };


  // STEP 3: Manual save when user edits (EXACTLY AS PROVIDED)
  const handleManualSave = async () => {
    setLoading(true);
    try {
      console.log("Manual save - sending growth strategy:", editable.draftData);
      const response = await fetch(
        `${API_BASE_URL}/growth-strategy/save_strategy/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editable.draftData),
        }
      );

      const result = await response.json();
      console.log("Manual save response:", result);

      if (response.ok && result.success) {
        // Update global state with saved data
        setGlobalData((prev: any) => ({
          ...prev,
          growth_strategy: result.data,
        }));
        // Mark edit as complete
        editable.saveEdit(() => {
          // Save completed
        });
        // Update reference to prevent redundant auto-save
        previousDataRef.current = JSON.stringify(result.data);
        setSnackbar({
          open: true,
          message: "✅ Growth strategy successfully saved",
          severity: "success",
        });
      } else {
        throw new Error(result.message || "Failed to save");
      }
    } catch (error) {
      console.error("Manual save error:", error);
      setSnackbar({
        open: true,
        message: "❌ Failed to save growth strategy",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const strategyData: StrategySection[] = [
    {
      id: 1,
      question: "What is the growth aspiration for the account?",
      points: editable.draftData.growth_aspiration || [],
      fieldName: "growth_aspiration",
    },
    {
      id: 2,
      question:
        "What are key vectors for driving growth (e.g., shaping large deals, SL penetration, coverage of client BUs, engagement with new budget-holders)?",
      points: editable.draftData.key_vectors_for_driving_growth || [],
      fieldName: "key_vectors_for_driving_growth",
    },
    {
      id: 3,
      question:
        "How can we improve quality and sustainability of revenues (e.g., higher share of outcome-linked business, annuity revenues)?",
      points: editable.draftData.improve_quality_sustainability_revenues || [],
      fieldName: "improve_quality_sustainability_revenues",
    },
    {
      id: 4,
      question:
        "What are potential inorganic opportunities to grow the account?",
      points: editable.draftData.potential_inorganic_opportunities || [],
      fieldName: "potential_inorganic_opportunities",
    },
  ];

  if (initialLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
        }}
      >
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading growth strategy...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "#fff", p: 2 }}>
      
      {/* --- NEW CONFIRMATION DIALOG --- */}
      <Dialog open={showConfirmDialog} disableEscapeKeyDown>
        <DialogTitle sx={{ fontWeight: 700 }}>Update Strategy?</DialogTitle>
        <DialogContent>
          <DialogContentText>
             The chatbot has generated a new strategy. Do you want to **Overwrite** your existing saved data, or **Keep** your current data?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
           <Button onClick={handleKeepExisting} variant="outlined" color="inherit">
             Keep My Data
           </Button>
           <Button onClick={handleOverwrite} variant="contained" sx={{ bgcolor: TEAL_COLOR, "&:hover": { bgcolor: "#006d6d" } }}>
             Overwrite
           </Button>
        </DialogActions>
      </Dialog>
      {/* ------------------------------- */}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Box sx={{ maxWidth: 1600, mx: "auto", px: 4, py: 2 }}>
        {/* HEADER ACTIONS */}
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
            <Button
              variant="outlined"
              onClick={editable.startEdit}
              disabled={loading}
              sx={{
                borderColor: TEAL_COLOR,
                color: TEAL_COLOR,
                ml: 2,
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
                onClick={handleManualSave}
                disabled={loading}
                sx={{
                  backgroundColor: TEAL_COLOR,
                  ml: 2,
                  "&:hover": {
                    backgroundColor: "#006d6d",
                  },
                }}
              >
                {loading ? <CircularProgress size={24} /> : "Save"}
              </Button>
              <Button
                variant="outlined"
                onClick={editable.cancelEdit}
                disabled={loading}
                sx={{
                  borderColor: TEAL_COLOR,
                  color: TEAL_COLOR,
                  ml: 2,
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

        {/* DOWNLOADABLE CONTENT */}
        <Box id="template-to-download" className="template-section">

          <Typography
           className="pdf-section"
            variant="h4"
            sx={{
              fontWeight: 700,
              color: TEAL_COLOR,
              mb: 3,
            }}
          >
            Growth Strategy
          </Typography>

          
          {strategyData.map((section) => (
            <Box className="pdf-section">
            <SectionContainer key={section.id} elevation={0}>
              <QuestionHeader>{section.question}</QuestionHeader>
              <AnswerBody>
                {section.points.length > 0 ? (
                  <Box
                    component="ul"
                    sx={{ m: 0, pl: 3, listStyleType: "disc" }}
                  >
                    {section.points.map((point, index) => (
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
                          <Typography component="span" sx={{ fontSize: 14 }}>
                            {point}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography sx={{ fontSize: 14, color: "#999" }}>
                    ▪
                  </Typography>
                )}
              </AnswerBody>
            </SectionContainer>
            </Box>
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