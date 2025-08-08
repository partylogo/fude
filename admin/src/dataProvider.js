// Data Provider - 連接本地 API
import axios from 'axios';
import { HttpError } from 'react-admin';

// 支援雲端部署：優先讀取環境變數，否則相對路徑 /api
const API_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// 創建 axios 實例
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // 防止某些瀏覽器/內容阻擋器把 /events 認成追蹤器時阻擋
  withCredentials: false,
});

const dataProvider = {
  apiUrl: API_URL,

  // 取得列表
  getList: async (resource, params) => {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;
    
    try {
      let url = `/${resource}`;
      const queryParams = new URLSearchParams();
      
      // 添加分頁參數（如果 API 支援）
      if (page && perPage) {
        queryParams.append('page', page);
        queryParams.append('perPage', perPage);
      }
      
      // 添加排序參數（如果 API 支援）
      if (field && order) {
        queryParams.append('sortBy', field);
        queryParams.append('order', order.toLowerCase());
      }
      
      // 添加過濾參數
      Object.keys(params.filter).forEach(key => {
        queryParams.append(key, params.filter[key]);
      });
      
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
      
      const response = await apiClient.get(url);
      
      // 處理不同的 API 回應格式
      let data, total;
      if (resource === 'events' && response.data.events) {
        data = response.data.events.map(evt => ({
          ...evt,
          // ensure solar_date is string for DateField
          solar_date: Array.isArray(evt.solar_date) ? evt.solar_date[0] : evt.solar_date,
        }));
        total = data.length;
      } else if (resource === 'groups' && response.data.groups) {
        data = response.data.groups;
        total = data.length;
      } else {
        data = Array.isArray(response.data) ? response.data : [response.data];
        total = data.length;
      }
      
      return {
        data,
        total
      };
    } catch (error) {
      const status = error?.response?.status || 500;
      const message = error?.response?.data?.message || error.message || 'Unknown error';
      const body = error?.response?.data;
      throw new HttpError(message, status, body);
    }
  },

  // 取得單一資源
  getOne: async (resource, params) => {
    try {
      const response = await apiClient.get(`/${resource}/${params.id}`);
      let data = response.data;
      if (resource === 'events') {
        const first = Array.isArray(data.solar_date) ? (data.solar_date[0] || null) : data.solar_date;
        data = { ...data, solar_date: first };
      }
      return { data };
    } catch (error) {
      const status = error?.response?.status || 500;
      const message = error?.response?.data?.message || error.message || 'Unknown error';
      const body = error?.response?.data;
      throw new HttpError(message, status, body);
    }
  },

  // 建立資源
  create: async (resource, params) => {
    try {
      let data = { ...params.data };
      const type = data.type;
      const isEmpty = (v) => v === undefined || v === null || v === '';
      Object.keys(data).forEach((k) => { if (isEmpty(data[k])) delete data[k]; });
      if (resource === 'events') {
        if (type === 'festival') {
          delete data.lunar_month; delete data.lunar_day; delete data.is_leap_month; delete data.leap_behavior; delete data.one_time_date; delete data.solar_term_name;
        } else if (type === 'deity') {
          delete data.solar_month; delete data.solar_day; delete data.one_time_date; delete data.solar_term_name;
        } else if (type === 'custom') {
          delete data.solar_month; delete data.solar_day; delete data.lunar_month; delete data.lunar_day; delete data.solar_term_name;
        } else if (type === 'solar_term') {
          delete data.solar_month; delete data.solar_day; delete data.lunar_month; delete data.lunar_day; delete data.one_time_date;
        }
        delete data.solar_date;
      }
      const response = await apiClient.post(`/${resource}`, data);
      return {
        data: response.data
      };
    } catch (error) {
      const status = error?.response?.status || 500;
      const message = error?.response?.data?.message || error.message || 'Unknown error';
      const body = error?.response?.data;
      throw new HttpError(message, status, body);
    }
  },

  // 更新資源
  update: async (resource, params) => {
    try {
      let data = { ...params.data };
      // 清洗：移除空字串或 null 的鍵，並移除不屬於該類型的欄位
      const type = data.type;
      const isEmpty = (v) => v === undefined || v === null || v === '';
      Object.keys(data).forEach((k) => {
        if (isEmpty(data[k])) delete data[k];
      });
      if (resource === 'events') {
        if (type === 'festival') {
          delete data.lunar_month; delete data.lunar_day; delete data.is_leap_month; delete data.leap_behavior; delete data.one_time_date; delete data.solar_term_name;
        } else if (type === 'deity') {
          delete data.solar_month; delete data.solar_day; delete data.one_time_date; delete data.solar_term_name;
        } else if (type === 'custom') {
          delete data.solar_month; delete data.solar_day; delete data.lunar_month; delete data.lunar_day; delete data.solar_term_name;
        } else if (type === 'solar_term') {
          delete data.solar_month; delete data.solar_day; delete data.lunar_month; delete data.lunar_day; delete data.one_time_date;
        }
        // 不讓前端主動寫入 solar_date（由後端規則推導）
        delete data.solar_date;
      }
      const response = await apiClient.put(`/${resource}/${params.id}`, data);
      return {
        data: response.data
      };
    } catch (error) {
      const status = error?.response?.status || 500;
      const message = error?.response?.data?.message || error.message || 'Unknown error';
      const body = error?.response?.data;
      throw new HttpError(message, status, body);
    }
  },

  // 刪除資源
  delete: async (resource, params) => {
    try {
      const response = await apiClient.delete(`/${resource}/${params.id}`);
      return {
        data: response.data
      };
    } catch (error) {
      const status = error?.response?.status || 500;
      const message = error?.response?.data?.message || error.message || 'Unknown error';
      const body = error?.response?.data;
      throw new HttpError(message, status, body);
    }
  },

  // 批量刪除
  deleteMany: async (resource, params) => {
    try {
      const promises = params.ids.map(id => 
        apiClient.delete(`/${resource}/${id}`)
      );
      const responses = await Promise.all(promises);
      return {
        data: responses.map(response => response.data)
      };
    } catch (error) {
      const status = error?.response?.status || 500;
      const message = error?.response?.data?.message || error.message || 'Unknown error';
      const body = error?.response?.data;
      throw new HttpError(message, status, body);
    }
  },

  // 批量更新
  updateMany: async (resource, params) => {
    try {
      const promises = params.ids.map(id => 
        apiClient.put(`/${resource}/${id}`, params.data)
      );
      const responses = await Promise.all(promises);
      return {
        data: responses.map(response => response.data)
      };
    } catch (error) {
      throw new Error(`API Error: ${error.message}`);
    }
  },

  // 取得多個資源
  getMany: async (resource, params) => {
    try {
      const promises = params.ids.map(id => 
        apiClient.get(`/${resource}/${id}`)
      );
      const responses = await Promise.all(promises);
      return {
        data: responses.map(response => response.data)
      };
    } catch (error) {
      throw new Error(`API Error: ${error.message}`);
    }
  }
};

export default dataProvider;