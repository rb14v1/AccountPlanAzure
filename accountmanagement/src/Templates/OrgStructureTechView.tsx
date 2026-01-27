import React from "react";
import { Box, Button, Typography, styled, TextField, Divider } from "@mui/material";
import DownloadTemplates from "../components/DownloadTemplates";
import { useEditableTable } from "../hooks/useEditableTable";
import { useData } from "../context/DataContext";

const PRIMARY_TEAL = "#008080";
const DARK_BG = "#0b1e26";
const COLOR_GREEN = "#90c978";
const COLOR_ORANGE = "#e6a935";
const COLOR_PINK = "#e66c7d";
const COLOR_CEO = "#0b1e26";
const NODE_WIDTH = "190px";
const TEMPLATE_NAME = "Org_Structure_Tech_View";

const NodeBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== "bgColor",
})<{ bgColor?: string }>(({ bgColor }) => ({
  backgroundColor: bgColor || DARK_BG,
  color: "#fff",
  padding: "10px 5px",
  textAlign: "center",
  width: NODE_WIDTH,
  minHeight: "80px",
  fontSize: "0.75rem",
  fontWeight: 500,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  boxShadow: "0px 3px 6px rgba(0,0,0,0.1)",
  "& .MuiTypography-root": { color: "#fff" },
  zIndex: 2,
  position: "relative",
  margin: "0 auto",
}));

const NodeName = styled(Typography)({
  fontWeight: 800,
  fontSize: "0.85rem",
  marginTop: "6px",
  lineHeight: 1.2,
  textTransform: "capitalize",
});

const VerticalLine = styled(Box)({
  width: "2px",
  backgroundColor: "#ccc",
  height: "25px",
  margin: "0 auto",
});

const BranchContainer = styled(Box)<{ isFirst?: boolean; isLast?: boolean }>(
  ({ isFirst, isLast }) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
    position: "relative",
    paddingTop: "25px",
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: "50%",
      height: "25px",
      borderLeft: "2px solid #ccc",
    },
    "&::after": {
      content: '""',
      position: "absolute",
      top: 0,
      left: isFirst ? "50%" : 0,
      right: isLast ? "50%" : 0,
      borderTop: "2px solid #ccc",
      height: "25px",
      display: isFirst && isLast ? "none" : "block",
    },
  })
);

// Helper function to determine color based on presence_type
const getColorByPresence = (presenceType: string): string => {
  if (presenceType === "Deep presence") return COLOR_GREEN;
  if (presenceType === "Focus area for growth") return COLOR_ORANGE;
  if (presenceType === "Not a priority" || presenceType === "Not a priority / synergistic with Client focus") return COLOR_PINK;
  return DARK_BG;
};

interface KeyFunction {
  function: string;
  leader_name: string;
  leader_role: string;
  presence_type: string;
}

interface OrgStructureData {
  group_ceo: { name: string; role: string };
  cdio: { name: string; role: string };
  key_functions: KeyFunction[];
}

