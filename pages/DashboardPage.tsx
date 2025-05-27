import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useProjects } from "../contexts/ProjectsContext";
import { Project, Platform } from "../types";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import { Input } from "../components/common/Input";
import {
  PlusIcon,
  CubeTransparentIcon,
  TrashIcon,
  EyeIcon,
  InformationCircleIcon,
} from "../components/common/Icons"; // Added InformationCircleIcon

export const DashboardPage: React.FC = () => {
  const { projects, addProject, deleteProject, loading, error, fetchProjects } =
    useProjects();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);

  // useEffect(() => {
  //   // Initial fetch is handled by context provider
  //   // fetchProjects(); // If you want to re-fetch on dashboard mount specifically
  // }, [fetchProjects]);

  const handleCreateProject = async () => {
    if (newProjectName.trim() && selectedPlatforms.length > 0) {
      const success = await addProject(
        newProjectName,
        newProjectDescription,
        selectedPlatforms
      );
      if (success) {
        setNewProjectName("");
        setNewProjectDescription("");
        setSelectedPlatforms([]);
        setIsModalOpen(false);
      } else {
        // Error is handled by context and displayed globally or locally
        alert("Failed to create project. Check console or error display.");
      }
    } else {
      alert("Project name and at least one platform are required.");
    }
  };

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const getPlatformBadgeColor = (platform: Platform) => {
    switch (platform) {
      case Platform.Android:
        return "bg-green-500 text-green-50";
      case Platform.iOS:
        return "bg-blue-500 text-blue-50";
      default:
        return "bg-gray-500 text-gray-50";
    }
  };

  if (loading && projects.length === 0) {
    // Show loading only on initial load or if projects are empty
    return (
      <div className="flex justify-center items-center h-64">
        <div role="status">
          <svg
            aria-hidden="true"
            className="w-10 h-10 text-slate-500 animate-spin fill-sky-500"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="currentColor"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0492C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentFill"
            />
          </svg>
          <span className="sr-only">Loading projects...</span>
        </div>
        <p className="ml-3 text-slate-300">Loading projects...</p>
      </div>
    );
  }

  if (error && projects.length === 0) {
    // Show error only if projects couldn't be loaded at all
    return (
      <div className="text-center py-10 bg-slate-800 rounded-lg shadow">
        <InformationCircleIcon className="h-16 w-16 mx-auto text-red-500 mb-4" />
        <p className="text-red-400 text-lg">Error loading projects: {error}</p>
        <Button
          onClick={() => fetchProjects()}
          variant="primary"
          className="mt-4"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-100">
          Projects Dashboard
        </h1>
        <Button
          onClick={() => setIsModalOpen(true)}
          variant="primary"
          className="flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>New Project</span>
        </Button>
      </div>

      {/* Global error display from context, if any, for non-initial load errors */}
      {error && (
        <div
          className="p-4 mb-4 text-sm text-red-200 bg-red-800 rounded-lg"
          role="alert"
        >
          {error}
        </div>
      )}

      {!loading &&
        projects.length === 0 &&
        !error && ( // Show this only if not loading, no projects, and no initial error
          <div className="text-center py-10 bg-slate-800 rounded-lg shadow">
            <CubeTransparentIcon className="h-16 w-16 mx-auto text-slate-500 mb-4" />
            <p className="text-slate-400 text-lg">
              No projects yet. Create one to get started!
            </p>
          </div>
        )}

      {projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: Project) => (
            <div
              key={project._id}
              className="bg-slate-800 p-6 rounded-lg shadow-lg hover:shadow-sky-500/30 transition-shadow duration-300 flex flex-col justify-between"
            >
              <div>
                <h2 className="text-xl font-semibold text-sky-400 mb-2">
                  {project.name}
                </h2>
                <p className="text-slate-400 text-sm mb-3 h-12 overflow-hidden">
                  {project.description || "No description."}
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {project.platforms.map((platform) => (
                    <span
                      key={platform}
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getPlatformBadgeColor(
                        platform
                      )}`}
                    >
                      {platform}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mb-1">
                  Versions: {project.versions?.length || 0}
                </p>
                <p className="text-xs text-slate-500">
                  Created: {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="mt-4 flex justify-end space-x-3">
                <Link to={`/project/${project._id}`}>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex items-center space-x-1.5"
                  >
                    <EyeIcon className="h-4 w-4" />
                    <span>View</span>
                  </Button>
                </Link>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={async () => {
                    if (
                      window.confirm(
                        `Are you sure you want to delete project "${project.name}"?`
                      )
                    ) {
                      await deleteProject(project._id);
                    }
                  }}
                  className="flex items-center space-x-1.5"
                >
                  <TrashIcon className="h-4 w-4" />
                  <span>Delete</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Project"
      >
        <div className="space-y-4">
          <Input
            label="Project Name"
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="My Awesome App"
            className="bg-slate-700 border-slate-600 text-slate-100"
          />
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Description (Optional)
          </label>
          <textarea
            value={newProjectDescription}
            onChange={(e) => setNewProjectDescription(e.target.value)}
            placeholder="A brief description of your project"
            rows={3}
            className="w-full p-2 rounded-md bg-slate-700 border border-slate-600 focus:ring-sky-500 focus:border-sky-500 text-slate-100 placeholder-slate-400"
          />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Platforms
            </label>
            <div className="flex space-x-4">
              {(Object.keys(Platform) as Array<keyof typeof Platform>).map(
                (key) => (
                  <label
                    key={Platform[key]}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPlatforms.includes(Platform[key])}
                      onChange={() => togglePlatform(Platform[key])}
                      className="form-checkbox h-5 w-5 text-sky-500 bg-slate-600 border-slate-500 rounded focus:ring-sky-500"
                    />
                    <span className="text-slate-200">{Platform[key]}</span>
                  </label>
                )
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateProject}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
