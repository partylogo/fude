# 環境變數設定指南

## ⚠️ 雲端部署必須設定的環境變數

### **Vercel 環境變數**

在你的 Vercel Dashboard → Settings → Environment Variables 中添加：

```bash
# 嚴格模式（防止假成功）
ENFORCE_DB_WRITES=true
READ_FALLBACK=false

# Supabase 設定  
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...your_anon_key

# API 設定
NODE_ENV=production
```

### **問題診斷**

如果沒有設定 `ENFORCE_DB_WRITES=true`：
- 創建事件時如果 Supabase 連接失敗
- 系統會"假裝成功"但實際沒有寫入資料庫
- 前端收到 200 回應但 DB 裡沒有資料

### **立即修正**

1. **設定 Vercel 環境變數**
2. **重新部署** Vercel 應用
3. **執行 migration** 確保資料庫 schema 正確