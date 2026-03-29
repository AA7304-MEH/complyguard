/**
 * In-memory Rate Limiter for Gemini API Pro (Free Tier)
 * Limit: 2 requests per minute
 */
class RateLimiter {
    private lastRequestTime: number = 0;
    private requestCount: number = 0;
    private readonly LIMIT = 2;
    private readonly WINDOW_MS = 60 * 1000;

    constructor() {
        this.resetCounter();
    }

    private resetCounter() {
        setInterval(() => {
            console.log("[RateLimiter] Resetting counter.");
            this.requestCount = 0;
        }, this.WINDOW_MS);
    }

    public canMakeRequest(): boolean {
        const now = Date.now();
        // If we haven't reached the limit in the current window
        if (this.requestCount < this.LIMIT) {
            return true;
        }
        return false;
    }

    public recordRequest(): void {
        this.requestCount++;
        this.lastRequestTime = Date.now();
        console.log(`[RateLimiter] Request recorded. Count: ${this.requestCount}/${this.LIMIT}`);
    }

    public getStatus() {
        return {
            count: this.requestCount,
            limit: this.LIMIT,
            remaining: Math.max(0, this.LIMIT - this.requestCount)
        };
    }
}

// Singleton instance
export const rateLimiter = new RateLimiter();
