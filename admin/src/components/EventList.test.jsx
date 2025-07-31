// Events List 組件測試
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AdminContext } from 'react-admin';
import '@testing-library/jest-dom';
import EventList from './EventList';

// Mock react-admin hooks
const mockDataProvider = {
  getList: vi.fn(() => Promise.resolve({ 
    data: [
      { 
        id: 1, 
        title: '媽祖聖誕', 
        type: 'deity', 
        description: '海上女神媽祖的誕辰',
        solar_date: '2025-04-20',
        lunar_month: 3,
        lunar_day: 23
      },
      { 
        id: 2, 
        title: '清明節', 
        type: 'festival', 
        description: '祭祖掃墓的重要節日',
        solar_date: '2025-04-05',
        lunar_month: 3,
        lunar_day: 5
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
      resource: 'events'
    }),
    List: ({ children }) => <div data-testid="list-container">{children}</div>,
    Datagrid: ({ children }) => <table data-testid="datagrid">{children}</table>,
    TextField: ({ source, record }) => <td data-testid={`field-${source}`}>{record?.[source]}</td>,
    DateField: ({ source, record }) => <td data-testid={`field-${source}`}>{record?.[source]}</td>,
    SelectField: ({ source, record }) => <td data-testid={`field-${source}`}>{record?.[source]}</td>,
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

describe('EventList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render events list with proper columns', async () => {
    renderWithAdmin(<EventList />);
    
    expect(screen.getByTestId('list-container')).toBeInTheDocument();
    expect(screen.getByTestId('datagrid')).toBeInTheDocument();
  });

  it('should display event data correctly', async () => {
    renderWithAdmin(<EventList />);
    
    // 檢查是否有正確的欄位
    await waitFor(() => {
      expect(screen.getAllByTestId('field-title')).toHaveLength(2);
      expect(screen.getAllByTestId('field-type')).toHaveLength(2);
      expect(screen.getAllByTestId('field-solar_date')).toHaveLength(2);
    });
  });

  it('should include action buttons', async () => {
    renderWithAdmin(<EventList />);
    
    await waitFor(() => {
      expect(screen.getAllByTestId('edit-button')).toHaveLength(2);
      expect(screen.getAllByTestId('show-button')).toHaveLength(2);
      expect(screen.getAllByTestId('delete-button')).toHaveLength(2);
    });
  });

  it('should handle lunar date display', async () => {
    renderWithAdmin(<EventList />);
    
    // 檢查農曆日期欄位存在
    await waitFor(() => {
      expect(screen.getAllByTestId('field-lunar_month')).toHaveLength(2);
      expect(screen.getAllByTestId('field-lunar_day')).toHaveLength(2);
    });
  });
});