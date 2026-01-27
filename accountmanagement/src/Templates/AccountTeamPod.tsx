import React, { useEffect, useState, useRef } from "react";
import DownloadTemplates from "../components/DownloadTemplates";
import {
  Box,
  Button,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
  styled,
} from "@mui/material";
import { useEditableTable } from "../hooks/useEditableTable";
import { useData } from "../context/DataContext";

const API_BASE_URL = "http://localhost:8000/api";

export interface RoleRow {
  id: number;
  role: string;
}

// Mappings from UI Names to JSON Keys
const ROLE_TO_KEY: Record<string, string> = {
  "Client Partner": "Client_Partner",
  "Delivery Manager": "Delivery_Manager",
  "Digital & Cloud POC": "Digital_and_Cloud_POC",
  "SRG POC": "SRG_POC",
  "EA POC": "EA_POC",
  "Data POC": "Data_POC",
  "Presales Lead": "Presales_Lead",
  "Marketing POC": "Marketing_POC",
  "Partnerships POC": "Partnerships_POC",
  "AI & Innovation Lead": "AI_and_Innovation_Lead",
  "Delivery Excellence Lead": "Delivery_Excellence_Lead",
  "Talent Supply Chain POC": "Talent_Supply_Chain_POC",
  "L&D Lead": "L_and_D_Lead",
};

const salesRoles: RoleRow[] = [
  { id: 1, role: "Client Partner" },
  { id: 2, role: "Delivery Manager" },
];

const serviceLineRoles: RoleRow[] = [
  { id: 3, role: "Digital & Cloud POC" },
  { id: 4, role: "SRG POC" },
  { id: 5, role: "EA POC" },
  { id: 6, role: "Data POC" },
];

const functionalRoles: RoleRow[] = [
  { id: 7, role: "Presales Lead" },
  { id: 8, role: "Marketing POC" },
  { id: 9, role: "Partnerships POC" },
  { id: 10, role: "AI & Innovation Lead" },
  { id: 11, role: "Delivery Excellence Lead" },
  { id: 12, role: "Talent Supply Chain POC" },
  { id: 13, role: "L&D Lead" },
];

// Styled Components
const TEAL_COLOR = "#008080";
const HEADER_BG = "#000000";
const HEADER_TEXT = "#FFFFFF";
const SUB_HEADER_BG = "#E0E0E0";

const TEMPLATE_NAME = "Account_Team_POD";

const RoleCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: TEAL_COLOR,
  color: "#fff",
  fontWeight: 500,
  fontSize: theme.typography.pxToRem(13),
  borderRight: "1px solid #ffffff",
  borderBottom: "1px solid #ffffff",
  padding: theme.spacing(1),
}));

const NumberCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: HEADER_BG,
  color: "#fff",
  width: 48,
  textAlign: "center",
  fontWeight: "bold",
  fontSize: theme.typography.pxToRem(13),
  borderRight: "1px solid #ffffff",
  borderBottom: "1px solid #ffffff",
  padding: theme.spacing(1),
}));

const HeaderCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: HEADER_BG,
  color: HEADER_TEXT,
  fontWeight: "bold",
  fontSize: theme.typography.pxToRem(13),
  borderRight: "1px solid #555",
  borderBottom: "1px solid #555",
  padding: theme.spacing(1),
}));

interface PodTableProps {
  title: string;
  rows: RoleRow[];
  extraRows?: RoleRow[];
  subHeader?: string;
  dataSource?: any;
  isEditing: boolean;
  section: "Sales_and_Delivery_Leads" | "Functional_POCs";
  onChange: (
    section: "Sales_and_Delivery_Leads" | "Functional_POCs",
    roleKey: string,
    field: "Accountable_POC" | "Time_Commitment",
    value: string
  ) => void;
}

const PodTable: React.FC<PodTableProps> = ({
  title,
  rows,
  extraRows,
  subHeader,
  dataSource,
  isEditing,
  onChange,
  section,
}) => {
  const getDataForRole = (roleName: string) => {
    if (!dataSource) return { poc: "", commitment: "" };
    const key = ROLE_TO_KEY[roleName];
    const item = dataSource[key];
    return {
      poc: item?.Accountable_POC || "",
      commitment: item?.Time_Commitment || "",
    };
  };

  const renderRow = (row: RoleRow) => {
    const { poc, commitment } = getDataForRole(row.role);
    return (
      <TableRow key={row.id}>
        <NumberCell align="center">{row.id}</NumberCell>
        <RoleCell>{row.role}</RoleCell>
        <TableCell
          sx={{ borderRight: "1px solid #ddd", borderBottom: "1px solid #ddd" }}
        >
          {isEditing ? (
            <TextField
              size="small"
              fullWidth
              value={poc}
              onChange={(e) =>
                onChange(
                  section,
                  ROLE_TO_KEY[row.role],
                  "Accountable_POC",
                  e.target.value
                )
              }
            />
          ) : (
            poc
          )}
        </TableCell>
        <TableCell sx={{ borderBottom: "1px solid #ddd" }}>
          {isEditing ? (
            <TextField
              size="small"
              fullWidth
              value={commitment}
              onChange={(e) =>
                onChange(
                  section,
                  ROLE_TO_KEY[row.role],
                  "Time_Commitment",
                  e.target.value
                )
              }
            />
          ) : (
            commitment
          )}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h6"
        sx={{ fontWeight: "bold", mb: 1, fontSize: { xs: 15, sm: 18 } }}
      >
        {title}
      </Typography>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "1px solid #ccc", overflowX: "auto" }}
      >
        <Table
          size="small"
          sx={{ minWidth: 520, borderCollapse: "separate", borderSpacing: 0 }}
        >
          <TableHead>
            <TableRow>
              <NumberCell>#</NumberCell>
              <HeaderCell>Key roles</HeaderCell>
              <HeaderCell>Accountable POC</HeaderCell>
              <HeaderCell>% time commitment</HeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(renderRow)}
            {subHeader && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  sx={{
                    backgroundColor: SUB_HEADER_BG,
                    fontWeight: "bold",
                    py: 1,
                    fontSize: 13,
                  }}
                >
                  {subHeader}
                </TableCell>
              </TableRow>
            )}
            {extraRows?.map(renderRow)}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

