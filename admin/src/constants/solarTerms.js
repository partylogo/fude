// Solar Terms Constants - 24節氣常數檔案 (Frontend Copy)
// 前後端共用，避免硬編碼重複
// Based on admin-date-rule.md design

const SOLAR_TERMS = [
  { name: '立春', order: 1, season: '春', description: '春季開始' },
  { name: '雨水', order: 2, season: '春', description: '降雨增多' },
  { name: '驚蟄', order: 3, season: '春', description: '春雷驚醒萬物' },
  { name: '春分', order: 4, season: '春', description: '春季中點，晝夜等長' },
  { name: '清明', order: 5, season: '春', description: '天清地明，掃墓祭祖' },
  { name: '穀雨', order: 6, season: '春', description: '春雨滋潤穀物' },
  { name: '立夏', order: 7, season: '夏', description: '夏季開始' },
  { name: '小滿', order: 8, season: '夏', description: '麥穗開始飽滿' },
  { name: '芒種', order: 9, season: '夏', description: '收割麥子，播種水稻' },
  { name: '夏至', order: 10, season: '夏', description: '夏季中點，白晝最長' },
  { name: '小暑', order: 11, season: '夏', description: '炎熱開始' },
  { name: '大暑', order: 12, season: '夏', description: '最炎熱時期' },
  { name: '立秋', order: 13, season: '秋', description: '秋季開始' },
  { name: '處暑', order: 14, season: '秋', description: '暑氣消退' },
  { name: '白露', order: 15, season: '秋', description: '露水凝結' },
  { name: '秋分', order: 16, season: '秋', description: '秋季中點，晝夜等長' },
  { name: '寒露', order: 17, season: '秋', description: '露水更冷' },
  { name: '霜降', order: 18, season: '秋', description: '開始降霜' },
  { name: '立冬', order: 19, season: '冬', description: '冬季開始' },
  { name: '小雪', order: 20, season: '冬', description: '開始下雪' },
  { name: '大雪', order: 21, season: '冬', description: '雪量增多' },
  { name: '冬至', order: 22, season: '冬', description: '冬季中點，夜晚最長' },
  { name: '小寒', order: 23, season: '冬', description: '開始寒冷' },
  { name: '大寒', order: 24, season: '冬', description: '最寒冷時期' }
];

/**
 * 取得 React Admin 選項格式的節氣列表
 * @returns {Array} React Admin choices 格式
 */
export const getSolarTermChoices = () => 
  SOLAR_TERMS.map(term => ({ 
    id: term.name, 
    name: `${term.name} (${term.season})`
  }));

/**
 * 根據季節分組的節氣列表
 * @returns {Object} 按季節分組的節氣
 */
export const getSolarTermsBySeason = () => {
  const seasons = { '春': [], '夏': [], '秋': [], '冬': [] };
  SOLAR_TERMS.forEach(term => {
    seasons[term.season].push(term);
  });
  return seasons;
};

/**
 * 根據節氣名稱取得詳細資訊
 * @param {string} name - 節氣名稱
 * @returns {Object|null} 節氣詳細資訊
 */
export const getSolarTermByName = (name) => 
  SOLAR_TERMS.find(term => term.name === name) || null;

/**
 * 驗證節氣名稱是否有效
 * @param {string} name - 節氣名稱
 * @returns {boolean} 是否為有效節氣名稱
 */
export const isValidSolarTerm = (name) => 
  SOLAR_TERMS.some(term => term.name === name);

/**
 * 取得所有節氣名稱列表
 * @returns {Array<string>} 節氣名稱陣列
 */
export const getAllSolarTermNames = () => 
  SOLAR_TERMS.map(term => term.name);

export { SOLAR_TERMS };
export default {
  SOLAR_TERMS,
  getSolarTermChoices,
  getSolarTermsBySeason,
  getSolarTermByName,
  isValidSolarTerm,
  getAllSolarTermNames
};