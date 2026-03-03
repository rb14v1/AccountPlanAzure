// src/Components/PromptModal.tsx

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
} from "@mui/material";
import { PRIMARY_TEAL } from "./constants";
import type { PromptDefinition, PromptPlaceholder } from "./constants";

type PromptPart =
  | { type: "text"; content: string }
  | {
      type: "variable";
      placeholder: PromptPlaceholder;
    };


interface PromptModalProps {
  open: boolean;
  activePrompt: PromptDefinition | null;
  onClose: () => void;
  onSubmit: (finalText: string) => void;
}

const PromptModal: React.FC<PromptModalProps> = ({
  open,
  activePrompt,
  onClose,
  onSubmit,
}) => {
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [promptParts, setPromptParts] = useState<PromptPart[]>([]);

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  

  useEffect(() => {
    if (open && activePrompt) {
      setFieldValues({});

      // ✅ Set the actual editable value of the text boxes right when the modal opens
      const initialValues: Record<string, string> = {};
      activePrompt.placeholders.forEach((placeholder) => {
        initialValues[placeholder.key] = "NatWest Group"; 
      });
      setFieldValues(initialValues);
      
      inputRefs.current = {};

      // 1. Create Markers
      const markers: Record<string, string> = {};
      activePrompt.placeholders.forEach((placeholder) => {
        markers[placeholder.key] = `__${placeholder.key}__`;
      });

      // 2. Parse Template
      const rawString = activePrompt.template(markers);
      const regex = /(__[^_]+__)/g;
      const parts = rawString.split(regex);

      const parsedParts: PromptPart[] = parts.map(
        (part: string): PromptPart => {
          const matchedField = activePrompt.placeholders.find(
            (f) => `__${f.key}__` === part
          );

          if (matchedField) {
            return {
              type: "variable",
              placeholder: matchedField,
            };
          }

          return {
            type: "text",
            content: part,
          };
        }
      );


      setPromptParts(parsedParts);

      // 3. SMART AUTO-FOCUS
      setTimeout(() => {
        const firstVariablePart = parsedParts.find(
          (p) => p.type === "variable"
        );

        if (firstVariablePart) {
          const firstKey = firstVariablePart.placeholder.key;
          inputRefs.current[firstKey]?.focus();
        }

      }, 100);
    }
  }, [open, activePrompt]);

  const handleFieldChange = (key: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  };

  // SMART ENTER NAVIGATION (visual order)
  const handleKeyDown = (e: React.KeyboardEvent, currentKey: string) => {
    if (e.key === "Enter") {
      e.preventDefault();

      const visualOrderKeys = promptParts
        .filter((p) => p.type === "variable")
        .map((p) => p.placeholder.key);

      const uniqueKeys = Array.from(new Set(visualOrderKeys));

      const currentIndex = uniqueKeys.indexOf(currentKey);
      const nextKey = uniqueKeys[currentIndex + 1];

      if (nextKey) {
        inputRefs.current[nextKey]?.focus();
      }
    }
  };

  const handleSubmit = () => {
    if (!activePrompt) return;

    const finalData: any = {};
    activePrompt.placeholders.forEach((placeholder) => {
      finalData[placeholder.key] = fieldValues[placeholder.key] || placeholder.placeholder || "";
    });

    onSubmit(activePrompt.template(finalData));
    onClose();
  };

  const isFormValid =
    activePrompt?.placeholders.every(
      (field) => (fieldValues[field.key] || "").trim().length > 0
    ) ?? false;

  const getFirstOccurrenceIndices = () => {
    const indices = new Set<number>();
    const seenKeys = new Set<string>();

    promptParts.forEach((part, index) => {
      if (part.type === "variable") {
        if (!seenKeys.has(part.placeholder.key)) {
          seenKeys.add(part.placeholder.key);
          indices.add(index);
        }
      }
    });

    return indices;
  };

  const firstIndices = getFirstOccurrenceIndices();

  const isEmptyMirror = (index: number) => {
    if (index < 0 || index >= promptParts.length) return false;
    const part = promptParts[index];
    if (part.type !== "variable") return false;

    const hasValue = (fieldValues[part.placeholder.key] || "").length > 0;
    const isFirst = firstIndices.has(index);

    return !isFirst && !hasValue;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
    >
      <DialogTitle sx={{ fontWeight: 700, color: "#222" }}>
        {activePrompt?.title}
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" sx={{ color: "#666", mb: 3 }}>
          {activePrompt?.description}
        </Typography>

        <Box
          sx={{
            p: 3,
            border: "1px solid #e0e0e0",
            borderRadius: 2,
            bgcolor: "#fff",
            lineHeight: 2.5,
            fontSize: "1.05rem",
            color: "#333",
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
          }}
        >
          {promptParts.map((part, index) => {
            if (part.type === "text") {
              let content = part.content;

              if (isEmptyMirror(index + 1) && content.endsWith('"')) {
                content = content.slice(0, -1);
              }
              if (isEmptyMirror(index - 1) && content.startsWith('"')) {
                content = content.slice(1);
              }
              if (isEmptyMirror(index - 1) && content.startsWith('".')) {
                content = "." + content.slice(2);
              }

              return <span key={index}>{content}</span>;
            } else {
              const { key, placeholder } = part.placeholder;
              const isInput = firstIndices.has(index);
              const hasValue = (fieldValues[key] || "").length > 0;

              if (isInput) {
                return (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[key] = el;
                    }}

                    type="text"
                    placeholder={placeholder}
                    value={fieldValues[key] || ""}
                    onChange={(e) =>
                      handleFieldChange(key, e.target.value)
                    }
                    onKeyDown={(e) => handleKeyDown(e, key)}
                    style={{
                      display: "inline-block",
                      width: `${Math.max(
                        (fieldValues[key] || placeholder || "").length,
                        8
                      ) + 2
                        }ch`,
                      minWidth: "100px",
                      maxWidth: "100%",
                      padding: "2px 6px",
                      margin: "0 4px",
                      border: "1px solid transparent",
                      borderRadius: "4px",
                      backgroundColor: "rgba(0,128,128,0.12)",
                      color: PRIMARY_TEAL,
                      fontWeight: "bold",
                      fontSize: "1rem",
                      outline: "none",
                      textAlign: "center",
                      transition: "all 0.2s ease",
                    }}
                    onFocus={(e) => {
                      e.target.style.backgroundColor =
                        "rgba(0,128,128,0.2)";
                      e.target.style.boxShadow = `0 0 0 2px ${PRIMARY_TEAL}`;
                    }}
                    onBlur={(e) => {
                      e.target.style.backgroundColor =
                        "rgba(0,128,128,0.12)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                );
              } else {
                if (!hasValue) return null;

                return (
                  <span
                    key={index}
                    style={{
                      color: PRIMARY_TEAL,
                      fontWeight: "bold",
                      margin: "0 1px",
                    }}
                  >
                    {fieldValues[key]}
                  </span>
                );
              }
            }
          })}
        </Box>

        {!isFormValid && (
          <Typography
            variant="caption"
            sx={{
              color: "#888",
              mt: 2,
              display: "block",
              fontStyle: "italic",
            }}
          >
            Fill in the highlighted fields to continue...
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} sx={{ color: "#666" }}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid}
          variant="contained"
          sx={{
            bgcolor: PRIMARY_TEAL,
            "&:hover": { bgcolor: "#006b30" },
            "&.Mui-disabled": {
              bgcolor: "#f0f0f0",
              color: "#ccc",
            },
          }}
        >
          Generate
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PromptModal;
