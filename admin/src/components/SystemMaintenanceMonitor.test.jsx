// System Maintenance Monitor Tests - TDD First
// Following Kent Beck's TDD principles (Red → Green → Refactor)

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TestContext } from 'react-admin';
import SystemMaintenanceMonitor from './SystemMaintenanceMonitor';

// Mock axios for API calls
import { vi } from 'vitest';
import axios from 'axios';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

const TestWrapper = ({ children, ...props }) => (
  <TestContext dataProvider={{
    getList: () => Promise.resolve({ data: [], total: 0 }),
    getOne: () => Promise.resolve({ data: {} }),
    getMany: () => Promise.resolve({ data: [] }),
    getManyReference: () => Promise.resolve({ data: [], total: 0 }),
    create: () => Promise.resolve({ data: {} }),
    update: () => Promise.resolve({ data: {} }),
    updateMany: () => Promise.resolve({ data: [] }),
    delete: () => Promise.resolve({ data: {} }),
    deleteMany: () => Promise.resolve({ data: [] })
  }} {...props}>
    {children}
  </TestContext>
);

describe('SystemMaintenanceMonitor - Extension Status Display', () => {
  
  beforeEach(() => {
    mockedAxios.get.mockClear();
    mockedAxios.post.mockClear();
  });

  test('should display extension status information', async () => {
    // Arrange
    const mockExtensionStatus = {
      min_extended_year: 2025,
      max_extended_year: 2030,
      total_events: 15,
      events_need_extension: 3,
      target_extension_year: 2030
    };

    mockedAxios.get.mockResolvedValueOnce({ 
      data: mockExtensionStatus 
    });

    // Act
    render(
      <TestWrapper>
        <SystemMaintenanceMonitor />
      </TestWrapper>
    );

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/系統延伸狀態/)).toBeInTheDocument();
      expect(screen.getByText(/總事件數: 15/)).toBeInTheDocument();
      expect(screen.getByText(/需要延伸: 3/)).toBeInTheDocument();
      expect(screen.getByText(/目標年份: 2030/)).toBeInTheDocument();
    });

    expect(mockedAxios.get).toHaveBeenCalledWith('/api/system/extension-status');
  });

  test('should show loading state initially', () => {
    // Arrange
    mockedAxios.get.mockImplementation(() => new Promise(() => {})); // Never resolves

    // Act
    render(
      <TestWrapper>
        <SystemMaintenanceMonitor />
      </TestWrapper>
    );

    // Assert
    expect(screen.getByText(/載入中.../)).toBeInTheDocument();
  });

  test('should handle API error gracefully', async () => {
    // Arrange
    mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

    // Act
    render(
      <TestWrapper>
        <SystemMaintenanceMonitor />
      </TestWrapper>
    );

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/載入失敗/)).toBeInTheDocument();
    });
  });
});

describe('SystemMaintenanceMonitor - Maintenance History', () => {
  
  test('should display maintenance history table', async () => {
    // Arrange
    const mockHistory = [
      {
        id: 1,
        maintenance_type: 'annual_extension',
        target_year: 2030,
        events_processed: 10,
        started_at: '2025-01-01T00:00:00Z',
        completed_at: '2025-01-01T00:05:00Z',
        status: 'completed'
      },
      {
        id: 2,
        maintenance_type: 'manual_trigger',
        target_year: 2029,
        events_processed: 5,
        started_at: '2024-12-01T00:00:00Z',
        completed_at: null,
        status: 'running'
      }
    ];

    mockedAxios.get.mockImplementation((url) => {
      if (url === '/api/system/extension-status') {
        return Promise.resolve({ data: {} });
      }
      if (url === '/api/system/maintenance-history') {
        return Promise.resolve({ data: { records: mockHistory } });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    // Act
    render(
      <TestWrapper>
        <SystemMaintenanceMonitor />
      </TestWrapper>
    );

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/維護歷史/)).toBeInTheDocument();
      expect(screen.getByText(/annual_extension/)).toBeInTheDocument();
      expect(screen.getByText(/completed/)).toBeInTheDocument();
      expect(screen.getByText(/running/)).toBeInTheDocument();
    });
  });
});

