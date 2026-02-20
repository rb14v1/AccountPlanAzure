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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

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
      <Box
        sx={{
          background: "#0b2b2e",
          color: "#fff",
          px: 2,
          py: 1,
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {labelLeft}
      </Box>

      <Box sx={{ px: 2, py: 1, bgcolor: "#fff", color: "#000000" }}>
        {isEditing ? (
          <TextField
            size="small"
            fullWidth
            value={valueLeft}
            onChange={(e) => onChangeLeft(e.target.value)}
          />
        ) : (
          <Typography fontSize={13} fontWeight={500}>
            {valueLeft}
          </Typography>
        )}
      </Box>

      <Box
        sx={{
          background: "#0b2b2e",
          color: "#fff",
          px: 2,
          py: 1,
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {labelRight}
      </Box>

      <Box sx={{ px: 2, py: 1, bgcolor: "#fff", color: "#000000" }}>
        {isEditing ? (
          <TextField
            size="small"
            fullWidth
            value={valueRight}
            onChange={(e) => onChangeRight(e.target.value)}
          />
        ) : (
          <Typography fontSize={13} fontWeight={500}>
            {valueRight}
          </Typography>
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
      <Box
        sx={{
          background: "#0b2b2e",
          color: "#fff",
          px: 2,
          py: 1,
          fontWeight: 600,
        }}
      >
        <Typography fontSize={14}>{title}</Typography>
      </Box>

      <Box
        sx={{
          border: "1px solid #0b2b2e",
          borderTop: "none",
          px: 2,
          py: 2,
          bgcolor: "#f7f7f7",
        }}
      >
        {items.length > 0 ? (
          <Box component="ul" sx={{ m: 0, pl: 2, color: "#000000" }}>
            {items.map((item, i) => (
              <li key={i}>
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
                    sx={{ mb: 1 }}
                  />
                ) : (
                  <Typography fontSize={13} fontWeight={500}>
                    {item}
                  </Typography>
                )}
              </li>
            ))}
          </Box>
        ) : (
          <Typography fontSize={13}>▪</Typography>
        )}
      </Box>
    </Box>
  );
}

/* ---------- MAIN COMPONENT ---------- */
export default function CustomerProfile() {
  const { globalData, setGlobalData } = useData();
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

  const editable = useEditableTable(data || {});

  // STEP 1: Load data from database when component mounts
  useEffect(() => {
    const loadDataFromDB = async () => {
      if (dataLoadedFromDB.current) return;

      console.log("Loading customer profile from database...");
      setInitialLoading(true);

      try {
        const response = await fetch(`${API_BASE_URL}/customer-profile/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const dbData = await response.json();
          console.log("Customer profile loaded from DB:", dbData);

          if (dbData && Object.keys(dbData).length > 0) {
            setGlobalData((prev: any) => ({
              ...prev,
              customer_profile: dbData,
            }));
            dataLoadedFromDB.current = true;
          } else {
            console.log("No customer profile found in database");
          }
        }
      } catch (error) {
        console.error("Error loading customer profile from DB:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadDataFromDB();
  }, [setGlobalData]);

  // STEP 2: Auto-save when NEW data arrives from chatbot
  useEffect(() => {
    const autoSaveToDatabase = async () => {
      // Skip if data was loaded from DB
      if (dataLoadedFromDB.current && !autoSaveAttempted.current) {
        console.log("Customer profile already in DB, skipping auto-save");
        return;
      }

      // Check if we have valid data
      const hasValidData =
        data &&
        (data.customer_name ||
          data.headquarter_location ||
          data.csat ||
          data.version_1_vertical);

      // Check if data is NEW (no ID means fresh from chatbot)
      const isNewDataFromChatbot = data && !data.id;

      if (hasValidData && isNewDataFromChatbot && !autoSaveAttempted.current) {
        console.log("New customer profile from chatbot detected, auto-saving...");
        autoSaveAttempted.current = true;

        try {
          console.log("Sending customer profile to backend:", data);

          const response = await fetch(
            `${API_BASE_URL}/customer-profile/save_profile/`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(data),
            }
          );

          const result = await response.json();
          console.log("Auto-save response:", result);

          if (response.ok && result.success) {
            setGlobalData((prev: any) => ({
              ...prev,
              customer_profile: result.data,
            }));

            setSnackbar({
              open: true,
              message: "✅ Customer profile auto-saved to database",
              severity: "success",
            });
          } else {
            throw new Error(result.message || "Auto-save failed");
          }
        } catch (error) {
          console.error("Auto-save error:", error);
          setSnackbar({
            open: true,
            message: "⚠️ Auto-save failed. You can edit and save manually.",
            severity: "warning",
          });
          autoSaveAttempted.current = false;
        }
      }
    };

    const timeoutId = setTimeout(() => {
      autoSaveToDatabase();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [data, setGlobalData]);

  // STEP 3: Manual save when user edits
  const handleManualSave = async () => {
    setLoading(true);
    try {
      console.log("Manual save - sending customer profile:", editable.draftData);

      const response = await fetch(
        `${API_BASE_URL}/customer-profile/save_profile/`,
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
        setGlobalData((prev: any) => ({
          ...prev,
          customer_profile: result.data,
        }));

        editable.saveEdit(() => {
          // Save completed
        });

        setSnackbar({
          open: true,
          message: "✅ Customer profile successfully saved",
          severity: "success",
        });
      } else {
        throw new Error(result.message || "Failed to save");
      }
    } catch (error) {
      console.error("Manual save error:", error);
      setSnackbar({
        open: true,
        message: "❌ Failed to save customer profile",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

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
        <Typography sx={{ ml: 2 }}>Loading customer profile...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "#fff", p: 2 }}>
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
        {/* HEADER */}
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
                borderColor: "#008080",
                color: "#008080",
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
                  backgroundColor: "#008080",
                  ml: 2,
                  color: "#fff",
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
                  borderColor: "#008080",
                  color: "#008080",
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
        <Box id="template-to-download" className="template-section">
          
          <Box className="pdf-section" sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography  variant="h4" fontWeight={700} color="teal">
              Customer & Version 1
            </Typography>
          </Box>

          {/* INFO TABLE */}
          <Box className="pdf-section" sx={{ border: "1px solid #0b2b2e", mb: 3 }}>
            <InfoRow
              labelLeft="Customer"
              valueLeft={editable.draftData.customer_name || ""}
              labelRight="Headquarter"
              valueRight={editable.draftData.headquarter_location || ""}
              isEditing={editable.isEditing}
              onChangeLeft={(v) =>
                editable.updateDraft({ ...editable.draftData, customer_name: v })
              }
              onChangeRight={(v) =>
                editable.updateDraft({
                  ...editable.draftData,
                  headquarter_location: v,
                })
              }
            />

            <InfoRow
              labelLeft="CSAT"
              valueLeft={editable.draftData.csat || ""}
              labelRight="Version 1 Vertical"
              valueRight={editable.draftData.version_1_vertical || ""}
              isEditing={editable.isEditing}
              onChangeLeft={(v) =>
                editable.updateDraft({ ...editable.draftData, csat: v })
              }
              onChangeRight={(v) =>
                editable.updateDraft({
                  ...editable.draftData,
                  version_1_vertical: v,
                })
              }
            />
          </Box>

          {/* SECTIONS */}
          <Box className="pdf-section">
          <EditableSection
            title="What work are we currently doing with the customer?"
            items={editable.draftData.current_work || []}
            isEditing={editable.isEditing}
            onChange={(items) =>
              editable.updateDraft({ ...editable.draftData, current_work: items })
            }
          />
          </Box>
          <Box className="pdf-section">
          <EditableSection
            title="What Service Lines are we currently working with the customer on?"
            items={editable.draftData.service_lines || []}
            isEditing={editable.isEditing}
            onChange={(items) =>
              editable.updateDraft({ ...editable.draftData, service_lines: items })
            }
          />
          </Box>
          <Box className="pdf-section">
          <EditableSection
            title="What is the customer's current perception of Version 1?"
            items={editable.draftData.customer_perception || []}
            isEditing={editable.isEditing}
            onChange={(items) =>
              editable.updateDraft({
                ...editable.draftData,
                customer_perception: items,
              })
            }
          />
          </Box>
          <Typography sx={{ fontSize: 10, color: "#6b7280", mt: 3 }}>
            Classification: Controlled. Copyright ©2025 Version 1.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
