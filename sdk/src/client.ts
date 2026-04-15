import { FeatureFlagOptions, EvalResult, BulkEvalResponse, SdkFlagsResponse } from './types';

export class FeatureFlagClient {
  private apiUrl: string;
  private apiKey: string;
  private userId: string;
  private userAttributes: Record<string, string>;
  private refreshIntervalMs: number;
  private onFlagsUpdate?: (flags: Record<string, boolean>) => void;
  
  private flagCache: Map<string, EvalResult>;
  private pollingIntervalId?: ReturnType<typeof setInterval>;
  private isInitialized: boolean = false;

  constructor(options: FeatureFlagOptions) {
    this.apiUrl = options.apiUrl.replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.userId = options.userId;
    this.userAttributes = options.userAttributes || {};
    this.refreshIntervalMs = options.refreshIntervalMs || 30000;
    this.onFlagsUpdate = options.onFlagsUpdate;
    this.flagCache = new Map();
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    await this.fetchFlags();
    
    this.pollingIntervalId = setInterval(() => {
      this.fetchFlags().catch(console.error);
    }, this.refreshIntervalMs);

    this.isInitialized = true;
  }

  public isEnabled(key: string): boolean {
    const cached = this.flagCache.get(key);
    if (!cached) return false; // Fail closed
    return cached.enabled;
  }

  public async isEnabledAsync(key: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify({
          flagKey: key,
          userId: this.userId,
          userAttributes: this.userAttributes,
        }),
      });

      if (!response.ok) {
        return this.isEnabled(key); // Fallback to cache
      }

      const body = await response.json();
      if (body.success && body.data) {
        this.flagCache.set(key, body.data);
        return body.data.enabled;
      }

      return this.isEnabled(key);
    } catch (e) {
      return this.isEnabled(key); // Fail closed but gracefully use cache if available
    }
  }

  public getAllFlags(): Record<string, boolean> {
    const flags: Record<string, boolean> = {};
    for (const [key, result] of this.flagCache.entries()) {
      flags[key] = result.enabled;
    }
    return flags;
  }

  public destroy(): void {
    if (this.pollingIntervalId) {
      clearInterval(this.pollingIntervalId);
    }
    this.flagCache.clear();
    this.isInitialized = false;
  }

  private async fetchFlags(): Promise<void> {
    try {
      // 1. Get all flag keys
      const keysRes = await fetch(`${this.apiUrl}/api/v1/sdk/flags`, {
        headers: { 'X-API-Key': this.apiKey }
      });
      
      if (!keysRes.ok) return; // Silent fail, relying on next poll
      
      const keysData: SdkFlagsResponse = await keysRes.json();
      if (!keysData.success || !keysData.data.flagKeys.length) return;

      // 2. Fetch bulk eval
      const bulkRes = await fetch(`${this.apiUrl}/api/v1/evaluate/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify({
          userId: this.userId,
          userAttributes: this.userAttributes,
          flagKeys: keysData.data.flagKeys,
        }),
      });

      if (!bulkRes.ok) return;

      const bulkData: BulkEvalResponse = await bulkRes.json();
      if (bulkData.success && bulkData.data) {
        const hasChanges = this.updateCache(bulkData.data);
        if (hasChanges && this.onFlagsUpdate) {
          this.onFlagsUpdate(this.getAllFlags());
        }
      }
    } catch (err) {
      // Background poll failure should be silent, network might be temporarily down
    }
  }

  private updateCache(newData: Record<string, EvalResult>): boolean {
    let changed = false;
    
    // Check for new/updated keys
    for (const [key, value] of Object.entries(newData)) {
      const existing = this.flagCache.get(key);
      if (!existing || existing.enabled !== value.enabled) {
        changed = true;
      }
      this.flagCache.set(key, value);
    }

    // Check for removed keys
    for (const key of this.flagCache.keys()) {
      if (!(key in newData)) {
        this.flagCache.delete(key);
        changed = true;
      }
    }

    return changed;
  }
}
