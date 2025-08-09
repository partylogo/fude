// Phase 0.25: 資料遷移檢查機制
// 檢查 in-memory 資料與 Supabase 資料的一致性

const getSupabaseClient = require('./supabaseClient');

/**
 * 檢查資料一致性
 * @returns {Promise<{needsMigration: boolean, conflicts: Array, memoryCount: number, dbCount: number}>}
 */
async function checkDataConsistency() {
  const supabase = getSupabaseClient();
  
  if (!supabase) {
    return {
      needsMigration: false,
      conflicts: [],
      memoryCount: 0,
      dbCount: 0,
      error: 'Supabase client not available'
    };
  }

  try {
    // 取得 memory 資料
    const memoryEvents = global.__eventsStore || [];
    
    // 取得 DB 資料
    const { data: dbEvents, error } = await supabase
      .from('events')
      .select('*')
      .order('id', { ascending: true });
      
    if (error) throw error;

    // 檢查衝突
    const conflicts = [];
    
    // 檢查 memory 中有但 DB 沒有的事件
    memoryEvents.forEach(memEvent => {
      const dbEvent = (dbEvents || []).find(db => db.id === memEvent.id);
      if (!dbEvent) {
        conflicts.push({
          type: 'missing_in_db',
          id: memEvent.id,
          title: memEvent.title,
          memoryEvent: memEvent
        });
      } else {
        // 檢查內容是否不同
        if (dbEvent.title !== memEvent.title || 
            dbEvent.description !== memEvent.description ||
            dbEvent.type !== memEvent.type) {
          conflicts.push({
            type: 'content_mismatch',
            id: memEvent.id,
            title: memEvent.title,
            memoryEvent: memEvent,
            dbEvent: dbEvent,
            differences: {
              title: dbEvent.title !== memEvent.title ? { memory: memEvent.title, db: dbEvent.title } : null,
              description: dbEvent.description !== memEvent.description ? { memory: memEvent.description, db: dbEvent.description } : null,
              type: dbEvent.type !== memEvent.type ? { memory: memEvent.type, db: dbEvent.type } : null
            }
          });
        }
      }
    });

    // 檢查 DB 中有但 memory 沒有的事件
    (dbEvents || []).forEach(dbEvent => {
      const memEvent = memoryEvents.find(mem => mem.id === dbEvent.id);
      if (!memEvent) {
        conflicts.push({
          type: 'missing_in_memory',
          id: dbEvent.id,
          title: dbEvent.title,
          dbEvent: dbEvent
        });
      }
    });

    return {
      needsMigration: conflicts.length > 0,
      conflicts: conflicts,
      memoryCount: memoryEvents.length,
      dbCount: (dbEvents || []).length,
      summary: {
        missingInDb: conflicts.filter(c => c.type === 'missing_in_db').length,
        missingInMemory: conflicts.filter(c => c.type === 'missing_in_memory').length,
        contentMismatch: conflicts.filter(c => c.type === 'content_mismatch').length
      }
    };

  } catch (error) {
    return {
      needsMigration: false,
      conflicts: [],
      memoryCount: global.__eventsStore?.length || 0,
      dbCount: 0,
      error: `Data consistency check failed: ${error.message}`
    };
  }
}

/**
 * 將 memory 資料同步到 Supabase
 * @param {Array} conflicts - 衝突列表
 * @returns {Promise<{success: boolean, synced: number, errors: Array}>}
 */
async function syncMemoryToDb(conflicts) {
  const supabase = getSupabaseClient();
  
  if (!supabase) {
    return {
      success: false,
      synced: 0,
      errors: ['Supabase client not available']
    };
  }

  const errors = [];
  let synced = 0;

  try {
    // 只同步 missing_in_db 類型的衝突
    const toSync = conflicts.filter(c => c.type === 'missing_in_db');
    
    for (const conflict of toSync) {
      try {
        const { error } = await supabase
          .from('events')
          .insert({
            id: conflict.memoryEvent.id,
            title: conflict.memoryEvent.title,
            description: conflict.memoryEvent.description,
            type: conflict.memoryEvent.type,
            solar_date: Array.isArray(conflict.memoryEvent.solar_date) 
              ? conflict.memoryEvent.solar_date 
              : [conflict.memoryEvent.solar_date],
            rule_version: 1
          });
          
        if (error) throw error;
        synced++;
        
      } catch (err) {
        errors.push(`Failed to sync event ${conflict.id}: ${err.message}`);
      }
    }

    return {
      success: errors.length === 0,
      synced: synced,
      errors: errors,
      total: toSync.length
    };

  } catch (error) {
    return {
      success: false,
      synced: synced,
      errors: [...errors, `Sync operation failed: ${error.message}`]
    };
  }
}

/**
 * 生成遷移報告
 * @param {Object} consistencyResult - checkDataConsistency 的結果
 * @returns {string} 格式化的報告
 */
function generateMigrationReport(consistencyResult) {
  if (consistencyResult.error) {
    return `❌ 資料檢查失敗: ${consistencyResult.error}`;
  }

  let report = '📊 資料一致性檢查報告\n\n';
  report += `Memory 事件數: ${consistencyResult.memoryCount}\n`;
  report += `Database 事件數: ${consistencyResult.dbCount}\n\n`;

  if (!consistencyResult.needsMigration) {
    report += '✅ 資料一致，無需遷移\n';
    return report;
  }

  report += '⚠️  發現資料不一致，需要處理:\n\n';
  
  if (consistencyResult.summary.missingInDb > 0) {
    report += `- ${consistencyResult.summary.missingInDb} 個事件存在於 Memory 但不在 Database\n`;
  }
  
  if (consistencyResult.summary.missingInMemory > 0) {
    report += `- ${consistencyResult.summary.missingInMemory} 個事件存在於 Database 但不在 Memory\n`;
  }
  
  if (consistencyResult.summary.contentMismatch > 0) {
    report += `- ${consistencyResult.summary.contentMismatch} 個事件內容不一致\n`;
  }

  report += '\n詳細衝突:\n';
  consistencyResult.conflicts.forEach((conflict, index) => {
    report += `${index + 1}. [${conflict.type}] ID: ${conflict.id}, 標題: ${conflict.title}\n`;
  });

  return report;
}

module.exports = {
  checkDataConsistency,
  syncMemoryToDb,
  generateMigrationReport
};