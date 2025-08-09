// API Endpoint Tester 組件 - 診斷 API 連接問題
import React, { useState } from 'react';

const APIEndpointTester = () => {
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 候選的 API 端點
  const candidateURLs = [
    'http://localhost:3000/api',
    '/api', // 相對路徑
    'https://fude.vercel.app/api',
    'https://folklore.vercel.app/api',
    'https://fude-backend.vercel.app/api',
    'https://fude-api.vercel.app/api'
  ];

  const testEndpoint = async (baseUrl) => {
    console.log(`🔍 Testing endpoint: ${baseUrl}`);
    
    try {
      const testUrl = `${baseUrl}/events`;
      const response = await fetch(testUrl, {
        headers: {
          'Content-Type': 'application/json',
          'api-version': 'v2'
        }
      });
      
      console.log(`📊 ${baseUrl} - Status: ${response.status}`);
      const contentType = response.headers.get('content-type');
      console.log(`📊 ${baseUrl} - Content-Type: ${contentType}`);
      
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log(`✅ ${baseUrl} - Success:`, data);
        return {
          url: baseUrl,
          status: 'success',
          statusCode: response.status,
          contentType,
          data: data?.events ? `Found ${data.events.length} events` : 'Data received',
          error: null
        };
      } else if (response.ok) {
        const text = await response.text();
        const isHtml = text.includes('<html>') || text.includes('<!doctype html>');
        console.log(`⚠️ ${baseUrl} - HTML Response (${isHtml ? 'HTML' : 'Text'})`);
        return {
          url: baseUrl,
          status: 'html_response',
          statusCode: response.status,
          contentType,
          data: `Returns ${isHtml ? 'HTML' : 'text'} instead of JSON`,
          error: null
        };
      } else {
        console.log(`❌ ${baseUrl} - HTTP ${response.status}`);
        return {
          url: baseUrl,
          status: 'http_error',
          statusCode: response.status,
          contentType,
          data: null,
          error: `HTTP ${response.status}`
        };
      }
      
    } catch (error) {
      console.log(`💥 ${baseUrl} - Network Error:`, error.message);
      return {
        url: baseUrl,
        status: 'network_error',
        statusCode: null,
        contentType: null,
        data: null,
        error: error.message
      };
    }
  };

  const runTests = async () => {
    console.log('🚀 Starting API endpoint tests...');
    setIsLoading(true);
    setTestResults([]);
    
    const results = [];
    
    for (const url of candidateURLs) {
      const result = await testEndpoint(url);
      results.push(result);
      setTestResults([...results]); // Update UI with partial results
    }
    
    console.log('✅ All tests completed:', results);
    setIsLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return '#4caf50';
      case 'html_response': return '#ff9800';
      case 'http_error': return '#f44336';
      case 'network_error': return '#9e9e9e';
      default: return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'success': return '✅ 成功';
      case 'html_response': return '⚠️ 回應HTML';
      case 'http_error': return '❌ HTTP錯誤';
      case 'network_error': return '💥 網絡錯誤';
      default: return '❓ 未知';
    }
  };

  return (
    <div style={{
      padding: '20px',
      border: '2px solid #1976d2',
      borderRadius: '8px',
      backgroundColor: '#f8f9fa',
      margin: '20px 0'
    }}>
      <h3 style={{ color: '#1976d2', marginBottom: '16px' }}>
        🔍 API 端點診斷工具
      </h3>
      
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
        測試多個可能的 API 端點，找出正確的生產環境 URL
      </p>

      <button 
        onClick={runTests}
        disabled={isLoading}
        style={{
          padding: '12px 20px',
          backgroundColor: isLoading ? '#ccc' : '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          marginBottom: '20px'
        }}
      >
        {isLoading ? '測試中...' : '開始測試 API 端點'}
      </button>

      {testResults.length > 0 && (
        <div>
          <h4 style={{ color: '#333', marginBottom: '12px' }}>測試結果:</h4>
          
          {testResults.map((result, index) => (
            <div 
              key={index}
              style={{
                padding: '12px',
                margin: '8px 0',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: 'white'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <code style={{ 
                  backgroundColor: '#f5f5f5', 
                  padding: '2px 6px', 
                  borderRadius: '3px',
                  fontSize: '12px'
                }}>
                  {result.url}
                </code>
                <span style={{ 
                  color: getStatusColor(result.status),
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}>
                  {getStatusText(result.status)}
                </span>
              </div>
              
              <div style={{ fontSize: '12px', color: '#666' }}>
                {result.statusCode && (
                  <div>狀態碼: <code>{result.statusCode}</code></div>
                )}
                {result.contentType && (
                  <div>內容類型: <code>{result.contentType}</code></div>
                )}
                {result.data && (
                  <div>回應: <code>{result.data}</code></div>
                )}
                {result.error && (
                  <div style={{ color: '#f44336' }}>錯誤: <code>{result.error}</code></div>
                )}
              </div>
            </div>
          ))}
          
          {/* 給出建議 */}
          {testResults.some(r => r.status === 'success') && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#e8f5e8',
              border: '1px solid #4caf50',
              borderRadius: '4px'
            }}>
              <strong style={{ color: '#2e7d32' }}>✅ 建議:</strong>
              <div style={{ fontSize: '14px', marginTop: '4px' }}>
                使用以下成功的端點更新 dataProvider.js:
                {testResults
                  .filter(r => r.status === 'success')
                  .map(r => (
                    <div key={r.url} style={{ marginTop: '4px' }}>
                      <code style={{ 
                        backgroundColor: '#c8e6c9', 
                        padding: '2px 6px', 
                        borderRadius: '3px'
                      }}>
                        {r.url}
                      </code>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default APIEndpointTester;