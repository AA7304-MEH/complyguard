/**
 * Simple In-Memory Rate Limiter for Gemini API
 * Tracks requests in a rolling 60-second window.
 * Default limit: 15 requests per minute (Gemini 1.5 Flash Free Tier)
 */

class RateLimiter {
    private lastRequestTimes: number[] = [];
    private readonly WINDOW_SIZE = 60000; // 1 minute in ms
    private readonly MAX_REQUESTS = 15;

    /**
     * Checks if a request can be made within the current rate limit window.
     */
    canMakeRequest(): boolean {
        this.cleanup();
        return this.lastRequestTimes.length < this.MAX_REQUESTS;
    }

    /**
     * Records a new request.
     */
    recordRequest() {
        this.lastRequestTimes.push(Date.now());
    }

    /**
     * Removes timestamps outside the current 60-second window.
     */
    private cleanup() {
        const now = Date.now();
        this.lastRequestTimes = this.lastRequestTimes.filter(
            time => now - time < this.WINDOW_SIZE
        );
    }

    /**
     * Gets current usage stats for debugging.
     */
    getStats() {
        this.cleanup();
        return {
            requestsInWindow: this.lastRequestTimes.length,
            limit: this.MAX_REQUESTS,
            remaining: this.MAX_REQUESTS - this.lastRequestTimes.length
        };
    }
}

export const rateLimiter = new RateLimiter();
