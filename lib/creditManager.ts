
import { FingerprintService } from './fingerprint';

export class CreditManager {
  static async getProfile(userId: string, email: string) {
    const deviceId = FingerprintService.getDeviceId();
    const response = await fetch('/api/user/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email, deviceId, action: 'get_or_init' })
    });
    return response.json();
  }

  static async consumeCredit(userId: string) {
    const response = await fetch('/api/user/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action: 'consume' })
    });
    return response.json();
  }
}
