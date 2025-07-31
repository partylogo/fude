// Events Create 組件測試
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminContext } from 'react-admin';
import '@testing-library/jest-dom';
import EventCreate from './EventCreate';

// Mock react-admin hooks
const mockDataProvider = {
  create: vi.fn(() => Promise.resolve({ 
    data: { 
      id: 3, 
      title: '新增事件', 
      type: 'custom', 
      description: '測試事件描述'
    }
  }))
};

// Mock AdminContext
vi.mock('react-admin', async () => {
  const actual = await vi.importActual('react-admin');
  return {
    ...actual,
    useDataProvider: () => mockDataProvider,
    Create: ({ children }) => <div data-testid="create-container">{children}</div>,
    SimpleForm: ({ children, onSubmit }) => (
      <form data-testid="create-form" onSubmit={onSubmit}>
        {children}
        <button type="submit" data-testid="submit-button">Create</button>
      </form>
    ),
    TextInput: ({ source, label, required }) => (
      <input 
        data-testid={`input-${source}`} 
        placeholder={label}
        name={source}
        required={required}
      />
    ),
    SelectInput: ({ source, label, choices, required }) => (
      <select data-testid={`select-${source}`} name={source} required={required}>
        <option value="">請選擇...</option>
        {choices?.map(choice => (
          <option key={choice.id} value={choice.id}>{choice.name}</option>
        ))}
      </select>
    ),
    NumberInput: ({ source, label, required, min, max }) => (
      <input 
        type="number"
        data-testid={`number-${source}`} 
        placeholder={label}
        name={source}
        required={required}
        min={min}
        max={max}
      />
    ),
    DateInput: ({ source, label, required }) => (
      <input 
        type="date"
        data-testid={`date-${source}`} 
        placeholder={label}
        name={source}
        required={required}
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

describe('EventCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render create form with all required fields', async () => {
    renderWithAdmin(<EventCreate />);
    
    expect(screen.getByTestId('create-container')).toBeInTheDocument();
    expect(screen.getByTestId('create-form')).toBeInTheDocument();
    
    // 檢查所有必要的輸入欄位
    expect(screen.getByTestId('input-title')).toBeInTheDocument();
    expect(screen.getByTestId('select-type')).toBeInTheDocument();
    expect(screen.getByTestId('input-description')).toBeInTheDocument();
    expect(screen.getByTestId('date-solar_date')).toBeInTheDocument();
    expect(screen.getByTestId('number-lunar_month')).toBeInTheDocument();
    expect(screen.getByTestId('number-lunar_day')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-is_leap_month')).toBeInTheDocument();
  });

  it('should have required field validation', async () => {
    renderWithAdmin(<EventCreate />);
    
    // 檢查必填欄位
    expect(screen.getByTestId('input-title')).toHaveAttribute('required');
    expect(screen.getByTestId('select-type')).toHaveAttribute('required');
    expect(screen.getByTestId('input-description')).toHaveAttribute('required');
  });

  it('should have event type options', async () => {
    renderWithAdmin(<EventCreate />);
    
    const typeSelect = screen.getByTestId('select-type');
    expect(typeSelect).toBeInTheDocument();
    
    // 檢查選項
    const options = typeSelect.querySelectorAll('option');
    expect(options).toHaveLength(4); // 空選項 + deity, festival, custom
    expect(options[0]).toHaveTextContent('請選擇...');
  });

  it('should have lunar date range validation', async () => {
    renderWithAdmin(<EventCreate />);
    
    const monthInput = screen.getByTestId('number-lunar_month');
    const dayInput = screen.getByTestId('number-lunar_day');
    
    // 檢查範圍限制
    expect(monthInput).toHaveAttribute('min', '1');
    expect(monthInput).toHaveAttribute('max', '12');
    expect(dayInput).toHaveAttribute('min', '1');
    expect(dayInput).toHaveAttribute('max', '30');
  });

  it('should include lunar converter integration', async () => {
    renderWithAdmin(<EventCreate />);
    
    // 檢查農曆轉換器相關元素
    expect(screen.getByTestId('number-lunar_month')).toBeInTheDocument();
    expect(screen.getByTestId('number-lunar_day')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-is_leap_month')).toBeInTheDocument();
  });

  it('should have submit button', async () => {
    renderWithAdmin(<EventCreate />);
    
    const submitButton = screen.getByTestId('submit-button');
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveTextContent('Create');
  });

  it('should handle form submission', async () => {
    const user = userEvent.setup();
    
    renderWithAdmin(<EventCreate />);
    
    // 填寫表單
    await user.type(screen.getByTestId('input-title'), '測試事件');
    await user.selectOptions(screen.getByTestId('select-type'), 'custom');
    await user.type(screen.getByTestId('input-description'), '這是測試事件描述');
    await user.type(screen.getByTestId('date-solar_date'), '2025-05-01');
    await user.type(screen.getByTestId('number-lunar_month'), '4');
    await user.type(screen.getByTestId('number-lunar_day'), '5');
    
    // 提交表單
    await user.click(screen.getByTestId('submit-button'));
    
    // 檢查是否調用了 create API
    await waitFor(() => {
      expect(mockDataProvider.create).toHaveBeenCalled();
    });
  });

  it('should provide default values for new events', async () => {
    renderWithAdmin(<EventCreate />);
    
    // 檢查是否有適當的默認值或佔位符
    expect(screen.getByTestId('input-title')).toHaveAttribute('placeholder');
    expect(screen.getByTestId('select-type')).toBeInTheDocument();
    expect(screen.getByTestId('input-description')).toHaveAttribute('placeholder');
  });
});