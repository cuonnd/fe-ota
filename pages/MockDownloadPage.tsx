import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useProjects } from "../contexts/ProjectsContext";
import { AppVersion, Project } from "../types";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from "../components/common/Icons";

export const MockDownloadPage: React.FC = () => {
  const { projectId, versionId } = useParams<{
    projectId: string;
    versionId: string;
  }>();
  const { getProjectById } = useProjects();
  const [message, setMessage] = useState<string>(
    "Processing your mock download..."
  );
  const [project, setProject] = useState<Project | null>(null);
  const [version, setVersion] = useState<AppVersion | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectId && versionId) {
      const currentProject = getProjectById(projectId);
      if (currentProject) {
        setProject(currentProject);
        const currentVersion = currentProject.versions.find(
          (v) => v.id === versionId
        );
        if (currentVersion) {
          setVersion(currentVersion);
          setError(null);
        } else {
          setError(
            `Version with ID "${versionId}" not found in project "${currentProject.name}".`
          );
        }
      } else {
        setError(`Project with ID "${projectId}" not found.`);
      }
    }
  }, [projectId, versionId, getProjectById]);

  useEffect(() => {
    if (project && version && !error) {
      try {
        const dummyContent = `This is a mock download for the file: ${
          version.fileName
        }
Version: ${version.versionName} (Build: ${version.buildNumber})
Platform: ${version.platform}
Project: ${project.name}
Upload Date: ${new Date(version.uploadDate).toLocaleString()}

This is a placeholder file. Actual app binary is not available in this demo.
`;
        const blob = new Blob([dummyContent], {
          type: "text/plain;charset=utf-8",
        });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = version.fileName; // Use the original file name
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        setMessage(
          `Mock download for "${version.fileName}" has been initiated.`
        );
      } catch (e) {
        console.error("Error triggering mock download:", e);
        setError(`Failed to initiate mock download for "${version.fileName}".`);
      }
    }
  }, [project, version, error]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-800 rounded-lg shadow-xl">
        <XCircleIcon className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-semibold text-red-400 mb-2">
          Download Error
        </h1>
        <p className="text-slate-300 mb-6">{error}</p>
        <Link
          to={project ? `/project/${project.id}` : "/dashboard"}
          className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors flex items-center"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Go Back
        </Link>
      </div>
    );
  }

  if (!project || (!version && !error)) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-800 rounded-lg shadow-xl">
        <InformationCircleIcon className="h-16 w-16 text-sky-500 mb-4" />
        <h1 className="text-2xl font-semibold text-slate-100 mb-2">
          Loading Download...
        </h1>
        <p className="text-slate-300 mb-6">{message}</p>
        <div role="status" className="mt-4">
          <svg
            aria-hidden="true"
            className="w-8 h-8 text-slate-500 animate-spin fill-sky-500"
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
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-800 rounded-lg shadow-xl">
      <CheckCircleIcon className="h-16 w-16 text-green-500 mb-4" />
      <h1 className="text-2xl font-semibold text-slate-100 mb-2">
        Mock Download Initiated
      </h1>
      <p className="text-slate-300 mb-6">{message}</p>
      <p className="text-xs text-slate-400 mb-6">
        If the download didn't start, please ensure your browser allows pop-ups
        or automatic downloads from this site.
      </p>
      <Link
        to={`/project/${project.id}`}
        className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors flex items-center"
      >
        <ArrowLeftIcon className="h-5 w-5 mr-2" />
        Back to Project Details
      </Link>
    </div>
  );
};
