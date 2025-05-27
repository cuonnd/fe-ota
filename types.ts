export enum Platform {
  Android = "Android",
  iOS = "iOS",
}

export enum DeploymentEnvironment {
  Development = "Development",
  Staging = "Staging",
  Production = "Production",
}

export interface AppVersion {
  _id: string; // Changed from id
  platform: Platform;
  versionName: string;
  buildNumber: string;
  fileName: string;
  fileSize: string;
  uploadDate: string; // ISO string from backend
  releaseNotes?: string;
  downloadUrl: string; // Full URL from backend
  qrCodeValue: string; // Full URL or value for QR from backend
  filePath: string; // Relative path on server, from backend
  activeEnvironments: DeploymentEnvironment[];
}

export interface Project {
  _id: string; // Changed from id
  name: string;
  description?: string;
  createdAt: string; // ISO string from backend
  platforms: Platform[]; // For APK/IPA uploads
  versions: AppVersion[];
  // Fields for React Native bundle updates, if you integrate UI for them
  rnPlatforms?: ("android" | "ios")[];
  bundleUpdates?: BundleUpdate[];
}

export interface BundleUpdate {
  // For React Native Hot Updates
  _id: string;
  bundleVersion: string;
  platform: "android" | "ios";
  bundleUrl: string;
  bundleHash: string;
  fileName: string;
  fileSize: string;
  filePath: string;
  description?: string;
  isMandatory?: boolean;
  createdAt: string;
}

export interface GoogleSearchWebResult {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web?: GoogleSearchWebResult;
  retrievedContext?: {
    uri: string;
    title: string;
  };
}
