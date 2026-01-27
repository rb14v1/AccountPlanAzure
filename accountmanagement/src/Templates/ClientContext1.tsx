import React from "react";
import {
  Box,
  Button,
  Typography,
  styled,
  Avatar,
  List,
  ListItem,
  TextField,
} from "@mui/material";
import DownloadTemplates from "../components/DownloadTemplates";
import { useEditableTable } from "../hooks/useEditableTable";
import { useData } from "../context/DataContext";

const TEMPLATE_NAME = "Client_Context";

// DEFINE THE SHAPE OF YOUR DATA (Matches your Prompt)
export interface ClientContextJSON {
  year_founded: string;
  headquarters_location: string;
  number_of_offices: string;
  total_employees: string;
  roe_percent: string;
  total_revenue_usd_bn: {
    ebitda_margin: string;
    actuals: string;
    forecast: string;
  };
  revenue_by_year: Array<{
    fiscal_year: string;
    revenue: string;
    cagr_percent: string;
  }>;
  key_highlights: string[];
  executive_changes: Array<{
    name: string;
    position: string;
    background: string;
  }>;
  client_description: string;
}

interface StatData {
  value: string;
  label: string;
}

interface ExecData {
  name: string;
  role: string;
  desc: string;
  img: string;
}

const PRIMARY_TEAL = "#008080";
const PRIMARY_ORANGE = "#d95308";
const BUTTON_GREEN = "#009A44";
const DARK_BG = "#0b1e26";

const SectionHeader = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: "1.1rem",
  marginBottom: theme.spacing(1.5),
  borderBottom: "1px solid #ccc",
  paddingBottom: theme.spacing(1),
  color: "#222",
  marginTop: theme.spacing(0),
}));

const StatBox = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  color: "#fff",
  minWidth: 90,
  position: "relative",
  flex: 1,
}));

// --- UPDATED SUB-COMPONENT: Accepts 'stats', 'isEditing', and 'onStatsChange' props ---
const StatsRow: React.FC<{
  stats: StatData[];
  isEditing: boolean;
  onStatsChange: (index: number, value: string) => void;
}> = ({ stats, isEditing, onStatsChange }) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      bgcolor: DARK_BG,
      py: 2.5,
      px: { xs: 2, md: 4 },
      mb: 5,
      width: "100%",
    }}
  >
    {stats.map((stat, idx) => (
      <React.Fragment key={idx}>
        <StatBox>
          {isEditing ? (
            <TextField
              size="small"
              value={stat.value}
              onChange={(e) => onStatsChange(idx, e.target.value)}
              sx={{
                mb: 0.5,
                "& .MuiInputBase-root": {
                  color: "white",
                  fontWeight: 800,
                  fontSize: "1.25rem",
                  textAlign: "center",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255, 255, 255, 0.3)",
                },
              }}
            />
          ) : (
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
              {stat.value}
            </Typography>
          )}
          <Typography
            variant="caption"
            sx={{ opacity: 0.8, fontSize: "0.75rem", textTransform: "uppercase" }}
          >
            {stat.label}
          </Typography>
        </StatBox>
        {idx < stats.length - 1 && (
          <Box sx={{ width: "1px", height: "40px", bgcolor: "rgba(255,255,255,0.2)" }} />
        )}
      </React.Fragment>
    ))}
  </Box>
);

