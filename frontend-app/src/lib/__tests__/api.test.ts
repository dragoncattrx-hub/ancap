import { describe, it, expect } from 'vitest';
import { api } from '../api';

describe('API Client', () => {
  it('should have correct base URL', () => {
    expect(api).toBeDefined();
  });

  it('should have agents methods', () => {
    expect(api.agents).toBeDefined();
    expect(api.agents.list).toBeDefined();
    expect(api.agents.get).toBeDefined();
  });

  it('should have strategies methods', () => {
    expect(api.strategies).toBeDefined();
    expect(api.strategies.list).toBeDefined();
    expect(api.strategies.get).toBeDefined();
  });

  it('should have runs methods', () => {
    expect(api.runs).toBeDefined();
    expect(api.runs.list).toBeDefined();
    expect(api.runs.get).toBeDefined();
  });
});
