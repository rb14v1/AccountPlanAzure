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
    "account_dashboard": {
        "template_type": "Account_Dashboard",
        "data": {
            # Revenue
            "Revenue Budget": {
                "Q1 FY25": "", "Q2 FY25": "", "Q3 FY25": "", "Q4 FY25": "",
                "Q1 FY26": "", "Q2 FY26": "", "Q3 FY26": "", "Q4 FY26": "",
            },
            "Revenue Actuals / Forecast": {
                "Q1 FY25": "", "Q2 FY25": "", "Q3 FY25": "", "Q4 FY25": "",
                "Q1 FY26": "", "Q2 FY26": "", "Q3 FY26": "", "Q4 FY26": "",
            },
            "TCV won": {
                "Q1 FY25": "", "Q2 FY25": "", "Q3 FY25": "", "Q4 FY25": "",
                "Q1 FY26": "", "Q2 FY26": "", "Q3 FY26": "", "Q4 FY26": "",
            },
            "Win rate (YTD)": {
                "Q1 FY25": "", "Q2 FY25": "", "Q3 FY25": "", "Q4 FY25": "",
                "Q1 FY26": "", "Q2 FY26": "", "Q3 FY26": "", "Q4 FY26": "",
            },
            "Book to bill ratio": {
                "Q1 FY25": "", "Q2 FY25": "", "Q3 FY25": "", "Q4 FY25": "",
                "Q1 FY26": "", "Q2 FY26": "", "Q3 FY26": "", "Q4 FY26": "",
            },
            "SL revenue penetration %": {
                "Q1 FY25": "", "Q2 FY25": "", "Q3 FY25": "", "Q4 FY25": "",
                "Q1 FY26": "", "Q2 FY26": "", "Q3 FY26": "", "Q4 FY26": "",
            },
            "# of SLs present in the account*": {
                "Q1 FY25": "", "Q2 FY25": "", "Q3 FY25": "", "Q4 FY25": "",
                "Q1 FY26": "", "Q2 FY26": "", "Q3 FY26": "", "Q4 FY26": "",
            },

            # Delivery Ops
            "Gross Margin %": {
                "Q1 FY25": "", "Q2 FY25": "", "Q3 FY25": "", "Q4 FY25": "",
                "Q1 FY26": "", "Q2 FY26": "", "Q3 FY26": "", "Q4 FY26": "",
            },
            "Revenue / FTE (ONS)": {
                "Q1 FY25": "", "Q2 FY25": "", "Q3 FY25": "", "Q4 FY25": "",
                "Q1 FY26": "", "Q2 FY26": "", "Q3 FY26": "", "Q4 FY26": "",
            },
            "Revenue / FTE (OFS)": {
                "Q1 FY25": "", "Q2 FY25": "", "Q3 FY25": "", "Q4 FY25": "",
                "Q1 FY26": "", "Q2 FY26": "", "Q3 FY26": "", "Q4 FY26": "",
            },
            "Cost / FTE (ONS)": {
                "Q1 FY25": "", "Q2 FY25": "", "Q3 FY25": "", "Q4 FY25": "",
                "Q1 FY26": "", "Q2 FY26": "", "Q3 FY26": "", "Q4 FY26": "",
            },
            "Cost / FTE (OFS)": {
                "Q1 FY25": "", "Q2 FY25": "", "Q3 FY25": "", "Q4 FY25": "",
                "Q1 FY26": "", "Q2 FY26": "", "Q3 FY26": "", "Q4 FY26": "",
            },

            # Talent
            "Attrition %": {
                "Q1 FY25": "", "Q2 FY25": "", "Q3 FY25": "", "Q4 FY25": "",
                "Q1 FY26": "", "Q2 FY26": "", "Q3 FY26": "", "Q4 FY26": "",
            },
            "Fulfilment %": {
                "Q1 FY25": "", "Q2 FY25": "", "Q3 FY25": "", "Q4 FY25": "",
                "Q1 FY26": "", "Q2 FY26": "", "Q3 FY26": "", "Q4 FY26": "",
            },
            "Delivery on time %": {
                "Q1 FY25": "", "Q2 FY25": "", "Q3 FY25": "", "Q4 FY25": "",
                "Q1 FY26": "", "Q2 FY26": "", "Q3 FY26": "", "Q4 FY26": "",
            },
        },
    },

    # ---------------------------------------------------------
    # Service Line Penetration
    # ---------------------------------------------------------
    "service_line_penetration": {
        # MUST MATCH frontend key: globalData?.Service_Line_Penetration
        "template_type": "Service_Line_Penetration",
        "data": {
            "tableRows": [
                {"id": "1",  "name": "Secured Order Book",
                    "v1": "", "v2": "", "v3": "", "v4": ""},
                {"id": "1a", "name": "- Gross Order Book",  "v1": "",
                    "v2": "", "v3": "", "v4": "", "indent": True},
                {"id": "1b", "name": "- Expiry / run-off",  "v1": "",
                    "v2": "", "v3": "", "v4": "", "indent": True},
                {"id": "2",  "name": "Open TCV",
                    "v1": "", "v2": "", "v3": "", "v4": ""},
                {"id": "3",  "name": "Win Rate (%)",
                 "v1": "", "v2": "", "v3": "", "v4": ""},
                {"id": "4",  "name": "NRR (%)",
                 "v1": "", "v2": "", "v3": "", "v4": ""},
                {"id": "5",  "name": "Revenue",
                    "v1": "", "v2": "", "v3": "", "v4": ""},
                {"id": "6",  "name": "Tech Spend",
                    "v1": "", "v2": "", "v3": "", "v4": ""},
                {"id": "7",  "name": "Propensity to Buy",
                    "v1": "", "v2": "", "v3": "", "v4": ""},
            ],
            "serviceLines": [
                {"name": "Cloud",        "pos": 0, "penetration": "",
                    "revenue": "", "techSpend": "", "propensity": ""},
                {"name": "Data",         "pos": 0, "penetration": "",
                    "revenue": "", "techSpend": "", "propensity": ""},
                {"name": "Engineering",  "pos": 0, "penetration": "",
                    "revenue": "", "techSpend": "", "propensity": ""},
                {"name": "Security",     "pos": 0, "penetration": "",
                    "revenue": "", "techSpend": "", "propensity": ""},
            ],
        },
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
            "team_structure": [""],
            "roles_and_responsibilities": [""],
            "key_contacts": [""],
        },
    },

    # ---------------------------------------------------------
    # Account Cockpit View
    # ---------------------------------------------------------
    "account_cockpit_view": {
        "template_type": "account_cockpit_view",
        "data": {
            "executive_summary": [""],
            "key_highlights": [""],
            "key_metrics": [""],
            "risks": [""],
            "opportunities": [""],
        },
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
