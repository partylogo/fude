// Events List 組件
import React from 'react';
import {
  List,
  Datagrid,
  TextField,
  FunctionField,
  SelectField,
  EditButton,
  ShowButton,
  DeleteButton
} from 'react-admin';

const EventList = () => {
  const typeChoices = [
    { id: 'deity', name: '神明節日' },
    { id: 'festival', name: '民俗節慶' },
    { id: 'custom', name: '自訂事件' },
    { id: 'solar_term', name: '節氣事件' }
  ];

  return (
    <List>
      <Datagrid>
        <TextField source="id" label="ID" />
        <TextField source="title" label="事件名稱" />
        <SelectField 
          source="type" 
          label="類型" 
          choices={typeChoices}
        />
        <TextField source="description" label="描述" />
        <FunctionField label="國曆日期" render={record => {
          // 以陣列第一個或字串輸出國曆日期，否則以月/日組合顯示
          const first = Array.isArray(record.solar_date)
            ? (record.solar_date[0] || '')
            : (record.solar_date || '');
          if (typeof first === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(first)) {
            try { return new Date(first).toLocaleDateString('zh-TW'); } catch (_e) {}
          }
          if (record.solar_month && record.solar_day) {
            return `${record.solar_month}/${record.solar_day}`;
          }
          // 若為神明/農曆事件，避免誤導顯示錯誤國曆日期（暫時留空）
          return '';
        }} />
        <FunctionField label="農曆日期" render={record => {
          if (record.lunar_month && record.lunar_day) {
            return `${record.lunar_month}/${record.lunar_day}`;
          }
          return '';
        }} />
        <EditButton />
        <ShowButton />
        <DeleteButton />
      </Datagrid>
    </List>
  );
};

export default EventList;