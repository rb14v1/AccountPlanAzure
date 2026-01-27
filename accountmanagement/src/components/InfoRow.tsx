import { Box } from "@mui/material";
import React from "react";

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
}

export default function InfoRow({ label, value }: InfoRowProps) {
  return (
    <Box
      role="row"
      sx={{
        display: "flex",
        border: "1px solid #d6d6d6",
        height: 40,
        mb: 0.5,
      }}
    >
      {/* Label */}
      <Box
        role="cell"
        sx={{
          width: 280,
          backgroundColor: "#0b2b2e",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          px: 2,
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        {label}
      </Box>

      {/* Value */}
      <Box
        role="cell"
        sx={{
          flex: 1,
          backgroundColor: "#f2f4f6",
          display: "flex",
          alignItems: "center",
          px: 2,
          fontSize: 14,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value}
      </Box>
    </Box>
  );
}
