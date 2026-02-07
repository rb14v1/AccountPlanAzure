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
                {"id": "1",  "name": "Secured Order Book",  "v1": "", "v2": "", "v3": "", "v4": ""},
                {"id": "1a", "name": "- Gross Order Book",  "v1": "", "v2": "", "v3": "", "v4": "", "indent": True},
                {"id": "1b", "name": "- Expiry / run-off",  "v1": "", "v2": "", "v3": "", "v4": "", "indent": True},
                {"id": "2",  "name": "Open TCV",           "v1": "", "v2": "", "v3": "", "v4": ""},
                {"id": "3",  "name": "Win Rate (%)",       "v1": "", "v2": "", "v3": "", "v4": ""},
                {"id": "4",  "name": "NRR (%)",            "v1": "", "v2": "", "v3": "", "v4": ""},
                {"id": "5",  "name": "Revenue",            "v1": "", "v2": "", "v3": "", "v4": ""},
                {"id": "6",  "name": "Tech Spend",         "v1": "", "v2": "", "v3": "", "v4": ""},
                {"id": "7",  "name": "Propensity to Buy",  "v1": "", "v2": "", "v3": "", "v4": ""},
            ],
            "serviceLines": [
                {"name": "Cloud",        "pos": 0, "penetration": "", "revenue": "", "techSpend": "", "propensity": ""},
                {"name": "Data",         "pos": 0, "penetration": "", "revenue": "", "techSpend": "", "propensity": ""},
                {"name": "Engineering",  "pos": 0, "penetration": "", "revenue": "", "techSpend": "", "propensity": ""},
                {"name": "Security",     "pos": 0, "penetration": "", "revenue": "", "techSpend": "", "propensity": ""},
            ],
        },
    },

    # ---------------------------------------------------------
    # Growth Strategy
    # ---------------------------------------------------------
    "growth_strategy": {
        "template_type": "growth_strategy",
        "data": {
            "growth_aspiration": [""],
            "key_vectors_for_driving_growth": [""],
            "improve_quality_sustainability_revenues": [""],
            "potential_inorganic_opportunities": [""],
        },
    },

    # ---------------------------------------------------------
    # Customer Profile
    # ---------------------------------------------------------
    "customer_profile": {
        "template_type": "customer_profile",
        "data": {
            "client_overview": [""],
            "products_and_services": [""],
            "key_stakeholders": [""],
            "org_structure": [""],
            "geographies": [""],
            "key_competitors": [""],
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
            "objectives": [""],
            "key_initiatives": [""],
            "milestones": [""],
            "dependencies": [""],
            "risks_and_mitigations": [""],
        },
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
    # Tech Spend View
    # ---------------------------------------------------------
    "tech_spend_view": {
        "template_type": "tech_spend_view",
        "data": {
            "current_tech_spend": [""],
            "spend_breakdown": [""],
            "key_vendors": [""],
            "opportunities_to_optimize": [""],
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
