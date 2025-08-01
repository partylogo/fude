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
          if (Array.isArray(record.solar_date) && record.solar_date.length) {
            const dateStr = record.solar_date[0];
            return dateStr ? new Date(dateStr).toLocaleDateString('zh-TW') : '';
          }
          // fallback for festival fixed month/day
          if (record.solar_month && record.solar_day) {
            return `${record.solar_month}/${record.solar_day}`;
          }
          return '';
        }} />
        <TextField source="lunar_month" label="農曆月" />
        <TextField source="lunar_day" label="農曆日" />
        <EditButton />
        <ShowButton />
        <DeleteButton />
      </Datagrid>
    </List>
  );
};

export default EventList;