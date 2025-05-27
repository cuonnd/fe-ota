import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useProjects } from "../contexts/ProjectsContext";
import { Project, AppVersion, Platform, DeploymentEnvironment } from "../types";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import { Input } from "../components/common/Input";
import { Select } from "../components/common/Select";
import {
  ArrowLeftIcon,
  PlusIcon,
  UploadIcon,
  QrCodeIcon,
  TrashIcon,
  SparklesIcon,
  InformationCircleIcon,
} from "../components/common/Icons";
import { QRCodeSVG } from "qrcode.react";
import { generateReleaseNotes as fetchGeneratedReleaseNotes } from "../services/geminiService";

const getPlatformBadgeColor = (platform: Platform) => {
  switch (platform) {
    case Platform.Android:
      return "bg-green-600 text-green-50";
    case Platform.iOS:
      return "bg-blue-600 text-blue-50";
    default:
      return "bg-gray-600 text-gray-50";
  }
};

const getEnvironmentBadgeColor = (env: DeploymentEnvironment) => {
  switch (env) {
    case DeploymentEnvironment.Development:
      return "bg-purple-600 text-purple-50";
    case DeploymentEnvironment.Staging:
      return "bg-yellow-500 text-yellow-50";
    case DeploymentEnvironment.Production:
      return "bg-red-600 text-red-50";
    default:
      return "bg-slate-600 text-slate-50";
  }
};

