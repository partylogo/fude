// Events Create 組件 - Updated to use Smart Form
// Following Kent Beck's TDD principles (Red → Green → Refactor)

import React from 'react';
import { Create } from 'react-admin';
import SmartEventForm from './SmartEventForm';
import LunarConverter from './LunarConverter';

const EventCreate = () => {
  return (
    <Create>
      <SmartEventForm />
      
      {/* 農曆轉換工具 */}
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f5f5f5' }}>
        <h3 style={{ color: '#1976d2', marginBottom: '8px' }}>農曆轉換工具</h3>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
          使用此工具將農曆日期轉換為國曆日期，方便填寫上方表單
        </p>
        <LunarConverter />
      </div>
    </Create>
  );
};

export default EventCreate;