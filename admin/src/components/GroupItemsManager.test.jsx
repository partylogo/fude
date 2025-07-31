// Group Items Manager 組件測試 - 管理群組內的事件
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import GroupItemsManager from './GroupItemsManager';

// Mock API 調用
global.fetch = vi.fn();

describe('GroupItemsManager', () => {
  const mockGroupId = 1;
  const mockGroupItems = {
    deities: [
      { id: 1, title: '媽祖聖誕', type: 'deity' }
    ],
    festivals: [
      { id: 2, title: '清明節', type: 'festival' }
    ]
  };

  const mockAllEvents = [
    { id: 1, title: '媽祖聖誕', type: 'deity' },
    { id: 2, title: '清明節', type: 'festival' },
    { id: 3, title: '中秋節', type: 'festival' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockClear();
  });

  it('should render group items manager', async () => {
    render(<GroupItemsManager groupId={mockGroupId} />);
    
    expect(screen.getByTestId('group-items-manager')).toBeInTheDocument();
    expect(screen.getByTestId('current-items-section')).toBeInTheDocument();
    expect(screen.getByTestId('add-items-section')).toBeInTheDocument();
  });

  it('should load and display current group items', async () => {
    // Mock API response for group items
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockGroupItems
    });

    render(<GroupItemsManager groupId={mockGroupId} />);
    
    // 等待 API 調用
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(`/api/groups/${mockGroupId}/items`);
    });

    // 檢查是否顯示當前項目
    await waitFor(() => {
      expect(screen.getByTestId('deities-section')).toBeInTheDocument();
      expect(screen.getByTestId('festivals-section')).toBeInTheDocument();
    });
  });

  it('should load available events for adding', async () => {
    // Mock API responses
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockGroupItems
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events: mockAllEvents })
      });

    render(<GroupItemsManager groupId={mockGroupId} />);
    
    // 等待兩次 API 調用
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenCalledWith(`/api/groups/${mockGroupId}/items`);
      expect(fetch).toHaveBeenCalledWith('/api/events');
    });
  });

  it('should add event to group', async () => {
    const user = userEvent.setup();
    
    // Mock initial load
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockGroupItems
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events: mockAllEvents })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

    render(<GroupItemsManager groupId={mockGroupId} />);
    
    // 等待初始載入
    await waitFor(() => {
      expect(screen.getByTestId('available-events')).toBeInTheDocument();
    });

    // 點擊添加事件按鈕
    const addButton = screen.getByTestId('add-event-3');
    await user.click(addButton);

    // 檢查是否調用了添加 API
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(`/api/groups/${mockGroupId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ event_id: 3 })
      });
    });
  });

  it('should remove event from group', async () => {
    const user = userEvent.setup();
    
    // Mock initial load
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockGroupItems
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events: mockAllEvents })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

    render(<GroupItemsManager groupId={mockGroupId} />);
    
    // 等待初始載入
    await waitFor(() => {
      expect(screen.getByTestId('remove-event-1')).toBeInTheDocument();
    });

    // 點擊移除事件按鈕
    const removeButton = screen.getByTestId('remove-event-1');
    await user.click(removeButton);

    // 檢查是否調用了移除 API
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(`/api/groups/${mockGroupId}/items/1`, {
        method: 'DELETE'
      });
    });
  });

  it('should filter available events (exclude already added)', async () => {
    // Mock API responses
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockGroupItems
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events: mockAllEvents })
      });

    render(<GroupItemsManager groupId={mockGroupId} />);
    
    // 等待載入完成
    await waitFor(() => {
      expect(screen.getByTestId('available-events')).toBeInTheDocument();
    });

    // 檢查是否只顯示未添加的事件
    await waitFor(() => {
      expect(screen.queryByTestId('add-event-1')).not.toBeInTheDocument(); // 已添加
      expect(screen.queryByTestId('add-event-2')).not.toBeInTheDocument(); // 已添加
      expect(screen.getByTestId('add-event-3')).toBeInTheDocument(); // 未添加
    });
  });

  it('should handle API errors gracefully', async () => {
    // Mock API error
    fetch.mockRejectedValueOnce(new Error('API Error'));

    render(<GroupItemsManager groupId={mockGroupId} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText(/載入失敗/)).toBeInTheDocument();
    });
  });

  it('should show loading state', async () => {
    // Mock delayed response
    fetch.mockImplementationOnce(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => mockGroupItems
        }), 100)
      )
    );

    render(<GroupItemsManager groupId={mockGroupId} />);
    
    // 檢查載入狀態
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  it('should group events by type correctly', async () => {
    // Mock API responses
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockGroupItems
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events: mockAllEvents })
      });

    render(<GroupItemsManager groupId={mockGroupId} />);
    
    // 等待載入完成
    await waitFor(() => {
      expect(screen.getByTestId('deities-section')).toBeInTheDocument();
      expect(screen.getByTestId('festivals-section')).toBeInTheDocument();
    });

    // 檢查事件是否正確分組
    await waitFor(() => {
      // 神明節日部分
      const deitiesSection = screen.getByTestId('deities-section');
      expect(deitiesSection).toHaveTextContent('媽祖聖誕');
      
      // 民俗節慶部分
      const festivalsSection = screen.getByTestId('festivals-section');
      expect(festivalsSection).toHaveTextContent('清明節');
    });
  });
});