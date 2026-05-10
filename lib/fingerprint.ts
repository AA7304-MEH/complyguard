
export class FingerprintService {
  private static STORAGE_KEY = 'cg_device_id';

  static getDeviceId(): string {
    let deviceId = localStorage.getItem(this.STORAGE_KEY);
    if (!deviceId) {
      deviceId = this.generateId();
      localStorage.setItem(this.STORAGE_KEY, deviceId);
    }
    return deviceId;
  }

  private static generateId(): string {
    const parts = [
      navigator.userAgent,
      navigator.language,
      new Date().getTimezoneOffset(),
      window.screen.width + 'x' + window.screen.height,
      window.screen.colorDepth,
      navigator.hardwareConcurrency,
      navigator.deviceMemory,
    ];
    
    const str = parts.join('|');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    
    return 'dev_' + Math.abs(hash).toString(36) + '_' + Math.random().toString(36).substring(2, 9);
  }
}
