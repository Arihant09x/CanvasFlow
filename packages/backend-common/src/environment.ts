let envVars: any = {};

if (
  typeof process !== "undefined" &&
  process.versions &&
  process.versions.node
) {
  // Node.js environment (backend)
  const dotenv = require("dotenv");
  const path = require("path");
  dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
  envVars = process.env;
} else if (typeof window !== "undefined") {
  // Browser environment (frontend)
  envVars = (window as any).ENV || {};
}

interface Environment {
  MONGO_URI?: string;
  JWT_SECRET?: string;
  NEXT_PUBLIC_BACKEND_URL?: string;
  NEXT_PUBLIC_WS_URL?: string;
}

export const env: Environment = {
  MONGO_URI: envVars.MONGO_URI || "",
  JWT_SECRET: envVars.JWT_SECRET || "",
  NEXT_PUBLIC_BACKEND_URL: envVars.NEXT_PUBLIC_BACKEND_URL || "",
  NEXT_PUBLIC_WS_URL: envVars.NEXT_PUBLIC_WS_URL || "",
};
