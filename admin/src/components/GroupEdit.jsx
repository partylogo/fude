// Groups Edit 組件
import React from 'react';
import {
  Edit,
  SimpleForm,
  TextInput,
  BooleanInput
} from 'react-admin';
import GroupItemsManager from './GroupItemsManager';

const GroupEdit = () => {
  return (
    <Edit>
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
          <GroupItemsManager groupId={1} />
        </div>
      </SimpleForm>
    </Edit>
  );
};

export default GroupEdit;