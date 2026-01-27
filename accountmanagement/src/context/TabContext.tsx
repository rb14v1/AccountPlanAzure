import { createContext, useContext, useState } from "react";

type TabContextType = {
  activeTab: string;
  navigateTo: (tab: string) => void;
};

export const TabContext = createContext<TabContextType | null>(null);
export function TabProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<string>("upload");

  const navigateTo = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <TabContext.Provider value={{ activeTab, navigateTo }}>
      {children}
    </TabContext.Provider>
  );
}

export function useTab() {
  const ctx = useContext(TabContext);
  if (!ctx) {
    throw new Error("useTab must be used inside TabProvider");
  }
  return ctx;
}
