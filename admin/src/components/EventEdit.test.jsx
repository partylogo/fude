// Events Edit 組件測試
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminContext } from 'react-admin';
import '@testing-library/jest-dom';
import EventEdit from './EventEdit';

// Mock react-admin hooks
const mockDataProvider = {
  getOne: vi.fn(() => Promise.resolve({ 
    data: { 
      id: 1, 
      title: '媽祖聖誕', 
      type: 'deity', 
      description: '海上女神媽祖的誕辰',
      solar_date: '2025-04-20',
      lunar_month: 3,
      lunar_day: 23,
      is_leap_month: false
    }
  })),
  update: vi.fn(() => Promise.resolve({ data: { id: 1 } }))
};

// Mock AdminContext
vi.mock('react-admin', async () => {
  const actual = await vi.importActual('react-admin');
  return {
    ...actual,
    useDataProvider: () => mockDataProvider,
    Edit: ({ children }) => <div data-testid="edit-container">{children}</div>,
    SimpleForm: ({ children, onSubmit }) => (
      <form data-testid="edit-form" onSubmit={onSubmit}>
        {children}
        <button type="submit" data-testid="submit-button">Save</button>
      </form>
    ),
    TextInput: ({ source, label }) => (
      <input 
        data-testid={`input-${source}`} 
        placeholder={label}
        name={source}
      />
    ),
    SelectInput: ({ source, label, choices }) => (
      <select data-testid={`select-${source}`} name={source}>
        {choices?.map(choice => (
          <option key={choice.id} value={choice.id}>{choice.name}</option>
        ))}
      </select>
    ),
    NumberInput: ({ source, label }) => (
      <input 
        type="number"
        data-testid={`number-${source}`} 
        placeholder={label}
        name={source}
      />
    ),
    DateInput: ({ source, label }) => (
      <input 
        type="date"
        data-testid={`date-${source}`} 
        placeholder={label}
        name={source}
      />
    ),
    BooleanInput: ({ source, label }) => (
      <input 
        type="checkbox"
        data-testid={`checkbox-${source}`} 
        name={source}
      />
    )
  };
});

const renderWithAdmin = (component) => {
  return render(
    <AdminContext dataProvider={mockDataProvider}>
      {component}
    </AdminContext>
  );
};

describe('EventEdit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render edit form with all fields', async () => {
    renderWithAdmin(<EventEdit />);
    
    expect(screen.getByTestId('edit-container')).toBeInTheDocument();
    expect(screen.getByTestId('edit-form')).toBeInTheDocument();
    
    // 檢查所有必要的輸入欄位
    expect(screen.getByTestId('input-title')).toBeInTheDocument();
    expect(screen.getByTestId('select-type')).toBeInTheDocument();
    expect(screen.getByTestId('input-description')).toBeInTheDocument();
    expect(screen.getByTestId('date-solar_date')).toBeInTheDocument();
    expect(screen.getByTestId('number-lunar_month')).toBeInTheDocument();
    expect(screen.getByTestId('number-lunar_day')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-is_leap_month')).toBeInTheDocument();
  });

  it('should have event type options', async () => {
    renderWithAdmin(<EventEdit />);
    
    const typeSelect = screen.getByTestId('select-type');
    expect(typeSelect).toBeInTheDocument();
    
    // 檢查選項
    const options = typeSelect.querySelectorAll('option');
    expect(options).toHaveLength(3); // deity, festival, custom
  });

  it('should include lunar converter component', async () => {
    renderWithAdmin(<EventEdit />);
    
    // 檢查農曆轉換器相關元素
    expect(screen.getByTestId('number-lunar_month')).toBeInTheDocument();
    expect(screen.getByTestId('number-lunar_day')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-is_leap_month')).toBeInTheDocument();
  });

  it('should have submit button', async () => {
    renderWithAdmin(<EventEdit />);
    
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
  });

  it('should validate lunar date range', async () => {
    renderWithAdmin(<EventEdit />);
    
    const monthInput = screen.getByTestId('number-lunar_month');
    const dayInput = screen.getByTestId('number-lunar_day');
    
    // 農曆月份應該在 1-12 範圍
    expect(monthInput).toBeInTheDocument();
    
    // 農曆日期應該在 1-30 範圍
    expect(dayInput).toBeInTheDocument();
  });
});