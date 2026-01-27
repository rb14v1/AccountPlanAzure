import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { TabProvider } from './context/TabContext'
// 1. Import the new provider
import { DataProvider } from './context/DataContext' 

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <DataProvider> 
        <TabProvider>
          <App />
        </TabProvider>
      </DataProvider>
    </AuthProvider>
  </React.StrictMode>,
)