describe('SystemMaintenanceMonitor - Manual Trigger', () => {
  
  test('should allow manual maintenance trigger', async () => {
    // Arrange
    mockedAxios.get.mockImplementation((url) => {
      if (url === '/api/system/extension-status') {
        return Promise.resolve({ data: {} });
      }
      if (url === '/api/system/maintenance-history') {
        return Promise.resolve({ data: { records: [] } });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    mockedAxios.post.mockResolvedValueOnce({
      data: { 
        message: '維護完成', 
        success: true,
        events_processed: 5,
        occurrences_created: 25
      }
    });

    // Act
    render(
      <TestWrapper>
        <SystemMaintenanceMonitor />
      </TestWrapper>
    );

    await waitFor(() => {
      const triggerButton = screen.getByText(/手動觸發維護/);
      fireEvent.click(triggerButton);
    });

    // Assert
    expect(mockedAxios.post).toHaveBeenCalledWith('/api/system/trigger-maintenance');
    
    await waitFor(() => {
      expect(screen.getByText(/維護完成/)).toBeInTheDocument();
    });
  });

  test('should handle maintenance trigger failure', async () => {
    // Arrange
    mockedAxios.get.mockImplementation((url) => {
      if (url === '/api/system/extension-status') {
        return Promise.resolve({ data: {} });
      }
      if (url === '/api/system/maintenance-history') {
        return Promise.resolve({ data: { records: [] } });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    mockedAxios.post.mockRejectedValueOnce(new Error('Maintenance failed'));

    // Act
    render(
      <TestWrapper>
        <SystemMaintenanceMonitor />
      </TestWrapper>
    );

    await waitFor(() => {
      const triggerButton = screen.getByText(/手動觸發維護/);
      fireEvent.click(triggerButton);
    });

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/維護失敗/)).toBeInTheDocument();
    });
  });

  test('should disable trigger button during maintenance', async () => {
    // Arrange
    mockedAxios.get.mockImplementation((url) => {
      if (url === '/api/system/extension-status') {
        return Promise.resolve({ data: {} });
      }
      if (url === '/api/system/maintenance-history') {
        return Promise.resolve({ data: { records: [] } });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    mockedAxios.post.mockImplementation(() => new Promise(() => {})); // Never resolves

    // Act
    render(
      <TestWrapper>
        <SystemMaintenanceMonitor />
      </TestWrapper>
    );

    await waitFor(() => {
      const triggerButton = screen.getByText(/手動觸發維護/);
      fireEvent.click(triggerButton);
    });

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/維護中.../)).toBeInTheDocument();
      const buttonAfter = screen.getByText(/維護中.../);
      expect(buttonAfter).toBeDisabled();
    });
  });
});

describe('SystemMaintenanceMonitor - Error Handling', () => {
  
  test('should display generation errors summary', async () => {
    // Arrange
    const mockErrors = [
      {
        id: 1,
        event_id: 1,
        error_type: 'lunar_conversion',
        error_message: 'Invalid lunar date',
        occurred_at: '2025-01-01T00:00:00Z',
        event_title: '媽祖聖誕'
      }
    ];

    mockedAxios.get.mockImplementation((url) => {
      if (url === '/api/system/extension-status') {
        return Promise.resolve({ data: {} });
      }
      if (url === '/api/system/maintenance-history') {
        return Promise.resolve({ data: { records: [] } });
      }
      if (url === '/api/system/generation-errors?unresolved=true') {
        return Promise.resolve({ data: { errors: mockErrors } });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    // Act
    render(
      <TestWrapper>
        <SystemMaintenanceMonitor />
      </TestWrapper>
    );

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/錯誤記錄/)).toBeInTheDocument();
      expect(screen.getByText(/未解決錯誤: 1/)).toBeInTheDocument();
      expect(screen.getByText(/lunar_conversion/)).toBeInTheDocument();
    });
  });
});

describe('SystemMaintenanceMonitor - Data Refresh', () => {
  
  test('should refresh data when refresh button is clicked', async () => {
    // Arrange
    let callCount = 0;
    mockedAxios.get.mockImplementation((url) => {
      callCount++;
      if (url === '/api/system/extension-status') {
        return Promise.resolve({ data: { total_events: callCount } });
      }
      if (url === '/api/system/maintenance-history') {
        return Promise.resolve({ data: { records: [] } });
      }
      if (url === '/api/system/generation-errors?unresolved=true') {
        return Promise.resolve({ data: { errors: [] } });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    // Act
    render(
      <TestWrapper>
        <SystemMaintenanceMonitor />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/總事件數: 1/)).toBeInTheDocument();
    });

    const refreshButton = screen.getByText(/重新整理/);
    fireEvent.click(refreshButton);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/總事件數: 4/)).toBeInTheDocument(); // Second call to extension-status
    });

    expect(mockedAxios.get).toHaveBeenCalledTimes(6); // 3 initial calls + 3 refresh calls
  });
});