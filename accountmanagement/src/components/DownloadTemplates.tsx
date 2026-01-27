// accountmanagement/src/components/DownloadTemplates.tsx
import React, { useState } from "react";
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import DescriptionIcon from "@mui/icons-material/Description";
import LayersIcon from "@mui/icons-material/Layers";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface DownloadTemplatesProps {
  templateName: string;
}

const DownloadTemplates: React.FC<DownloadTemplatesProps> = ({ templateName }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(false);

  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  // ---------- PDF CORE ----------
  const generatePDF = async (elements: HTMLElement[], fileName: string) => {
    try {
      setLoading(true);
      const pdf = new jsPDF("p", "mm", "a4");

      for (let i = 0; i < elements.length; i++) {
        const canvas = await html2canvas(elements[i], { scale: 2 });
        const imgData = canvas.toDataURL("image/png");

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const marginX = 12; // left & right margin
        const marginY = 12; // top & bottom margin

        const imgWidth = pageWidth - marginX * 2;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let positionY = marginY;

        if (i !== 0) pdf.addPage();

        pdf.addImage(
          imgData,
          "PNG",
          marginX,
          positionY,
          imgWidth,
          imgHeight
        );
      }

      pdf.save(fileName);
    } catch (err) {
      console.error(err);
      alert("Unable to download. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadCurrentTemplate = () => {
    const el = document.getElementById("template-to-download");
    if (el) generatePDF([el], `${templateName}.pdf`);
  };

  const downloadAllTemplates = () => {
    const els = Array.from(
      document.querySelectorAll(".template-section")
    ) as HTMLElement[];
    console.log("Templates found:", els.length);

    if (els.length) {
      generatePDF(els, "Full_Account_Report.pdf");
    } else {
      alert("No templates found for full download");
    }
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

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem
          onClick={() => {
            handleClose();
            downloadCurrentTemplate();
          }}
        >
          <ListItemIcon>
            <DescriptionIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="This Template (PDF)" />
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleClose();
            downloadAllTemplates();
          }}
        >

          <ListItemIcon>
            <LayersIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Full Account Report (PDF)" />
        </MenuItem>
      </Menu>
    </>
  );
};

export default DownloadTemplates;
