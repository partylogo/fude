// Groups Edit 組件
import React from 'react';
import { Edit, SimpleForm, TextInput, BooleanInput, useRecordContext, useGetOne } from 'react-admin';
import { useParams } from 'react-router-dom';
import GroupItemsManager from './GroupItemsManager';

const GroupEditForm = () => {
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
    </SimpleForm>
  );
};

const GroupItemsSection = () => {
  const record = useRecordContext();
  const { id } = useParams();
  const groupId = record?.id || id;
  
  React.useEffect(() => {
    console.log('=== GroupEdit Debug Info ===');
    console.log('record:', record);
    console.log('URL params id:', id);
    console.log('最終使用的 groupId:', groupId);
    console.log('=============================');
  }, [record, id, groupId]);
  
  if (!groupId) {
    return (
      <div style={{ 
        marginTop: '24px', 
        border: '1px solid #ddd', 
        padding: '16px', 
        borderRadius: '4px',
        backgroundColor: '#f5f5f5'
      }}>
        <h3 style={{ color: '#1976d2', marginBottom: '16px' }}>群組事件管理</h3>
        <div style={{ color: '#666', fontStyle: 'italic' }}>
          等待載入群組資料...
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      marginTop: '24px', 
      border: '1px solid #ddd', 
      padding: '16px', 
      borderRadius: '4px',
      backgroundColor: '#fafafa'
    }}>
      <h3 style={{ color: '#1976d2', marginBottom: '16px' }}>群組事件管理</h3>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
        管理此群組包含的事件項目。這些變更會立即生效，不需要點擊「保存」按鈕。
      </p>
      <GroupItemsManager groupId={parseInt(groupId, 10)} />
    </div>
  );
};

const GroupEdit = () => {
  return (
    <Edit>
      <GroupEditForm />
      <GroupItemsSection />
    </Edit>
  );
};

export default GroupEdit;