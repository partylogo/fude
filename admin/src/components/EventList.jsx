// Events List 組件
import React from 'react';
import {
  List,
  Datagrid,
  TextField,
  DateField,
  SelectField,
  EditButton,
  ShowButton,
  DeleteButton
} from 'react-admin';

const EventList = () => {
  const typeChoices = [
    { id: 'deity', name: '神明節日' },
    { id: 'festival', name: '民俗節慶' },
    { id: 'custom', name: '自訂事件' }
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
        <DateField source="solar_date" label="國曆日期" />
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