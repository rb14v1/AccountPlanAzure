import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { AccountTeamPodData, ServiceLineGrowthData } from '../types';

// Define what the global store looks like
interface DataContextType {
  // We allow any key to be stored, but we specifically type the ones we know
  globalData: {
    Account_Team_POD?: AccountTeamPodData['Account_Team_POD'];
    Service_Line_Growth_Actions?: ServiceLineGrowthData['Service_Line_Growth_Actions'];
    [key: string]: any; // Allow other templates to be added dynamically
  };
  setGlobalData: (data: any) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [globalData, setGlobalData] = useState<DataContextType['globalData']>({});

  return (
    <DataContext.Provider value={{ globalData, setGlobalData }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};