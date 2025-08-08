// Groups List 組件
import React from 'react';
import {
  List,
  Datagrid,
  TextField,
  BooleanField,
  UrlField,
  EditButton,
  ShowButton,
  DeleteButton
} from 'react-admin';

const GroupList = () => {
  return (
    <List>
      <Datagrid>
        <TextField source="id" label="ID" />
        <TextField source="name" label="群組名稱" />
        <TextField source="description" label="描述" />
        <BooleanField source="enabled" label="啟用狀態" />
        <UrlField source="video_url" label="推薦影片" emptyText="" />
        <EditButton />
        <ShowButton />
        <DeleteButton />
      </Datagrid>
    </List>
  );
};

export default GroupList;