// accountmanagement/src/components/DownloadTemplates.tsx
import React, { useState } from "react";
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Box,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import DescriptionIcon from "@mui/icons-material/Description";
import LayersIcon from "@mui/icons-material/Layers";
import ChecklistIcon from "@mui/icons-material/Checklist";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ---------------------------------------------------------
// IMPORT ALL TEMPLATES SO WE CAN RENDER THEM OFF-SCREEN
// ---------------------------------------------------------
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

interface DownloadTemplatesProps {
  templateName: string;
  tableConfig?: {
    headers: string[];
    rows: any[][];
    rowStyle?: (row: any[], rowIndex: number) => {
      fillColor?: [number, number, number];
    };
  };
}

// Custom type to handle forced page breaks
type PdfSectionItem = HTMLElement | { el: HTMLElement; forceNewPage?: boolean };

const DownloadTemplates: React.FC<DownloadTemplatesProps> = ({
  templateName,
  tableConfig,
}) => {
  // 🔥 FIX: We moved this object INSIDE the component to prevent Circular Dependency crashes!
  const TEMPLATE_COMPONENTS: Record<string, React.ElementType> = {
    "Account Team POD": AccountTeamPod,
    "Client Context 1": ClientContext1,
    "Client Context 2": ClientContext2,
    "Customer Profile": CustomerProfile,
    "Growth Strategy": GrowthStrategy,
    "Service Line Growth": ServiceLineGrowth,
    "Org & Tech View": OrgStructureTechView,
    "Relationship Heatmap": RelationshipHeatmap,
    "Growth Opportunities": GrowthOpportunitiesPage,
    "Implementation Plan": ImplementationPlanPage,
    "Strategic Partnerships": StrategicPartnershipsPage,
    "Operational Excellence": OperationalExcellencePage,
    "Critical Risk": CriticalRiskPage,
    "Account Performance Quarterly Plan": AccountPerformanceQuarterlyPlan,
    "Operational Impl. Plan": OperationalImplementationPlan,
    "Investment Plan": InvestmentPlan,
    "Innovation Strategy": InnovationStrategy,
    "Revenue Teardown": RevenueTeardownView,
    "Tech Spend View": TechSpendView,
    "Account Cockpit": AccountCockpitView,
    "SL Penetration": ServiceLinePenetration,
    "Planned Action GenAI": PlannedActionGenAI,
    "Margin Improvement": MarginImprovementPlan,
    "Talent Excellence": TalentExcellenceOverview,
    "Account Performance Annual Plan": AccountPerformanceAnnualPlan,
    "Opportunity Deep Dive": OpportunityDeepDive,
    "Margin Improvement 2": MarginImprovementPlan2,
  };

  const ALL_TEMPLATES = Object.keys(TEMPLATE_COMPONENTS);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(false);

  // Modal / Selection State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);

  // Hidden Rendering State
  const [templatesToRender, setTemplatesToRender] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);

  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  // ---------- GENERIC TABLE PDF (ROW-BY-ROW, NO CUTTING) ----------
  const generateTablePDF = (
    headers: string[],
    rows: any[][],
    fileName: string
  ) => {
    try {
      setLoading(true);
      const pdf = new jsPDF("l", "mm", "a4");

      pdf.setFontSize(14);
      pdf.text(templateName.replace(/_/g, " "), 14, 15);

      autoTable(pdf, {
        startY: 22,
        head: [headers],
        body: rows,
        headStyles: {
          fillColor: [11, 30, 38],
          textColor: 255,
          fontStyle: "bold",
        },
        margin: { left: 10, right: 10 },
        pageBreak: "auto",
        showHead: "everyPage",
        didParseCell: (data) => {
          if (tableConfig?.rowStyle && data.section === "body") {
            const style = tableConfig.rowStyle(
              tableConfig.rows[data.row.index],
              data.row.index
            );

            if (style?.fillColor) {
              data.cell.styles.fillColor = style.fillColor;
            }
          }
        },
      });

      pdf.save(fileName);
    } catch (err) {
      console.error(err);
      alert("Unable to download table PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- SECTION / CARD PDF (IMAGE-BASED) ----------
  const generatePDF = async (items: PdfSectionItem[], fileName: string) => {
    try {
      const pdf = new jsPDF("l", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const marginX = 15;
      const marginTop = 15;
      const marginBottom = 20;

      const usableWidth = pageWidth - marginX * 2;
      let cursorY = marginTop;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const element = item instanceof HTMLElement ? item : item.el;
        const forceNewPage = item instanceof HTMLElement ? false : item.forceNewPage;

        // Force a page break if requested
        if (forceNewPage && cursorY !== marginTop) {
          pdf.addPage();
          cursorY = marginTop;
        }

        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
        });

        const imgData = canvas.toDataURL("image/png");
        const imgHeight = (canvas.height * usableWidth) / canvas.width;

        if (
          cursorY !== marginTop &&
          cursorY + imgHeight > pageHeight - marginBottom
        ) {
          pdf.addPage();
          cursorY = marginTop;
        }

        pdf.addImage(imgData, "PNG", marginX, cursorY, usableWidth, imgHeight);
        cursorY += imgHeight + 6;
      }

      pdf.save(fileName);
    } catch (err) {
      console.error(err);
      alert("Unable to process PDF. Please try again.");
    }
  };

  // ---------- THE SMART BACKGROUND CAPTURE ENGINE ----------
  const handleBulkDownload = (templates: string[], fileName: string) => {
    setTemplatesToRender(templates);
    setIsCapturing(true);
    setLoading(true);
    setDialogOpen(false); 
    handleClose(); 

    setTimeout(async () => {
      const finalSections: PdfSectionItem[] = [];
      
      const wrappers = document.querySelectorAll(
        "#hidden-bulk-download-container .bulk-template-section"
      );

      wrappers.forEach((wrapper, index) => {
        const innerSections = wrapper.querySelectorAll(".pdf-section");
        
        if (innerSections.length > 0) {
          const arr = Array.from(innerSections) as HTMLElement[];
          arr.forEach((sec, i) => {
            finalSections.push({
              el: sec,
              forceNewPage: i === 0 && index !== 0,
            });
          });
        } else {
          finalSections.push({
            el: wrapper as HTMLElement,
            forceNewPage: index !== 0, 
          });
        }
      });

      if (finalSections.length > 0) {
        await generatePDF(finalSections, fileName);
      } else {
        alert("Error: Rendering engine failed to mount the templates.");
      }

      setIsCapturing(false);
      setTemplatesToRender([]);
      setLoading(false);
    }, 2500); 
  };

  // ---------- DOWNLOAD HANDLERS ----------

  const downloadCurrentTemplate = () => {
    if (tableConfig) {
      generateTablePDF(tableConfig.headers, tableConfig.rows, `${templateName}.pdf`);
      handleClose();
      return;
    }

    const matchedKey = ALL_TEMPLATES.find(
      (key) =>
        key.toLowerCase() === templateName.toLowerCase() ||
        templateName.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(templateName.toLowerCase().split(" ")[0])
    );

    if (matchedKey) {
      handleBulkDownload([matchedKey], `${templateName}.pdf`);
    } else {
      const sections = Array.from(document.querySelectorAll(".pdf-section")) as HTMLElement[];
      if (sections.length) {
        setLoading(true);
        generatePDF(sections, `${templateName}.pdf`).finally(() => setLoading(false));
      } else {
        alert("Unable to match this template name to the registry for PDF capture.");
      }
      handleClose();
    }
  };

  const downloadAllTemplates = () => {
    handleBulkDownload(ALL_TEMPLATES, "Full_Account_Report.pdf");
  };

  const downloadSelectedTemplates = () => {
    if (selectedTemplates.length === 0) {
      alert("Please select at least one template.");
      return;
    }
    handleBulkDownload(selectedTemplates, "Selected_Templates_Report.pdf");
  };

  // ---------- DIALOG HANDLERS ----------
  const handleToggleTemplate = (name: string) => {
    setSelectedTemplates((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  };

  const openSelectionDialog = () => {
    handleClose();
    setSelectedTemplates([]);
    setDialogOpen(true);
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={
          loading ? (
            <CircularProgress size={16} color="inherit" />
          ) : (
            <DownloadIcon />
          )
        }
        disabled={loading}
        onClick={handleOpen}
        sx={{
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 2,
          px: 2.5,
          bgcolor: "#008080",
          "&:hover": { bgcolor: "#006b6b" },
        }}
      >
        {loading ? "Preparing..." : "Download"}
      </Button>

      {/* Dropdown Menu */}
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={downloadCurrentTemplate}>
          <ListItemIcon>
            <DescriptionIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="This Template (PDF)" />
        </MenuItem>

        <MenuItem onClick={downloadAllTemplates}>
          <ListItemIcon>
            <LayersIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Download All Templates (PDF)" />
        </MenuItem>

        <MenuItem onClick={openSelectionDialog}>
          <ListItemIcon>
            <ChecklistIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Download Selected Templates..." />
        </MenuItem>
      </Menu>

      {/* Select Templates Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: "bold" }}>
          Select Templates to Download
        </DialogTitle>
        <DialogContent dividers>
          <FormGroup>
            {ALL_TEMPLATES.map((name) => (
              <FormControlLabel
                key={name}
                control={
                  <Checkbox
                    checked={selectedTemplates.includes(name)}
                    onChange={() => handleToggleTemplate(name)}
                    color="primary"
                  />
                }
                label={name}
              />
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={downloadSelectedTemplates}
            variant="contained"
            disabled={selectedTemplates.length === 0 || loading}
            sx={{ bgcolor: "#008080", "&:hover": { bgcolor: "#006b6b" } }}
          >
            Download Selected
          </Button>
        </DialogActions>
      </Dialog>

      {/* HIDDEN OFF-SCREEN CONTAINER */}
      {isCapturing && (
        <Box
          id="hidden-bulk-download-container"
          sx={{
            position: "absolute",
            top: "-9999px",
            left: "-9999px",
            width: "1200px",
            bgcolor: "#f7f9fb",
            p: 2,
            opacity: 0,
            pointerEvents: "none",
            zIndex: -1,
            "& button": { display: "none !important" }, 
            "& .MuiButtonBase-root": { display: "none !important" }, 
            "& *": { 
              overflow: "visible !important", 
              scrollbarWidth: "none", 
            }
          }}
        >
          {templatesToRender.map((name) => {
            const Component = TEMPLATE_COMPONENTS[name];
            return (
              <Box
                key={name}
                className="bulk-template-section"
                sx={{ mb: 6, bgcolor: "white", width: "100%", height: "auto" }}
              >
                {Component && <Component />}
              </Box>
            );
          })}
        </Box>
      )}
    </>
  );
};

export default DownloadTemplates;