// Phase 1: 統一錯誤結構化處理

/**
 * 創建標準化的錯誤回應
 * @param {number} status - HTTP 狀態碼
 * @param {string} message - 錯誤訊息
 * @param {Object} details - 詳細錯誤資訊
 * @param {string} code - 錯誤代碼（可選）
 * @returns {Object} 標準化錯誤物件
 */
function createErrorResponse(status, message, details = null, code = null) {
  const errorResponse = {
    status,
    message,
    details: details || null
  };
  
  if (code) {
    errorResponse.code = code;
  }
  
  return errorResponse;
}

/**
 * 發送標準化的錯誤回應
 * @param {Object} res - Express response 物件
 * @param {number} status - HTTP 狀態碼
 * @param {string} message - 錯誤訊息
 * @param {Object} details - 詳細錯誤資訊
 * @param {string} code - 錯誤代碼（可選）
 */
function sendError(res, status, message, details = null, code = null) {
  const errorResponse = createErrorResponse(status, message, details, code);
  return res.status(status).json(errorResponse);
}

/**
 * 處理驗證錯誤
 * @param {Object} res - Express response 物件
 * @param {Array} validationErrors - 驗證錯誤陣列
 * @param {string} code - 錯誤代碼（可選）
 */
function sendValidationError(res, validationErrors, code = 'VALIDATION_FAILED') {
  return sendError(res, 400, 'Validation failed', {
    errors: validationErrors
  }, code);
}

/**
 * 處理 Supabase 錯誤
 * @param {Object} res - Express response 物件
 * @param {Error} error - Supabase 錯誤物件
 * @param {string} operation - 操作類型 (create, update, delete, etc.)
 */
function sendSupabaseError(res, error, operation = 'operation') {
  const status = getStatusFromSupabaseError(error);
  const message = `Database ${operation} failed`;
  const details = {
    supabase_error: error.message,
    error_code: error.code || 'UNKNOWN',
    hint: error.hint || null
  };
  
  return sendError(res, status, message, details, `E_DB_${operation.toUpperCase()}`);
}

/**
 * 根據 Supabase 錯誤判斷 HTTP 狀態碼
 * @param {Error} error - Supabase 錯誤物件
 * @returns {number} HTTP 狀態碼
 */
function getStatusFromSupabaseError(error) {
  if (!error.code) return 500;
  
  // PostgreSQL 錯誤碼對應
  switch (error.code) {
    case 'PGRST116': // not found
      return 404;
    case '23505': // unique violation
    case '23503': // foreign key violation
    case '23514': // check constraint violation
      return 409;
    case '23502': // not null violation
    case '22001': // string data right truncated
      return 400;
    default:
      return 500;
  }
}

/**
 * 處理內部伺服器錯誤
 * @param {Object} res - Express response 物件
 * @param {Error} error - 錯誤物件
 * @param {string} code - 錯誤代碼
 */
function sendInternalError(res, error, code = 'INTERNAL_ERROR') {
  console.error(`[${code}] Internal error:`, error);
  
  const details = process.env.NODE_ENV === 'development' ? {
    error_message: error.message,
    stack: error.stack
  } : null;
  
  return sendError(res, 500, 'Internal server error', details, code);
}

module.exports = {
  createErrorResponse,
  sendError,
  sendValidationError, 
  sendSupabaseError,
  sendInternalError,
  getStatusFromSupabaseError
};