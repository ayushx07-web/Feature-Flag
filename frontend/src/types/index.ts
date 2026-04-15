export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  apiKey: string;
  createdAt: string;
  flagsCount: number;
}

export interface TargetingRule {
  id: string;
  attribute: string;
  operator: string;
  value: string;
  ruleValue: boolean;
  priority: number;
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  rules: TargetingRule[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  flagId: string | null;
  changedByEmail: string;
  oldValue: Record<string, any> | null;
  newValue: Record<string, any> | null;
  createdAt: string;
}
