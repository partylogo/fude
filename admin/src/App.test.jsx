// React Admin App 測試
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock react-admin 組件
vi.mock('react-admin', () => ({
  Admin: ({ children }) => <div data-testid="admin-container">{children}</div>,
  Resource: ({ name }) => <div data-testid={`resource-${name}`}>{name}</div>,
  ListGuesser: () => <div data-testid="list-guesser">ListGuesser</div>,
  EditGuesser: () => <div data-testid="edit-guesser">EditGuesser</div>,
  ShowGuesser: () => <div data-testid="show-guesser">ShowGuesser</div>
}));

// Mock data provider
vi.mock('./dataProvider', () => ({
  default: {
    getList: vi.fn(() => Promise.resolve({ data: [], total: 0 })),
    getOne: vi.fn(() => Promise.resolve({ data: {} })),
    create: vi.fn(() => Promise.resolve({ data: {} })),
    update: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} }))
  }
}));

describe('React Admin App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render admin container', () => {
    render(<App />);
    
    expect(screen.getByTestId('admin-container')).toBeInTheDocument();
  });

  it('should include events resource', () => {
    render(<App />);
    
    expect(screen.getByTestId('resource-events')).toBeInTheDocument();
  });

  it('should include groups resource', () => {
    render(<App />);
    
    expect(screen.getByTestId('resource-groups')).toBeInTheDocument();
  });

  it('should have correct app title', () => {
    render(<App />);
    
    // 檢查文檔標題或 admin title prop
    expect(document.title).toBe('Folklore Admin Dashboard');
  });
});