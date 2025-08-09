// Group Items Manager 組件 - 管理群組內的事件
import React, { useState, useEffect } from 'react';

const GroupItemsManager = ({ groupId }) => {
  console.log('🔧 GroupItemsManager rendered with groupId:', groupId);
  
  const [currentItems, setCurrentItems] = useState({ deities: [], festivals: [], customEvents: [], solarTerms: [] });
  const [availableEvents, setAvailableEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 載入當前群組項目
  const loadCurrentItems = async () => {
    console.log(`[GroupItemsManager] 開始載入群組 ${groupId} 的項目`);
    try {
      const url = `/api/groups/${groupId}/items`;
      console.log(`[GroupItemsManager] 發送請求到: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'api-version': 'v2'
        }
      });
      
      console.log(`[GroupItemsManager] 回應狀態: ${response.status}`);
      
      if (!response.ok) {
        let msg = '載入失敗';
        try { 
          const j = await response.json(); 
          msg = j?.error || j?.message || msg;
          console.log(`[GroupItemsManager] 錯誤回應:`, j);
        } catch(_) {
          console.log(`[GroupItemsManager] 無法解析錯誤回應`);
        }
        throw new Error(msg);
      }
      
      const data = await response.json();
      console.log(`[GroupItemsManager] 成功載入資料:`, data);
      setCurrentItems(data);
    } catch (err) {
      console.error(`[GroupItemsManager] 載入失敗:`, err);
      setError('載入群組項目失敗：' + err.message);
    }
  };

  // 載入所有可用事件
  const loadAvailableEvents = async () => {
    try {
      const response = await fetch('/api/events', {
        headers: {
          'Content-Type': 'application/json',
          'api-version': 'v2'
        }
      });
      if (!response.ok) {
        let msg = '載入失敗';
        try { const j = await response.json(); msg = j?.error || j?.message || msg; } catch(_) {}
        throw new Error(msg);
      }
      const data = await response.json();
      setAvailableEvents(data.events || []);
    } catch (err) {
      setError('載入事件列表失敗：' + err.message);
    }
  };

  useEffect(() => {
    console.log('=== GroupItemsManager useEffect ===');
    console.log('groupId:', groupId);
    console.log('typeof groupId:', typeof groupId);
    
    const loadData = async () => {
      console.log('開始載入資料...');
      setIsLoading(true);
      await Promise.all([loadCurrentItems(), loadAvailableEvents()]);
      setIsLoading(false);
      console.log('載入完成');
    };
    
    if (groupId) {
      console.log('groupId 有效，開始載入');
      loadData();
    } else {
      console.log('groupId 無效，跳過載入');
    }
    console.log('===================================');
  }, [groupId]);

  // 添加事件到群組
  const addEventToGroup = async (eventId) => {
    if (isMutating) return;
    setIsMutating(true);
    setError(''); // 清除之前的錯誤
    setSuccessMessage(''); // 清除之前的成功訊息
    
    // 找到事件名稱用於顯示
    const event = availableEvents.find(e => e.id === eventId);
    const eventName = event?.title || `事件 ${eventId}`;
    
    try {
      console.log(`[GroupItemsManager] 正在添加事件 ${eventName} (ID: ${eventId}) 到群組 ${groupId}`);
      
      const response = await fetch(`/api/groups/${groupId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-version': 'v2'
        },
        body: JSON.stringify({ event_id: eventId })
      });

      if (!response.ok) {
        let msg = '添加失敗';
        try { const j = await response.json(); msg = j?.error || j?.message || msg; } catch(_) {}
        throw new Error(msg);
      }

      console.log(`[GroupItemsManager] 成功添加事件 ${eventName}`);
      
      // 重新載入當前項目
      await loadCurrentItems();
      
      // 顯示成功訊息
      setSuccessMessage(`成功添加事件「${eventName}」到群組`);
      
      // 3秒後清除成功訊息
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err) {
      console.error(`[GroupItemsManager] 添加事件失敗:`, err);
      setError('添加事件失敗：' + err.message);
    } finally {
      setIsMutating(false);
    }
  };

  // 從群組移除事件
  const removeEventFromGroup = async (eventId) => {
    if (isMutating) return;
    
    // 找到要移除的事件資訊
    const allEvents = [
      ...currentItems.deities,
      ...currentItems.festivals,
      ...currentItems.customEvents,
      ...currentItems.solarTerms
    ];
    const event = allEvents.find(e => e.id === eventId);
    const eventName = event?.title || `事件 ${eventId}`;
    
    // 確認對話框
    const confirmed = window.confirm(`確定要從群組中移除事件「${eventName}」嗎？\n\n這個操作會立即生效。`);
    if (!confirmed) return;
    
    setIsMutating(true);
    setError(''); // 清除之前的錯誤
    setSuccessMessage(''); // 清除之前的成功訊息
    
    try {
      console.log(`[GroupItemsManager] 正在移除事件 ${eventName} (ID: ${eventId}) 從群組 ${groupId}`);
      
      const response = await fetch(`/api/groups/${groupId}/items/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'api-version': 'v2'
        }
      });

      if (!response.ok) {
        let msg = '移除失敗';
        try { const j = await response.json(); msg = j?.error || j?.message || msg; } catch(_) {}
        throw new Error(msg);
      }

      console.log(`[GroupItemsManager] 成功移除事件 ${eventName}`);
      
      // 重新載入當前項目
      await loadCurrentItems();
      
      // 顯示成功訊息
      setSuccessMessage(`成功從群組移除事件「${eventName}」`);
      
      // 3秒後清除成功訊息
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err) {
      console.error(`[GroupItemsManager] 移除事件失敗:`, err);
      setError('移除事件失敗：' + err.message);
    } finally {
      setIsMutating(false);
    }
  };

  // 過濾出未添加的事件
  const getAvailableEventsToAdd = () => {
    const addedEventIds = [
      ...currentItems.deities.map(e => e.id),
      ...currentItems.festivals.map(e => e.id),
      ...currentItems.customEvents.map(e => e.id),
      ...currentItems.solarTerms.map(e => e.id)
    ];
    return availableEvents
      .filter(event => !addedEventIds.includes(event.id))
      .filter(event => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          String(event.title || '').toLowerCase().includes(q) ||
          String(event.type || '').toLowerCase().includes(q)
        );
      });
  };

  if (isLoading) {
    return (
      <div data-testid="loading-indicator" style={{ 
        padding: '20px', 
        textAlign: 'center',
        color: '#666'
      }}>
        載入中...
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div data-testid="error-message" style={{ 
          padding: '12px', 
          backgroundColor: '#ffebee', 
          border: '1px solid #ffcdd2',
          borderRadius: '4px',
          color: '#d32f2f',
          marginBottom: '16px'
        }}>
          {error}
        </div>
        <button 
          onClick={() => {
            setError('');
            loadCurrentItems();
            loadAvailableEvents();
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          重新載入
        </button>
      </div>
    );
  }

  return (
    <div data-testid="group-items-manager">
      {/* 成功訊息 */}
      {successMessage && (
        <div data-testid="success-message" style={{ 
          padding: '12px', 
          backgroundColor: '#e8f5e8', 
          border: '1px solid #c8e6c9',
          borderRadius: '4px',
          color: '#2e7d32',
          marginBottom: '16px'
        }}>
          {successMessage}
        </div>
      )}

      {/* 錯誤訊息 */}
      {error && (
        <div data-testid="error-message" style={{ 
          padding: '12px', 
          backgroundColor: '#ffebee', 
          border: '1px solid #ffcdd2',
          borderRadius: '4px',
          color: '#d32f2f',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}

      {/* 當前群組項目 */}
      <div data-testid="current-items-section" style={{ marginBottom: '24px' }}>
        <h4 style={{ color: '#333', marginBottom: '16px' }}>當前群組事件</h4>
        
        {/* 神明節日 */}
        <div data-testid="deities-section" style={{ marginBottom: '16px' }}>
          <h5 style={{ color: '#1976d2', marginBottom: '8px' }}>神明節日</h5>
          {currentItems.deities.length === 0 ? (
            <p style={{ color: '#666', fontSize: '14px' }}>尚無神明節日</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {currentItems.deities.map(event => (
                <div key={event.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  backgroundColor: '#e3f2fd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  <span>{event.title}</span>
                  <button
                    data-testid={`remove-event-${event.id}`}
                    onClick={() => removeEventFromGroup(event.id)}
                    style={{
                      marginLeft: '8px',
                      padding: '2px 6px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 民俗節慶 */}
        <div data-testid="festivals-section">
          <h5 style={{ color: '#1976d2', marginBottom: '8px' }}>民俗節慶</h5>
          {currentItems.festivals.length === 0 ? (
            <p style={{ color: '#666', fontSize: '14px' }}>尚無民俗節慶</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {currentItems.festivals.map(event => (
                <div key={event.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  backgroundColor: '#f3e5f5',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  <span>{event.title}</span>
                  <button
                    data-testid={`remove-event-${event.id}`}
                    onClick={() => removeEventFromGroup(event.id)}
                    style={{
                      marginLeft: '8px',
                      padding: '2px 6px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 自訂事件 */}
        <div data-testid="custom-events-section" style={{ marginBottom: '16px' }}>
          <h5 style={{ color: '#1976d2', marginBottom: '8px' }}>自訂事件</h5>
          {currentItems.customEvents.length === 0 ? (
            <p style={{ color: '#666', fontSize: '14px' }}>尚無自訂事件</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {currentItems.customEvents.map(event => (
                <div key={event.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  backgroundColor: '#fff3e0',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  <span>{event.title}</span>
                  <button
                    data-testid={`remove-event-${event.id}`}
                    onClick={() => removeEventFromGroup(event.id)}
                    style={{
                      marginLeft: '8px',
                      padding: '2px 6px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 節氣事件 */}
        <div data-testid="solar-terms-section">
          <h5 style={{ color: '#1976d2', marginBottom: '8px' }}>節氣事件</h5>
          {currentItems.solarTerms.length === 0 ? (
            <p style={{ color: '#666', fontSize: '14px' }}>尚無節氣事件</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {currentItems.solarTerms.map(event => (
                <div key={event.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  backgroundColor: '#e8f5e8',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  <span>{event.title}</span>
                  <button
                    data-testid={`remove-event-${event.id}`}
                    onClick={() => removeEventFromGroup(event.id)}
                    style={{
                      marginLeft: '8px',
                      padding: '2px 6px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 添加新事件 */}
      <div data-testid="add-items-section">
        <h4 style={{ color: '#333', marginBottom: '16px' }}>添加事件到群組</h4>
        <div style={{ marginBottom: '12px' }}>
          <input
            data-testid="search-input"
            type="text"
            placeholder="搜尋事件名稱或類型"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>
        <div data-testid="available-events">
          {getAvailableEventsToAdd().length === 0 ? (
            <p style={{ color: '#666', fontSize: '14px' }}>所有事件都已添加到群組中</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {getAvailableEventsToAdd().map(event => (
                <div key={event.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  <span>{event.title} ({
                    event.type === 'deity' ? '神明節日' : 
                    event.type === 'festival' ? '民俗節慶' : 
                    event.type === 'custom' ? '自訂事件' :
                    event.type === 'solar_term' ? '節氣事件' : '其他'
                  })</span>
                  <button
                    data-testid={`add-event-${event.id}`}
                    onClick={() => addEventToGroup(event.id)}
                    disabled={isMutating}
                    style={{
                      marginLeft: '8px',
                      padding: '4px 8px',
                      backgroundColor: '#4caf50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupItemsManager;