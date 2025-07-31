// 農曆轉換器組件測試
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import LunarConverter from './LunarConverter';

// Mock API 調用
global.fetch = vi.fn();

describe('LunarConverter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockClear();
  });

  it('should render lunar to solar converter', async () => {
    render(<LunarConverter />);
    
    expect(screen.getByTestId('lunar-converter')).toBeInTheDocument();
    expect(screen.getByTestId('lunar-month-input')).toBeInTheDocument();
    expect(screen.getByTestId('lunar-day-input')).toBeInTheDocument();
    expect(screen.getByTestId('leap-month-checkbox')).toBeInTheDocument();
    expect(screen.getByTestId('convert-button')).toBeInTheDocument();
  });

  it('should convert lunar date to solar date', async () => {
    const user = userEvent.setup();
    
    // Mock API response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        solar_date: '2025-04-20',
        lunar_month: 3,
        lunar_day: 23,
        is_leap_month: false
      })
    });

    render(<LunarConverter />);
    
    // 輸入農曆日期
    await user.type(screen.getByTestId('lunar-month-input'), '3');
    await user.type(screen.getByTestId('lunar-day-input'), '23');
    
    // 點擊轉換按鈕
    await user.click(screen.getByTestId('convert-button'));
    
    // 等待 API 調用
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/lunar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lunar_month: 3,
          lunar_day: 23,
          is_leap_month: false
        })
      });
    });
    
    // 檢查結果顯示
    await waitFor(() => {
      expect(screen.getByTestId('solar-result')).toBeInTheDocument();
      expect(screen.getByText('2025-04-20')).toBeInTheDocument();
    });
  });

  it('should handle leap month conversion', async () => {
    const user = userEvent.setup();
    
    // Mock API response for leap month
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        solar_date: '2025-05-18',
        lunar_month: 4,
        lunar_day: 1,
        is_leap_month: true
      })
    });

    render(<LunarConverter />);
    
    // 輸入農曆日期
    await user.type(screen.getByTestId('lunar-month-input'), '4');
    await user.type(screen.getByTestId('lunar-day-input'), '1');
    await user.click(screen.getByTestId('leap-month-checkbox'));
    
    // 點擊轉換按鈕
    await user.click(screen.getByTestId('convert-button'));
    
    // 等待 API 調用
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/lunar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lunar_month: 4,
          lunar_day: 1,
          is_leap_month: true
        })
      });
    });
  });

  it('should validate input range', async () => {
    const user = userEvent.setup();
    
    render(<LunarConverter />);
    
    const monthInput = screen.getByTestId('lunar-month-input');
    const dayInput = screen.getByTestId('lunar-day-input');
    
    // 測試無效月份
    await user.type(monthInput, '13');
    await user.click(screen.getByTestId('convert-button'));
    
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText(/月份必須在 1-12 範圍內/)).toBeInTheDocument();
    });
    
    // 清除並測試無效日期
    await user.clear(monthInput);
    await user.type(monthInput, '3');
    
    await user.type(dayInput, '31');
    await user.click(screen.getByTestId('convert-button'));
    
    await waitFor(() => {
      expect(screen.getByText(/日期必須在 1-30 範圍內/)).toBeInTheDocument();
    });
  });

  it('should handle API errors', async () => {
    const user = userEvent.setup();
    
    // Mock API error
    fetch.mockRejectedValueOnce(new Error('API Error'));

    render(<LunarConverter />);
    
    await user.type(screen.getByTestId('lunar-month-input'), '3');
    await user.type(screen.getByTestId('lunar-day-input'), '23');
    await user.click(screen.getByTestId('convert-button'));
    
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText(/轉換失敗/)).toBeInTheDocument();
    });
  });

  it('should clear results when inputs change', async () => {
    const user = userEvent.setup();
    
    // Mock successful conversion first
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        solar_date: '2025-04-20',
        lunar_month: 3,
        lunar_day: 23,
        is_leap_month: false
      })
    });

    render(<LunarConverter />);
    
    // 進行一次轉換
    await user.type(screen.getByTestId('lunar-month-input'), '3');
    await user.type(screen.getByTestId('lunar-day-input'), '23');
    await user.click(screen.getByTestId('convert-button'));
    
    // 等待結果
    await waitFor(() => {
      expect(screen.getByTestId('solar-result')).toBeInTheDocument();
    });
    
    // 修改輸入
    await user.clear(screen.getByTestId('lunar-month-input'));
    await user.type(screen.getByTestId('lunar-month-input'), '4');
    
    // 結果應該被清除
    expect(screen.queryByTestId('solar-result')).not.toBeInTheDocument();
  });
});