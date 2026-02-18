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

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


interface DownloadTemplatesProps {
  templateName: string;
  beforeDownload?: () => void;
  afterDownload?: () => void;
}


const DownloadTemplates: React.FC<DownloadTemplatesProps> = ({
  templateName,
  beforeDownload,
  afterDownload,
}) => {

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

    elements.forEach((el, index) => {
      const table = el.querySelector("table");
      if (!table) return;

      /* ---------------- HEADERS ---------------- */
      const head: string[][] = [
        Array.from(table.querySelectorAll("thead th")).map(
          (th) => th.textContent?.trim() || ""
        ),
      ];

      /* ---------------- BODY ---------------- */
      const body: string[][] = Array.from(
  table.querySelectorAll("tbody tr")
).map((tr) =>
  Array.from(tr.querySelectorAll("td")).map((td) => {
    // ✅ Always read from input/textarea/select FIRST
    const input = td.querySelector(
      "textarea, input, select"
    ) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;

    if (input) {
      return input.value.trim(); // ✅ printed ONCE, no duplication
    }

    // fallback (for # column etc.)
    return (td.textContent || "").trim();
  })
);


      autoTable(pdf, {
        head,
        body,
        startY: index === 0 ? 20 : pdf.lastAutoTable.finalY + 15,
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 3,
          overflow: "linebreak",
          valign: "top",
        },
        headStyles: {
          fillColor: [11, 30, 38],
          textColor: 255,
          fontStyle: "bold",
        },
        didDrawPage: () => {
          pdf.setFontSize(14);
          pdf.text(templateName.replace("_", " "), 14, 12);
        },
      });
    });

    pdf.save(fileName);
  } catch (err) {
    console.error(err);
    alert("Unable to download. Please try again.");
  } finally {
    setLoading(false);
  }
};



  const downloadCurrentTemplate = async () => {
    beforeDownload?.();
    await new Promise((r) => setTimeout(r, 300)); // allow DOM to re-render

    const el = document.getElementById("template-to-download");
    if (el) await generatePDF([el], `${templateName}.pdf`);

    afterDownload?.();
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
