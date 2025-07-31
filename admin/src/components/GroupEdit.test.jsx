// Groups Edit 組件測試
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminContext } from 'react-admin';
import '@testing-library/jest-dom';
import GroupEdit from './GroupEdit';

// Mock react-admin hooks
const mockDataProvider = {
  getOne: vi.fn(() => Promise.resolve({ 
    data: { 
      id: 1, 
      name: '簡少年老師 2025 拜拜推薦', 
      description: '簡少年老師精選2025年最重要的拜拜時機',
      enabled: true,
      video_url: 'https://www.youtube.com/watch?v=example123'
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
    TextInput: ({ source, label, required }) => (
      <input 
        data-testid={`input-${source}`} 
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

describe('GroupEdit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render edit form with all fields', async () => {
    renderWithAdmin(<GroupEdit />);
    
    expect(screen.getByTestId('edit-container')).toBeInTheDocument();
    expect(screen.getByTestId('edit-form')).toBeInTheDocument();
    
    // 檢查所有必要的輸入欄位
    expect(screen.getByTestId('input-name')).toBeInTheDocument();
    expect(screen.getByTestId('input-description')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-enabled')).toBeInTheDocument();
    expect(screen.getByTestId('input-video_url')).toBeInTheDocument();
  });

  it('should have submit button', async () => {
    renderWithAdmin(<GroupEdit />);
    
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
  });

  it('should include group management tools', async () => {
    renderWithAdmin(<GroupEdit />);
    
    // 檢查是否有群組管理相關元素
    expect(screen.getByTestId('input-name')).toBeInTheDocument();
    expect(screen.getByTestId('input-description')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-enabled')).toBeInTheDocument();
  });

  it('should handle video URL input', async () => {
    renderWithAdmin(<GroupEdit />);
    
    // 檢查影片 URL 輸入欄位
    expect(screen.getByTestId('input-video_url')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    renderWithAdmin(<GroupEdit />);
    
    // 檢查必填欄位
    const nameInput = screen.getByTestId('input-name');
    const descriptionInput = screen.getByTestId('input-description');
    
    expect(nameInput).toHaveAttribute('required');
    expect(descriptionInput).toHaveAttribute('required');
  });
});