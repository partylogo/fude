// Groups Create 組件
import React from 'react';
import {
  Create,
  SimpleForm,
  TextInput,
  BooleanInput
} from 'react-admin';

const GroupCreate = () => {
  return (
    <Create>
      <SimpleForm>
        <TextInput 
          source="name" 
          label="群組名稱" 
          required 
          fullWidth
          placeholder="請輸入群組名稱"
        />
        
        <TextInput 
          source="description" 
          label="群組描述" 
          required 
          multiline 
          fullWidth
          placeholder="請輸入群組描述"
        />
        
        <BooleanInput 
          source="enabled" 
          label="啟用狀態"
          defaultValue={true}
        />
        
        <TextInput 
          source="video_url" 
          label="推薦影片 URL" 
          fullWidth
          placeholder="https://www.youtube.com/watch?v=..."
        />

        {/* 說明文字 */}
        <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <h3 style={{ color: '#1976d2', marginBottom: '8px' }}>建立群組說明</h3>
          <p style={{ color: '#666', fontSize: '14px', margin: '4px 0' }}>
            • 群組名稱：為群組設定一個清楚的名稱，例如「簡少年老師推薦」
          </p>
          <p style={{ color: '#666', fontSize: '14px', margin: '4px 0' }}>
            • 群組描述：詳細說明此群組的用途和包含的事件類型
          </p>
          <p style={{ color: '#666', fontSize: '14px', margin: '4px 0' }}>
            • 啟用狀態：控制此群組是否對用戶可見
          </p>
          <p style={{ color: '#666', fontSize: '14px', margin: '4px 0' }}>
            • 推薦影片：可選，提供相關的 YouTube 影片連結
          </p>
          <p style={{ color: '#888', fontSize: '12px', marginTop: '12px' }}>
            建立群組後，您可以在編輯頁面中添加和管理群組內的事件項目。
          </p>
        </div>
      </SimpleForm>
    </Create>
  );
};

export default GroupCreate;