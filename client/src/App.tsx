import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { MainLayout } from './layouts/MainLayout';
import { TasksPage } from './pages/TasksPage';
import { SonamPage } from './pages/SonamPage';
import { SettingsPage } from './pages/SettingsPage';
import { Dashboard } from './pages/Dashboard';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/tasks" replace />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/calendar" element={<Dashboard />} />
            <Route path="/sonam" element={<SonamPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/tasks" replace />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
