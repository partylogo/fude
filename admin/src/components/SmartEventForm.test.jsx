// Smart Event Form Tests - TDD First
// Following Kent Beck's TDD principles (Red → Green → Refactor)

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TestContext } from 'react-admin';
import SmartEventForm from './SmartEventForm';

// Mock solar terms constants
import { vi } from 'vitest';

vi.mock('../constants/solarTerms', () => ({
  getSolarTermChoices: () => [
    { id: '清明', name: '清明 (春)' },
    { id: '冬至', name: '冬至 (冬)' }
  ]
}));

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

describe('SmartEventForm - Dynamic Field Display', () => {
  
  test('should show basic fields by default', () => {
    // Arrange & Act
    render(
      <TestWrapper>
        <SmartEventForm />
      </TestWrapper>
    );

    // Assert
    expect(screen.getByLabelText(/事件名稱/)).toBeInTheDocument();
    expect(screen.getByLabelText(/事件類型/)).toBeInTheDocument();
    expect(screen.getByLabelText(/事件描述/)).toBeInTheDocument();
  });

  test('should show lunar fields when deity type is selected', async () => {
    // Arrange
    render(
      <TestWrapper>
        <SmartEventForm />
      </TestWrapper>
    );

    // Act - Select deity type
    const typeSelect = screen.getByLabelText(/事件類型/);
    fireEvent.change(typeSelect, { target: { value: 'deity' } });

    // Assert
    await waitFor(() => {
      expect(screen.getByLabelText(/農曆月份/)).toBeInTheDocument();
      expect(screen.getByLabelText(/農曆日期/)).toBeInTheDocument();
      expect(screen.getByLabelText(/閏月處理/)).toBeInTheDocument();
    });
  });

  test('should show solar term selection when solar_term type is selected', async () => {
    // Arrange
    render(
      <TestWrapper>
        <SmartEventForm />
      </TestWrapper>
    );

    // Act - Select solar_term type
    const typeSelect = screen.getByLabelText(/事件類型/);
    fireEvent.change(typeSelect, { target: { value: 'solar_term' } });

    // Assert
    await waitFor(() => {
      expect(screen.getByLabelText(/節氣選擇/)).toBeInTheDocument();
      expect(screen.getByText(/清明 \(春\)/)).toBeInTheDocument();
    });
  });

  test('should show one-time date field when custom type is selected', async () => {
    // Arrange
    render(
      <TestWrapper>
        <SmartEventForm />
      </TestWrapper>
    );

    // Act - Select custom type
    const typeSelect = screen.getByLabelText(/事件類型/);
    fireEvent.change(typeSelect, { target: { value: 'custom' } });

    // Assert
    await waitFor(() => {
      expect(screen.getByLabelText(/一次性日期/)).toBeInTheDocument();
    });
  });

  test('should show solar date fields when festival type is selected', async () => {
    // Arrange
    render(
      <TestWrapper>
        <SmartEventForm />
      </TestWrapper>
    );

    // Act - Select festival type
    const typeSelect = screen.getByLabelText(/事件類型/);
    fireEvent.change(typeSelect, { target: { value: 'festival' } });

    // Assert
    await waitFor(() => {
      expect(screen.getByLabelText(/國曆月份/)).toBeInTheDocument();
      expect(screen.getByLabelText(/國曆日期/)).toBeInTheDocument();
    });
  });
});

describe('SmartEventForm - Leap Month Handling', () => {
  
  test('should show leap month options for lunar events', async () => {
    // Arrange
    render(
      <TestWrapper>
        <SmartEventForm />
      </TestWrapper>
    );

    // Act - Select deity type to show lunar fields
    const typeSelect = screen.getByLabelText(/事件類型/);
    fireEvent.change(typeSelect, { target: { value: 'deity' } });

    // Assert
    await waitFor(() => {
      const leapSelect = screen.getByLabelText(/閏月處理/);
      expect(leapSelect).toBeInTheDocument();
      
      // Check leap behavior options
      fireEvent.mouseDown(leapSelect);
      expect(screen.getByText(/從不閏月/)).toBeInTheDocument();
      expect(screen.getByText(/總是閏月/)).toBeInTheDocument();
      expect(screen.getByText(/平閏皆有/)).toBeInTheDocument();
    });
  });
});

