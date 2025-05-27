import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { Project, Platform, AppVersion, DeploymentEnvironment } from "../types";
import { API_BASE_URL } from "../constants";

interface ProjectsContextType {
  projects: Project[];
  loading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  addProject: (
    name: string,
    description: string | undefined,
    platforms: Platform[]
  ) => Promise<Project | null>;
  deleteProject: (projectId: string) => Promise<boolean>;
  updateProjectDetails: (
    projectId: string,
    name: string,
    description: string | undefined,
    platforms: Platform[]
  ) => Promise<Project | null>;
  getProjectById: (projectId: string) => Project | undefined; // Can remain local if projects are all fetched
  addAppVersion: (
    projectId: string,
    versionData: Omit<
      AppVersion,
      | "_id"
      | "uploadDate"
      | "downloadUrl"
      | "qrCodeValue"
      | "fileSize"
      | "filePath"
      | "activeEnvironments"
    >,
    file: File
  ) => Promise<AppVersion | null>;
  deleteAppVersion: (projectId: string, versionId: string) => Promise<boolean>;
  updateVersionEnvironments: (
    projectId: string,
    versionId: string,
    activeEnvironments: DeploymentEnvironment[]
  ) => Promise<AppVersion | null>;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(
  undefined
);

export const ProjectsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const handleApiResponse = async (response: Response) => {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    return data;
  };

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/projects`);
      console.log("Fetching projects from API:", response);
      const apiResponse = await handleApiResponse(response);
      setProjects(apiResponse.data || []);
    } catch (e: any) {
      console.error("Failed to fetch projects:", e);
      setError(e.message || "Failed to fetch projects.");
      setProjects([]); // Clear projects on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const addProject = async (
    name: string,
    description: string | undefined,
    platforms: Platform[]
  ): Promise<Project | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, platforms }),
      });
      const apiResponse = await handleApiResponse(response);
      const newProject = apiResponse.data;
      setProjects((prev) => [...prev, newProject]);
      setLoading(false);
      return newProject;
    } catch (e: any) {
      console.error("Failed to add project:", e);
      setError(e.message || "Failed to add project.");
      setLoading(false);
      return null;
    }
  };

  const deleteProject = async (projectId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: "DELETE",
      });
      await handleApiResponse(response);
      setProjects((prev) => prev.filter((p) => p._id !== projectId));
      setLoading(false);
      return true;
    } catch (e: any) {
      console.error("Failed to delete project:", e);
      setError(e.message || "Failed to delete project.");
      setLoading(false);
      return false;
    }
  };

  const updateProjectDetails = async (
    projectId: string,
    name: string,
    description: string | undefined,
    platforms: Platform[]
  ): Promise<Project | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, platforms }),
      });
      const apiResponse = await handleApiResponse(response);
      const updatedProject = apiResponse.data;
      setProjects((prev) =>
        prev.map((p) => (p._id === projectId ? updatedProject : p))
      );
      setLoading(false);
      return updatedProject;
    } catch (e: any) {
      console.error("Failed to update project:", e);
      setError(e.message || "Failed to update project.");
      setLoading(false);
      return null;
    }
  };

  const getProjectById = useCallback(
    (projectId: string): Project | undefined => {
      return projects.find((p) => p._id === projectId);
    },
    [projects]
  );

  const addAppVersion = async (
    projectId: string,
    versionData: Omit<
      AppVersion,
      | "_id"
      | "uploadDate"
      | "downloadUrl"
      | "qrCodeValue"
      | "fileSize"
      | "filePath"
      | "activeEnvironments"
    >,
    file: File
  ): Promise<AppVersion | null> => {
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("appFile", file);
    formData.append("platform", versionData.platform);
    formData.append("versionName", versionData.versionName);
    formData.append("buildNumber", versionData.buildNumber);
    if (versionData.releaseNotes) {
      formData.append("releaseNotes", versionData.releaseNotes);
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${projectId}/versions`,
        {
          method: "POST",
          body: formData, // No 'Content-Type' header needed, browser sets it for FormData
        }
      );
      const apiResponse = await handleApiResponse(response);
      const newVersion = apiResponse.data;
      setProjects((prevProjects) =>
        prevProjects.map((p) => {
          if (p._id === projectId) {
            return {
              ...p,
              versions: [newVersion, ...(p.versions || [])].sort(
                (a, b) =>
                  new Date(b.uploadDate).getTime() -
                  new Date(a.uploadDate).getTime()
              ),
            };
          }
          return p;
        })
      );
      setLoading(false);
      return newVersion;
    } catch (e: any) {
      console.error("Failed to add app version:", e);
      setError(e.message || "Failed to add app version.");
      setLoading(false);
      return null;
    }
  };

  const deleteAppVersion = async (
    projectId: string,
    versionId: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${projectId}/versions/${versionId}`,
        { method: "DELETE" }
      );
      await handleApiResponse(response);
      setProjects((prevProjects) =>
        prevProjects.map((p) => {
          if (p._id === projectId) {
            return {
              ...p,
              versions: p.versions.filter((v) => v._id !== versionId),
            };
          }
          return p;
        })
      );
      setLoading(false);
      return true;
    } catch (e: any) {
      console.error("Failed to delete app version:", e);
      setError(e.message || "Failed to delete app version.");
      setLoading(false);
      return false;
    }
  };

  const updateVersionEnvironments = async (
    projectId: string,
    versionId: string,
    activeEnvironments: DeploymentEnvironment[]
  ): Promise<AppVersion | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${projectId}/versions/${versionId}/environments`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activeEnvironments }),
        }
      );
      const apiResponse = await handleApiResponse(response);
      const updatedVersion = apiResponse.data;
      setProjects((prevProjects) =>
        prevProjects.map((p) => {
          if (p._id === projectId) {
            return {
              ...p,
              versions: p.versions.map((v) =>
                v._id === versionId ? updatedVersion : v
              ),
            };
          }
          return p;
        })
      );
      setLoading(false);
      return updatedVersion;
    } catch (e: any) {
      console.error("Failed to update version environments:", e);
      setError(e.message || "Failed to update version environments.");
      setLoading(false);
      return null;
    }
  };

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        loading,
        error,
        fetchProjects,
        addProject,
        deleteProject,
        updateProjectDetails,
        getProjectById,
        addAppVersion,
        deleteAppVersion,
        updateVersionEnvironments,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
};

export const useProjects = (): ProjectsContextType => {
  const context = useContext(ProjectsContext);
  if (context === undefined) {
    throw new Error("useProjects must be used within a ProjectsProvider");
  }
  return context;
};
