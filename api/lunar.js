// Lunar Calendar API Handler
const LunarCalendarService = require('../services/lunarCalendarService');

const lunarHandler = (req, res) => {
  try {
    const { lunar } = req.body;
    
    // 使用 service 驗證輸入
    const validation = LunarCalendarService.validateLunarDate(lunar);
    if (!validation.isValid) {
      return res.status(400).json({
        error: validation.error
      });
    }
    
    // 使用 service 進行轉換
    const solarDates = LunarCalendarService.convertToSolar(lunar);
    
    res.status(200).json({
      solar_dates: solarDates
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

module.exports = lunarHandler;