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
        "client_stakeholder": "string",
        "role": "string",
        "reports_to": "string",
        "level": "string",
        "client_relationship": "string",
        "engagement_plan_next_action": "string"
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
      { "category": "string", "action": "string", "primary_owner": "string", "support_team": "string", "timeline": "string", "owner": "string", "status": "string", "investment_needed": "string", "impact": "string" },
      { "category": "string", "action": "string", "primary_owner": "string", "support_team": "string", "timeline": "string", "owner": "string", "status": "string", "investment_needed": "string", "impact": "string" },
      { "category": "string", "action": "string", "primary_owner": "string", "support_team": "string", "timeline": "string", "owner": "string", "status": "string", "investment_needed": "string", "impact": "string" }
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
  },
  {
    id: "account_performance_annual_plan",
    title: "Account Performance",
    description: "Generate an account performance annual plan.",
    placeholders: [
      { key: "company", label: "Company Name", type: "text", placeholder: "e.g. NatWest Group" }
    ],
    template: (data) => `Company="${data.company}"
{
  "template_type": "account_performance_annual_plan",
  "data": {
    "financials": [
      { "metric": "Revenue", "unit": "£m", "fy24": "string", "fy25": "string", "fy26": "string" },
      { "metric": "GM", "unit": "%", "fy24": "string", "fy25": "string", "fy26": "string" },
      { "metric": "CM", "unit": "%", "fy24": "string", "fy25": "string", "fy26": "string" }
    ],
    "delivery": [
      { "metric": "Utilization", "unit": "%", "fy24": "string", "fy25": "string", "fy26": "string" }
    ],
    "talent": [
      { "metric": "Attrition", "unit": "%", "fy24": "string", "fy25": "string", "fy26": "string" }
    ]
  }
}`
  },
  {
    id: "service_line_growth_actions",
    title: "Service Line Growth",
    description: "Map out service line growth actions and objectives.",
    placeholders: [
      { key: "company", label: "Company Name", type: "text", placeholder: "e.g. NatWest Group" }
    ],
    template: (data) => `Company="${data.company}"
{
  "template_type": "service_line_growth_actions",
  "data": {
    "Cloud_Transformation": { "Objective": "", "Target_Buying_Centres": "", "Current_Status": "", "Next_Action_and_Responsible_Person": "" },
    "Data": { "Objective": "", "Target_Buying_Centres": "", "Current_Status": "", "Next_Action_and_Responsible_Person": "" },
    "AI": { "Objective": "", "Target_Buying_Centres": "", "Current_Status": "", "Next_Action_and_Responsible_Person": "" },
    "SRG_Managed_Services": { "Objective": "", "Target_Buying_Centres": "", "Current_Status": "", "Next_Action_and_Responsible_Person": "" },
    "EA": { "Objective": "", "Target_Buying_Centres": "", "Current_Status": "", "Next_Action_and_Responsible_Person": "" },
    "Strategy_Design_and_Change": { "Objective": "", "Target_Buying_Centres": "", "Current_Status": "", "Next_Action_and_Responsible_Person": "" },
    "SAM_and_Licensing": { "Objective": "", "Target_Buying_Centres": "", "Current_Status": "", "Next_Action_and_Responsible_Person": "" }
  }
}`
  },

  // Add these to the STARTER_PROMPTS array in constants.ts

  {
    id: "Account_Team_POD",
    title: "Account Team POD",
    description: "Define the core sales and delivery leads.",
    placeholders: [
      { key: "company", label: "Company Name", type: "text", placeholder: "e.g. NatWest Group" }
    ],
    template: (data) => `Company="${data.company}"
{
  "template_type": "Account_Team_POD",
  "data": {
    "Sales_and_Delivery_Leads": {
      "Client_Partner": { "Accountable_POC": "string", "Time_Commitment": "string" },
      "Delivery_Manager": { "Accountable_POC": "string", "Time_Commitment": "string" },
      "Digital_and_Cloud_POC": { "Accountable_POC": "string", "Time_Commitment": "string" },
      "SRG_POC": { "Accountable_POC": "string", "Time_Commitment": "string" },
      "EA_POC": { "Accountable_POC": "string", "Time_Commitment": "string" },
      "Data_POC": { "Accountable_POC": "string", "Time_Commitment": "string" }
    },
    "Functional_POCs": {
      "Presales_Lead": { "Accountable_POC": "string", "Time_Commitment": "string" },
      "Marketing_POC": { "Accountable_POC": "string", "Time_Commitment": "string" },
      "Partnerships_POC": { "Accountable_POC": "string", "Time_Commitment": "string" },
      "AI_and_Innovation_Lead": { "Accountable_POC": "string", "Time_Commitment": "string" },
      "Delivery_Excellence_Lead": { "Accountable_POC": "string", "Time_Commitment": "string" },
      "Talent_Supply_Chain_POC": { "Accountable_POC": "string", "Time_Commitment": "string" },
      "L_and_D_Lead": { "Accountable_POC": "string", "Time_Commitment": "string" }
    }
  }
}`
  },
  {
    id: "account_cockpit_view",
    title: "Account Cockpit",
    description: "Generate a high-level performance cockpit overview.",
    placeholders: [
      { key: "company", label: "Company Name", type: "text", placeholder: "e.g. NatWest Group" }
    ],
    template: (data) => `Company="${data.company}"
{
  "template_type": "account_cockpit_view",
  "data": {
    "revenue_performance": {
      "yoy": [{"year": "FY24", "value": "number", "target_achieved": "string"}],
      "qoq": [{"quarter": "string", "value": "number", "target": "string"}]
    },
    "booking_performance": {
      "yoy": [{"year": "FY24", "value": "number", "target_achieved": "string"}],
      "qoq": [{"quarter": "string", "value": "number", "target": "string"}]
    },
    "margin_performance": {
      "yoy": [{"year": "FY24", "value": "number", "target_achieved": "string"}],
      "qoq": [{"quarter": "string", "value": "number", "target": "string"}]
    },
    "large_deals": {
      "tcv_wins": [{"quarter": "string", "value": "number"}],
      "num_wins": ["string", "string", "string", "string"]
    },
    "service_lines_presence": {
      "data_cloud": false, "infra": false, "dats": false, "erp": false
    },
    "sl_penetration": [
      { "quarter": "string", "value": "number" }
    ],
    "partnership_revenue": [
      { "partner": "string", "fy25_revenue": "string", "fy26_target": "string" }
    ],
    "revenue_geos": [
      { "geo": "string", "value": "number" }
    ],
    "csat_trajectory": [
      { "period": "string", "value": "number" }
    ]
  }
}`
  },
  {
    id: "account_dashboard",
    title: "Account Dashboard",
    description: "Detailed quarterly metrics for the account.",
    placeholders: [
      { key: "company", label: "Company Name", type: "text", placeholder: "e.g. NatWest Group" }
    ],
    template: (data) => `Company="${data.company}"
{
  "template_type": "account_dashboard",
  "data": {
    "Revenue Budget": { "Q1 FY25": "string", "Q2 FY25": "string", "Q3 FY25": "string", "Q4 FY25": "string", "Q1 FY26": "string", "Q2 FY26": "string", "Q3 FY26": "string", "Q4 FY26": "string" },
    "Revenue Actuals / Forecast": { "Q1 FY25": "string", "Q2 FY25": "string", "Q3 FY25": "string", "Q4 FY25": "string", "Q1 FY26": "string", "Q2 FY26": "string", "Q3 FY26": "string", "Q4 FY26": "string" },
    "TCV won": { "Q1 FY25": "string", "Q2 FY25": "string", "Q3 FY25": "string", "Q4 FY25": "string", "Q1 FY26": "string", "Q2 FY26": "string", "Q3 FY26": "string", "Q4 FY26": "string" },
    "Win rate (YTD)": { "Q1 FY25": "string", "Q2 FY25": "string", "Q3 FY25": "string", "Q4 FY25": "string", "Q1 FY26": "string", "Q2 FY26": "string", "Q3 FY26": "string", "Q4 FY26": "string" },
    "Book to bill ratio": { "Q1 FY25": "string", "Q2 FY25": "string", "Q3 FY25": "string", "Q4 FY25": "string", "Q1 FY26": "string", "Q2 FY26": "string", "Q3 FY26": "string", "Q4 FY26": "string" },
    "SL revenue penetration %": { "Q1 FY25": "string", "Q2 FY25": "string", "Q3 FY25": "string", "Q4 FY25": "string", "Q1 FY26": "string", "Q2 FY26": "string", "Q3 FY26": "string", "Q4 FY26": "string" },
    "# of SLs present in the account*": { "Q1 FY25": "string", "Q2 FY25": "string", "Q3 FY25": "string", "Q4 FY25": "string", "Q1 FY26": "string", "Q2 FY26": "string", "Q3 FY26": "string", "Q4 FY26": "string" },
    "Gross Margin %": { "Q1 FY25": "string", "Q2 FY25": "string", "Q3 FY25": "string", "Q4 FY25": "string", "Q1 FY26": "string", "Q2 FY26": "string", "Q3 FY26": "string", "Q4 FY26": "string" },
    "Revenue / FTE (ONS)": { "Q1 FY25": "string", "Q2 FY25": "string", "Q3 FY25": "string", "Q4 FY25": "string", "Q1 FY26": "string", "Q2 FY26": "string", "Q3 FY26": "string", "Q4 FY26": "string" },
    "Revenue / FTE (OFS)": { "Q1 FY25": "string", "Q2 FY25": "string", "Q3 FY25": "string", "Q4 FY25": "string", "Q1 FY26": "string", "Q2 FY26": "string", "Q3 FY26": "string", "Q4 FY26": "string" },
    "Cost / FTE (ONS)": { "Q1 FY25": "string", "Q2 FY25": "string", "Q3 FY25": "string", "Q4 FY25": "string", "Q1 FY26": "string", "Q2 FY26": "string", "Q3 FY26": "string", "Q4 FY26": "string" },
    "Cost / FTE (OFS)": { "Q1 FY25": "string", "Q2 FY25": "string", "Q3 FY25": "string", "Q4 FY25": "string", "Q1 FY26": "string", "Q2 FY26": "string", "Q3 FY26": "string", "Q4 FY26": "string" },
    "Attrition %": { "Q1 FY25": "string", "Q2 FY25": "string", "Q3 FY25": "string", "Q4 FY25": "string", "Q1 FY26": "string", "Q2 FY26": "string", "Q3 FY26": "string", "Q4 FY26": "string" },
    "Fulfilment %": { "Q1 FY25": "string", "Q2 FY25": "string", "Q3 FY25": "string", "Q4 FY25": "string", "Q1 FY26": "string", "Q2 FY26": "string", "Q3 FY26": "string", "Q4 FY26": "string" },
    "Delivery on time %": { "Q1 FY25": "string", "Q2 FY25": "string", "Q3 FY25": "string", "Q4 FY25": "string", "Q1 FY26": "string", "Q2 FY26": "string", "Q3 FY26": "string", "Q4 FY26": "string" }
  }
}`
  },
  {
    id: "Client_Context",
    title: "Client Context",
    description: "Get general context and executive changes for the client.",
    placeholders: [
      { key: "company", label: "Company Name", type: "text", placeholder: "e.g. NatWest Group" }
    ],
    template: (data) => `Company="${data.company}"
{
  "template_type": "Client_Context",
  "data": {
    "year_founded": "string",
    "headquarters_location": "string",
    "number_of_offices": "string",
    "total_employees": "string",
    "roe_percent": "string",
    "total_revenue_usd_bn": {
      "ebitda_margin": "percentage",
      "actuals": "string",
      "forecast": "string"
    },
    "revenue_by_year": [
      {
        "fiscal_year": "string",
        "revenue": "string",
        "cagr_percent": "percentage"
      }
    ],
    "key_highlights": [
      "string"
    ],
    "executive_changes": [
      {
        "name": "string",
        "position": "string",
        "background": "string"
      }
    ],
    "client_description": "string"
  }
}`
  },
  {
    id: "client_context_business_tech_priorities",
    title: "Business & Tech Priorities",
    description: "Analyze tech spend and business priorities.",
    placeholders: [
      { key: "company", label: "Company Name", type: "text", placeholder: "e.g. NatWest Group" }
    ],
    template: (data) => `Company="${data.company}"
{
  "template_type": "client_context_business_tech_priorities",
  "data": {
    "top_business_priorities": ["string"],
    "top_tech_priorities": ["string"],
    "tech_spend_landscape": {
      "overall_tech_spend": "string",
      "outsourced_tech_spend": "string",
      "research_and_development_spend_pct": "string",
      "core_erp_platform": "string",
      "preferred_hyperscaler_partners": "string",
      "other_isvs": "string"
    },
    "competitive_intel": {
      "competition_overview": [
        {
          "name": "string",
          "share_of_wallet_percent": "string",
          "depth_of_relationship": "integer",
          "key_areas_of_engagement": "string"
        }
      ]
    }
  }
}`
  },
  {
    id: "org_structure_tech_view",
    title: "Org Structure (Tech View)",
    description: "Map out the key technology leaders and structure.",
    placeholders: [
      { key: "company", label: "Company Name", type: "text", placeholder: "e.g. NatWest Group" }
    ],
    template: (data) => `Company="${data.company}"
{
  "template_type": "org_structure_tech_view",
  "data": {
    "group_ceo": {
      "name": "string",
      "role": "string"
    },
    "cdio": {
      "name": "string",
      "role": "string"
    },
    "key_functions": [
      {
        "function": "string",
        "leader_name": "string",
        "leader_role": "string",
        "presence_type": "string"
      }
    ]
  }
}`
  },
  {
    id: "Revenue_Teardown",
    title: "Revenue Teardown",
    description: "Detailed teardown of revenue by geography and EE/EN.",
    placeholders: [
      { key: "company", label: "Company Name", type: "text", placeholder: "e.g. NatWest Group" }
    ],
    template: (data) => `Company="${data.company}"
{
  "template_type": "Revenue_Teardown",
  "data": {
    "eeRows": [
      { "id": 1, "name": "EE / EER", "fy25Act": "string", "fy26Tar": "string", "fy25Share": "string", "fy26Share": "string" },
      { "id": 2, "name": "EN", "fy25Act": "string", "fy26Tar": "string", "fy25Share": "string", "fy26Share": "string" }
    ],
    "geoRows": [
      { "id": 1, "name": "Americas", "fy25Act": "string", "fy26Tar": "string", "fy25Share": "string", "fy26Share": "string" },
      { "id": 2, "name": "Europe", "fy25Act": "string", "fy26Tar": "string", "fy25Share": "string", "fy26Share": "string" },
      { "id": 3, "name": "APAC", "fy25Act": "string", "fy26Tar": "string", "fy25Share": "string", "fy26Share": "string" }
    ],
    "insights": {
      "top": "string",
      "bottom": "string"
    }
  }
}`
  },

];
 