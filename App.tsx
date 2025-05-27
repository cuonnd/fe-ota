import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { ProjectDetailsPage } from "./pages/ProjectDetailsPage";
// import { MockDownloadPage } from './pages/MockDownloadPage'; // Removed
import { ProjectsProvider } from "./contexts/ProjectsContext";

const App: React.FC = () => {
  return (
    <ProjectsProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route
              path="/project/:projectId"
              element={<ProjectDetailsPage />}
            />
            {/* <Route path="/app-downloads/:projectId/:versionId" element={<MockDownloadPage />} /> // Removed route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </ProjectsProvider>
  );
};

export default App;