const AccountTeamPod: React.FC = () => {
  const { globalData, setGlobalData } = useData();

  const podData = globalData?.Account_Team_POD;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning",
  });

  const autoSaveAttempted = useRef(false);
  const dataLoadedFromDB = useRef(false);

  const editable = useEditableTable(podData || {});

  // STEP 1: Load data from database when component mounts
  useEffect(() => {
    const loadDataFromDB = async () => {
      if (dataLoadedFromDB.current) return;

      console.log("Loading account team POD from database...");
      setInitialLoading(true);

      try {
        const response = await fetch(`${API_BASE_URL}/account-team-pod/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const dbData = await response.json();
          console.log("Account team POD loaded from DB:", dbData);

          if (dbData && Object.keys(dbData).length > 0) {
            setGlobalData((prev: any) => ({
              ...prev,
              Account_Team_POD: dbData,
            }));
            dataLoadedFromDB.current = true;
          } else {
            console.log("No account team POD found in database");
          }
        }
      } catch (error) {
        console.error("Error loading account team POD from DB:", error);
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
        console.log("Account team POD already in DB, skipping auto-save");
        return;
      }

      // Check if we have valid data
      const hasValidData =
        podData &&
        (podData.Sales_and_Delivery_Leads ||
          podData.Functional_POCs);

      // Check if data is NEW (no ID means fresh from chatbot)
      const isNewDataFromChatbot = podData && !podData.id;

      if (hasValidData && isNewDataFromChatbot && !autoSaveAttempted.current) {
        console.log("New account team POD from chatbot detected, auto-saving...");
        autoSaveAttempted.current = true;

        try {
          console.log("Sending account team POD to backend:", podData);

          const response = await fetch(
            `${API_BASE_URL}/account-team-pod/save_pod/`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(podData),
            }
          );

          const result = await response.json();
          console.log("Auto-save response:", result);

          if (response.ok && result.success) {
            setGlobalData((prev: any) => ({
              ...prev,
              Account_Team_POD: result.data,
            }));

            setSnackbar({
              open: true,
              message: "✅ Account Team POD auto-saved to database",
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
  }, [podData, setGlobalData]);

  // STEP 3: Manual save when user edits
  const handleManualSave = async () => {
    setLoading(true);
    try {
      console.log("Manual save - sending account team POD:", editable.draftData);

      const response = await fetch(
        `${API_BASE_URL}/account-team-pod/save_pod/`,
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
          Account_Team_POD: result.data,
        }));

        editable.saveEdit(() => {
          // Save completed
        });

        setSnackbar({
          open: true,
          message: "✅ Account Team POD successfully saved",
          severity: "success",
        });
      } else {
        throw new Error(result.message || "Failed to save");
      }
    } catch (error) {
      console.error("Manual save error:", error);
      setSnackbar({
        open: true,
        message: "❌ Failed to save Account Team POD",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    section: "Sales_and_Delivery_Leads" | "Functional_POCs",
    roleKey: string,
    field: "Accountable_POC" | "Time_Commitment",
    value: string
  ) => {
    editable.updateDraft({
      ...editable.draftData,
      [section]: {
        ...editable.draftData[section],
        [roleKey]: {
          ...editable.draftData[section]?.[roleKey],
          [field]: value,
        },
      },
    });
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
        <Typography sx={{ ml: 2 }}>Loading account team POD...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "#ffffff", p: 2 }}>
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

      <Box sx={{ maxWidth: 1600, mx: "auto", px: { xs: 1, sm: 4 }, py: 2 }}>
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
        <Box
          id="template-to-download"
          className="template-section"
          sx={{ mt: 2, mx: "auto" }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, color: "#008080" }}>
            Account Team POD
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <PodTable
                title="Sales and delivery leads"
                rows={salesRoles}
                subHeader="Service line leads"
                extraRows={serviceLineRoles}
                dataSource={editable.draftData.Sales_and_Delivery_Leads}
                isEditing={editable.isEditing}
                section="Sales_and_Delivery_Leads"
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <PodTable
                title="Functional POCs"
                rows={functionalRoles}
                dataSource={editable.draftData.Functional_POCs}
                isEditing={editable.isEditing}
                section="Functional_POCs"
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};

export default AccountTeamPod;
