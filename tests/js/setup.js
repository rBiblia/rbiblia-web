import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock js-cookie
vi.mock('js-cookie', () => ({
  default: { get: vi.fn(), set: vi.fn() }
}));