// --- UPDATED SUB-COMPONENT: Accepts 'data', 'margin', 'isEditing', and handlers ---
const RevenueChart: React.FC<{
  revenueData: ClientContextJSON["revenue_by_year"];
  margin: string;
  isEditing: boolean;
  onRevenueChange: (index: number, field: string, value: string) => void;
  onMarginChange: (value: string) => void;
}> = ({ revenueData, margin, isEditing, onRevenueChange, onMarginChange }) => {
  const getNum = (str: string) => parseFloat(str.replace(/[^0-9.]/g, "")) || 0;
  const maxVal = Math.max(...revenueData.map((d) => getNum(d.revenue))) || 1;

  return (
    <Box sx={{ mb: 4, pr: { md: 4 } }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          borderBottom: "1px solid #ccc",
          pb: 1,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1rem" }}>
          Total Revenue
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box sx={{ width: 12, height: 8, bgcolor: "#dba380" }} />
            <Typography variant="caption" sx={{ fontSize: "0.7rem", color: "#555" }}>
              Actuals
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box sx={{ width: 12, height: 8, bgcolor: PRIMARY_ORANGE }} />
            <Typography variant="caption" sx={{ fontSize: "0.7rem", color: "#555" }}>
              Forecast
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {isEditing ? (
              <TextField
                size="small"
                value={margin}
                onChange={(e) => onMarginChange(e.target.value)}
                sx={{ width: 60, "& .MuiInputBase-input": { fontSize: "0.6rem", p: 0.5 } }}
              />
            ) : (
              <Typography
                variant="caption"
                sx={{
                  fontWeight: "bold",
                  bgcolor: "#eee",
                  px: 0.5,
                  borderRadius: 1,
                  fontSize: "0.6rem",
                }}
              >
                {margin}
              </Typography>
            )}
            <Typography variant="caption" sx={{ fontSize: "0.7rem", color: "#555" }}>
              EBITDA margin
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          position: "relative",
          height: 260,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-around",
          pt: 6,
        }}
      >
        {revenueData.length > 0 && (
          <>
            <svg
              style={{
                position: "absolute",
                top: 30,
                left: 5,
                width: "90%",
                height: "60px",
                zIndex: 0,
                overflow: "visible",
              }}
            >
              <path
                d="M 10,40 Q 150,0 350,20"
                stroke="#333"
                strokeWidth="1.5"
                fill="none"
                markerEnd="url(#arrowhead)"
              />
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#333" />
                </marker>
              </defs>
            </svg>

            <Box
              sx={{
                position: "absolute",
                top: 10,
                left: "42%",
                textAlign: "center",
                bgcolor: "#fff",
                px: 1,
                zIndex: 2,
              }}
            >
              <Typography
                variant="caption"
                sx={{ fontWeight: 800, fontSize: "0.7rem", display: "block", lineHeight: 1 }}
              >
                CAGR
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 800, fontSize: "0.7rem" }}>
                (%)
              </Typography>
            </Box>
          </>
        )}

        {revenueData.map((item, idx) => {
          const numericVal = getNum(item.revenue);
          const heightPx = (numericVal / maxVal) * 220;

          return (
            <Box
              key={idx}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "18%",
                position: "relative",
                zIndex: 1,
              }}
            >
              <Box
                sx={{
                  width: "45px",
                  height: `${heightPx}px`,
                  bgcolor: idx > 1 ? PRIMARY_ORANGE : "#dba380",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: "0.85rem",
                }}
              >
                {isEditing ? (
                  <TextField
                    size="small"
                    value={item.revenue}
                    onChange={(e) => onRevenueChange(idx, "revenue", e.target.value)}
                    sx={{
                      width: "100%",
                      "& .MuiInputBase-input": {
                        color: "white",
                        fontWeight: "bold",
                        fontSize: "0.7rem",
                        textAlign: "center",
                        p: 0.5,
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(255, 255, 255, 0.3)",
                      },
                    }}
                  />
                ) : (
                  numericVal
                )}
              </Box>
              {isEditing ? (
                <TextField
                  size="small"
                  value={item.fiscal_year}
                  onChange={(e) => onRevenueChange(idx, "fiscal_year", e.target.value)}
                  sx={{ mt: 1, width: 60, "& .MuiInputBase-input": { fontSize: "0.75rem", p: 0.5, textAlign: "center" } }}
                />
              ) : (
                <Typography sx={{ mt: 1, fontWeight: "bold", fontSize: "0.75rem" }}>
                  {item.fiscal_year}
                </Typography>
              )}
              {isEditing ? (
                <TextField
                  size="small"
                  value={item.cagr_percent}
                  onChange={(e) => onRevenueChange(idx, "cagr_percent", e.target.value)}
                  sx={{ mt: 0.5, width: 60, "& .MuiInputBase-input": { fontSize: "0.65rem", p: 0.5, textAlign: "center" } }}
                />
              ) : (
                <Box
                  sx={{
                    mt: 0.5,
                    bgcolor: "#e0e0e0",
                    px: 1,
                    borderRadius: "4px",
                    fontSize: "0.65rem",
                    fontWeight: "bold",
                  }}
                >
                  {item.cagr_percent}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1rem", mb: 1 }}>
          Client Description
        </Typography>
      </Box>
    </Box>
  );
};

const ExecutiveCard: React.FC<
  ExecData & { isEditing: boolean; onChange: (field: string, value: string) => void }
> = ({ name, role, desc, img, isEditing, onChange }) => (
  <Box sx={{ mb: 2 }}>
    <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
      <Avatar src={img} alt={name} sx={{ width: 45, height: 45, mr: 1.5, fontSize: "1rem" }}>
        {name.charAt(0)}
      </Avatar>
      <Box sx={{ flex: 1 }}>
        {isEditing ? (
          <>
            <TextField
              size="small"
              fullWidth
              value={name}
              onChange={(e) => onChange("name", e.target.value)}
              sx={{ mb: 0.5, "& .MuiInputBase-input": { fontSize: "0.9rem", fontWeight: 800 } }}
            />
            <TextField
              size="small"
              fullWidth
              value={role}
              onChange={(e) => onChange("role", e.target.value)}
              sx={{ "& .MuiInputBase-input": { fontSize: "0.7rem", color: "#666" } }}
            />
          </>
        ) : (
          <>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: "0.9rem", color: "#000" }}>
              {name}
            </Typography>
            <Typography variant="caption" sx={{ color: "#666", fontSize: "0.7rem" }}>
              {role}
            </Typography>
          </>
        )}
      </Box>
    </Box>
    {isEditing ? (
      <TextField
        size="small"
        fullWidth
        multiline
        rows={2}
        value={desc}
        onChange={(e) => onChange("desc", e.target.value)}
        sx={{ mt: 0.5, "& .MuiInputBase-input": { fontSize: "0.75rem" } }}
      />
    ) : (
      <Typography variant="body2" sx={{ fontSize: "0.75rem", color: "#555", lineHeight: 1.4, mt: 0.5 }}>
        {desc}
      </Typography>
    )}
  </Box>
);

