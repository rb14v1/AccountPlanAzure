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
import autoTable from "jspdf-autotable";

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

const DownloadTemplates: React.FC<DownloadTemplatesProps> = ({
  templateName,
  tableConfig,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(false);

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
        showHead: "everyPage", // 🔥 fixes row cutting
        didParseCell: (data) => {
          if (
            tableConfig?.rowStyle &&
            data.section === "body"
          ) {
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
  const generatePDF = async (sections: HTMLElement[], fileName: string) => {
    try {
      setLoading(true);

      const pdf = new jsPDF("l", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const marginX = 15;
      const marginTop = 15;
      const marginBottom = 20;

      const usableWidth = pageWidth - marginX * 2;

      let cursorY = marginTop;

      for (let i = 0; i < sections.length; i++) {
        const canvas = await html2canvas(sections[i], {
          scale: 2,
          useCORS: true,
        });

        const imgData = canvas.toDataURL("image/png");

        const imgHeight =
          (canvas.height * usableWidth) / canvas.width;

        // 🚨 If section doesn't fit → move to next page
        if (cursorY + imgHeight > pageHeight - marginBottom) {
          pdf.addPage();
          cursorY = marginTop;
        }

        pdf.addImage(
          imgData,
          "PNG",
          marginX,
          cursorY,
          usableWidth,
          imgHeight
        );

        cursorY += imgHeight + 6; // spacing between sections
      }

      pdf.save(fileName);
    } catch (err) {
      console.error(err);
      alert("Unable to download. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- DOWNLOAD HANDLER ----------
  const downloadCurrentTemplate = () => {
    // 🔥 TABLE MODE (generic, row-by-row)
    if (tableConfig) {
      generateTablePDF(
        tableConfig.headers,
        tableConfig.rows,
        `${templateName}.pdf`
      );
      return;
    }

    // 🔁 DEFAULT MODE (sections / cards)
    const sections = Array.from(
      document.querySelectorAll("#template-to-download .pdf-section")
    ) as HTMLElement[];

    if (sections.length) {
      generatePDF(sections, `${templateName}.pdf`);
    } else {
      alert("No printable sections found");
    }
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

        {/* <MenuItem
          onClick={() => {
            handleClose();
            downloadAllTemplates();
          }}
        >

          <ListItemIcon>
            <LayersIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Full Account Report (PDF)" />
        </MenuItem> */}
      </Menu>
    </>
  );
};

export default DownloadTemplates;