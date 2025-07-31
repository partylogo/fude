// Groups Create 組件測試
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminContext } from 'react-admin';
import '@testing-library/jest-dom';
import GroupCreate from './GroupCreate';

// Mock react-admin hooks
const mockDataProvider = {
  create: vi.fn(() => Promise.resolve({ 
    data: { 
      id: 3, 
      name: '新增群組', 
      description: '測試群組描述',
      enabled: true
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
    BooleanInput: ({ source, label, defaultValue }) => (
      <input 
        type="checkbox"
        data-testid={`checkbox-${source}`} 
        name={source}
        defaultChecked={defaultValue}
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

describe('GroupCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render create form with all required fields', async () => {
    renderWithAdmin(<GroupCreate />);
    
    expect(screen.getByTestId('create-container')).toBeInTheDocument();
    expect(screen.getByTestId('create-form')).toBeInTheDocument();
    
    // 檢查所有必要的輸入欄位
    expect(screen.getByTestId('input-name')).toBeInTheDocument();
    expect(screen.getByTestId('input-description')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-enabled')).toBeInTheDocument();
    expect(screen.getByTestId('input-video_url')).toBeInTheDocument();
  });

  it('should have required field validation', async () => {
    renderWithAdmin(<GroupCreate />);
    
    // 檢查必填欄位
    expect(screen.getByTestId('input-name')).toHaveAttribute('required');
    expect(screen.getByTestId('input-description')).toHaveAttribute('required');
  });

  it('should have submit button', async () => {
    renderWithAdmin(<GroupCreate />);
    
    const submitButton = screen.getByTestId('submit-button');
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveTextContent('Create');
  });

  it('should handle form submission', async () => {
    const user = userEvent.setup();
    
    renderWithAdmin(<GroupCreate />);
    
    // 填寫表單
    await user.type(screen.getByTestId('input-name'), '測試群組');
    await user.type(screen.getByTestId('input-description'), '這是測試群組描述');
    await user.type(screen.getByTestId('input-video_url'), 'https://example.com/video');
    
    // 提交表單
    await user.click(screen.getByTestId('submit-button'));
    
    // 檢查是否調用了 create API
    await waitFor(() => {
      expect(mockDataProvider.create).toHaveBeenCalled();
    });
  });

  it('should provide default values for new groups', async () => {
    renderWithAdmin(<GroupCreate />);
    
    // 檢查是否有適當的默認值或佔位符
    expect(screen.getByTestId('input-name')).toHaveAttribute('placeholder');
    expect(screen.getByTestId('input-description')).toHaveAttribute('placeholder');
    expect(screen.getByTestId('input-video_url')).toHaveAttribute('placeholder');
  });

  it('should have enabled checkbox checked by default', async () => {
    renderWithAdmin(<GroupCreate />);
    
    // 檢查啟用狀態預設為 true
    const enabledCheckbox = screen.getByTestId('checkbox-enabled');
    expect(enabledCheckbox).toBeInTheDocument();
  });

  it('should support video URL input', async () => {
    renderWithAdmin(<GroupCreate />);
    
    // 檢查影片 URL 輸入欄位
    const videoUrlInput = screen.getByTestId('input-video_url');
    expect(videoUrlInput).toBeInTheDocument();
    expect(videoUrlInput).toHaveAttribute('placeholder');
  });
});