describe('SmartEventForm - Validation', () => {
  test('should validate missing lunar fields when deity type selected', async () => {
    render(
      <TestWrapper>
        <SmartEventForm />
      </TestWrapper>
    );
    const typeSelect = screen.getByLabelText(/事件類型/);
    fireEvent.change(typeSelect, { target: { value: 'deity' } });

    // 點擊儲存
    fireEvent.click(screen.getByText(/儲存/));

    await waitFor(() => {
      expect(screen.getByText(/農曆月份必須在 1-12 之間|必填/)).toBeInTheDocument();
      expect(screen.getByText(/農曆日期必須在 1-30 之間|必填/)).toBeInTheDocument();
    });
  });

  test('should validate missing solar fields when festival type selected', async () => {
    render(
      <TestWrapper>
        <SmartEventForm />
      </TestWrapper>
    );
    const typeSelect = screen.getByLabelText(/事件類型/);
    fireEvent.change(typeSelect, { target: { value: 'festival' } });
    fireEvent.click(screen.getByText(/儲存/));
    await waitFor(() => {
      expect(screen.getByText(/國曆月份必須在 1-12 之間|必填/)).toBeInTheDocument();
      expect(screen.getByText(/國曆日期必須在 1-31 之間|必填/)).toBeInTheDocument();
    });
  });
  
  test('should validate required fields', async () => {
    // Arrange
    render(
      <TestWrapper>
        <SmartEventForm />
      </TestWrapper>
    );

    // Act - Try to submit without required fields
    const saveButton = screen.getByText(/儲存/);
    fireEvent.click(saveButton);

    // Assert - Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/事件名稱為必填/)).toBeInTheDocument();
      expect(screen.getByText(/事件類型為必填/)).toBeInTheDocument();
    });
  });

  test('should validate lunar date range', async () => {
    // Arrange
    render(
      <TestWrapper>
        <SmartEventForm />
      </TestWrapper>
    );

    // Act - Select deity type and enter invalid lunar date
    const typeSelect = screen.getByLabelText(/事件類型/);
    fireEvent.change(typeSelect, { target: { value: 'deity' } });

    await waitFor(() => {
      const monthInput = screen.getByLabelText(/農曆月份/);
      const dayInput = screen.getByLabelText(/農曆日期/);
      
      fireEvent.change(monthInput, { target: { value: '13' } }); // Invalid month
      fireEvent.change(dayInput, { target: { value: '32' } }); // Invalid day
    });

    // Assert - Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/農曆月份必須在 1-12 之間/)).toBeInTheDocument();
      expect(screen.getByText(/農曆日期必須在 1-30 之間/)).toBeInTheDocument();
    });
  });
});

describe('SmartEventForm - Integration', () => {
  
  test('should handle complete workflow for lunar event', async () => {
    // Arrange
    render(
      <TestWrapper>
        <SmartEventForm />
      </TestWrapper>
    );

    // Act - Fill out complete lunar event
    fireEvent.change(screen.getByLabelText(/事件名稱/), { 
      target: { value: '媽祖聖誕' } 
    });
    
    fireEvent.change(screen.getByLabelText(/事件類型/), { 
      target: { value: 'deity' } 
    });

    await waitFor(() => {
      fireEvent.change(screen.getByLabelText(/農曆月份/), { 
        target: { value: '3' } 
      });
      
      fireEvent.change(screen.getByLabelText(/農曆日期/), { 
        target: { value: '23' } 
      });
      
      fireEvent.change(screen.getByLabelText(/閏月處理/), { 
        target: { value: 'never_leap' } 
      });
    });

    // Assert - Form should be valid and ready to submit
    const saveButton = screen.getByText(/儲存/);
    expect(saveButton).not.toBeDisabled();
  });
});