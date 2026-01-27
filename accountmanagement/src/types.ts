// src/types.ts

export interface PlaybackData {
  meta: {
    subSectorName: string;
    playbackDate: string;
    headlineTargetMillions: number;
  };
  pipeline: {
    pipelineCoverage: number;
  };
}

// --- NEW INTERFACES START HERE ---

export interface ServiceLineItem {
  Objective: string;
  Target_Buying_Centres: string;
  Current_Status: string;
  Next_Action_and_Responsible_Person: string;
}

export interface ServiceLineGrowthData {
  Service_Line_Growth_Actions: {
    [key: string]: ServiceLineItem; 
    Cloud_Transformation: ServiceLineItem;
    Data: ServiceLineItem;
    AI: ServiceLineItem;
    SRG_Managed_Services: ServiceLineItem;
    EA: ServiceLineItem;
    Strategy_Design_and_Change: ServiceLineItem;
    SAM_and_Licensing: ServiceLineItem;
  };
}

export interface PodMember {
  Accountable_POC: string;
  Time_Commitment: string;
}

export interface AccountTeamPodData {
  Account_Team_POD: {
    Sales_and_Delivery_Leads: {
      [key: string]: PodMember;
      Client_Partner: PodMember;
      Delivery_Manager: PodMember;
      Digital_and_Cloud_POC: PodMember;
      SRG_POC: PodMember;
      EA_POC: PodMember;
      Data_POC: PodMember;
    };
    Functional_POCs: {
      [key: string]: PodMember;
      Presales_Lead: PodMember;
      Marketing_POC: PodMember;
      Partnerships_POC: PodMember;
      AI_and_Innovation_Lead: PodMember;
      Delivery_Excellence_Lead: PodMember;
      Talent_Supply_Chain_POC: PodMember;
      L_and_D_Lead: PodMember;
    };
  };
}