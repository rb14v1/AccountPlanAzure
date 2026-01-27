import React from "react";
import {
  Box,
  Button,
  Grid,
  Typography,
  Table,
  TableBody,
  TextField,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Paper,
  styled
} from "@mui/material";
import { useData } from "../context/DataContext";
import duckCreekLogo from "../assets/duckCreek.png";
import pegaLogo from "../assets/pega.png";
import DownloadTemplates from "../components/DownloadTemplates";
import { useEditableTable } from "../hooks/useEditableTable";

type CompetitionRow = {
  name: string;
  share: string;
  depth: number;
  key: string;
};

type DummyData = {
  businessPriorities: string[];
  techPriorities: string[];
  spend: { overall: string; outsourced: string; rnd: string };
  competition: CompetitionRow[];
};

type PartnerLogos = {
  logo?: string;
  text?: string;
  className?: string;
  name: string;
};

type TechData = {
  spend: { overall: string; outsourced: string; rnd: string };
  partners: {
    erp: { logo: string; text: string };
    hyperscalers: PartnerLogos[];
    isvs: PartnerLogos[];
  };
};

const PieChart = styled("div")({
  width: 160,
  height: 160,
  borderRadius: "50%",
  background:
    "conic-gradient(#0f172a 0% 40%, #06b6d4 40% 70%, #e2e8f0 70% 90%, #cbd5e1 90% 100%)",
  position: "relative",
  "&::after": {
    content: '""',
    position: "absolute",
    width: 80,
    height: 80,
    background: "#ffffff",
    borderRadius: "50%",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)"
  }
});

const spendHeaderSx = {
  fontWeight: 600,
  fontSize: "0.75rem",
  color: "#fff",
  bgcolor: "#0b1e26",
  border: "1px solid #333",
  py: 1
};

const spendCellSx = {
  fontSize: "0.8rem",
  fontWeight: 600,
  textAlign: "center" as const,
  border: "1px solid #ccc"
};

function depthColor(depth: number) {
  if (depth >= 5) return { bg: "#00B050", color: "#fff" };
  if (depth === 4) return { bg: "#92D050", color: "#000" };
  if (depth === 3) return { bg: "#FFC000", color: "#000" };
  if (depth === 2) return { bg: "#FF6B6B", color: "#fff" };
  return { bg: "#D9D9D9", color: "#000" };
}

