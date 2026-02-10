import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { useData } from "../context/DataContext";
import { useEditableTable } from "../hooks/useEditableTable";
import DownloadTemplates from "../components/DownloadTemplates";

const API_BASE_URL = "http://localhost:8000/api";

/* ---------- INFO ROW ---------- */
function InfoRow({
  labelLeft,
  valueLeft,
  labelRight,
  valueRight,
  isEditing,
  onChangeLeft,
  onChangeRight,
}: {
  labelLeft: string;
  valueLeft: string;
  labelRight: string;
  valueRight: string;
  isEditing: boolean;
  onChangeLeft: (val: string) => void;
  onChangeRight: (val: string) => void;
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "260px 1fr 300px 1fr" },
        borderBottom: "1px solid #d6d6d6",
      }}
    >
      <Box sx={{ background: "#0b2b2e", color: "#fff", px: 2, py: 1, fontSize: 13, fontWeight: 600 }}>
        {labelLeft}
      </Box>
      <Box sx={{ px: 2, py: 1, bgcolor: "#fff", color: "#000000" }}>
        {isEditing ? (
          <TextField size="small" fullWidth value={valueLeft} onChange={(e) => onChangeLeft(e.target.value)} />
        ) : (
          <Typography fontSize={13} fontWeight={500}>{valueLeft}</Typography>
        )}
      </Box>
      <Box sx={{ background: "#0b2b2e", color: "#fff", px: 2, py: 1, fontSize: 13, fontWeight: 600 }}>
        {labelRight}
      </Box>
      <Box sx={{ px: 2, py: 1, bgcolor: "#fff", color: "#000000" }}>
        {isEditing ? (
          <TextField size="small" fullWidth value={valueRight} onChange={(e) => onChangeRight(e.target.value)} />
        ) : (
          <Typography fontSize={13} fontWeight={500}>{valueRight}</Typography>
        )}
      </Box>
    </Box>
  );
}

