// Event Show - 安全顯示事件詳細資訊（避免 Guesser 對無效日期格式化崩潰）
import React from 'react';
import { Show, SimpleShowLayout, TextField, FunctionField, useRecordContext } from 'react-admin';

function formatGregorian(record) {
  const value = Array.isArray(record?.solar_date) ? record.solar_date[0] : record?.solar_date;
  if (typeof value !== 'string') return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
  try { const d = new Date(value); if (!isNaN(d.getTime())) return d.toLocaleDateString('zh-TW'); } catch (_e) {}
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
      <FunctionField label="國曆日期" render={formatGregorian} />
      <FunctionField label="農曆日期" render={(r) => (r?.lunar_month && r?.lunar_day ? `${r.lunar_month}/${r.lunar_day}` : '')} />
      <TextField source="solar_term_name" label="節氣" />
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

