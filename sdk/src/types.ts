export interface FeatureFlagOptions {
  apiUrl: string;
  apiKey: string;
  userId: string;
  userAttributes?: Record<string, string>;
  refreshIntervalMs?: number; // Defaults to 30000
  onFlagsUpdate?: (flags: Record<string, boolean>) => void;
}

export interface EvalResult {
  flagKey: string;
  enabled: boolean;
  reason: string;
  ruleId?: string;
}

export interface BulkEvalResponse {
  success: boolean;
  data: Record<string, EvalResult>;
  error?: any;
}

export interface SdkFlagsResponse {
  success: boolean;
  data: {
    flagKeys: string[];
  };
  error?: any;
}