export const ProjectDetailsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const {
    getProjectById,
    addAppVersion,
    deleteAppVersion,
    updateVersionEnvironments,
    loading: contextLoading,
    error: contextError,
    fetchProjects, // To potentially re-fetch if needed
  } = useProjects();

  const [project, setProject] = useState<Project | null>(null);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [currentQrValueForModal, setCurrentQrValueForModal] = useState("");

  const [newVersionPlatform, setNewVersionPlatform] = useState<Platform>(
    Platform.Android
  );
  const [newVersionName, setNewVersionName] = useState("");
  const [newBuildNumber, setNewBuildNumber] = useState("");
  const [newReleaseNotes, setNewReleaseNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      const currentProject = getProjectById(projectId);
      setProject(currentProject ?? null);
      if (currentProject && currentProject.platforms.length > 0) {
        setNewVersionPlatform(currentProject.platforms[0]);
      }
    }
    setPageLoading(contextLoading); // Align page loading with context loading initially
  }, [projectId, getProjectById, contextLoading]);

  // If project is not found after context has loaded, it might be a direct link access
  // or data is not available yet, trigger a fetch.
  useEffect(() => {
    if (!project && projectId && !contextLoading && !contextError) {
      // This implies the project might not be in the initial list fetched by context,
      // or a direct navigation occurred. Fetching all projects again,
      // or having a getProjectByIdAPI in context would be better.
      // For now, let's rely on getProjectById from already fetched projects.
      // If it's still null, the "Project not found" message will show.
      const currentProject = getProjectById(projectId);
      if (currentProject) {
        setProject(currentProject);
        if (currentProject.platforms.length > 0) {
          setNewVersionPlatform(currentProject.platforms[0]);
        }
      }
    }
  }, [
    project,
    projectId,
    contextLoading,
    contextError,
    getProjectById,
    fetchProjects,
  ]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const generateReleaseNotes = useCallback(async () => {
    if (!project || !selectedFile) {
      alert("Please select a file and ensure project details are loaded.");
      return;
    }
    setIsGeneratingNotes(true);
    try {
      const notes = await fetchGeneratedReleaseNotes(
        `Generate concise and informative release notes for an app update.
            Project: ${project.name}
            Platform: ${newVersionPlatform}
            Version: ${newVersionName} (Build: ${newBuildNumber})
            File: ${selectedFile.name}
            Focus on key new features, bug fixes, and improvements. Be brief.`
      );
      setNewReleaseNotes(notes);
    } catch (error) {
      console.error("Error generating release notes:", error);
      alert(
        "Failed to generate release notes. Please try again or write them manually."
      );
      setNewReleaseNotes(
        "Automated release notes generation failed. Please write manually."
      );
    } finally {
      setIsGeneratingNotes(false);
    }
  }, [
    project,
    selectedFile,
    newVersionPlatform,
    newVersionName,
    newBuildNumber,
  ]);

  const handleAddVersion = async () => {
    if (
      !project ||
      !selectedFile ||
      !newVersionName.trim() ||
      !newBuildNumber.trim()
    ) {
      alert("Please fill all required fields and select a file.");
      return;
    }

    const versionData = {
      platform: newVersionPlatform,
      versionName: newVersionName,
      buildNumber: newBuildNumber,
      fileName: selectedFile.name, // Backend will also use this
      releaseNotes: newReleaseNotes,
      // _id, uploadDate, downloadUrl, qrCodeValue, fileSize, filePath, activeEnvironments are set by backend/context
    };

    // We pass Omit<AppVersion, ...> which matches the versionData structure.
    const addedVersion = await addAppVersion(
      project._id,
      versionData,
      selectedFile
    );

    if (addedVersion) {
      setNewVersionName("");
      setNewBuildNumber("");
      setNewReleaseNotes("");
      setSelectedFile(null);
      if (project.platforms.length > 0) {
        setNewVersionPlatform(project.platforms[0]);
      }
      setIsUploadModalOpen(false);
      // Project state in context is updated, which should trigger re-render.
      // Fetch the updated project from context to refresh local state if necessary
      const updatedProj = getProjectById(project._id);
      if (updatedProj) setProject(updatedProj);
    } else {
      alert("Failed to add new version. Check console for errors.");
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (
      !project ||
      !window.confirm("Are you sure you want to delete this version?")
    )
      return;

    const success = await deleteAppVersion(project._id, versionId);
    if (success) {
      const updatedProj = getProjectById(project._id);
      if (updatedProj) setProject(updatedProj);
    } else {
      alert("Failed to delete version. Check console for errors.");
    }
  };

  const toggleVersionEnvironment = async (
    versionId: string,
    environment: DeploymentEnvironment
  ) => {
    if (!project) return;

    const targetVersion = project.versions.find((v) => v._id === versionId);
    if (!targetVersion) return;

    let newActiveEnvironments: DeploymentEnvironment[];

    const isCurrentlyActive =
      targetVersion.activeEnvironments.includes(environment);

    if (isCurrentlyActive) {
      // If want to deactivate
      newActiveEnvironments = targetVersion.activeEnvironments.filter(
        (e) => e !== environment
      );
    } else {
      // If want to activate
      // Deactivate this environment for all other versions of the same platform
      const updatedVersionsForProject = project.versions.map((v) => {
        if (v.platform === targetVersion.platform && v._id !== versionId) {
          return {
            ...v,
            activeEnvironments: v.activeEnvironments.filter(
              (e) => e !== environment
            ),
          };
        }
        return v;
      });
      // Now set for the target version
      newActiveEnvironments = [
        ...targetVersion.activeEnvironments,
        environment,
      ];

      // If you were to update the whole project structure first
      // const tempProject = {...project, versions: updatedVersionsForProject};
      // Then apply to target version within that structure.
      // For now, direct call:
    }

    const updatedVersion = await updateVersionEnvironments(
      project._id,
      versionId,
      newActiveEnvironments
    );
    if (updatedVersion) {
      const updatedProj = getProjectById(project._id); // Re-fetch project to get all changes
      if (updatedProj) setProject(updatedProj);
    } else {
      alert("Failed to update environment. Check console for errors.");
    }
  };

  const openQrModal = (qrValue: string) => {
    setCurrentQrValueForModal(qrValue); // This is already the full URL from backend
    setIsQrModalOpen(true);
  };

  if (pageLoading) {
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
        </div>
        <p className="ml-3 text-slate-300">Loading project details...</p>
      </div>
    );
  }

  if (!project && !pageLoading) {
    // Ensure not loading before saying "not found"
    return (
      <div className="text-center py-10">
        <InformationCircleIcon className="h-12 w-12 mx-auto text-sky-500 mb-4" />
        <p className="text-slate-300 text-xl">Project not found.</p>
        {contextError && (
          <p className="text-red-400 mt-2">Error: {contextError}</p>
        )}
        <Link
          to="/dashboard"
          className="mt-4 inline-block text-sky-400 hover:text-sky-300"
        >
          <ArrowLeftIcon className="h-5 w-5 inline mr-1" /> Go back to Dashboard
        </Link>
      </div>
    );
  }

  if (!project) return null; // Should be caught by above conditions

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <Link
            to="/dashboard"
            className="text-sm text-sky-400 hover:text-sky-300 flex items-center mb-2"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to Projects
          </Link>
          <h1 className="text-3xl font-bold text-slate-100">{project.name}</h1>
          <p className="text-slate-400 mt-1">{project.description}</p>
          <div className="mt-2 flex space-x-2">
            {project.platforms.map((p) => (
              <span
                key={p}
                className={`px-3 py-1 text-xs font-semibold rounded-full ${getPlatformBadgeColor(
                  p
                )}`}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
        <Button
          onClick={() => setIsUploadModalOpen(true)}
          variant="primary"
          className="flex items-center space-x-2"
        >
          <UploadIcon className="h-5 w-5" />
          <span>Upload New Version</span>
        </Button>
      </div>

      {/* Global error display from context */}
      {contextError && (
        <div
          className="p-4 mb-4 text-sm text-red-200 bg-red-800 rounded-lg"
          role="alert"
        >
          {contextError}
        </div>
      )}

      <div className="bg-slate-800 shadow-xl rounded-lg overflow-hidden">
        <h2 className="text-xl font-semibold text-slate-200 p-6 border-b border-slate-700">
          App Versions
        </h2>
        {(project.versions?.length || 0) === 0 ? (
          <p className="text-slate-400 p-6 text-center">
            No versions uploaded yet for this project.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-slate-700/50">
                <tr>
                  {[
                    "Platform",
                    "Version",
                    "Build",
                    "File",
                    "Size",
                    "Uploaded",
                    "Environments",
                    "Actions",
                  ].map((header) => (
                    <th
                      key={header}
                      className="p-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {project.versions.map((version) => (
                  <tr
                    key={version._id}
                    className="hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getPlatformBadgeColor(
                          version.platform
                        )}`}
                      >
                        {version.platform}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap text-sm text-slate-200">
                      {version.versionName}
                    </td>
                    <td className="p-4 whitespace-nowrap text-sm text-slate-300">
                      {version.buildNumber}
                    </td>
                    <td
                      className="p-4 whitespace-nowrap text-sm text-slate-300 truncate max-w-xs"
                      title={version.fileName}
                    >
                      {version.fileName}
                    </td>
                    <td className="p-4 whitespace-nowrap text-sm text-slate-300">
                      {version.fileSize}
                    </td>
                    <td className="p-4 whitespace-nowrap text-sm text-slate-300">
                      {new Date(version.uploadDate).toLocaleDateString()}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex space-x-1">
                        {(
                          Object.values(
                            DeploymentEnvironment
                          ) as DeploymentEnvironment[]
                        ).map((env) => {
                          const isActive =
                            version.activeEnvironments.includes(env);
                          return (
                            <button
                              key={env}
                              title={
                                isActive
                                  ? `Active in ${env}`
                                  : `Set active for ${env} (will deactivate for other versions on this platform if applicable)`
                              }
                              onClick={() =>
                                toggleVersionEnvironment(version._id, env)
                              }
                              className={`px-2 py-1 text-xs font-semibold rounded-full transition-all duration-200
                                    ${
                                      isActive
                                        ? getEnvironmentBadgeColor(env)
                                        : "bg-slate-600 text-slate-300 hover:bg-slate-500"
                                    }
                                    ${
                                      isActive
                                        ? "ring-2 ring-offset-2 ring-offset-slate-800"
                                        : ""
                                    } 
                                    ${
                                      isActive &&
                                      env === DeploymentEnvironment.Development
                                        ? "ring-purple-400"
                                        : ""
                                    }
                                    ${
                                      isActive &&
                                      env === DeploymentEnvironment.Staging
                                        ? "ring-yellow-300"
                                        : ""
                                    }
                                    ${
                                      isActive &&
                                      env === DeploymentEnvironment.Production
                                        ? "ring-red-400"
                                        : ""
                                    }
                                `}
                            >
                              {env.substring(0, 1)}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="p-4 whitespace-nowrap text-sm space-x-2">
                      <a
                        href={version.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-400 hover:text-sky-300 font-medium"
                        title="Download File"
                      >
                        Download
                      </a>
                      <button
                        onClick={() => openQrModal(version.qrCodeValue)}
                        className="text-sky-400 hover:text-sky-300"
                        title="Show QR Code"
                      >
                        <QrCodeIcon className="h-5 w-5 inline" />
                      </button>
                      <button
                        onClick={() =>
                          alert(
                            version.releaseNotes ||
                              "No release notes for this version."
                          )
                        }
                        className="text-slate-400 hover:text-slate-200"
                        title="View Release Notes"
                      >
                        <InformationCircleIcon className="h-5 w-5 inline" />
                      </button>
                      <button
                        onClick={() => handleDeleteVersion(version._id)}
                        className="text-red-500 hover:text-red-400"
                        title="Delete Version"
                      >
                        <TrashIcon className="h-5 w-5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload New App Version"
      >
        <div className="space-y-4">
          <Select
            label="Platform"
            value={newVersionPlatform}
            onChange={(e) => setNewVersionPlatform(e.target.value as Platform)}
            options={project.platforms.map((p) => ({ value: p, label: p }))}
            className="bg-slate-700 border-slate-600 text-slate-100"
          />
          <Input
            label="Version Name (e.g., 1.0.0)"
            type="text"
            value={newVersionName}
            onChange={(e) => setNewVersionName(e.target.value)}
            placeholder="1.0.0"
            className="bg-slate-700 border-slate-600 text-slate-100"
          />
          <Input
            label="Build Number (e.g., 101)"
            type="text"
            value={newBuildNumber}
            onChange={(e) => setNewBuildNumber(e.target.value)}
            placeholder="101"
            className="bg-slate-700 border-slate-600 text-slate-100"
          />
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              App File (APK/IPA)
            </label>
            <input
              type="file"
              onChange={handleFileUpload}
              className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-500 file:text-sky-50 hover:file:bg-sky-600"
              accept=".apk,.ipa"
            />
            {selectedFile && (
              <p className="text-xs text-slate-400 mt-1">
                {selectedFile.name} (
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Release Notes
            </label>
            <textarea
              value={newReleaseNotes}
              onChange={(e) => setNewReleaseNotes(e.target.value)}
              placeholder="Describe new features, bug fixes, etc."
              rows={4}
              className="w-full p-2 rounded-md bg-slate-700 border border-slate-600 focus:ring-sky-500 focus:border-sky-500 text-slate-100 placeholder-slate-400"
            />
            <Button
              onClick={generateReleaseNotes}
              variant="outline"
              size="sm"
              className="mt-2 flex items-center space-x-1.5"
              disabled={
                isGeneratingNotes ||
                !selectedFile ||
                !newVersionName ||
                !newBuildNumber ||
                contextLoading
              }
            >
              <SparklesIcon className="h-4 w-4" />
              <span>
                {isGeneratingNotes ? "Generating..." : "Generate with AI"}
              </span>
            </Button>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsUploadModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAddVersion}
              disabled={!selectedFile || isGeneratingNotes || contextLoading}
            >
              {contextLoading
                ? "Processing..."
                : isGeneratingNotes
                ? "Generating Notes..."
                : "Add Version"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title="App Download QR Code"
      >
        <div className="flex flex-col items-center p-4">
          {currentQrValueForModal ? (
            <QRCodeSVG
              value={currentQrValueForModal}
              size={256}
              level="H"
              bgColor="#1e293b"
              fgColor="#e2e8f0"
            />
          ) : (
            <p className="text-slate-400">No QR code value available.</p>
          )}
          <p
            className="mt-4 text-xs text-slate-500 break-all"
            title={currentQrValueForModal}
          >
            {currentQrValueForModal}
          </p>
          <Button
            variant="secondary"
            onClick={() => setIsQrModalOpen(false)}
            className="mt-6"
          >
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
};
