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
 
// In accountmanagement/src/components/constants.ts
 
export const STARTER_PROMPTS: PromptDefinition[] = [
  {
    id: "growth_strategy",
    title: "Growth Strategy",
    description: "Generate a strategic growth plan payload.",
    placeholders: [
      { key: "company", label: "Company Name", type: "text", placeholder: "e.g. NatWest Group" }
    ],
    template: (data) => `Company="${data.company}"
{
  "template_type": "growth_strategy",
  "data": {
    "growth_aspiration": ["string"],
    "key_vectors_for_driving_growth": ["string"],
    "improve_quality_sustainability_revenues": ["string"],
    "potential_inorganic_opportunities": ["string"]
  }
}`
  },
  {
    id: "customer_profile",
    title: "Customer Profile",
    description: "Generate a detailed customer profile.",
    placeholders: [
      { key: "company", label: "Company Name", type: "text", placeholder: "e.g. NatWest Group" }
    ],
    template: (data) => `Company="${data.company}"
{
  "template_type": "customer_profile",
  "data": {
    "customer_name": "",
    "headquarter_location": "",
    "csat": "",
    "version_1_vertical": "",
    "current_work": [],
    "service_lines": [],
    "customer_perception": []
  }
}`
  },
  {
    id: "relationship_heatmap",
    title: "Relationship Heatmap",
    description: "Map out key stakeholder relationships.",
    placeholders: [
      { key: "company", label: "Company Name", type: "text", placeholder: "e.g. NatWest Group" }
    ],
    template: (data) => `Company="${data.company}"
{
  "template_type": "relationship_heatmap",
  "data": {
    "stakeholder_list": [
      {
        "client_stakeholder": "string",
        "role": "string",
        "reports_to": "string",
        "level": "string",
        "client_relationship": "string",
        "engagement_plan_next_action": "string"
      }
    ]
  }
}`
  },
  {
    id: "implementation_plan",
    title: "Implementation Plan",
    description: "Create a detailed implementation timeline.",
    placeholders: [
      { key: "company", label: "Company Name", type: "text", placeholder: "e.g. NatWest Group" }
    ],
    template: (data) => `Company="${data.company}"
{
  "template_type": "implementation_plan",
  "data": {
    "actions": [
      { "action": "string", "timeline": "string", "owner": "string", "status": "string", "investment_needed": "string", "impact": "string" },
      { "action": "string", "timeline": "string", "owner": "string", "status": "string", "investment_needed": "string", "impact": "string" },
      { "action": "string", "timeline": "string", "owner": "string", "status": "string", "investment_needed": "string", "impact": "string" }
    ]
  }
}`
  }
];
 