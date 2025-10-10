import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { ThemeProvider } from 'next-themes';

// Mock data for testing
export const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  image: '/placeholder-user.jpg',
};

export const mockGitHubActivity = [
  {
    id: '1',
    type: 'push',
    repo: 'test-repo',
    message: 'Test commit',
    timestamp: new Date().toISOString(),
    url: 'https://github.com/test/test-repo/commit/123',
  },
];

export const mockRepositories = [
  {
    id: 1,
    name: 'test-repo',
    fullName: 'test/test-repo',
    private: false,
    htmlUrl: 'https://github.com/test/test-repo',
    description: 'Test repository',
    language: 'TypeScript',
    stargazersCount: 10,
    forksCount: 5,
    updatedAt: new Date().toISOString(),
  },
];

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
      {children}
    </ThemeProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock fetch responses
export const mockFetch = (data: any, status = 200) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
};

// Mock fetch error
export const mockFetchError = (message = 'Network error') => {
  global.fetch = jest.fn().mockRejectedValue(new Error(message));
};

// Mock localStorage
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
  };
};

// Mock sessionStorage
export const mockSessionStorage = () => {
  const store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
  };
};

// Wait for async operations
export const waitFor = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

// Mock IntersectionObserver
export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = jest.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  });
  window.IntersectionObserver = mockIntersectionObserver;
};

// Mock ResizeObserver
export const mockResizeObserver = () => {
  const mockResizeObserver = jest.fn();
  mockResizeObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  });
  window.ResizeObserver = mockResizeObserver;
};

// Mock matchMedia
export const mockMatchMedia = (matches = false) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

// Test data generators
export const generateMockPR = (overrides = {}) => ({
  id: 1,
  number: 123,
  title: 'Test PR',
  body: 'Test PR description',
  state: 'open',
  author: mockUser,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const generateMockIssue = (overrides = {}) => ({
  id: 1,
  number: 456,
  title: 'Test Issue',
  body: 'Test issue description',
  state: 'open',
  author: mockUser,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Clean up function
export const cleanup = () => {
  jest.clearAllMocks();
  if (global.fetch) {
    (global.fetch as jest.Mock).mockClear();
  }
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };
