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
    <List sort={{ field: 'id', order: 'DESC' }}>
      <Datagrid>
        <TextField source="id" label="ID" />
        <TextField source="title" label="事件名稱" />
        <SelectField 
          source="type" 
          label="類型" 
          choices={typeChoices}
        />
        <TextField source="description" label="描述" />
        <FunctionField label="下次發生日期/節氣" render={record => {
          // 優先使用 next_occurrence_date（API v2 提供）
          if (record.next_occurrence_date) {
            try { 
              const d = new Date(record.next_occurrence_date); 
              if (!isNaN(d.getTime())) return d.toLocaleDateString('zh-TW'); 
            } catch (_e) {}
          }
          
          // 節氣事件顯示節氣名稱
          if (record.type === 'solar_term' && record.solar_term_name) {
            return `節氣：${record.solar_term_name}`;
          }
          
          // 降級顯示：使用規則欄位資訊
          if (record.rule_fields) {
            const rf = record.rule_fields;
            if (rf.solar_month && rf.solar_day) {
              return `每年 ${rf.solar_month}/${rf.solar_day}`;
            }
            if (rf.lunar_month && rf.lunar_day) {
              const leapText = rf.is_leap_month ? '閏' : '';
              return `農曆 ${leapText}${rf.lunar_month}/${rf.lunar_day}`;
            }
            if (rf.one_time_date) {
              try {
                const d = new Date(rf.one_time_date);
                if (!isNaN(d.getTime())) return `單次：${d.toLocaleDateString('zh-TW')}`;
              } catch (_e) {}
            }
          }
          
          return '--';
        }} />
        <FunctionField label="規則詳情" render={record => {
          // 使用 rule_fields 顯示詳細規則資訊
          if (record.rule_fields) {
            const rf = record.rule_fields;
            if (rf.lunar_month && rf.lunar_day) {
              const leapText = rf.is_leap_month ? '閏' : '';
              const behaviorText = rf.leap_behavior === 'both' ? ' (平閏皆過)' : 
                                   rf.leap_behavior === 'always_leap' ? ' (只過閏月)' : 
                                   rf.leap_behavior === 'never_leap' ? ' (平月)' : '';
              return `農曆 ${leapText}${rf.lunar_month}/${rf.lunar_day}${behaviorText}`;
            }
            if (rf.solar_month && rf.solar_day) {
              return `國曆 ${rf.solar_month}/${rf.solar_day}`;
            }
            if (rf.one_time_date) {
              return `單次事件`;
            }
            if (rf.solar_term_name) {
              return `節氣：${rf.solar_term_name}`;
            }
          }
          
          // 降級顯示：使用舊欄位
          if (record.lunar_month && record.lunar_day) {
            const leapText = record.is_leap_month ? '閏' : '';
            return `農曆 ${leapText}${record.lunar_month}/${record.lunar_day}`;
          }
          if (record.solar_month && record.solar_day) {
            return `國曆 ${record.solar_month}/${record.solar_day}`;
          }
          if (record.solar_term_name) {
            return `節氣：${record.solar_term_name}`;
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