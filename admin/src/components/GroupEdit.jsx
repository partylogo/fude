// Groups Edit 組件
import React from 'react';
import { Edit, SimpleForm, TextInput, BooleanInput, useRecordContext, useGetOne } from 'react-admin';
import { useParams } from 'react-router-dom';
import GroupItemsManager from './GroupItemsManager';

const GroupEditForm = () => {
  const record = useRecordContext();
  const { id } = useParams(); // 從 URL 參數取得 ID
  const groupId = record?.id || id; // 使用 record.id 或 URL 參數
  
  console.log(`[GroupEdit] record:`, record);
  console.log(`[GroupEdit] URL params id:`, id);
  console.log(`[GroupEdit] 最終使用的 groupId:`, groupId);
  
  return (
    <SimpleForm>
      <TextInput 
        source="name" 
        label="群組名稱" 
        required 
        fullWidth
      />
      
      <TextInput 
        source="description" 
        label="群組描述" 
        required 
        multiline 
        fullWidth
      />
      
      <BooleanInput 
        source="enabled" 
        label="啟用狀態"
      />
      
      <TextInput 
        source="video_url" 
        label="推薦影片 URL" 
        fullWidth
      />

      {/* 群組事件管理工具 */}
      <div style={{ marginTop: '24px', border: '1px solid #ddd', padding: '16px', borderRadius: '4px' }}>
        <h3 style={{ color: '#1976d2', marginBottom: '16px' }}>群組事件管理</h3>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
          管理此群組包含的事件項目
        </p>
        {groupId ? (
          <GroupItemsManager groupId={parseInt(groupId, 10)} />
        ) : (
          <div style={{ color: '#666', fontStyle: 'italic' }}>
            等待載入群組資料...
          </div>
        )}
      </div>
    </SimpleForm>
  );
};

const GroupEdit = () => {
  return (
    <Edit>
      <GroupEditForm />
    </Edit>
  );
};

export default GroupEdit;