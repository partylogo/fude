// Events Create 組件
import React from 'react';
import {
  Create,
  SimpleForm,
  TextInput,
  SelectInput,
  DateInput,
  NumberInput,
  BooleanInput
} from 'react-admin';
import LunarConverter from './LunarConverter';

const EventCreate = () => {
  const typeChoices = [
    { id: 'deity', name: '神明節日' },
    { id: 'festival', name: '民俗節慶' },
    { id: 'custom', name: '自訂事件' }
  ];

  return (
    <Create>
      <SimpleForm>
        <TextInput 
          source="title" 
          label="事件名稱" 
          required 
          fullWidth
          placeholder="請輸入事件名稱"
        />
        
        <SelectInput 
          source="type" 
          label="事件類型" 
          choices={typeChoices}
          required 
          placeholder="請選擇事件類型"
        />
        
        <TextInput 
          source="description" 
          label="事件描述" 
          required 
          multiline 
          fullWidth
          placeholder="請輸入事件描述"
        />
        
        <DateInput 
          source="solar_date" 
          label="國曆日期" 
          required 
        />
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
          <NumberInput 
            source="lunar_month" 
            label="農曆月份" 
            min={1} 
            max={12}
            placeholder="1-12"
          />
          
          <NumberInput 
            source="lunar_day" 
            label="農曆日期" 
            min={1} 
            max={30}
            placeholder="1-30"
          />
          
          <BooleanInput 
            source="is_leap_month" 
            label="閏月"
            defaultValue={false}
          />
        </div>
        
        <TextInput 
          source="cover_url" 
          label="封面圖片 URL" 
          fullWidth
          placeholder="https://example.com/image.jpg"
        />
        
        <TextInput 
          source="deity_role" 
          label="神明職掌" 
          fullWidth
          placeholder="例：海上保護神"
        />
        
        <TextInput 
          source="worship_notes" 
          label="祭拜注意事項" 
          multiline 
          fullWidth
          placeholder="例：準備供品、禁忌事項等"
        />

        {/* 農曆轉換器工具 */}
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ color: '#1976d2', marginBottom: '8px' }}>農曆轉換工具</h3>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
            使用此工具將農曆日期轉換為國曆日期，方便填寫上方表單
          </p>
          <LunarConverter />
        </div>
      </SimpleForm>
    </Create>
  );
};

export default EventCreate;