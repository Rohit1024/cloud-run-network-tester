import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import NetworkDebuggerClient from '@/app/components/NetworkDebuggerClient';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as networkActions from '@/app/actions/network';

// Mocking server actions
vi.mock('@/app/actions/network', () => ({
  checkEgressIp: vi.fn(),
  testDiagnosticTrace: vi.fn(),
  getDefaultTargets: vi.fn(),
}));

// Mock ResizeObserver which is needed for some components (like Accordion from Radix)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('NetworkDebuggerClient - Data Display', () => {
  const defaultTargets = [
    { name: 'Google', host: 'google.com', port: 443 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders default targets and fetches egress IP correctly', async () => {
    (networkActions.checkEgressIp as any).mockResolvedValueOnce({
      success: true,
      ip: '1.2.3.4',
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <NetworkDebuggerClient defaultTargets={defaultTargets} />
      </QueryClientProvider>
    );

    // Verify initial render
    expect(screen.getByText('Current Egress IP')).toBeInTheDocument();
    
    // Verify default targets are shown
    expect(screen.getByText('Google')).toBeInTheDocument();

    // Verify Egress IP display
    await waitFor(() => {
      expect(screen.getByText('1.2.3.4')).toBeInTheDocument();
    });
  });

  it('handles failed egress IP detection gracefully', async () => {
    (networkActions.checkEgressIp as any).mockResolvedValueOnce({
      success: false,
      ip: 'Unknown',
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <NetworkDebuggerClient defaultTargets={defaultTargets} />
      </QueryClientProvider>
    );

    // Verify Egress IP display shows failure
    await waitFor(() => {
      expect(screen.getByText('Detection Failed')).toBeInTheDocument();
    });
  });
});
