export class RateLimiter {
  private timestamps: number[] = [];
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 10) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  private cleanup() {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(
      timestamp => now - timestamp < this.windowMs
    );
  }

  public tryRequest(): boolean {
    this.cleanup();
    
    if (this.timestamps.length >= this.maxRequests) {
      return false;
    }

    this.timestamps.push(Date.now());
    return true;
  }

  public getNextAllowedTime(): number {
    if (this.timestamps.length === 0) return 0;
    return this.timestamps[0] + this.windowMs;
  }
}
