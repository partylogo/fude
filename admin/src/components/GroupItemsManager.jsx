// Group Items Manager 組件 - 管理群組內的事件
import React, { useState, useEffect } from 'react';

const GroupItemsManager = ({ groupId }) => {
  const [currentItems, setCurrentItems] = useState({ deities: [], festivals: [] });
  const [availableEvents, setAvailableEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // 載入當前群組項目
  const loadCurrentItems = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/items`);
      if (!response.ok) {
        let msg = '載入失敗';
        try { const j = await response.json(); msg = j?.message || msg; } catch(_) {}
        throw new Error(msg);
      }
      const data = await response.json();
      setCurrentItems(data);
    } catch (err) {
      setError('載入群組項目失敗：' + err.message);
    }
  };

  // 載入所有可用事件
  const loadAvailableEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (!response.ok) {
        let msg = '載入失敗';
        try { const j = await response.json(); msg = j?.message || msg; } catch(_) {}
        throw new Error(msg);
      }
      const data = await response.json();
      setAvailableEvents(data.events || []);
    } catch (err) {
      setError('載入事件列表失敗：' + err.message);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([loadCurrentItems(), loadAvailableEvents()]);
      setIsLoading(false);
    };
    
    if (groupId) {
      loadData();
    }
  }, [groupId]);

  // 添加事件到群組
  const addEventToGroup = async (eventId) => {
    if (isMutating) return;
    setIsMutating(true);
    try {
      const response = await fetch(`/api/groups/${groupId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ event_id: eventId })
      });

      if (!response.ok) {
        let msg = '添加失敗';
        try { const j = await response.json(); msg = j?.message || msg; } catch(_) {}
        throw new Error(msg);
      }

      // 重新載入當前項目
      await loadCurrentItems();
    } catch (err) {
      setError('添加事件失敗：' + err.message);
    } finally {
      setIsMutating(false);
    }
  };

  // 從群組移除事件
  const removeEventFromGroup = async (eventId) => {
    if (isMutating) return;
    setIsMutating(true);
    try {
      const response = await fetch(`/api/groups/${groupId}/items/${eventId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        let msg = '移除失敗';
        try { const j = await response.json(); msg = j?.message || msg; } catch(_) {}
        throw new Error(msg);
      }

      // 重新載入當前項目
      await loadCurrentItems();
    } catch (err) {
      setError('移除事件失敗：' + err.message);
    } finally {
      setIsMutating(false);
    }
  };

  // 過濾出未添加的事件
  const getAvailableEventsToAdd = () => {
    const addedEventIds = [
      ...currentItems.deities.map(e => e.id),
      ...currentItems.festivals.map(e => e.id)
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
      <div data-testid="error-message" style={{ 
        padding: '12px', 
        backgroundColor: '#ffebee', 
        border: '1px solid #ffcdd2',
        borderRadius: '4px',
        color: '#d32f2f'
      }}>
        {error}
      </div>
    );
  }

  return (
    <div data-testid="group-items-manager">
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
                  <span>{event.title} ({event.type === 'deity' ? '神明節日' : event.type === 'festival' ? '民俗節慶' : '自訂事件'})</span>
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