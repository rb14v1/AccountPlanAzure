// src/Components/constants.ts

export const PRIMARY_TEAL = "#008080";
export const DARK_BG = "#0b1e26";
export const BOT_BG = "#f4f6f8";
export const USER_BG = "#e0f2f1";

export const SIDEBAR_WIDTH = 260;
export const COLLAPSED_WIDTH = 70;

export interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: string;
  attachment?: string;
}

export interface PromptPlaceholder {
  key: string;                 
  label: string;               
  type: "text" | "number";     
  placeholder?: string;        
  multiline?: boolean;
}

export interface PromptDefinition {
  id: string;                  
  title: string;               
  description: string;         
  placeholders: PromptPlaceholder[];
  template: (data: Record<string, string>) => string;
}