const ClientContext2 = () => {
  // Access global data
  const { globalData, setGlobalData } = useData();
  const contextData = globalData?.client_context_business_tech_priorities || null;
  const editable = useEditableTable(contextData);


  console.log("ClientContext2 - globalData:", globalData); // DEBUG
  console.log("ClientContext2 - contextData:", contextData); // DEBUG

  // Extract data with fallbacks
  const businessPriorities = contextData?.top_business_priorities || [
    "Improve customer experience across digital channels",
    "Reduce operational cost by 15% via automation",
    "Expand to new markets in APAC region"
  ];

  const techPriorities = contextData?.top_tech_priorities || [
    "Cloud migration (Move legacy Oracle to AWS)",
    "AI automation for customer support tickets",
    "Cybersecurity enhancement (Zero Trust model)"
  ];

  const techSpendData = contextData?.tech_spend_landscape || {
    core_erp_platform: "Oracle",
    preferred_hyperscaler_partners: "Azure, AWS",
    other_isvs: "Salesforce, PEGA"
  };
  const updateBusinessPriority = (index: number, value: string) => {
    const updated = [...editable.draftData.top_business_priorities];
    updated[index] = value;

    editable.updateDraft({
      ...editable.draftData,
      top_business_priorities: updated,
    });
  };

  const updateTechPriority = (index: number, value: string) => {
    const updated = [...editable.draftData.top_tech_priorities];
    updated[index] = value;

    editable.updateDraft({
      ...editable.draftData,
      top_tech_priorities: updated,
    });
  };

  const updateKeyArea = (index: number, value: string) => {
    const updated = [...editable.draftData.competitive_intel.competition_overview];
    updated[index] = {
      ...updated[index],
      key_areas_of_engagement: value,
    };

    editable.updateDraft({
      ...editable.draftData,
      competitive_intel: {
        ...editable.draftData.competitive_intel,
        competition_overview: updated,
      },
    });
  };

  const competitiveIntel = contextData?.competitive_intel || {
    share_of_wallet: {
      client: 20,
      competitor_1: 20,
      competitor_2: 20,
      competitor_3: 10
    },
    competition_overview: [
      { name: "Version 1", share_of_wallet_percent: "20%", depth_of_relationship: 4, key_areas_of_engagement: "Cloud & ERP" },
      { name: "Competitor 1", share_of_wallet_percent: "20%", depth_of_relationship: 3, key_areas_of_engagement: "Data & AI" },
      { name: "Competitor 2", share_of_wallet_percent: "20%", depth_of_relationship: 3, key_areas_of_engagement: "Consulting" },
      { name: "Competitor 3", share_of_wallet_percent: "10%", depth_of_relationship: 2, key_areas_of_engagement: "Support" },
      { name: "Competitor 4", share_of_wallet_percent: "10%", depth_of_relationship: 2, key_areas_of_engagement: "Modernisation" }
    ]
  };

  // Build dummy data for compatibility
  const dummyData: DummyData = {
    businessPriorities,
    techPriorities,
    spend: { overall: "€120 Mn", outsourced: "€45 Mn", rnd: "€15 Mn" },
    competition: competitiveIntel.competition_overview.map((comp: any) => ({
      name: comp.name || "N/A",
      share: comp.share_of_wallet_percent || "0%",
      depth: comp.depth_of_relationship || 0,
      key: comp.key_areas_of_engagement || "..."
    }))
  };
  const TEMPLATE_NAME = " Client_Context_2";
  // Parse hyperscalers and ISVs
  const hyperscalersList = techSpendData.preferred_hyperscaler_partners?.split(",").map((s: string) => s.trim()) || [];
  const isvsList = techSpendData.other_isvs?.split(",").map((s: string) => s.trim()) || [];

  // Build tech data structure
  const techData: TechData = {
    spend: { overall: "€xx Mn", outsourced: "€xx Mn", rnd: "€xx Mn" },
    partners: {
      erp: {
        logo: techSpendData.core_erp_platform?.toLowerCase().includes("oracle")
          ? "https://upload.wikimedia.org/wikipedia/commons/5/50/Oracle_logo.svg"
          : "",
        text: techSpendData.core_erp_platform || "ERP CLOUD"
      },
      hyperscalers: hyperscalersList.map((name: string) => {
        if (name.toLowerCase().includes("azure")) {
          return {
            logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Microsoft_Azure.svg",
            name: "Azure"
          };
        }
        if (name.toLowerCase().includes("aws")) {
          return {
            logo: "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg",
            name: "AWS"
          };
        }
        return { text: name, name };
      }),
      isvs: isvsList.map((name: string) => {
        if (name.toLowerCase().includes("salesforce")) {
          return {
            logo: "https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg",
            name: "Salesforce"
          };
        }
        if (name.toLowerCase().includes("pega")) {
          return { logo: pegaLogo, name: "PEGA" };
        }
        if (name.toLowerCase().includes("duck")) {
          return { logo: duckCreekLogo, name: "Duck Creek" };
        }
        return { text: name, name };
      })
    }
  };

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
          <DownloadTemplates templateName={TEMPLATE_NAME} />
          {!editable.isEditing ? (
            <Button variant="outlined" onClick={editable.startEdit} sx={{
              borderColor: "#008080",
              color: "#008080",
              ml: 2,
              "&:hover": {
                borderColor: "#006d6d",
                backgroundColor: "#e6f4f4",
              },
            }}>
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
                      client_context_business_tech_priorities: updatedData,
                    }));
                  })
                }
                sx={{
                  backgroundColor: "#008080",
                  ml: 2,
                  color: "#fff",
                  "&:hover": {
                    backgroundColor: "#006d6d",
                  },
                }}
              >
                Save
              </Button>
              <Button variant="outlined" onClick={editable.cancelEdit} sx={{
                borderColor: "#008080",
                color: "#008080",
                ml: 2,
                "&:hover": {
                  borderColor: "#006d6d",
                  backgroundColor: "#e6f4f4",
                },
              }}>
                Cancel
              </Button>
            </>
          )}
        </Box>
        <Box id="template-to-download" className="template-section" sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: "#008080", mb: 0.5 }}
          >
            Client context 2
          </Typography>


          <Box sx={{ mb: 5 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: "1.1rem",
                mb: 2.5,
                color: "#1B2B38"
              }}
            >
              Business and tech priorities
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    border: "2px solid #e2e8f0",
                    borderRadius: 2,
                    p: 3,
                    minHeight: 240,
                    bgcolor: "#ffffff"
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      mb: 2,
                      color: "#1B2B38",
                      lineHeight: 1.4
                    }}
                  >
                    What are the top business priorities / key challenges currently
                    faced by the client?
                  </Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2.5, color: "#334155" }}>
                    {dummyData.businessPriorities.map((item, i) => (
                      <li key={i}>
                        {editable.isEditing ? (
                          <TextField
                            fullWidth
                            size="small"
                            value={editable.draftData.top_business_priorities[i] || ""}
                            onChange={(e) => updateBusinessPriority(i, e.target.value)}
                          />
                        ) : (
                          item
                        )}
                      </li>
                    ))}

                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    border: "2px solid #e2e8f0",
                    borderRadius: 2,
                    p: 3,
                    minHeight: 240,
                    bgcolor: "#ffffff"
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      mb: 2,
                      color: "#1B2B38",
                      lineHeight: 1.4
                    }}
                  >
                    What are the top tech priorities / use cases linked to business
                    challenges?
                  </Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2.5, color: "#334155" }}>
                    {dummyData.techPriorities.map((item, i) => (
                      <li key={i}>
                        {editable.isEditing ? (
                          <TextField
                            fullWidth
                            size="small"
                            value={editable.draftData.top_tech_priorities[i] || ""}
                            onChange={(e) => updateTechPriority(i, e.target.value)}
                          />
                        ) : (
                          item
                        )}
                      </li>
                    ))}

                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 5 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: "1.1rem",
                mb: 2.5,
                color: "#1B2B38"
              }}
            >
              Tech spend and landscape
            </Typography>

            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 1,
                    overflow: "hidden"
                  }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={spendHeaderSx} colSpan={2}>
                          Tech Spend (Annual)
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ ...spendCellSx, bgcolor: "#f8fafc" }}>
                          Overall
                        </TableCell>
                        <TableCell sx={spendCellSx}>
                          {techData.spend.overall}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ ...spendCellSx, bgcolor: "#f8fafc" }}>
                          Outsourced
                        </TableCell>
                        <TableCell sx={spendCellSx}>
                          {techData.spend.outsourced}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ ...spendCellSx, bgcolor: "#f8fafc" }}>
                          R&D
                        </TableCell>
                        <TableCell sx={spendCellSx}>
                          {techData.spend.rnd}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Paper>
              </Grid>

              <Grid item xs={12} md={8}>
                <Paper
                  elevation={0}
                  sx={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 1,
                    p: 3
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      mb: 2,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}
                  >
                    Core ERP Platform
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                    {techData.partners.erp.logo && (
                      <img
                        src={techData.partners.erp.logo}
                        alt="ERP"
                        style={{ height: 45 }}
                      />
                    )}
                    {techData.partners.erp.text && !techData.partners.erp.logo && (
                      <Typography sx={{ fontSize: "1rem", fontWeight: 600 }}>
                        {techData.partners.erp.text}
                      </Typography>
                    )}
                  </Box>

                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      mb: 2,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}
                  >
                    Preferred Hyperscaler Partners
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 3,
                      flexWrap: "wrap",
                      alignItems: "center",
                      mb: 3
                    }}
                  >
                    {techData.partners.hyperscalers.map((partner, i) => (
                      <Box key={i}>
                        {partner.logo ? (
                          <img
                            src={partner.logo}
                            alt={partner.name}
                            style={{ height: 35 }}
                          />
                        ) : (
                          <Typography sx={{ fontSize: "1rem", fontWeight: 600 }}>
                            {partner.text || partner.name}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>

                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      mb: 2,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}
                  >
                    Other ISVs
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 3,
                      flexWrap: "wrap",
                      alignItems: "center"
                    }}
                  >
                    {techData.partners.isvs.map((partner, i) => (
                      <Box key={i}>
                        {partner.logo ? (
                          <img
                            src={partner.logo}
                            alt={partner.name}
                            style={{ height: 30 }}
                          />
                        ) : (
                          <Typography sx={{ fontSize: "1rem", fontWeight: 600 }}>
                            {partner.text || partner.name}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: "1.1rem",
                mb: 2.5,
                color: "#1B2B38"
              }}
            >
              Competitive intel & overview
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 1,
                    p: 3,
                    textAlign: "center"
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      mb: 3,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}
                  >
                    Competitive Intel
                  </Typography>

                  <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
                    <PieChart />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.5,
                      alignItems: "flex-start",
                      fontSize: "0.75rem",
                      color: "#475569"
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 14,
                          height: 14,
                          bgcolor: "#0f172a",
                          borderRadius: "2px"
                        }}
                      />
                      <span>Client</span>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 14,
                          height: 14,
                          bgcolor: "#06b6d4",
                          borderRadius: "2px"
                        }}
                      />
                      <span>Competitor 1</span>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 14,
                          height: 14,
                          bgcolor: "#e2e8f0",
                          borderRadius: "2px"
                        }}
                      />
                      <span>Competitor 2</span>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 14,
                          height: 14,
                          bgcolor: "#cbd5e1",
                          borderRadius: "2px"
                        }}
                      />
                      <span>Competitor 3</span>
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={8}>
                <Paper
                  elevation={0}
                  sx={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 1,
                    overflow: "hidden"
                  }}
                >
                  <Box sx={{ p: 2, bgcolor: "#f8fafc" }}>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.8rem",
                        color: "#64748b",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px"
                      }}
                    >
                      Competition Overview
                    </Typography>
                  </Box>

                  <Table
                    size="small"
                    sx={{
                      "& td, & th": {
                        fontSize: "0.8rem"
                      }
                    }}
                  >
                    <TableHead>
                      <TableRow
                        sx={{
                          bgcolor: "#f8fafc",
                          borderBottom: "2px solid #e2e8f0"
                        }}
                      >
                        <TableCell
                          sx={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#1B2B38",
                            textTransform: "uppercase"
                          }}
                        >
                          Name
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#1B2B38",
                            textTransform: "uppercase",
                            width: 120
                          }}
                        >
                          Share of wallet %
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#1B2B38",
                            textTransform: "uppercase"
                          }}
                        >
                          Depth of relationship
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#1B2B38",
                            textTransform: "uppercase"
                          }}
                        >
                          Key areas of engagement
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {dummyData.competition.map((row, i) => {
                        const { bg, color } = depthColor(row.depth);
                        return (
                          <TableRow
                            key={i}
                            hover
                            sx={{
                              borderBottom: i === dummyData.competition.length - 1
                                ? "none"
                                : "1px solid #e2e8f0"
                            }}
                          >
                            <TableCell sx={{ py: 1.5 }}>
                              <Typography
                                sx={{
                                  fontWeight:
                                    row.name === "Version 1" ? 700 : 500,
                                  color: "#1B2B38"
                                }}
                              >
                                {row.name}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ py: 1.5 }}>
                              <Chip
                                label={row.share}
                                sx={{
                                  bgcolor: "#00C0B5",
                                  color: "#ffffff",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  px: 1.5,
                                  borderRadius: 999
                                }}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="center" sx={{ py: 1.5 }}>
                              <Box
                                sx={{
                                  mx: "auto",
                                  width: 32,
                                  height: 24,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderRadius: 1,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  bgcolor: bg,
                                  color
                                }}
                              >
                                {row.depth}
                              </Box>
                            </TableCell>
                            <TableCell>
                              {editable.isEditing ? (
                                <TextField
                                  fullWidth
                                  size="small"
                                  value={
                                    editable.draftData.competitive_intel
                                      .competition_overview[i]?.key_areas_of_engagement || ""
                                  }
                                  onChange={(e) => updateKeyArea(i, e.target.value)}
                                />
                              ) : (
                                row.key
                              )}
                            </TableCell>

                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Paper>
              </Grid>
            </Grid>
            <Typography sx={{ fontSize: 10, color: "#6b7280", mt: 0.5 }}>
              Classification: Controlled. Copyright ©2025 Version 1. All rights
              reserved.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ClientContext2;