/* ---------- SECTION ---------- */
function EditableSection({
  title,
  items,
  isEditing,
  onChange,
}: {
  title: string;
  items: string[];
  isEditing: boolean;
  onChange: (items: string[]) => void;
}) {
  return (
    <Box mt={4}>
      <Box sx={{ background: "#0b2b2e", color: "#fff", px: 2, py: 1, fontWeight: 600 }}>
        <Typography fontSize={14}>{title}</Typography>
      </Box>
      <Box sx={{ border: "1px solid #0b2b2e", borderTop: "none", px: 2, py: 2, bgcolor: "#f7f7f7" }}>
        <Box component="ul" sx={{ m: 0, pl: 2, color: "#000000" }}>
          {(items || []).map((item, i) => (
            <li key={i} style={{ marginBottom: isEditing ? '8px' : '4px' }}>
              {isEditing ? (
                <TextField
                  size="small"
                  fullWidth
                  value={item}
                  onChange={(e) => {
                    const updated = [...items];
                    updated[i] = e.target.value;
                    onChange(updated);
                  }}
                />
              ) : (
                <Typography fontSize={13} fontWeight={500}>{item || "TBD"}</Typography>
              )}
            </li>
          ))}
          {isEditing && (
             <Button 
               size="small" 
               onClick={() => onChange([...(items || []), ""])}
               sx={{ mt: 1, color: "#008080", textTransform: 'none' }}
             >
               + Add Line
             </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}

/* ---------- MAIN COMPONENT ---------- */
export default function CustomerProfile() {
  const { globalData, setGlobalData } = useData();
  // Changed key to match renamed template_type
  const data = globalData?.customer_profile; 
  const TEMPLATE_NAME = "Customer Profile";

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning",
  });

  const autoSaveAttempted = useRef(false);
  const dataLoadedFromDB = useRef(false);

  const editable = useEditableTable(data || {
    customer_name: "",
    headquarter_location: "",
    csat: "",
    version_1_vertical: "",
    current_work: [],
    service_lines: [],
    customer_perception: []
  });

  // STEP 1: Load data from database on mount
  useEffect(() => {
    const loadDataFromDB = async () => {
      if (dataLoadedFromDB.current) return;
      setInitialLoading(true);
      try {
        // Updated endpoint path
        const response = await fetch(`${API_BASE_URL}/customer-profile/?user_id=101`);
        if (response.ok) {
          const dbData = await response.json();
          if (dbData && Object.keys(dbData).length > 0) {
            setGlobalData((prev: any) => ({
              ...prev,
              customer_profile: dbData, // Updated key
            }));
            dataLoadedFromDB.current = true;
          }
        }
      } catch (error) {
        console.error("Error loading customer profile:", error);
      } finally {
        setInitialLoading(false);
      }
    };
    loadDataFromDB();
  }, [setGlobalData]);

  // STEP 2: Auto-save when NEW Chatbot data arrives
  useEffect(() => {
    const autoSaveToDatabase = async () => {
      if (dataLoadedFromDB.current && !autoSaveAttempted.current) return;
      
      const isNewData = data && !data.id && (data.customer_name || data.version_1_vertical);

      if (isNewData && !autoSaveAttempted.current) {
        autoSaveAttempted.current = true;
        try {
          const response = await fetch(`${API_BASE_URL}/customer-profile/save_profile/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          const result = await response.json();
          if (response.ok && result.success) {
            setSnackbar({ open: true, message: "✅ New profile synced to database", severity: "success" });
          }
        } catch (error) {
          console.error("Auto-save failed:", error);
        }
      }
    };
    const timeoutId = setTimeout(autoSaveToDatabase, 1500);
    return () => clearTimeout(timeoutId);
  }, [data]);

  // STEP 3: Manual Save after user edits
  const handleManualSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/customer-profile/save_profile/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editable.draftData),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setGlobalData((prev: any) => ({
          ...prev,
          customer_profile: result.data, // Updated key
        }));
        editable.saveEdit(() => {});
        setSnackbar({ open: true, message: "✅ Profile saved successfully", severity: "success" });
      }
    } catch (error) {
      setSnackbar({ open: true, message: "❌ Failed to save changes", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <Box sx={{ p: 10, textAlign: "center" }}><CircularProgress /><Typography sx={{ mt: 2 }}>Fetching Customer Profile...</Typography></Box>;

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "#fff", p: 2 }}>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>

      <Box sx={{ maxWidth: 1600, mx: "auto", px: 4, py: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <DownloadTemplates templateName={TEMPLATE_NAME} />
          {!editable.isEditing ? (
            <Button variant="outlined" onClick={editable.startEdit} sx={{ ml: 2, color: "#008080", borderColor: "#008080" }}>Edit</Button>
          ) : (
            <>
              <Button variant="contained" onClick={handleManualSave} disabled={loading} sx={{ ml: 2, bgcolor: "#008080" }}>
                {loading ? <CircularProgress size={20} /> : "Save"}
              </Button>
              <Button variant="outlined" onClick={editable.cancelEdit} sx={{ ml: 2 }}>Cancel</Button>
            </>
          )}
        </Box>

        <Box id="template-to-download">
          <Typography variant="h4" className="pdf-section" fontWeight={700} color="teal" mb={2}>Customer & Version 1</Typography>

          {/* TOP INFO GRID */}
          <Box sx={{className:"pdf-section", border: "1px solid #0b2b2e", mb: 3 }}>
            <InfoRow
              labelLeft="Customer" valueLeft={editable.draftData.customer_name || ""}
              labelRight="Headquarter" valueRight={editable.draftData.headquarter_location || ""}
              isEditing={editable.isEditing}
              onChangeLeft={(v) => editable.updateDraft({ ...editable.draftData, customer_name: v })}
              onChangeRight={(v) => editable.updateDraft({ ...editable.draftData, headquarter_location: v })}
            />
            <InfoRow
              labelLeft="CSAT" valueLeft={editable.draftData.csat || ""}
              labelRight="Version 1 Vertical" valueRight={editable.draftData.version_1_vertical || ""}
              isEditing={editable.isEditing}
              onChangeLeft={(v) => editable.updateDraft({ ...editable.draftData, csat: v })}
              onChangeRight={(v) => editable.updateDraft({ ...editable.draftData, version_1_vertical: v })}
            />
          </Box>

          {/* LIST SECTIONS */}
          <Box className="pdf-section">
          <EditableSection
            title="What work are we currently doing with the customer?"
            items={editable.draftData.current_work || []}
            isEditing={editable.isEditing}
            onChange={(items) => editable.updateDraft({ ...editable.draftData, current_work: items })}
          />
          </Box>
          <Box className="pdf-section">
          <EditableSection
            title="What Service Lines are we currently working with the customer on?"
            items={editable.draftData.service_lines || []}
            isEditing={editable.isEditing}
            onChange={(items) => editable.updateDraft({ ...editable.draftData, service_lines: items })}
          />
          </Box>
          <Box className="pdf-section">
          <EditableSection
            title="What is the customer's current perception of Version 1?"
            items={editable.draftData.customer_perception || []}
            isEditing={editable.isEditing}
            onChange={(items) => editable.updateDraft({ ...editable.draftData, customer_perception: items })}
          />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}