const OrgStructureTechView: React.FC = () => {
  const { globalData, setGlobalData } = useData();
  const contextData = globalData?.org_structure_tech_view || null;

  // Extract data with fallbacks
  const initialData: OrgStructureData = {
    group_ceo: contextData?.group_ceo || { name: "Ralph Hamers", role: "Group CEO" },
    cdio: contextData?.cdio || { name: "Mike Dargan", role: "Chief Digital & Information Officer" },
    key_functions: contextData?.key_functions || [
      {
        function: "Chairman UBS India & Group Head Corporate Services",
        leader_name: "Harald Egger",
        leader_role: "",
        presence_type: "Deep presence"
      },
      {
        function: "Chief Information Security Officer",
        leader_name: "Thomas Hoffmann",
        leader_role: "",
        presence_type: "Deep presence"
      },
      {
        function: "Chief Digital & Information Officer Asset Management",
        leader_name: "Seraina Frey",
        leader_role: "",
        presence_type: "Focus area for growth"
      },
      {
        function: "APAC Head - Chief Digital and Information Officer",
        leader_name: "",
        leader_role: "",
        presence_type: "Not a priority"
      }
    ],
  };

  // Initialize editable table hook
  const editable = useEditableTable(initialData);

  // Handle field changes
  const handleCEOChange = (field: "name" | "role", value: string) => {
    editable.updateDraft({
      ...editable.draftData,
      group_ceo: {
        ...editable.draftData.group_ceo,
        [field]: value,
      },
    });
  };

  const handleCDIOChange = (field: "name" | "role", value: string) => {
    editable.updateDraft({
      ...editable.draftData,
      cdio: {
        ...editable.draftData.cdio,
        [field]: value,
      },
    });
  };

  const handleFunctionChange = (
    index: number,
    field: keyof KeyFunction,
    value: string
  ) => {
    const updatedFunctions = [...editable.draftData.key_functions];
    updatedFunctions[index] = {
      ...updatedFunctions[index],
      [field]: value,
    };
    editable.updateDraft({
      ...editable.draftData,
      key_functions: updatedFunctions,
    });
  };

  const displayFunctions = editable.draftData.key_functions;

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "#ffffff", p: 2 }}>
      <Box sx={{ maxWidth: 1600, mx: "auto", px: 4, py: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            mb: 2,
          }}
        >


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
                    editable.saveEdit((data) =>
                      setGlobalData((prev: any) => ({
                        ...prev,
                        org_structure_tech_view: data,
                      }))
                    )
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
          <Typography fontSize={35} fontWeight={700} sx={{ color: "teal" }}>
            Org structure: Tech view
          </Typography>
          <Typography
            sx={{
              fontSize: 22,
              fontWeight: 700,
              textAlign: "center",
              mb: 3,
              color: PRIMARY_TEAL,
            }}
          >
            Organizational Chart
          </Typography>

          {/* Group CEO */}
          <NodeBox bgColor={COLOR_CEO}>
            {editable.isEditing ? (
              <>
                <TextField
                  size="small"
                  fullWidth
                  value={editable.draftData.group_ceo.role}
                  onChange={(e) => handleCEOChange("role", e.target.value)}
                  sx={{
                    mb: 1,
                    "& .MuiInputBase-root": { color: "white", fontSize: "0.75rem" },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(255, 255, 255, 0.3)",
                    },
                  }}
                />
                <TextField
                  size="small"
                  fullWidth
                  value={editable.draftData.group_ceo.name}
                  onChange={(e) => handleCEOChange("name", e.target.value)}
                  sx={{
                    "& .MuiInputBase-root": { color: "white", fontSize: "0.85rem", fontWeight: 800 },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(255, 255, 255, 0.3)",
                    },
                  }}
                />
              </>
            ) : (
              <>
                <Typography sx={{ fontSize: "0.75rem" }}>
                  {editable.draftData.group_ceo.role}
                </Typography>
                <NodeName>{editable.draftData.group_ceo.name}</NodeName>
              </>
            )}
          </NodeBox>

          <VerticalLine />

          {/* CDIO */}
          <NodeBox bgColor={DARK_BG}>
            {editable.isEditing ? (
              <>
                <TextField
                  size="small"
                  fullWidth
                  value={editable.draftData.cdio.role}
                  onChange={(e) => handleCDIOChange("role", e.target.value)}
                  sx={{
                    mb: 1,
                    "& .MuiInputBase-root": { color: "white", fontSize: "0.75rem" },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(255, 255, 255, 0.3)",
                    },
                  }}
                />
                <TextField
                  size="small"
                  fullWidth
                  value={editable.draftData.cdio.name}
                  onChange={(e) => handleCDIOChange("name", e.target.value)}
                  sx={{
                    "& .MuiInputBase-root": { color: "white", fontSize: "0.85rem", fontWeight: 800 },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(255, 255, 255, 0.3)",
                    },
                  }}
                />
              </>
            ) : (
              <>
                <Typography sx={{ fontSize: "0.75rem" }}>
                  {editable.draftData.cdio.role}
                </Typography>
                <NodeName>{editable.draftData.cdio.name}</NodeName>
              </>
            )}
          </NodeBox>

          {/* Key Functions - Dynamic rendering */}
          <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 2 }}>
            {displayFunctions.slice(0, 4).map((func, index) => {
              const bgColor = getColorByPresence(func.presence_type);
              const isFirst = index === 0;
              const isLast = index === displayFunctions.slice(0, 4).length - 1;

              return (
                <BranchContainer key={index} isFirst={isFirst} isLast={isLast}>
                  <NodeBox bgColor={bgColor}>
                    {editable.isEditing ? (
                      <>
                        <TextField
                          size="small"
                          fullWidth
                          multiline
                          rows={2}
                          value={func.function}
                          onChange={(e) =>
                            handleFunctionChange(index, "function", e.target.value)
                          }
                          sx={{
                            mb: 1,
                            "& .MuiInputBase-root": { color: "white", fontSize: "0.75rem" },
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "rgba(255, 255, 255, 0.3)",
                            },
                          }}
                        />
                        <TextField
                          size="small"
                          fullWidth
                          value={func.leader_name}
                          onChange={(e) =>
                            handleFunctionChange(index, "leader_name", e.target.value)
                          }
                          placeholder="Leader Name"
                          sx={{
                            "& .MuiInputBase-root": { color: "white", fontSize: "0.85rem", fontWeight: 800 },
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "rgba(255, 255, 255, 0.3)",
                            },
                          }}
                        />
                      </>
                    ) : (
                      <>
                        <Typography sx={{ fontSize: "0.75rem" }}>
                          {func.function}
                        </Typography>
                        {func.leader_name && <NodeName>{func.leader_name}</NodeName>}
                      </>
                    )}
                  </NodeBox>
                </BranchContainer>
              );
            })}
          </Box>

          {/* Legend */}
          <Box sx={{ mt: 4, display: "flex", alignItems: "center", gap: 2 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 14 }}>Functions</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 20, height: 20, bgcolor: COLOR_GREEN }} />
              <Typography sx={{ fontSize: 13 }}>Deep presence</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 20, height: 20, bgcolor: COLOR_ORANGE }} />
              <Typography sx={{ fontSize: 13 }}>Focus area for growth</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 20, height: 20, bgcolor: COLOR_PINK }} />
              <Typography sx={{ fontSize: 13 }}>
                Not a priority / synergistic with Client focus
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography sx={{ fontSize: 10, color: "#6b7280" }}>
            Source: Company website, LinkedIn, General Web Search and Capital IQ
          </Typography>
          <Typography sx={{ fontSize: 10, color: "#6b7280", mt: 1 }}>
            Classification: Controlled. Copyright ©2025 Version 1. All rights reserved.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default OrgStructureTechView;