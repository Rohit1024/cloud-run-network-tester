import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as dnsPromises from 'dns/promises';
import { getDefaultTargets, checkEgressIp, testDiagnosticTrace } from '@/app/actions/network';

// Mocking dependencies
vi.mock('dns/promises', () => ({
  lookup: vi.fn().mockResolvedValue({ address: '93.184.216.34', family: 4 }),
}));

vi.mock('net', () => {
  class MockSocket {
    setTimeout = vi.fn();
    connect = vi.fn((port, host, callback) => {
      if (callback) setTimeout(callback, 0);
      return this;
    });
    destroy = vi.fn();
    on = vi.fn();
  }

  return {
    isIP: vi.fn((host) => {
      if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(host)) return 4;
      return 0;
    }),
    isIPv6: vi.fn(() => false),
    Socket: MockSocket,
  };
});

vi.mock('tls', () => ({
  connect: vi.fn((port, host, options, callback) => {
    const socket = {
      getPeerCertificate: vi.fn(() => ({
        valid_to: new Date(Date.now() + 86400000 * 30).toISOString(),
        issuer: { O: 'Test Issuer' },
        subjectaltname: 'DNS:test.com',
      })),
      getProtocol: vi.fn(() => 'TLSv1.3'),
      getCipher: vi.fn(() => ({ name: 'TLS_AES_256_GCM_SHA384' })),
      end: vi.fn(),
      on: vi.fn(),
    };
    if (callback) setTimeout(() => callback(socket), 0);
    return socket;
  }),
}));

// Mock global fetch
global.fetch = vi.fn();

describe('Server Actions: network', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDefaultTargets', () => {
    it('returns default targets', async () => {
      const targets = await getDefaultTargets();
      expect(targets).toBeInstanceOf(Array);
      expect(targets.length).toBeGreaterThan(0);
      expect(targets[0]).toHaveProperty('name');
    });
  });

  describe('checkEgressIp', () => {
    it('returns success and IP on successful fetch', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        json: async () => ({ ip: '1.2.3.4' }),
      });

      const result = await checkEgressIp();
      expect(result).toEqual({ success: true, ip: '1.2.3.4' });
    });

    it('returns failure on fetch error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await checkEgressIp();
      expect(result.success).toBe(false);
      expect(result.ip).toBe('Unknown');
    });
  });

  describe('testDiagnosticTrace', () => {
    it('successfully traces a valid host and port 443', async () => {
      const dns = await import('dns/promises');
      (dns.lookup as any).mockResolvedValueOnce({ address: '93.184.216.34', family: 4 });

      (global.fetch as any).mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        ok: true,
      });

      const result = await testDiagnosticTrace({ host: 'example.com', port: 443, tcpCount: 1 });

      expect(result.overallStatus).toBe('success');
      expect(result.trace.dns.status).toBe('success');
      expect(result.trace.tcp.status).toBe('success');
      expect(result.trace.tls.status).toBe('success');
      expect(result.trace.http.status).toBe('success');
    });

    it('handles DNS resolution failure', async () => {
      const dns = await import('dns/promises');
      (dns.lookup as any).mockRejectedValueOnce({ code: 'ENOTFOUND' });

      const result = await testDiagnosticTrace({ host: 'invalid.host', port: 443, tcpCount: 1 });

      expect(result.overallStatus).toBe('failed');
      expect(result.trace.dns.status).toBe('error');
    });
  });
});
