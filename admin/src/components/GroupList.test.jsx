// Groups List 組件測試
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AdminContext } from 'react-admin';
import '@testing-library/jest-dom';
import GroupList from './GroupList';

// Mock react-admin hooks
const mockDataProvider = {
  getList: vi.fn(() => Promise.resolve({ 
    data: [
      { 
        id: 1, 
        name: '簡少年老師 2025 拜拜推薦', 
        description: '簡少年老師精選2025年最重要的拜拜時機',
        enabled: true,
        video_url: 'https://www.youtube.com/watch?v=example123'
      },
      { 
        id: 2, 
        name: '基礎民俗節慶', 
        description: '台灣傳統民俗節慶基本清單',
        enabled: true,
        video_url: null
      }
    ], 
    total: 2 
  }))
};

// Mock AdminContext
vi.mock('react-admin', async () => {
  const actual = await vi.importActual('react-admin');
  return {
    ...actual,
    useDataProvider: () => mockDataProvider,
    useListContext: () => ({
      data: mockDataProvider.getList().then(r => r.data),
      total: 2,
      isLoading: false,
      resource: 'groups'
    }),
    List: ({ children }) => <div data-testid="list-container">{children}</div>,
    Datagrid: ({ children }) => <table data-testid="datagrid">{children}</table>,
    TextField: ({ source, record }) => <td data-testid={`field-${source}`}>{record?.[source]}</td>,
    BooleanField: ({ source, record }) => <td data-testid={`field-${source}`}>{record?.[source] ? 'true' : 'false'}</td>,
    UrlField: ({ source, record }) => <td data-testid={`field-${source}`}>{record?.[source] || 'N/A'}</td>,
    EditButton: () => <button data-testid="edit-button">Edit</button>,
    ShowButton: () => <button data-testid="show-button">Show</button>,
    DeleteButton: () => <button data-testid="delete-button">Delete</button>
  };
});

const renderWithAdmin = (component) => {
  return render(
    <AdminContext dataProvider={mockDataProvider}>
      {component}
    </AdminContext>
  );
};

describe('GroupList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render groups list with proper columns', async () => {
    renderWithAdmin(<GroupList />);
    
    expect(screen.getByTestId('list-container')).toBeInTheDocument();
    expect(screen.getByTestId('datagrid')).toBeInTheDocument();
  });

  it('should display group data correctly', async () => {
    renderWithAdmin(<GroupList />);
    
    // 檢查是否有正確的欄位
    await waitFor(() => {
      expect(screen.getAllByTestId('field-name')).toHaveLength(2);
      expect(screen.getAllByTestId('field-description')).toHaveLength(2);
      expect(screen.getAllByTestId('field-enabled')).toHaveLength(2);
    });
  });

  it('should include action buttons', async () => {
    renderWithAdmin(<GroupList />);
    
    await waitFor(() => {
      expect(screen.getAllByTestId('edit-button')).toHaveLength(2);
      expect(screen.getAllByTestId('show-button')).toHaveLength(2);
      expect(screen.getAllByTestId('delete-button')).toHaveLength(2);
    });
  });

  it('should handle video URL display', async () => {
    renderWithAdmin(<GroupList />);
    
    // 檢查影片 URL 欄位存在
    await waitFor(() => {
      expect(screen.getAllByTestId('field-video_url')).toHaveLength(2);
    });
  });

  it('should display enabled status correctly', async () => {
    renderWithAdmin(<GroupList />);
    
    // 檢查啟用狀態欄位
    await waitFor(() => {
      expect(screen.getAllByTestId('field-enabled')).toHaveLength(2);
    });
  });
});