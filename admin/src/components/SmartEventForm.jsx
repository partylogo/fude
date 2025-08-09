// Smart Event Form - 智能事件表單
// Following Kent Beck's TDD principles (Red → Green → Refactor)
// Dynamic fields based on event type with validation

import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useRecordContext } from 'react-admin';
import {
  SimpleForm,
  TextInput,
  SelectInput,
  DateInput,
  NumberInput,
  required,
  SaveButton,
  Toolbar
} from 'react-admin';
import { getSolarTermChoices } from '../constants/solarTerms';

// Validation functions
const validateTitle = [required('事件名稱為必填')];
const validateType = [required('事件類型為必填')];
const validateDescription = [required('事件描述為必填')];

const validateLunarMonth = (value) => {
  if (value && (value < 1 || value > 12)) {
    return '農曆月份必須在 1-12 之間';
  }
  return undefined;
};

const validateLunarDay = (value) => {
  if (value && (value < 1 || value > 30)) {
    return '農曆日期必須在 1-30 之間';
  }
  return undefined;
};

const validateSolarMonth = (value) => {
  if (value && (value < 1 || value > 12)) {
    return '國曆月份必須在 1-12 之間';
  }
  return undefined;
};

const validateSolarDay = (value) => {
  if (value && (value < 1 || value > 31)) {
    return '國曆日期必須在 1-31 之間';
  }
  return undefined;
};

// Custom toolbar with save button
const SmartEventToolbar = () => (
  <Toolbar>
    <SaveButton label="儲存" />
  </Toolbar>
);

export default function SmartEventForm(props) {
  // 表單層級驗證：依事件類型檢查必要欄位
  const formValidate = (values) => {
    const errors = {};
    const type = values.type;

    if (!type) return errors; // 基本驗證已涵蓋

    const addError = (field, msg) => {
      if (!errors[field]) errors[field] = msg;
    };

    switch (type) {
      case 'deity':
        if (!values.lunar_month) addError('lunar_month', '必填');
        if (!values.lunar_day) addError('lunar_day', '必填');
        break;
      case 'festival':
        if (!values.solar_month) addError('solar_month', '必填');
        if (!values.solar_day) addError('solar_day', '必填');
        break;
      case 'solar_term':
        if (!values.solar_term_name) addError('solar_term_name', '必填');
        break;
      case 'custom':
        if (!values.one_time_date) addError('one_time_date', '必填');
        break;
      default:
        break;
    }

    return errors;
  };
  const record = useRecordContext();
  const [eventType, setEventType] = useState(record?.type || '');

  // Sync eventType when record changes (for Edit view where data loads async)
  React.useEffect(() => {
    setEventType(record?.type || '');
  }, [record?.type]);

  const typeChoices = [
    { id: 'deity', name: '神明節日' },
    { id: 'festival', name: '民俗節慶' },
    { id: 'custom', name: '自訂事件' },
    { id: 'solar_term', name: '節氣事件' }
  ];

  const leapBehaviorChoices = [
    { id: 'never_leap', name: '從不閏月' },
    { id: 'always_leap', name: '總是閏月' },
    { id: 'both', name: '平閏皆有' }
  ];

  // 內嵌型別選擇（置於 SimpleForm 之內，取得 RHF context）
  const TypeSelect = ({ value, onSet }) => {
    const form = useFormContext();
    const handleChange = (event) => {
      const next = event.target.value;
      onSet(next);
      const clear = (fields) => fields.forEach((name) => {
        form.clearErrors(name);
        form.setValue(name, undefined, { shouldValidate: false, shouldDirty: true });
      });
      if (next === 'festival') clear(['lunar_month', 'lunar_day', 'is_leap_month', 'leap_behavior', 'one_time_date', 'solar_term_name']);
      else if (next === 'deity') clear(['solar_month', 'solar_day', 'one_time_date', 'solar_term_name']);
      else if (next === 'custom') clear(['lunar_month', 'lunar_day', 'is_leap_month', 'leap_behavior', 'solar_month', 'solar_day', 'solar_term_name']);
      else if (next === 'solar_term') clear(['lunar_month', 'lunar_day', 'is_leap_month', 'leap_behavior', 'solar_month', 'solar_day', 'one_time_date']);
    };
    return (
      <SelectInput 
        source="type" 
        label="事件類型" 
        choices={typeChoices}
        validate={validateType}
        onChange={handleChange}
        defaultValue={value}
        placeholder="請選擇事件類型"
      />
    );
  };

  return (
    <SimpleForm record={record} toolbar={<SmartEventToolbar />} validate={formValidate} {...props}>
      {/* Basic Fields - Always visible */}
      <TextInput 
        source="title" 
        label="事件名稱" 
        validate={validateTitle}
        fullWidth
        placeholder="請輸入事件名稱"
      />
      
      <TypeSelect value={eventType} onSet={setEventType} />
      
      <TextInput 
        source="description" 
        label="事件描述" 
        validate={validateDescription}
        multiline 
        fullWidth
        placeholder="請輸入事件描述"
      />

      {/* Dynamic Fields based on event type */}
      
      {/* Lunar Fields - Show for deity type */}
      {eventType === 'deity' && (
        <>
          <NumberInput 
            source="lunar_month" 
            label="農曆月份"
            validate={validateLunarMonth}
            min={1}
            max={12}
            placeholder="請輸入農曆月份 (1-12)"
          />
          
          <NumberInput 
            source="lunar_day" 
            label="農曆日期"
            validate={validateLunarDay}
            min={1}
            max={30}
            placeholder="請輸入農曆日期 (1-30)"
          />

          <SelectInput 
            source="is_leap_month" 
            label="是否閏月" 
            choices={[
              { id: false, name: '平月' },
              { id: true, name: '閏月' }
            ]}
            defaultValue={false}
            placeholder="請選擇是否為閏月"
          />
          
          <SelectInput 
            source="leap_behavior" 
            label="閏月處理" 
            choices={leapBehaviorChoices}
            defaultValue="never_leap"
            placeholder="請選擇閏月處理方式"
          />
        </>
      )}

      {/* Solar Term Selection - Show for solar_term type */}
      {eventType === 'solar_term' && (
        <SelectInput 
          source="solar_term_name" 
          label="節氣選擇" 
          choices={getSolarTermChoices()}
          validate={[required('節氣為必選')]}
          placeholder="請選擇節氣"
        />
      )}

      {/* One-time Date - Show for custom type */}
      {eventType === 'custom' && (
        <DateInput 
          source="one_time_date" 
          label="一次性日期"
          placeholder="請選擇一次性事件日期"
        />
      )}

      {/* Solar Date Fields - Show for festival type */}
      {eventType === 'festival' && (
        <>
          <NumberInput 
            source="solar_month" 
            label="國曆月份"
            validate={validateSolarMonth}
            min={1}
            max={12}
            placeholder="請輸入國曆月份 (1-12)"
          />
          
          <NumberInput 
            source="solar_day" 
            label="國曆日期"
            validate={validateSolarDay}
            min={1}
            max={31}
            placeholder="請輸入國曆日期 (1-31)"
          />
        </>
      )}

      {/* Hidden fields for complex date rule system */}
      <input type="hidden" name="is_lunar" value={eventType === 'deity'} />
      <input type="hidden" name="rule_version" value="1" />
    </SimpleForm>
  );
}