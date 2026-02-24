from __future__ import annotations

from copy import deepcopy
from typing import Any, Dict

# ============================================================
# SINGLE SOURCE OF TRUTH FOR TEMPLATE SCHEMAS
# Keys MUST match what user types in chatbot (snake_case)
# ============================================================

TEMPLATE_SCHEMAS: Dict[str, Dict[str, Any]] = {

    # ---------------------------------------------------------
    # Account Dashboard (Quarterly Plan / Performance Table)
    # ---------------------------------------------------------
    "account_performance_quarterly_plan": {
    "template_type": "account_performance_quarterly_plan",
    "data": [
        {
            "metric": "Revenue Budget",
            "Q1 FY25": "", "Q2 FY25": "", "Q3 FY25": "", "Q4 FY25": "",
            "Q1 FY26": "", "Q2 FY26": "", "Q3 FY26": "", "Q4 FY26": ""
        },
        {
            "metric": "Revenue Actuals / Forecast",
            "Q1 FY25": "", "Q2 FY25": "", "Q3 FY25": "", "Q4 FY25": "",
            "Q1 FY26": "", "Q2 FY26": "", "Q3 FY26": "", "Q4 FY26": ""
        },
        {
            "metric": "TCV won",
            "Q1 FY25": "", "Q2 FY25": "", "Q3 FY25": "", "Q4 FY25": "",
            "Q1 FY26": "", "Q2 FY26": "", "Q3 FY26": "", "Q4 FY26": ""
        },
        {
            "metric": "Win rate (YTD)",
            "Q1 FY25": "", "Q2 FY25": "", "Q3 FY25": "", "Q4 FY25": "",
            "Q1 FY26": "", "Q2 FY26": "", "Q3 FY26": "", "Q4 FY26": ""
        },
        {
            "metric": "Book to bill ratio",
            "Q1 FY25": "", "Q2 FY25": "", "Q3 FY25": "", "Q4 FY25": "",
            "Q1 FY26": "", "Q2 FY26": "", "Q3 FY26": "", "Q4 FY26": ""
        },
        {
            "metric": "SL revenue penetration %",
            "Q1 FY25": "", "Q2 FY25": "", "Q3 FY25": "", "Q4 FY25": "",
            "Q1 FY26": "", "Q2 FY26": "", "Q3 FY26": "", "Q4 FY26": ""
        },
        {
            "metric": "# of SLs present in the account*",
            "Q1 FY25": "", "Q2 FY25": "", "Q3 FY25": "", "Q4 FY25": "",
            "Q1 FY26": "", "Q2 FY26": "", "Q3 FY26": "", "Q4 FY26": ""
        },
        {
            "metric": "Gross Margin %",
            "Q1 FY25": "", "Q2 FY25": "", "Q3 FY25": "", "Q4 FY25": "",
            "Q1 FY26": "", "Q2 FY26": "", "Q3 FY26": "", "Q4 FY26": ""
        },
        {
            "metric": "Revenue / FTE (ONS)",
            "Q1 FY25": "", "Q2 FY25": "", "Q3 FY25": "", "Q4 FY25": "",
            "Q1 FY26": "", "Q2 FY26": "", "Q3 FY26": "", "Q4 FY26": ""
        },
        {
            "metric": "Revenue / FTE (OFS)",
            "Q1 FY25": "", "Q2 FY25": "", "Q3 FY25": "", "Q4 FY25": "",
            "Q1 FY26": "", "Q2 FY26": "", "Q3 FY26": "", "Q4 FY26": ""
        },
        {
            "metric": "Cost / FTE (ONS)",
            "Q1 FY25": "", "Q2 FY25": "", "Q3 FY25": "", "Q4 FY25": "",
            "Q1 FY26": "", "Q2 FY26": "", "Q3 FY26": "", "Q4 FY26": ""
        },
        {
            "metric": "Cost / FTE (OFS)",
            "Q1 FY25": "", "Q2 FY25": "", "Q3 FY25": "", "Q4 FY25": "",
            "Q1 FY26": "", "Q2 FY26": "", "Q3 FY26": "", "Q4 FY26": ""
        },
        {
            "metric": "Attrition %",
            "Q1 FY25": "", "Q2 FY25": "", "Q3 FY25": "", "Q4 FY25": "",
            "Q1 FY26": "", "Q2 FY26": "", "Q3 FY26": "", "Q4 FY26": ""
        },
        {
            "metric": "Fulfilment %",
            "Q1 FY25": "", "Q2 FY25": "", "Q3 FY25": "", "Q4 FY25": "",
            "Q1 FY26": "", "Q2 FY26": "", "Q3 FY26": "", "Q4 FY26": ""
        },
        {
            "metric": "Delivery on time %",
            "Q1 FY25": "", "Q2 FY25": "", "Q3 FY25": "", "Q4 FY25": "",
            "Q1 FY26": "", "Q2 FY26": "", "Q3 FY26": "", "Q4 FY26": ""
        }
    ]
},

    # ---------------------------------------------------------
    # Service Line Penetration
    # ---------------------------------------------------------
    "service_line_penetration": {
        "template_type": "service_line_penetration",
        "data": {
            "barValues": [["", "", "", ""]],
            "xxValues": ["", "", "", "", "", "", "", ""],
            "tableRows": [
                { "id": "1", "name": "Secured Order Book", "v1": "", "v2": "", "v3": "", "v4": "" },
                { "id": "1a", "name": "- Gross Order Book", "v1": "", "v2": "", "v3": "", "v4": "" },
                { "id": "1b", "name": "- Expiry / run-off", "v1": "", "v2": "", "v3": "", "v4": "" },
                { "id": "2", "name": "Open TCV", "v1": "", "v2": "", "v3": "", "v4": "" },
                { "id": "3", "name": "TCV Won", "v1": "", "v2": "", "v3": "", "v4": "" },
                { "id": "4", "name": "TCV dropped / lost", "v1": "", "v2": "", "v3": "", "v4": "" }
            ],
            "insights": ""
        }
    },

    # ---------------------------------------------------------
    # Growth Strategy
    # ---------------------------------------------------------
    "growth_strategy": {
        "template_type": "growth_strategy",
        "data": {
            "growth_aspiration": "string",
            "growth_vectors": ["string"],
            "revenue_quality_sustainability": "string",
            "inorganic_opportunities": "string",
        },
    },

    # ---------------------------------------------------------
    # Customer Profile
    # ---------------------------------------------------------
    "customer_profile": {
        "template_type": "customer_profile",
        "data": {
            "customer_name": "",
            "headquarter_location": "",
            "csat": "",
            "version_1_vertical": "",
            "current_work": [""],
            "service_lines": [""],
            "customer_perception": [""],
        },
    },

    # ---------------------------------------------------------
    # Critical Risk Page
    # ---------------------------------------------------------
    "critical_risk": {
        "template_type": "critical_risk",
        "data": {
            "key_risks": [""],
            "mitigation_plan": [""],
            "overall_risk_rating": [""],
        },
    },

    # ---------------------------------------------------------
    # Implementation Plan
    # ---------------------------------------------------------
    "implementation_plan": {
        "template_type": "implementation_plan",
        "data": {
            "actions": [
                {
                    "action": "",
                    "timeline": "",
                    "owner": "",
                    "status": "To be initiated",
                    "investment_needed": "",
                    "impact": ""
                },
                {
                    "action": "",
                    "timeline": "",
                    "owner": "",
                    "status": "To be initiated",
                    "investment_needed": "",
                    "impact": ""
                },
                {
                    "action": "",
                    "timeline": "",
                    "owner": "",
                    "status": "To be initiated",
                    "investment_needed": "",
                    "impact": ""
                }
            ]
        },
    },

    "operational_implementation_plan": {
        "template_type": "operational_implementation_plan",
        "plan_date": "TBD",
        "data": [
            {
                "category": "Operational Excellence",
                "subcategory": "Process Improvement",
                "action_number": 1,
                "action_description": "",
                "primary_owner": "",
                "support_team": "",
                "timeline": "",
                "status": "To be initiated",
                "help_required": "",
                "investment_needed": "",
                "impact": ""
            }
        ]
    },

    # ---------------------------------------------------------
    # Growth Opportunities
    # ---------------------------------------------------------
    "growth_opportunities": {
        "template_type": "growth_opportunities",
        "data": {
            "opportunity_areas": [""],
            "priority_opportunities": [""],
            "next_steps": [""],
        },
    },

    # ---------------------------------------------------------
    # Client Context 1
    # ---------------------------------------------------------
    "client_context_1": {
        "template_type": "client_context_1",
        "data": {
            "client_strategy": [""],
            "market_dynamics": [""],
            "key_trends": [""],
        },
    },

    # ---------------------------------------------------------
    # Client Context 2
    # ---------------------------------------------------------
    "client_context_2": {
        "template_type": "client_context_2",
        "data": {
            "client_priorities": [""],
            "key_challenges": [""],
            "version1_positioning": [""],
        },
    },

    # ---------------------------------------------------------
    # Account Team Pod
    # ---------------------------------------------------------
    "account_team_pod": {
        "template_type": "account_team_pod",
        "data": {
            "Sales_and_Delivery_Leads": {
                "Client_Partner": {"Accountable_POC": "", "Time_Commitment": ""},
                "Delivery_Manager": {"Accountable_POC": "", "Time_Commitment": ""},
                "Digital_and_Cloud_POC": {"Accountable_POC": "", "Time_Commitment": ""},
                "SRG_POC": {"Accountable_POC": "", "Time_Commitment": ""},
                "EA_POC": {"Accountable_POC": "", "Time_Commitment": ""},
                "Data_POC": {"Accountable_POC": "", "Time_Commitment": ""}
            },
            "Functional_POCs": {
                "Presales_Lead": {"Accountable_POC": "", "Time_Commitment": ""},
                "Marketing_POC": {"Accountable_POC": "", "Time_Commitment": ""},
                "Partnerships_POC": {"Accountable_POC": "", "Time_Commitment": ""},
                "AI_and_Innovation_Lead": {"Accountable_POC": "", "Time_Commitment": ""},
                "Delivery_Excellence_Lead": {"Accountable_POC": "", "Time_Commitment": ""},
                "Talent_Supply_Chain_POC": {"Accountable_POC": "", "Time_Commitment": ""},
                "L_and_D_Lead": {"Accountable_POC": "", "Time_Commitment": ""}
            }
        },
    },

    # ---------------------------------------------------------
    # Account Cockpit View
    # ---------------------------------------------------------
    "account_cockpit_view": {
        "template_type": "account_cockpit_view",
        "data": {
            "revenue_performance": {
                "yoy": [{"year": "FY24", "value": "", "target_achieved": ""}, {"year": "FY25", "value": "", "target_achieved": ""}, {"year": "FY26", "value": "", "target_achieved": ""}],
                "qoq": [{"quarter": "FY25 Q1", "value": "", "target": ""}, {"quarter": "FY25 Q2", "value": "", "target": ""}, {"quarter": "FY25 Q3", "value": "", "target": ""}, {"quarter": "FY25 Q4", "value": "", "target": ""}, {"quarter": "FY26 Q1", "value": "", "target": ""}, {"quarter": "FY26 Q2", "value": "", "target": ""}, {"quarter": "FY26 Q3", "value": "", "target": ""}, {"quarter": "FY26 Q4", "value": "", "target": ""}]
            },
            "booking_performance": {
                "yoy": [{"year": "FY24", "value": "", "target_achieved": ""}, {"year": "FY25", "value": "", "target_achieved": ""}, {"year": "FY26", "value": "", "target_achieved": ""}],
                "qoq": [{"quarter": "FY25 Q1", "value": "", "target": ""}, {"quarter": "FY25 Q2", "value": "", "target": ""}, {"quarter": "FY25 Q3", "value": "", "target": ""}, {"quarter": "FY25 Q4", "value": "", "target": ""}, {"quarter": "FY26 Q1", "value": "", "target": ""}, {"quarter": "FY26 Q2", "value": "", "target": ""}, {"quarter": "FY26 Q3", "value": "", "target": ""}, {"quarter": "FY26 Q4", "value": "", "target": ""}]
            },
            "margin_performance": {
                "yoy": [{"year": "FY24", "value": "", "target_achieved": ""}, {"year": "FY25", "value": "", "target_achieved": ""}, {"year": "FY26", "value": "", "target_achieved": ""}],
                "qoq": [{"quarter": "FY25 Q1", "value": "", "target": ""}, {"quarter": "FY25 Q2", "value": "", "target": ""}, {"quarter": "FY25 Q3", "value": "", "target": ""}, {"quarter": "FY25 Q4", "value": "", "target": ""}, {"quarter": "FY26 Q1", "value": "", "target": ""}, {"quarter": "FY26 Q2", "value": "", "target": ""}, {"quarter": "FY26 Q3", "value": "", "target": ""}, {"quarter": "FY26 Q4", "value": "", "target": ""}]
            },
            "large_deals": {
                "tcv_wins": [{"quarter": "Q1 FY25", "value": ""}, {"quarter": "Q2 FY25", "value": ""}, {"quarter": "Q3 FY25", "value": ""}, {"quarter": "Q4 FY25", "value": ""}],
                "num_wins": ["", "", "", ""]
            },
            "service_lines_presence": {
                "data_cloud": False, "infra": False, "dats": False, "erp": False
            },
            "sl_penetration": [
                {"quarter": "FY25 Q1", "value": ""}, {"quarter": "FY25 Q2", "value": ""}, {"quarter": "FY25 Q3", "value": ""}, {"quarter": "FY25 Q4", "value": ""}
            ],
            "partnership_revenue": [
                {"partner": "", "fy25_revenue": "", "fy26_target": ""},
                {"partner": "", "fy25_revenue": "", "fy26_target": ""},
                {"partner": "", "fy25_revenue": "", "fy26_target": ""}
            ],
            "revenue_geos": [
                {"geo": "Americas", "value": ""}, {"geo": "EMEA", "value": ""}, {"geo": "APAC", "value": ""}, {"geo": "Others", "value": ""}
            ],
            "csat_trajectory": [
                {"period": "H1 FY24", "value": ""}, {"period": "H2 FY24", "value": ""}, {"period": "H1 FY25", "value": ""}, {"period": "H2 FY25", "value": ""}
            ]
        }
    },

    # ---------------------------------------------------------
    # Relationship Heatmap
    # ---------------------------------------------------------
    "relationship_heatmap": {
        "template_type": "relationship_heatmap",
        "data": {
            "stakeholder_list": [
                {
                    "client_stakeholder": "",
                    "role": "",
                    "reports_to": "",
                    "level": "",
                    "client_relationship": "",
                    "engagement_plan_next_action": "",
                }
            ]
        },
    },

    # ---------------------------------------------------------
    # Service Line Growth Actions
    # ---------------------------------------------------------
    "service_line_growth_actions": {
        "template_type": "service_line_growth_actions",
        "data": {
            # ✅ THESE KEYS MATCH YOUR FRONTEND KEY_MAP EXACTLY
            "Cloud_Transformation": {
                "Objective": "", "Target_Buying_Centres": "", "Current_Status": "", "Next_Action_and_Responsible_Person": ""
            },
            "Data": {
                "Objective": "", "Target_Buying_Centres": "", "Current_Status": "", "Next_Action_and_Responsible_Person": ""
            },
            "AI": {
                "Objective": "", "Target_Buying_Centres": "", "Current_Status": "", "Next_Action_and_Responsible_Person": ""
            },
            "SRG_Managed_Services": {
                "Objective": "", "Target_Buying_Centres": "", "Current_Status": "", "Next_Action_and_Responsible_Person": ""
            },
            "EA": {
                "Objective": "", "Target_Buying_Centres": "", "Current_Status": "", "Next_Action_and_Responsible_Person": ""
            },
            "Strategy_Design_and_Change": {
                "Objective": "", "Target_Buying_Centres": "", "Current_Status": "", "Next_Action_and_Responsible_Person": ""
            },
            "SAM_and_Licensing": {
                "Objective": "", "Target_Buying_Centres": "", "Current_Status": "", "Next_Action_and_Responsible_Person": ""
            },
        },
    },

    "operational_excellence_strategy": {
        "template_type": "operational_excellence_strategy",
        "data": {
            "current_gp_percentage": "",
            "gp_percentage_ambition": "",
            "priority_levers_to_drive_margin_uplift": [""],
            "plan_for_commercial_model_transformation": [""]
        },
    },

    # ---------------------------------------------------------
    # Talent Excellence Overview
    # ---------------------------------------------------------
    "talent_excellence_overview": {
        "template_type": "talent_excellence_overview",
        "data": {
            "overviewRows": [
                {
                    "id": 1,
                    "metric": "",
                    "target": "",
                    "q1": "", "q1Status": "",
                    "q2": "", "q2Status": "",
                    "q3": "", "q3Status": "",
                    "q4": "", "q4Status": ""
                }
            ],
            "demandRows": [
                {
                    "id": 1,
                    "metric": "",
                    "target": "",
                    "q1": "", "q1Status": "",
                    "q2": "", "q2Status": "",
                    "q3": "", "q3Status": "",
                    "q4": "", "q4Status": ""
                }
            ],
            "insights": ""
        }
    },

    "innovation_strategy": {
        "template_type": "innovation_strategy",
        "data": {
            "current_outlook_on_ai": "",
            "top_motivations_for_genai": "",
            "top_genai_projects": "",
            "other_innovation_projects": "",
            "high_value_use_cases": ""
        },
    },

    "investment_plan": {
        "template_type": "investment_plan",
        "data": {
            "investments": [
                {
                    "investment_number": 1,
                    "investment_type": "Billing investment",
                    "investment_description": "",
                    "investment_value_eur": "",
                    "targeted_outcome": "",
                    "primary_owner": "",
                    "timeline_status": "Approved",
                    "remarks": ""
                },
                {
                    "investment_number": 2,
                    "investment_type": "Buffers",
                    "investment_description": "",
                    "investment_value_eur": "",
                    "targeted_outcome": "",
                    "primary_owner": "",
                    "timeline_status": "Delayed",
                    "remarks": ""
                },
                {
                    "investment_number": 3,
                    "investment_type": "Innovation",
                    "investment_description": "",
                    "investment_value_eur": "",
                    "targeted_outcome": "",
                    "primary_owner": "",
                    "timeline_status": "At Risk",
                    "remarks": ""
                },
                {
                    "investment_number": 4,
                    "investment_type": "Free resources",
                    "investment_description": "",
                    "investment_value_eur": "",
                    "targeted_outcome": "",
                    "primary_owner": "",
                    "timeline_status": "On-track",
                    "remarks": ""
                },
                {
                    "investment_number": 5,
                    "investment_type": "Marketing investments / relationship building",
                    "investment_description": "",
                    "investment_value_eur": "",
                    "targeted_outcome": "",
                    "primary_owner": "",
                    "timeline_status": "Approved",
                    "remarks": ""
                },
                {
                    "investment_number": 6,
                    "investment_type": "Travel investments",
                    "investment_description": "",
                    "investment_value_eur": "",
                    "targeted_outcome": "",
                    "primary_owner": "",
                    "timeline_status": "Delayed",
                    "remarks": ""
                }
            ],
            "total_investment_value": "XX"
        },
    },

    "account_performance_annual_plan": {
        "template_type": "account_performance_annual_plan",
        "data": {
            "financials": [
                {"metric": "Revenue Budget", "unit": "€ Mn",
                    "fy24": "", "fy25": "", "fy26": ""},
                {"metric": "Revenue Actuals / Forecast",
                    "unit": "€ Mn", "fy24": "", "fy25": "", "fy26": ""},
                {"metric": "TCV won", "unit": "€ Mn",
                    "fy24": "", "fy25": "", "fy26": ""},
                {"metric": "Win rate (YTD)", "unit": "%",
                 "fy24": "", "fy25": "", "fy26": ""},
                {"metric": "Book to bill ratio", "unit": "#",
                    "fy24": "", "fy25": "", "fy26": ""},
                {"metric": "SL revenue penetration %", "unit": "%",
                    "fy24": "", "fy25": "", "fy26": ""},
                {"metric": "# of SLs present in the account*",
                    "unit": "#", "fy24": "", "fy25": "", "fy26": ""}
            ],
            "delivery": [
                {"metric": "Gross Margin %", "unit": "%",
                    "fy24": "", "fy25": "", "fy26": ""},
                {"metric": "Revenue / FTE (ONS)", "unit": "€ K",
                 "fy24": "", "fy25": "", "fy26": ""},
                {"metric": "Revenue / FTE (OFS)", "unit": "€ K",
                 "fy24": "", "fy25": "", "fy26": ""},
                {"metric": "Cost / FTE (ONS)", "unit": "#",
                 "fy24": "", "fy25": "", "fy26": ""},
                {"metric": "Cost / FTE (OFS)", "unit": "#",
                 "fy24": "", "fy25": "", "fy26": ""}
            ],
            "talent": [
                {"metric": "Attrition %", "unit": "%",
                    "fy24": "", "fy25": "", "fy26": ""},
                {"metric": "Fulfilment %", "unit": "%",
                    "fy24": "", "fy25": "", "fy26": ""},
                {"metric": "Delivery on time %", "unit": "%",
                    "fy24": "", "fy25": "", "fy26": ""}
            ]
        },
    },

    # ---------------------------------------------------------
    # Tech Spend View
    # ---------------------------------------------------------
    "tech_spend_view": {
        "template_type": "tech_spend_view",
        "data": {
            "rows": [
                # We expect 6 rows for Business Units (BU1 - BU6)
                {"id": 1, "name": "BU1", "desc": "", "size": "", "growth": "",
                    "spend": "", "priorities": "", "presence": "", "incumbent": ""},
                {"id": 2, "name": "BU2", "desc": "", "size": "", "growth": "",
                    "spend": "", "priorities": "", "presence": "", "incumbent": ""},
                {"id": 3, "name": "BU3", "desc": "", "size": "", "growth": "",
                    "spend": "", "priorities": "", "presence": "", "incumbent": ""},
                {"id": 4, "name": "BU4", "desc": "", "size": "", "growth": "",
                    "spend": "", "priorities": "", "presence": "", "incumbent": ""},
                {"id": 5, "name": "BU5", "desc": "", "size": "", "growth": "",
                    "spend": "", "priorities": "", "presence": "", "incumbent": ""},
                {"id": 6, "name": "BU6", "desc": "", "size": "", "growth": "",
                    "spend": "", "priorities": "", "presence": "", "incumbent": ""}
            ],
            "geoRevenue": [
                {"l": "Americas", "v": "", "h": "75%"},
                {"l": "EMEA", "v": "", "h": "60%"},
                {"l": "APAC", "v": "", "h": "20%"},
                {"l": "Others", "v": "", "h": "15%"}
            ],
            "geoTalent": [
                {"geo": "Americas", "val": ""},
                {"geo": "EMEA", "val": ""},
                {"geo": "APAC", "val": ""}
            ],
            "geoPriorities": [
                {"geo": "Americas", "val": ""},
                {"geo": "EMEA", "val": ""},
                {"geo": "APAC", "val": ""}
            ]
        },
    },

    # ---------------------------------------------------------
    # Org Structure Tech View
    # ---------------------------------------------------------
    "org_structure_tech_view": {
        "template_type": "org_structure_tech_view",
        "data": {
            "group_ceo": {"name": "", "role": ""},
            "cdio": {"name": "", "role": ""},
            "key_functions": [
                {"function": "", "leader_name": "", "leader_role": "", "presence_type": "Green"},
                {"function": "", "leader_name": "", "leader_role": "", "presence_type": "Orange"}
            ]
        }
    },

    # ---------------------------------------------------------
    # Revenue Teardown
    # ---------------------------------------------------------
    "revenue_teardown": {
        "template_type": "revenue_teardown",
        "data": {
            "eeRows": [
                { "id": 1, "name": "EE / EER", "fy25Act": "", "fy26Tar": "", "fy25Share": "", "fy26Share": "" },
                { "id": 2, "name": "EN", "fy25Act": "", "fy26Tar": "", "fy25Share": "", "fy26Share": "" }
            ],
            "geoRows": [
                { "id": 1, "name": "Americas", "fy25Act": "", "fy26Tar": "", "fy25Share": "", "fy26Share": "" },
                { "id": 2, "name": "EMEA", "fy25Act": "", "fy26Tar": "", "fy25Share": "", "fy26Share": "" },
                { "id": 3, "name": "APAC", "fy25Act": "", "fy26Tar": "", "fy25Share": "", "fy26Share": "" },
                { "id": 4, "name": "Others", "fy25Act": "", "fy26Tar": "", "fy25Share": "", "fy26Share": "" }
            ],
            "insights": {
                "top": "",
                "bottom": ""
            }
        }
    },
    # ---------------------------------------------------------
    # Client Context 1
    # ---------------------------------------------------------
    "client_context_1": {
        "template_type": "client_context_1",
        "data": {
            "year_founded": "",
            "headquarters_location": "",
            "number_of_offices": "",
            "total_employees": "",
            "roe_percent": "",
            "total_revenue_usd_bn": {
                "ebitda_margin": "",
                "actuals": "",
                "forecast": ""
            },
            "revenue_by_year": [
                { "fiscal_year": "", "revenue": "", "cagr_percent": "" }
            ],
            "key_highlights": [""],
            "executive_changes": [
                { "name": "", "position": "", "background": "" }
            ],
            "client_description": ""
        }
    },

    # ---------------------------------------------------------
    # Client Context 2
    # ---------------------------------------------------------
    "client_context_2": {
        "template_type": "client_context_2",
        "data": {
            "business_it_priorities": {
                "business": ["", "", ""],
                "it": ["", "", ""]
            },
            "tech_landscape_spend": {
                "spend": {"overall": "", "outsourced": "", "rnd": ""},
                "partners": {
                    "erp": {"name": ""},
                    "hyperscalers": [{"name": ""}, {"name": ""}],
                    "isvs": [{"name": ""}, {"name": ""}]
                }
            },
            "competitive_intel": {
                "market_share": [
                    {"name": "Client", "value": 0},
                    {"name": "Competitor 1", "value": 0},
                    {"name": "Competitor 2", "value": 0}
                ],
                "competition_overview": [
                    {"competitor_name": "", "wallet_share_percent": "", "depth_of_relationship": 1, "key_areas_of_engagement": ""}
                ]
            }
        }
    },
}


def get_template_schema(template_name: str) -> Dict[str, Any]:
    """
    Returns a deep-copied schema so callers can safely mutate.
    """
    key = (template_name or "").strip()

    if not key:
        raise KeyError("template_name required")

    if key not in TEMPLATE_SCHEMAS:
        raise KeyError(f"unknown template_name: {key}")

    return deepcopy(TEMPLATE_SCHEMAS[key])
