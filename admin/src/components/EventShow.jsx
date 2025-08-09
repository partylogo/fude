// Event Show - 顯示事件詳細資訊（使用 API v2 的 next_occurrence_date）
import React from 'react';
import { Show, SimpleShowLayout, TextField, FunctionField, useRecordContext } from 'react-admin';

function formatNextOccurrence(record) {
  // 優先使用 next_occurrence_date（API v2）
  if (record?.next_occurrence_date) {
    try { 
      const d = new Date(record.next_occurrence_date); 
      if (!isNaN(d.getTime())) return d.toLocaleDateString('zh-TW'); 
    } catch (_e) {}
  }
  return '';
}

const EventShowContent = () => {
  const record = useRecordContext();
  if (!record) return null;
  return (
    <SimpleShowLayout>
      <TextField source="id" label="ID" />
      <TextField source="title" label="事件名稱" />
      <TextField source="type" label="類型" />
      <TextField source="description" label="描述" />
      <FunctionField label="下次發生日期" render={(r) => {
        const nextDate = formatNextOccurrence(r);
        if (nextDate) return nextDate;
        if (r?.type === 'solar_term' && r?.solar_term_name) return `節氣：${r.solar_term_name}`;
        return '--';
      }} />
      <FunctionField label="事件規則" render={(r) => {
        // 使用 rule_fields 顯示完整規則資訊
        if (r?.rule_fields) {
          const rf = r.rule_fields;
          const parts = [];
          
          if (rf.lunar_month && rf.lunar_day) {
            const leapText = rf.is_leap_month ? '閏' : '';
            parts.push(`農曆 ${leapText}${rf.lunar_month}月${rf.lunar_day}日`);
            if (rf.leap_behavior) {
              const behaviorText = rf.leap_behavior === 'both' ? '平閏皆過' : 
                                   rf.leap_behavior === 'always_leap' ? '只過閏月' : 
                                   rf.leap_behavior === 'never_leap' ? '平月' : '';
              parts.push(`(${behaviorText})`);
            }
          }
          
          if (rf.solar_month && rf.solar_day) {
            parts.push(`國曆 每年${rf.solar_month}月${rf.solar_day}日`);
          }
          
          if (rf.one_time_date) {
            try {
              const d = new Date(rf.one_time_date);
              if (!isNaN(d.getTime())) parts.push(`單次事件：${d.toLocaleDateString('zh-TW')}`);
            } catch (_e) {}
          }
          
          if (rf.solar_term_name) {
            parts.push(`節氣：${rf.solar_term_name}`);
          }
          
          return parts.join(' ');
        }
        
        // 降級顯示
        const parts = [];
        if (r?.lunar_month && r?.lunar_day) {
          const leapText = r.is_leap_month ? '閏' : '';
          parts.push(`農曆 ${leapText}${r.lunar_month}月${r.lunar_day}日`);
        }
        if (r?.solar_month && r?.solar_day) {
          parts.push(`國曆 ${r.solar_month}月${r.solar_day}日`);
        }
        if (r?.one_time_date) {
          parts.push(`單次事件：${r.one_time_date}`);
        }
        if (r?.solar_term_name) {
          parts.push(`節氣：${r.solar_term_name}`);
        }
        
        return parts.join(' ') || '--';
      }} />
      <TextField source="next_occurrence_date" label="API 下次發生日期 (原始)" />
      <TextField source="solar_term_name" label="節氣名稱" />
    </SimpleShowLayout>
  );
};

export default function EventShow(props) {
  return (
    <Show {...props}>
      <EventShowContent />
    </Show>
  );
}

