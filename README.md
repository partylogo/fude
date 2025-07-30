# 民俗通知 App 🏮

一款專為台灣佛道教信眾設計的民俗節慶提醒 iOS App，幫助用戶不錯過重要的神明生日、民俗節慶和定期拜拜日。

## 📱 功能特色

- **近期重要日子**：顯示農曆節慶和神明生日
- **附近廟宇查詢**：基於地理位置的廟宇搜尋
- **個人化通知**：可自訂通知時間和偏好
- **群組推薦**：簡少年老師精選拜拜時機
- **詳細資訊**：神明介紹、廟宇資訊、參拜建議

## 🎨 設計系統

基於 **純粹雙色系統**：
- **深赭紅** `#9D4F4A` - 專門用於行動召喚
- **煙燻灰** `#2F2B27` - 專門用於系統回饋  
- **米杏白** `#F7F3E8` - 溫暖背景色

## 🚀 版本規劃

| 版本 | 週期 | 功能 |
|------|------|------|
| **1.0** | Week 0-2 | 基礎通知功能 (Mock 資料) |
| **1.1** | Week 3-4 | 後端整合 + 認證系統 |
| **2.0** | Week 5-6 | 新增相關活動功能 |
| **2.1** | Week 7-8 | 附近廟宇查詢 |
| **2.2** | Week 9-10 | 詳細頁面 + 地圖整合 |

## 🛠 技術棧

### iOS App
- **Swift 5.9 + SwiftUI 3**
- **Combine + Async/Await**
- **Google Sign-In SDK**
- **Firebase Cloud Messaging**
- **MapKit + Google Maps**

### 後端
- **Vercel Serverless Functions**
- **Supabase (PostgreSQL)**
- **Google OAuth 2.0**

### 後台管理
- **React 19 + Next.js 15**
- **React Admin**
- **TailwindCSS**

## 📐 專案管理

使用 **XcodeGen** 管理專案結構：

```bash
# 重新生成 Xcode 專案
xcodegen generate

# 開啟專案
open fude.xcodeproj
```

## 📁 專案結構

```
fude/
├── doc/                    # 專案文檔
│   ├── prd.md             # 產品需求文檔
│   ├── tech-doc.md        # 技術規格文檔
│   ├── ui-guideline.html  # UI 設計規範
│   └── ui-mockup.html     # UI 頁面原型
├── fude/                  # iOS App 源碼
├── fudeTests/             # 單元測試
├── fudeUITests/           # UI 測試
├── project.yml            # XcodeGen 配置
└── .gitignore            # Git 忽略規則
```

## 🔧 開發環境

### 必要工具
- **Xcode 15+**
- **Swift 5.9+**
- **XcodeGen**
- **Node.js 20+**

### 安裝 XcodeGen
```bash
brew install xcodegen
```

### 開發流程
1. 修改 `project.yml` 配置（如需要）
2. 執行 `xcodegen generate` 重新生成專案
3. 在 Xcode 中開發和測試
4. 遵循 TDD 原則：Red → Green → Refactor

## 📖 文檔

- [產品需求文檔 (PRD)](./doc/prd.md)
- [技術規格文檔](./doc/tech-doc.md)
- [UI 設計規範](./doc/ui-guideline.html)
- [UI 頁面原型](./doc/ui-mockup.html)

## 🎯 開發原則

- **TDD (Test-Driven Development)**
- **Tidy First** - 結構變更與行為變更分離
- **純粹雙色設計哲學**
- **XcodeGen 專案管理**

## 📱 支援平台

- **iOS 16.0+**
- **iPhone 專用**

---

> **開發狀態**: 🚧 準備開始 Version 1.0 開發  
> **最後更新**: 2024-12-19