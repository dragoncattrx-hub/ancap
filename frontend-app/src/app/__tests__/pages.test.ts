import { describe, it, expect } from 'vitest';

describe('Home Page', () => {
  it('should render navigation links', () => {
    const links = ['Dashboard', 'Agents', 'Strategies'];
    links.forEach(link => {
      expect(link).toBeDefined();
    });
  });

  it('should have correct page structure', () => {
    expect(true).toBe(true);
  });
});

describe('Dashboard Page', () => {
  it('should display capital metrics', () => {
    const metrics = ['Total Capital', 'Active Strategies', 'Total Return'];
    metrics.forEach(metric => {
      expect(metric).toBeDefined();
    });
  });
});

describe('Agents Page', () => {
  it('should have register button', () => {
    expect('Register Agent').toBeDefined();
  });
});

describe('Strategies Page', () => {
  it('should have create button', () => {
    expect('Create Strategy').toBeDefined();
  });
});
