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
  },

  {
    id: "operational_excellence_strategy",
    title: "Operational Excellence",
    description: "Generate an operational excellence strategy.",
    placeholders: [
      { key: "company", label: "Company Name", type: "text", placeholder: "e.g. NatWest Group" }
    ],
    template: (data) => `Company="${data.company}"
{
  "template_type": "operational_excellence_strategy",
  "data": {
    "current_gp_percentage": "string",
    "gp_percentage_ambition": "string",
    "priority_levers_to_drive_margin_uplift": [
      "string"
    ],
    "plan_for_commercial_model_transformation": [
      "string"
    ]
  }
}`
  },
  {
    id: "investment_plan",
    title: "Investment Plan",
    description: "Generate an investment plan overview.",
    placeholders: [
      { key: "company", label: "Company Name", type: "text", placeholder: "e.g. NatWest Group" }
    ],
    template: (data) => `Company="${data.company}"
{
  "template_type": "investment_plan",
  "data": {
    "investments": [
      { "investment_number": 1, "investment_type": "Billing investment", "investment_description": "string", "investment_value_eur": "string", "targeted_outcome": "string", "primary_owner": "string", "timeline_status": "string", "remarks": "string" },
      { "investment_number": 2, "investment_type": "Buffers", "investment_description": "string", "investment_value_eur": "string", "targeted_outcome": "string", "primary_owner": "string", "timeline_status": "string", "remarks": "string" },
      { "investment_number": 3, "investment_type": "Innovation", "investment_description": "string", "investment_value_eur": "string", "targeted_outcome": "string", "primary_owner": "string", "timeline_status": "string", "remarks": "string" },
      { "investment_number": 4, "investment_type": "Free resources", "investment_description": "string", "investment_value_eur": "string", "targeted_outcome": "string", "primary_owner": "string", "timeline_status": "string", "remarks": "string" },
      { "investment_number": 5, "investment_type": "Marketing investments / relationship building", "investment_description": "string", "investment_value_eur": "string", "targeted_outcome": "string", "primary_owner": "string", "timeline_status": "string", "remarks": "string" },
      { "investment_number": 6, "investment_type": "Travel investments", "investment_description": "string", "investment_value_eur": "string", "targeted_outcome": "string", "primary_owner": "string", "timeline_status": "string", "remarks": "string" }
    ],
    "total_investment_value": "string"
  }
}`
  },

    {
    id: "innovation_strategy",
    title: "Innovation Strategy",
    description: "Outline the innovation and GenAI strategy.",
    placeholders: [
      { key: "company", label: "Company Name", type: "text", placeholder: "e.g. NatWest Group" }
    ],
    template: (data) => `Company="${data.company}"
{
  "template_type": "innovation_strategy",
  "data": {
    "current_outlook_on_ai": "string",
    "top_motivations_for_genai": "string",
    "top_genai_projects": "string",
    "other_innovation_projects": "string",
    "high_value_use_cases": "string"
  }
}`
  },
  {
    id: "tech_spend_view",
    title: "Tech Spend View",
    description: "Map out the technology spend and priorities.",
    placeholders: [
      { key: "company", label: "Company Name", type: "text", placeholder: "e.g. NatWest Group" }
    ],
    template: (data) => `Company="${data.company}"
{
  "template_type": "tech_spend_view",
  "data": {
    "rows": [
      { "id": 1, "name": "string", "desc": "string", "size": "string", "growth": "string", "spend": "string", "priorities": "string", "presence": "string", "incumbent": "string" },
      { "id": 2, "name": "string", "desc": "string", "size": "string", "growth": "string", "spend": "string", "priorities": "string", "presence": "string", "incumbent": "string" },
      { "id": 3, "name": "string", "desc": "string", "size": "string", "growth": "string", "spend": "string", "priorities": "string", "presence": "string", "incumbent": "string" },
      { "id": 4, "name": "string", "desc": "string", "size": "string", "growth": "string", "spend": "string", "priorities": "string", "presence": "string", "incumbent": "string" },
      { "id": 5, "name": "string", "desc": "string", "size": "string", "growth": "string", "spend": "string", "priorities": "string", "presence": "string", "incumbent": "string" },
      { "id": 6, "name": "string", "desc": "string", "size": "string", "growth": "string", "spend": "string", "priorities": "string", "presence": "string", "incumbent": "string" }
    ],
    "geoRevenue": [
      { "l": "Americas", "v": "string" },
      { "l": "EMEA", "v": "string" },
      { "l": "APAC", "v": "string" },
      { "l": "Others", "v": "string" }
    ],
    "geoTalent": [
      { "geo": "Americas", "val": "string" },
      { "geo": "EMEA", "val": "string" },
      { "geo": "APAC", "val": "string" }
    ],
    "geoPriorities": [
      { "geo": "Americas", "val": "string" },
      { "geo": "EMEA", "val": "string" },
      { "geo": "APAC", "val": "string" }
    ]
  }
}`
  },
  {
    id: "talent_excellence_overview",
    title: "Talent Excellence",
    description: "Generate a talent excellence overview.",
    placeholders: [
      { key: "company", label: "Company Name", type: "text", placeholder: "e.g. NatWest Group" }
    ],
    template: (data) => `Company="${data.company}"
{
   "template_type": "talent_excellence_overview",
   "data": {
    "overviewRows": [
      { "id": 1, "metric": "Overall headcount", "target": "string", "q1": "string", "q2": "string", "q3": "string", "q4": "string", "q1Status": "Above target | Meets Target | Below Target", "q2Status": "Above target | Meets Target | Below Target", "q3Status": "Above target | Meets Target | Below Target", "q4Status": "Above target | Meets Target | Below Target" },
      { "id": 2, "metric": "% gender representation", "target": "string", "q1": "string", "q2": "string", "q3": "string", "q4": "string", "q1Status": "Above target | Meets Target | Below Target", "q2Status": "Above target | Meets Target | Below Target", "q3Status": "Above target | Meets Target | Below Target", "q4Status": "Above target | Meets Target | Below Target" },
      { "id": 3, "metric": "Attrition % LTM", "target": "string", "q1": "string", "q2": "string", "q3": "string", "q4": "string", "q1Status": "Above target | Meets Target | Below Target", "q2Status": "Above target | Meets Target | Below Target", "q3Status": "Above target | Meets Target | Below Target", "q4Status": "Above target | Meets Target | Below Target" },
      { "id": 4, "metric": "Average tenure (no. of years)", "target": "string", "q1": "string", "q2": "string", "q3": "string", "q4": "string", "q1Status": "Above target | Meets Target | Below Target", "q2Status": "Above target | Meets Target | Below Target", "q3Status": "Above target | Meets Target | Below Target", "q4Status": "Above target | Meets Target | Below Target" },
      { "id": 5, "metric": "# of associates with tenure >18 months", "target": "string", "q1": "string", "q2": "string", "q3": "string", "q4": "string", "q1Status": "Above target | Meets Target | Below Target", "q2Status": "Above target | Meets Target | Below Target", "q3Status": "Above target | Meets Target | Below Target", "q4Status": "Above target | Meets Target | Below Target" },
      { "id": 6, "metric": "ESAT", "target": "string", "q1": "string", "q2": "string", "q3": "string", "q4": "string", "q1Status": "Above target | Meets Target | Below Target", "q2Status": "Above target | Meets Target | Below Target", "q3Status": "Above target | Meets Target | Below Target", "q4Status": "Above target | Meets Target | Below Target" }
    ],
    "demandRows": [
      { "id": 1, "metric": "Total open demand", "target": "string", "q1": "string", "q2": "string", "q3": "string", "q4": "string", "q1Status": "Above target | Meets Target | Below Target", "q2Status": "Above target | Meets Target | Below Target", "q3Status": "Above target | Meets Target | Below Target", "q4Status": "Above target | Meets Target | Below Target" },
      { "id": 2, "metric": "Overdue demand", "target": "string", "q1": "string", "q2": "string", "q3": "string", "q4": "string", "q1Status": "Above target | Meets Target | Below Target", "q2Status": "Above target | Meets Target | Below Target", "q3Status": "Above target | Meets Target | Below Target", "q4Status": "Above target | Meets Target | Below Target" },
      { "id": 3, "metric": "Fulfilment % ONS", "target": "string", "q1": "string", "q2": "string", "q3": "string", "q4": "string", "q1Status": "Above target | Meets Target | Below Target", "q2Status": "Above target | Meets Target | Below Target", "q3Status": "Above target | Meets Target | Below Target", "q4Status": "Above target | Meets Target | Below Target" },
      { "id": 4, "metric": "Fulfilment % OFS", "target": "string", "q1": "string", "q2": "string", "q3": "string", "q4": "string", "q1Status": "Above target | Meets Target | Below Target", "q2Status": "Above target | Meets Target | Below Target", "q3Status": "Above target | Meets Target | Below Target", "q4Status": "Above target | Meets Target | Below Target" },
      { "id": 5, "metric": "% external fulfilment", "target": "string", "q1": "string", "q2": "string", "q3": "string", "q4": "string", "q1Status": "Above target | Meets Target | Below Target", "q2Status": "Above target | Meets Target | Below Target", "q3Status": "Above target | Meets Target | Below Target", "q4Status": "Above target | Meets Target | Below Target" },
      { "id": 6, "metric": "Fulfilment", "target": "string", "q1": "string", "q2": "string", "q3": "string", "q4": "string", "q1Status": "Above target | Meets Target | Below Target", "q2Status": "Above target | Meets Target | Below Target", "q3Status": "Above target | Meets Target | Below Target", "q4Status": "Above target | Meets Target | Below Target" },
      { "id": 7, "metric": "Delivery on time %", "target": "string", "q1": "string", "q2": "string", "q3": "string", "q4": "string", "q1Status": "Above target | Meets Target | Below Target", "q2Status": "Above target | Meets Target | Below Target", "q3Status": "Above target | Meets Target | Below Target", "q4Status": "Above target | Meets Target | Below Target" },
      { "id": 8, "metric": "SLA %", "target": "string", "q1": "string", "q2": "string", "q3": "string", "q4": "string", "q1Status": "Above target | Meets Target | Below Target", "q2Status": "Above target | Meets Target | Below Target", "q3Status": "Above target | Meets Target | Below Target", "q4Status": "Above target | Meets Target | Below Target" },
      { "id": 9, "metric": "Average time to billability", "target": "string", "q1": "string", "q2": "string", "q3": "string", "q4": "string", "q1Status": "Above target | Meets Target | Below Target", "q2Status": "Above target | Meets Target | Below Target", "q3Status": "Above target | Meets Target | Below Target", "q4Status": "Above target | Meets Target | Below Target" },
      { "id": 10, "metric": "Client interview %", "target": "string", "q1": "string", "q2": "string", "q3": "string", "q4": "string", "q1Status": "Above target | Meets Target | Below Target", "q2Status": "Above target | Meets Target | Below Target", "q3Status": "Above target | Meets Target | Below Target", "q4Status": "Above target | Meets Target | Below Target" }
    ],
    "insights": "string"
   }
}`
  }

];
 