// --- MAIN COMPONENT ---
const ClientContext: React.FC = () => {
  const { globalData, setGlobalData } = useData();
  const contextData: ClientContextJSON | undefined = globalData?.Client_Context;

  // Initialize data structure
  const initialData: ClientContextJSON = contextData || {
    year_founded: "",
    headquarters_location: "",
    number_of_offices: "",
    total_employees: "",
    roe_percent: "",
    total_revenue_usd_bn: {
      ebitda_margin: "",
      actuals: "",
      forecast: "",
    },
    revenue_by_year: [],
    key_highlights: [],
    executive_changes: [],
    client_description: "",
  };

  // Initialize editable hook
  const editable = useEditableTable<ClientContextJSON>(initialData);

  // Handle stats changes
  const handleStatsChange = (index: number, value: string) => {
    const fields = ["year_founded", "headquarters_location", "number_of_offices", "total_employees", "roe_percent"];
    editable.updateDraft({
      ...editable.draftData,
      [fields[index]]: value,
    });
  };

  // Handle revenue data changes
  const handleRevenueChange = (index: number, field: string, value: string) => {
    const updatedRevenue = [...editable.draftData.revenue_by_year];
    updatedRevenue[index] = {
      ...updatedRevenue[index],
      [field]: value,
    };
    editable.updateDraft({
      ...editable.draftData,
      revenue_by_year: updatedRevenue,
    });
  };

  // Handle margin change
  const handleMarginChange = (value: string) => {
    editable.updateDraft({
      ...editable.draftData,
      total_revenue_usd_bn: {
        ...editable.draftData.total_revenue_usd_bn,
        ebitda_margin: value,
      },
    });
  };

  // Handle highlights change
  const handleHighlightChange = (index: number, value: string) => {
    const updatedHighlights = [...editable.draftData.key_highlights];
    updatedHighlights[index] = value;
    editable.updateDraft({
      ...editable.draftData,
      key_highlights: updatedHighlights,
    });
  };

  // Handle executive changes
  const handleExecutiveChange = (index: number, field: string, value: string) => {
    const updatedExecs = [...editable.draftData.executive_changes];
    updatedExecs[index] = {
      ...updatedExecs[index],
      [field === "role" ? "position" : field === "desc" ? "background" : field]: value,
    };
    editable.updateDraft({
      ...editable.draftData,
      executive_changes: updatedExecs,
    });
  };

  // MAP DYNAMIC DATA TO UI STRUCTURES
  const statsData: StatData[] = [
    { value: editable.draftData.year_founded, label: "year founded" },
    { value: editable.draftData.headquarters_location, label: "Headquarters" },
    { value: editable.draftData.number_of_offices, label: "offices" },
    { value: editable.draftData.total_employees, label: "Employees" },
    { value: editable.draftData.roe_percent, label: "ROE" },
  ];

  const executives: ExecData[] = editable.draftData.executive_changes.map((exec) => ({
    name: exec.name,
    role: exec.position,
    desc: exec.background,
    img: `https://ui-avatars.com/api/?name=${encodeURIComponent(exec.name)}&background=random&color=fff`,
  }));

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "#ffffff", p: 2 }}>
      <Box sx={{ maxWidth: 1600, mx: "auto", px: 4, py: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 3,
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, color: PRIMARY_TEAL, letterSpacing: "-0.5px" }}>
            Client context
          </Typography>

          <Box sx={{ display: "flex", gap: 2 }}>
            <DownloadTemplates templateName={TEMPLATE_NAME} />
            {!editable.isEditing ? (
              <Button
                variant="outlined"
                onClick={editable.startEdit}
                sx={{
                  borderColor: "#008080",
                  color: "#008080",
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
                  onClick={() =>
                    editable.saveEdit((updatedData) => {
                      setGlobalData((prev: any) => ({
                        ...prev,
                        Client_Context: updatedData,
                      }));
                    })
                  }
                  sx={{
                  backgroundColor: "#008080",
                  color: "#fff",
                  "&:hover": {
                    backgroundColor: "#006d6d",
                  },
                }}
                >
                Save
              </Button>
            <Button
              variant="outlined"
              onClick={editable.cancelEdit}
              sx={{
                borderColor: "#008080",
                color: "#008080",
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
      </Box>

      <Box id="template-to-download" className="template-section">
        <StatsRow stats={statsData} isEditing={editable.isEditing} onStatsChange={handleStatsChange} />

        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 6, width: "100%" }}>
          <Box sx={{ flex: 1 }}>
            <RevenueChart
              revenueData={editable.draftData.revenue_by_year}
              margin={editable.draftData.total_revenue_usd_bn.ebitda_margin}
              isEditing={editable.isEditing}
              onRevenueChange={handleRevenueChange}
              onMarginChange={handleMarginChange}
            />

            <Box sx={{ mt: -4 }}>
              {editable.isEditing ? (
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={editable.draftData.client_description}
                  onChange={(e) =>
                    editable.updateDraft({
                      ...editable.draftData,
                      client_description: e.target.value,
                    })
                  }
                  sx={{ "& .MuiInputBase-input": { fontSize: "0.85rem" } }}
                />
              ) : (
                <Typography variant="body2" sx={{ color: "#555", lineHeight: 1.6, fontSize: "0.85rem" }}>
                  {editable.draftData.client_description}
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Box sx={{ mb: 4 }}>
              <SectionHeader variant="h6">Key highlights</SectionHeader>
              <List sx={{ pl: 0 }}>
                {editable.draftData.key_highlights.map((text, idx) => {
                  if (editable.isEditing) {
                    return (
                      <ListItem key={idx} sx={{ display: "list-item", pl: 0, py: 0.5 }}>
                        <TextField
                          fullWidth
                          multiline
                          size="small"
                          value={text}
                          onChange={(e) => handleHighlightChange(idx, e.target.value)}
                          sx={{ "& .MuiInputBase-input": { fontSize: "0.8rem" } }}
                        />
                      </ListItem>
                    );
                  }

                  const firstCommaIndex = text.indexOf(",");
                  const boldText = firstCommaIndex !== -1 ? text.substring(0, firstCommaIndex) : text;
                  const normalText = firstCommaIndex !== -1 ? text.substring(firstCommaIndex) : "";

                  return (
                    <ListItem
                      key={idx}
                      sx={{ display: "list-item", pl: 0, py: 0.25, alignItems: "flex-start" }}
                    >
                      <Box component="span" sx={{ display: "flex", alignItems: "flex-start" }}>
                        <Box component="span" sx={{ mr: 1, color: "#333", fontSize: "1.2rem", lineHeight: 0.8 }}>
                          •
                        </Box>
                        <Typography
                          variant="body2"
                          component="span"
                          sx={{ fontSize: "0.8rem", lineHeight: 1.5, color: "#333" }}
                        >
                          <strong>{boldText}</strong>
                          {normalText}
                        </Typography>
                      </Box>
                    </ListItem>
                  );
                })}
              </List>
            </Box>

            <Box>
              <SectionHeader variant="h6">Executive changes</SectionHeader>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mt: 2 }}>
                {executives.map((exec, idx) => (
                  <ExecutiveCard
                    key={idx}
                    {...exec}
                    isEditing={editable.isEditing}
                    onChange={(field, value) => handleExecutiveChange(idx, field, value)}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
    </Box >
  );
};

export default ClientContext;