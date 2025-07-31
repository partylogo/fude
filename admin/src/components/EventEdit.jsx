// Events Edit 組件
import React from 'react';
import {
  Edit,
  SimpleForm,
  TextInput,
  SelectInput,
  DateInput,
  NumberInput,
  BooleanInput
} from 'react-admin';
import LunarConverter from './LunarConverter';

const EventEdit = () => {
  const typeChoices = [
    { id: 'deity', name: '神明節日' },
    { id: 'festival', name: '民俗節慶' },
    { id: 'custom', name: '自訂事件' }
  ];

  return (
    <Edit>
      <SimpleForm>
        <TextInput 
          source="title" 
          label="事件名稱" 
          required 
          fullWidth
        />
        
        <SelectInput 
          source="type" 
          label="事件類型" 
          choices={typeChoices}
          required 
        />
        
        <TextInput 
          source="description" 
          label="事件描述" 
          required 
          multiline 
          fullWidth
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
          />
          
          <NumberInput 
            source="lunar_day" 
            label="農曆日期" 
            min={1} 
            max={30}
          />
          
          <BooleanInput 
            source="is_leap_month" 
            label="閏月"
          />
        </div>
        
        <TextInput 
          source="cover_url" 
          label="封面圖片 URL" 
          fullWidth
        />
        
        <TextInput 
          source="deity_role" 
          label="神明職掌" 
          fullWidth
        />
        
        <TextInput 
          source="worship_notes" 
          label="祭拜注意事項" 
          multiline 
          fullWidth
        />

        {/* 農曆轉換器工具 */}
        <div style={{ marginTop: '24px' }}>
          <LunarConverter />
        </div>
      </SimpleForm>
    </Edit>
  );
};

export default EventEdit;