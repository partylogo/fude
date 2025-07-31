// 農曆轉換器組件
import React, { useState } from 'react';

const LunarConverter = () => {
  const [lunarMonth, setLunarMonth] = useState('');
  const [lunarDay, setLunarDay] = useState('');
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [solarResult, setSolarResult] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateInput = () => {
    const month = parseInt(lunarMonth);
    const day = parseInt(lunarDay);

    if (!lunarMonth || !lunarDay) {
      setError('請輸入農曆月份和日期');
      return false;
    }

    if (month < 1 || month > 12) {
      setError('月份必須在 1-12 範圍內');
      return false;
    }

    if (day < 1 || day > 30) {
      setError('日期必須在 1-30 範圍內');
      return false;
    }

    setError('');
    return true;
  };

  const handleConvert = async () => {
    if (!validateInput()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/lunar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lunar_month: parseInt(lunarMonth),
          lunar_day: parseInt(lunarDay),
          is_leap_month: isLeapMonth
        })
      });

      if (!response.ok) {
        throw new Error('轉換失敗');
      }

      const result = await response.json();
      setSolarResult(result);
    } catch (err) {
      setError('轉換失敗：' + err.message);
      setSolarResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    // 清除之前的結果
    setSolarResult(null);
    setError('');
  };

  return (
    <div data-testid="lunar-converter" style={{ 
      border: '1px solid #ddd', 
      padding: '16px', 
      margin: '16px 0',
      borderRadius: '4px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>農曆轉國曆</h3>
      
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
            農曆月份：
          </label>
          <input
            data-testid="lunar-month-input"
            type="number"
            min="1"
            max="12"
            value={lunarMonth}
            onChange={handleInputChange(setLunarMonth)}
            placeholder="1-12"
            style={{ width: '80px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
            農曆日期：
          </label>
          <input
            data-testid="lunar-day-input"
            type="number"
            min="1"
            max="30"
            value={lunarDay}
            onChange={handleInputChange(setLunarDay)}
            placeholder="1-30"
            style={{ width: '80px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>
        
        <div>
          <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', marginTop: '20px' }}>
            <input
              data-testid="leap-month-checkbox"
              type="checkbox"
              checked={isLeapMonth}
              onChange={(e) => setIsLeapMonth(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            閏月
          </label>
        </div>
        
        <button
          data-testid="convert-button"
          onClick={handleConvert}
          disabled={isLoading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            marginTop: '20px'
          }}
        >
          {isLoading ? '轉換中...' : '轉換'}
        </button>
      </div>

      {error && (
        <div data-testid="error-message" style={{ 
          color: '#d32f2f', 
          fontSize: '14px', 
          marginBottom: '12px',
          padding: '8px', 
          backgroundColor: '#ffebee', 
          border: '1px solid #ffcdd2',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}

      {solarResult && (
        <div data-testid="solar-result" style={{ 
          marginTop: '12px', 
          padding: '12px', 
          backgroundColor: '#e8f5e8', 
          border: '1px solid #c8e6c9',
          borderRadius: '4px'
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#2e7d32' }}>轉換結果：</h4>
          <p style={{ margin: '4px 0', fontSize: '16px', fontWeight: 'bold' }}>
            國曆日期：{solarResult.solar_date}
          </p>
          <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>
            農曆：{solarResult.lunar_month}月 {solarResult.lunar_day}日 
            {solarResult.is_leap_month ? ' (閏月)' : ''}
          </p>
        </div>
      )}
    </div>
  );
};

export default LunarConverter;