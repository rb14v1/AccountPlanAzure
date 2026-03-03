import { useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { useNavigate } from "react-router-dom";

import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  IconButton,
  Avatar,
  Typography,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import Header from "../components/Header";
import Footer from "../components/Footer";

import { useTab } from "../context/TabContext";
import { useAuth } from "../context/AuthContext";

import UploadPage from "../pages/UploadPage";
import AccountTeamPod from "../Templates/AccountTeamPod";
import ClientContext1 from "../Templates/ClientContext1";
import ClientContext2 from "../Templates/ClientContext2";
import CustomerProfile from "../Templates/CustomerProfile";
import OrgStructureTechView from "../Templates/OrgStructureTechView";
import RelationshipHeatmap from "../Templates/RelationshipHeatmap";
import ServiceLineGrowth from "../Templates/ServiceLineGrowth";
import GrowthStrategy from "../Templates/GrowthStrategy";
import GrowthOpportunitiesPage from "../Templates/GrowthOpportunitiesPage";
import ImplementationPlanPage from "../Templates/ImplementationPlanPage";
import InvestmentPlan from "../Templates/InvestmentPlan";
import StrategicPartnershipsPage from "../Templates/StrategicPartnershipsPage";
import OperationalExcellencePage from "../Templates/OperationalExcellencePage";
import CriticalRiskPage from "../Templates/CriticalRiskPage";
import OperationalImplementationPlan from "../Templates/OperationalImplementationPlan";
import AccountPerformanceQuarterlyPlan from "../Templates/AccountPerformanceQuarterlyPlan";
import InnovationStrategy from "../Templates/InnovationStrategy";
import RevenueTeardownView from "../Templates/RevenueTeardownView";
import TechSpendView from "../Templates/TechSpendView";
import AccountCockpitView from "../Templates/AccountCockpitView";
import ServiceLinePenetration from "../Templates/ServiceLinePenetration";
import PlannedActionGenAI from "../Templates/PlannedActionGenAI";
import MarginImprovementPlan from "../Templates/MarginImprovementPlan";
import TalentExcellenceOverview from "../Templates/TalentExcellenceOverview";
import AccountPerformanceAnnualPlan from "../Templates/AccountPerformanceAnnualPlan";
import OpportunityDeepDive from "../Templates/OpportunityDeepDive";
import MarginImprovementPlan2 from "../Templates/MarginImprovementPlan2";
import profileIcon from "../assets/profileIcon.png";

const EXPANDED_WIDTH = 220;
const COLLAPSED_WIDTH = 72;

export default function MainLayout() {
  const { activeTab, navigateTo } = useTab();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(true);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const handleLogout = () => {
    setLogoutOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  const menuItems = [
    { id: "account-team-pod", label: "Account Team POD", icon: "bi-diagram-3" },
    { id: "account-cockpit-view", label: "Account Cockpit", icon: "bi-speedometer2" },
    { id: "account-performance-annual-plan", label: "Account Performance Annual Plan", icon: "bi-calendar-check" },
    { id: "account-performance-quarterly-plan", label: "Account Performance Quarterly Plan", icon: "bi-speedometer2" },
    { id: "client-context-1", label: "Client Context 1", icon: "bi-briefcase" },
    { id: "client-context-2", label: "Client Context 2", icon: "bi-briefcase-fill" },
    { id: "customer-profile", label: "Customer & Version 1", icon: "bi-person-badge" },
    { id: "tech-spend", label: "Tech spend breakdown by client BU and Geography", icon: "bi-database-gear" },
    { id: "growth-strategy", label: "Growth Strategy", icon: "bi-graph-up" },
    { id: "service-line-growth-actions", label: "Service Line Growth Actions", icon: "bi-bar-chart-line" },
    { id: "org-structure-tech-view", label: "Org structure: Tech view", icon: "bi-diagram-2" },
    { id: "relationship-heatmap", label: "Relationship Heatmap", icon: "bi-thermometer-half" },
    { id: "revenue-teardown", label: "Revenue Teardown: EE vs. EN  & Geo teardown", icon: "bi-graph-up-arrow" },
    { id: "service-line-penetration", label: "Revenue teardown: Service Line Penetration", icon: "bi-bar-chart-steps" },
    { id: "key-growth-opportunities", label: "Summary of key growth opportunities in the account", icon: "bi-lightbulb" },
    { id: "opportunity-deep-dive", label: "Deep dive: OPPORTUNITY NAME", icon: "bi-search" },
    { id: "implementation-plan", label: "Implementation plan for growth", icon: "bi-clipboard-check" },
    { id: "innovation-strategy", label: "Innovation excellence overview: Our understanding of client’s AI strategy", icon: "bi-lightbulb-fill" },
    { id: "planned-action-genai", label: "Planned action for next 12 months: GenAI", icon: "bi-robot" },
    { id: "strategic-partnerships", label: "Strategic Partnerships", icon: "bi-people" },
    { id: "operational-excellence-strategy", label: "Operational excellence strategy", icon: "bi-bullseye" },
    { id: "margin-improvement", label: "Margin Improvement Plan 1", icon: "bi-graph-up-arrow" },
    { id: "margin-improvement-plan-2", label: "Margin Improvement Plan 2", icon: "bi-graph-up-arrow" },
    { id: "critical-risk", label: "Critical Risk Tracking", icon: "bi-exclamation-triangle" },
    { id: "talent-excellence-overview", label: "Talent Excellence Overview", icon: "bi-people-fill" },
    { id: "operational-implementation-plan", label: "Implementation plan for operational excellence, delivery, and talent", icon: "bi-file-earmark-check" },
    { id: "investment-plan", label: "Investment plan for next 12 months ", icon: "bi-cash-stack" },
  ];

  const renderPage = () => {
    switch (activeTab) {
      case "account-team-pod": return <AccountTeamPod />;
      case "client-context-1": return <ClientContext1 />;
      case "client-context-2": return <ClientContext2 />;
      case "customer-profile": return <CustomerProfile />;
      case "org-structure-tech-view": return <OrgStructureTechView />;
      case "relationship-heatmap": return <RelationshipHeatmap />;
      case "service-line-growth-actions": return <ServiceLineGrowth />;
      case "growth-strategy": return <GrowthStrategy />;
      case "key-growth-opportunities": return <GrowthOpportunitiesPage />;
      case "implementation-plan": return <ImplementationPlanPage />;
      case "strategic-partnerships": return <StrategicPartnershipsPage />;
      case "operational-excellence-strategy": return <OperationalExcellencePage />;
      case "critical-risk": return <CriticalRiskPage />;
      case "operational-implementation-plan": return <OperationalImplementationPlan />;
      case "investment-plan": return <InvestmentPlan />;
      case "account-performance-quarterly-plan": return <AccountPerformanceQuarterlyPlan />;
      case "innovation-strategy": return <InnovationStrategy />;
      case "revenue-teardown": return <RevenueTeardownView />;
      case "tech-spend": return <TechSpendView />;
      case "account-cockpit-view": return <AccountCockpitView />;
      case "service-line-penetration": return <ServiceLinePenetration />;
      case "planned-action-genai": return <PlannedActionGenAI />;
      case "margin-improvement": return <MarginImprovementPlan />;
      case "talent-excellence-overview": return <TalentExcellenceOverview />;
      case "account-performance-annual-plan": return <AccountPerformanceAnnualPlan />;
      case "opportunity-deep-dive": return <OpportunityDeepDive />;
      case "margin-improvement-plan-2": return <MarginImprovementPlan2 />;
      default: return <AccountTeamPod />;
    }
  };

  return (
    <Box height="100vh" display="flex" flexDirection="column">
      <Header />

      <Box display="flex" flex={1} minHeight={0}>
        <Box
  sx={{
    width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
    backgroundColor: "#f0fdfa",
    color: "#134e4a",

    borderRight: "1px solid #ccfbf1", // 👈 ADD HERE

    display: "flex",
    flexDirection: "column",
    position: "relative",
  }}
>

          <Box
            flex={1}
            overflow="auto"
            sx={{
              "&::-webkit-scrollbar": { display: "none" },
              scrollbarWidth: "none",
            }}
          >
            <List>
              {menuItems.map((item) => (
                <Tooltip
                  key={item.id}
                  title={item.label}
                  placement="right"
                  disableHoverListener={!collapsed}
                >
                  <ListItemButton
                    selected={activeTab === item.id}
                    onClick={() => {
                      navigateTo(item.id);
                      // // Assuming your app routes are prefixed with /app/
                      // navigate(`/app/${item.id}`); 
            }}
                    sx={{
  justifyContent: collapsed ? "center" : "flex-start",
  px: collapsed ? 0 : 2,
  gap: collapsed ? 0 : 1.5,
  borderRadius: 2,
  mx: 1,
  my: 0.5,
  transition: "all 0.2s ease",

  // TEXT COLOR
  color: activeTab === item.id ? "#ffffff" : "#134e4a",

  // ACTIVE (selected tab)
  backgroundColor: activeTab === item.id ? "#14b8a6" : "transparent",

  // HOVER
  "&:hover": {
    backgroundColor: "#ccfbf1",
  },

  // CLICK EFFECT
  "&:active": {
    backgroundColor: "#0f766e",
    color: "#ffffff",
  },
}}

                  >
                    <i
  className={`bi ${item.icon}`}
  style={{
    fontSize: 18,
    color: activeTab === item.id ? "#332525" : "#0f766e",
  }}
/>

                    {!collapsed && (
                      <ListItemText
  primary={item.label}
  primaryTypographyProps={{
    fontWeight: 600,
    fontSize: 14,
    color: activeTab === item.id ? "#302323" : "#075a54",
  }}
/>

                    )}
                  </ListItemButton>
                </Tooltip>
              ))}
            </List>
          </Box>

          <Box
            position="sticky"
            bottom={0}
            height={64}
            px={2}
            display="flex"
            alignItems="center"
            gap={1.5}
            borderTop="1px solid #ccfbf1"
sx={{
  cursor: "pointer",
  backgroundColor: "#f0fdfa",
  "&:hover": {
    backgroundColor: "#ccfbf1",
  },
}}

            onClick={() => setLogoutOpen(true)}
          >
            <Avatar src={profileIcon} sx={{ width: 32, height: 32 }} />
            {!collapsed && (
              <Typography fontSize={14} fontWeight={600} color="#134e4a">

                {user?.username || "User"}
              </Typography>
            )}
          </Box>

          <IconButton
            onClick={() => setCollapsed(!collapsed)}
            sx={{
              position: "absolute",
              top: "50%",
              right: -16,
              transform: "translateY(-50%)",
              backgroundColor: "#14b8a6",
color: "#ffffff",
border: "1px solid #5eead4",
"&:hover": {
  backgroundColor: "#0f766e",
},

            }}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Box>

        <Box
  flex={1}
  minHeight={0}
  display="flex"
  flexDirection="column"
  bgcolor="#f7f9fb"
>
  {/* SCROLLABLE CONTENT */}
  <Box
    flex={1}
    minHeight={0}
    overflow="auto"
    p={2}
    sx={{
      "&::-webkit-scrollbar": { display: "none" },
      scrollbarWidth: "none",
      msOverflowStyle: "none",
    }}
  >
    {renderPage()}
  </Box>

  {/* FOOTER (NON-SCROLLING) */}
  <Footer />
</Box>

      </Box>

      <Dialog open={logoutOpen} onClose={() => setLogoutOpen(false)}>
        <DialogTitle>Log out</DialogTitle>
        <DialogContent>
          <Typography fontSize={14}>
            Are you sure you want to log out?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleLogout}>
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
