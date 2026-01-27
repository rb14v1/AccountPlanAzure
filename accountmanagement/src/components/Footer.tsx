import { Box, Typography } from "@mui/material";

const FOOTER_HEIGHT = 64;

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        height: FOOTER_HEIGHT,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
        borderTop: "1px solid #e5e7eb",
        px: 2,
        flexShrink: 0,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        © {new Date().getFullYear()} Sales App. All rights reserved. @Version1
      </Typography>
    </Box>
  );
}
