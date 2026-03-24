import { NativeModules } from "react-native";

const DEFAULT_PORT = "5000";

const getMetroHost = () => {
  const scriptURL = NativeModules.SourceCode?.scriptURL;

  if (!scriptURL) {
    return null;
  }

  const match = scriptURL.match(/https?:\/\/([^/:]+)(?::\d+)?/i);
  return match?.[1] || null;
};

const host = process.env.EXPO_PUBLIC_API_HOST || getMetroHost() || "localhost";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || `http://${host}:${DEFAULT_PORT}`;
