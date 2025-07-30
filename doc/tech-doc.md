# 民俗通知 App 技術規格

> 本文件針對 AI 程式協作工具（如 Cursor、Github Copilot）撰寫，提供 **逐步可執行** 的開發細節。涵蓋 Version 1.0 \~ 2.2 完整路線圖、系統架構、資料模型、API、模組切割、部署與測試。請依章節順序實作。

---

## 0. 版本里程碑

| 版本                | 預估週期       | 重點功能                                        | 交付物                                                                      |
| ----------------- | ---------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| **Version 1.0 (通知 app 雛形)** | Week 0‑2   | 首頁、近期重要日子、基礎通知設定、資料使用 mock data | • iOS IPA (基礎版)<br>• Mock 資料系統                                              |
| **Version 1.1 (通知 app 完整版)** | Week 3‑4   | 新增 Onboarding 流程、資料使用後台資料、後台管理系統（民俗日期管理） | • iOS IPA<br>• Vercel Functions + Supabase schema v1<br>• React Admin v1 |
| **Version 2.0 (新增相關活動)**   | Week 5‑6   | 首頁新增「近期相關活動」Section、後台新增相關活動管理功能            | • 活動資料表 & API<br>• 首頁 UI 更新                                              |
| **Version 2.1 (新增附近廟宇)**   | Week 7‑8  | 首頁新增查看附近廟宇功能、附近相關廟宇詳細頁、廟宇資料庫建置、後台新增相關廟宇管理功能     | • temple schema & geo index<br>• 附近廟宇頁面          |
| **Version 2.2 (地圖整合)**   | Week 9‑10 | 加入廟宇詳細頁、加入神明詳細頁、地圖整合功能（複製地址、開啟 Google 地圖）                         | • MapKit + Google Maps Deep‑Link<br>• 詳細頁面完成                                                                    |

> **後續**：V5.x 可擴充 Android、Web PWA、帳號同步等。

---

## 1. 技術棧

### **iOS App**
- **Swift 5.9 + SwiftUI 3**
  - Combine + Async/Await 資料流
  - MapKit (V3.0) & URL Scheme
- **Google Sign-In SDK 7.0+**
- **Firebase SDK**：推播通知
- **設計系統**：基於 UI Guideline 的 SwiftUI 元件庫

### **雲端 API**
- **Vercel Serverless** (Node 20 ESM)
  - Edge Function (Lunar cache)
  - Firebase Admin SDK v12
- **Google OAuth 2.0**：身份驗證

### **資料庫**
- **Supabase** (PostgreSQL 15)
  - Row‑Level Security / Realtime
  - Storage (圖片上傳)

### **後台管理**
- **React 19 + Next.js 15** (App Router)
- **TailwindCSS**：基於設計系統的配置
- **React Admin**：CRUD 介面

### **第三方整合**
- **Firebase Cloud Messaging**：推播通知
- **Google Maps API**：地圖與深度連結
- **GA4**：數據分析

> **架構選擇理由**：免費額度足以支撐 ≤5k MAU；serverless 自動擴充；一鍵預覽環境。

---

## 2. 系統架構

```
(iOS App) ⇆ HTTPS ⇆ Vercel API Route
                             │
                             ├─► Google OAuth 2.0
                             ├─► Edge Function (Lunar Cache @KV)
                             └─► Supabase (PostgreSQL + Storage)
                                          │
     (React Admin ↔) ─────────┘           │ realtime / RLS
                                          │
    Firebase FCM ◀────────────────────────┘ push service
                                          │
    Google Maps API ◀─────────────────────┘ 深度連結
```

### **資料流**
- **認證流程**：Google OAuth → Supabase Auth → JWT Token
- **資料同步**：Supabase Realtime → iOS combine subscriber
- **快取策略**：Lunar 日期計算結果 30d TTL 於 Vercel KV；Events JSON 1h SW cache
- **安全性**：Supabase RLS 以 `user_id = auth.uid()`；Functions 取自環境變數

---

## 3. 設計系統實作

### 3.1 SwiftUI 設計系統

基於 `ui-guideline.html` 的設計規範：

```swift
// Core/DesignSystem/Colors.swift
extension Color {
    // 核心色彩系統 - 純粹雙色系統（基於 UI Guideline）
    static let brickRed = Color(red: 0.616, green: 0.310, blue: 0.290) // #9D4F4A
    static let smokyCharcoal = Color(red: 0.184, green: 0.168, blue: 0.153) // #2F2B27
    static let warmIvory = Color(red: 0.969, green: 0.953, blue: 0.910) // #F7F3E8
    
    // 煙燻灰延伸系列
    static let charcoalLight = Color(red: 0.290, green: 0.271, blue: 0.247) // #4A453F
    static let charcoalMedium = Color(red: 0.227, green: 0.208, blue: 0.188) // #3A3530
    static let charcoalSoft = Color(red: 0.184, green: 0.168, blue: 0.153).opacity(0.6)
    static let charcoalSubtle = Color(red: 0.184, green: 0.168, blue: 0.153).opacity(0.1)
    static let charcoalBorder = Color(red: 0.184, green: 0.168, blue: 0.153).opacity(0.15)
    
    // 米杏白延伸系列
    static let ivoryWarm = Color(red: 0.949, green: 0.929, blue: 0.878) // #F2EDE0
    static let ivoryCool = Color(red: 0.992, green: 0.988, blue: 0.969) // #FDFCF7
    static let ivoryPure = Color.white
    
    // 語意化命名（基於UI Guideline純粹雙色哲學）
    static let primaryColor = brickRed        // 紅色專門用於行動召喚
    static let secondaryColor = charcoalLight // 灰色專門用於系統回饋
    static let backgroundColor = warmIvory
    static let surfaceColor = ivoryPure
    static let surfaceWarm = ivoryWarm
    static let surfaceHighlight = ivoryCool
    static let textPrimary = smokyCharcoal
    static let textSecondary = charcoalSoft
    static let textSubtle = charcoalSubtle
    static let borderColor = charcoalBorder
}

// Core/DesignSystem/Typography.swift
extension Font {
    static let titleLarge = Font.system(size: 32, weight: .bold)      // H1
    static let titleMedium = Font.system(size: 24, weight: .bold)     // H2
    static let titleSmall = Font.system(size: 20, weight: .medium)    // H3
    static let bodyLarge = Font.system(size: 16, weight: .regular)    // Body
    static let bodySmall = Font.system(size: 14, weight: .regular)    // Caption
    static let labelSmall = Font.system(size: 12, weight: .regular)   // Small
}

// Core/DesignSystem/Spacing.swift
enum Spacing {
    static let xs: CGFloat = 4
    static let sm: CGFloat = 8
    static let md: CGFloat = 16
    static let lg: CGFloat = 24
    static let xl: CGFloat = 32
    static let xxl: CGFloat = 48
}
```

### 3.2 共用元件

```swift
// Core/DesignSystem/Components/PrimaryButton.swift
struct PrimaryButton: View {
    let title: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.bodyLarge)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, Spacing.sm)
                .background(Color.primaryColor)
                .cornerRadius(8)
        }
        .buttonStyle(PrimaryButtonStyle())
    }
}

// Core/DesignSystem/Components/SecondaryButton.swift
struct SecondaryButton: View {
    let title: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.bodyLarge)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, Spacing.sm)
                .background(Color.secondaryColor)
                .cornerRadius(8)
        }
        .buttonStyle(SecondaryButtonStyle())
    }
}

// Core/DesignSystem/Components/CheckboxListView.swift
// 統一的選擇頁面設計（對應PRD要求）
struct CheckboxListView<Item: CheckboxItem>: View {
    let title: String
    let selectedItems: [Item]
    let availableItems: [Item]
    let onToggle: (Item) -> Void
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 0) {
                    // 已選擇項目 Section
                    if !selectedItems.isEmpty {
                        SectionHeaderView(title: "已選擇的\(getSectionName()) (\(selectedItems.count))", icon: "✅")
                        
                        LazyVStack(spacing: Spacing.sm) {
                            ForEach(selectedItems, id: \.id) { item in
                                CheckboxRowView(
                                    item: item,
                                    isSelected: true,
                                    onToggle: { onToggle(item) }
                                )
                            }
                        }
                        .padding(.horizontal, Spacing.md)
                    }
                    
                    // 其他可選項目 Section
                    SectionHeaderView(title: "其他\(getSectionName())", icon: "📅")
                    
                    LazyVStack(spacing: Spacing.sm) {
                        ForEach(availableItems.filter { !selectedItems.contains($0) }, id: \.id) { item in
                            CheckboxRowView(
                                item: item,
                                isSelected: false,
                                onToggle: { onToggle(item) }
                            )
                        }
                    }
                    .padding(.horizontal, Spacing.md)
                }
            }
            .navigationTitle(title)
            .background(Color.backgroundColor)
        }
    }
    
    private func getSectionName() -> String {
        if Item.self == Event.self {
            return selectedItems.first?.type == .deity ? "神明" : "節慶"
        }
        return "項目"
    }
}

// Core/DesignSystem/Components/CheckboxRowView.swift
struct CheckboxRowView<Item: CheckboxItem>: View {
    let item: Item
    let isSelected: Bool
    let onToggle: () -> Void
    
    var body: some View {
        Button(action: onToggle) {
            HStack(spacing: Spacing.md) {
                // Checkbox
                ZStack {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(isSelected ? Color.primaryColor : Color.clear)
                        .frame(width: 24, height: 24)
                        .overlay(
                            RoundedRectangle(cornerRadius: 6)
                                .stroke(isSelected ? Color.primaryColor : Color.borderColor, lineWidth: 2)
                        )
                    
                    if isSelected {
                        Image(systemName: "checkmark")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.white)
                    }
                }
                
                // 項目資訊
                VStack(alignment: .leading, spacing: 2) {
                    Text(item.displayName)
                        .font(.bodyLarge)
                        .fontWeight(.medium)
                        .foregroundColor(.textPrimary)
                    
                    Text(item.dateDescription)
                        .font(.bodySmall)
                        .foregroundColor(.textSecondary)
                }
                
                Spacer()
            }
            .padding(Spacing.md)
            .background(Color.surfaceColor)
            .cornerRadius(12)
            .shadow(color: Color.textSubtle, radius: 2, x: 0, y: 2)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// Core/DesignSystem/Components/SectionHeaderView.swift
struct SectionHeaderView: View {
    let title: String
    let icon: String
    
    var body: some View {
        HStack(spacing: Spacing.sm) {
            ZStack {
                Circle()
                    .fill(Color.primaryColor)
                    .frame(width: 26, height: 26)
                
                Text(icon)
                    .font(.system(size: 13))
            }
            
            Text(title)
                .font(.titleSmall)
                .fontWeight(.semibold)
                .foregroundColor(.textPrimary)
            
            Spacer()
        }
        .padding(.horizontal, Spacing.md)
        .padding(.vertical, Spacing.sm)
    }
}

// 按鈕樣式
struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .opacity(configuration.isPressed ? 0.9 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

// 協議定義
protocol CheckboxItem: Identifiable, Equatable {
    var displayName: String { get }
    var dateDescription: String { get }
}

extension Event: CheckboxItem {
    var displayName: String { title }
    var dateDescription: String { 
        if let lunarDate = lunarDate {
            return "農曆 \(lunarDate.month)/\(lunarDate.day)"
        }
        return solarDate?.formatted(date: .abbreviated, time: .omitted) ?? ""
    }
}
```

---

## 4. 資料庫設計

### 4.1 核心表結構

> SQL DDL 建議使用 Supabase Migrations。以下為核心表（除特別標註外皆含 `created_at`, `updated_at` timestamp）。

#### users
| 欄位            | 型別      | 備註                |
| ------------- | ------- | ----------------- |
| id            | uuid PK | Supabase Auth UID |
| email         | text    | 唯一                |
| display\_name | text    |                   |
| google\_id    | text    | Google OAuth ID   |
| avatar\_url   | text    |                   |
| locale        | text    | 預設 `zh-TW`        |

#### devices
| 欄位        | 型別        | 備註           |
| --------- | --------- | ------------ |
| id        | uuid PK   |              |
| user\_id  | uuid FK   | → users      |
| token     | text      | APNs/FCM token |
| platform  | varchar(10) | ios/android  |
| is\_active | boolean   | 預設 true      |

#### events
| 欄位           | 型別                        | 備註      |
| ------------ | ------------------------- | ------- |
| id           | serial PK                 |         |
| type         | enum(festival,deity,custom) |         |
| title        | text                      |         |
| lunar\_month | int                       | 1‑12    |
| lunar\_day   | int                       | 1‑30    |
| solar\_date  | date\[]                   | 一年多對照   |
| description  | text                      |         |
| cover\_url   | text                      |         |
| deity\_role  | text                      | 神明職掌（V4.0） |
| worship\_notes | text                    | 拜拜須知（V4.0） |

#### temples (V3.0)
| 欄位            | 型別           | 備註        |
| ------------- | ------------ | --------- |
| id            | serial PK    |           |
| name          | text         |           |
| address       | text         |           |
| lat           | numeric(9,6) |           |
| lng           | numeric(9,6) |           |
| main\_deity   | text         |           |
| open\_time    | text         |           |
| phone         | text         |           |
| rating        | numeric(2,1) |           |
| introduction  | text         | 寺廟簡介      |
| features      | text         | 參拜特色      |
| transportation | text        | 交通資訊      |
| worship\_tips | text         | 參拜建議      |

> **地理索引**：`CREATE INDEX temples_location_idx ON temples USING gist (ll_to_earth(lat,lng));`

#### activities (V2.0)
| 欄位          | 型別           | 備註               |
| ----------- | ------------ | ---------------- |
| id          | serial PK    |                  |
| temple\_id  | int FK       | → temples        |
| event\_id   | int FK       | → events nullable |
| title       | text         |                  |
| start\_at   | timestamptz  |                  |
| end\_at     | timestamptz  |                  |
| description | text         |                  |

#### groups & group_items
```sql
-- 自定義群組（如：簡少年老師推薦）
CREATE TABLE groups (
    id serial PRIMARY KEY,
    name text NOT NULL,
    description text,
    enabled boolean DEFAULT true,
    video_url text, -- 推薦影片連結
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE group_items (
    group_id int REFERENCES groups(id),
    event_id int REFERENCES events(id),
    PRIMARY KEY (group_id, event_id)
);
```

#### notification_settings
| 欄位            | 型別      | 備註                                    |
| ------------- | ------- | ------------------------------------- |
| user\_id      | uuid PK | → users                               |
| enable\_all   | boolean | 總開關，預設 true                          |
| advance\_days | int     | 提前通知天數，預設 1                          |
| notify\_time  | time    | 通知時間，預設 '08:00'                      |
| newmoon\_enabled | boolean | 初一提醒                                  |
| fullmoon\_enabled | boolean | 十五提醒                                 |
| custom\_enabled | boolean | 自定提醒                                  |

#### user_event_subscriptions
| 欄位        | 型別     | 備註       |
| --------- | ------ | -------- |
| user\_id  | uuid   | → users  |
| event\_id | int    | → events |
| enabled   | boolean | 預設 true  |

#### user_group_subscriptions
| 欄位        | 型別     | 備註       |
| --------- | ------ | -------- |
| user\_id  | uuid   | → users  |
| group\_id | int    | → groups |
| enabled   | boolean | 預設 true  |

#### notification_logs
| 欄位            | 型別                        | 備註    |
| ------------- | ------------------------- | ----- |
| id            | serial PK                 |       |
| user\_id      | uuid                      |       |
| event\_id     | int                       |       |
| scheduled\_at | timestamptz               |       |
| sent\_at      | timestamptz nullable      |       |
| status        | enum(queued,sent,failed)  |       |
| error\_message | text                     |       |
| retry\_count  | int DEFAULT 0             | 重試次數  |

---

## 5. API 設計

### 5.1 認證相關

| Method | Path                    | 描述           | 版本  |
| ------ | ----------------------- | ------------ | --- |
| POST   | `/api/auth/google`      | Google 登入驗證  | 1.1 |
| PUT    | `/api/user/device-token` | 更新推播 token  | 1.1 |
| GET    | `/api/user/profile`     | 取得用戶資料     | 1.1 |

### 5.2 核心功能

| Method | Path                                        | 描述                             | 版本  |
| ------ | ------------------------------------------- | ------------------------------ | --- |
| GET    | `/api/events?from=2025‑01‑01&to=2025‑12‑31` | 節慶/神明清單 (含對應國曆)                | 1.1 |
| GET    | `/api/events/:id`                           | 事件詳細                           | 1.1 |
| GET    | `/api/deities/:id`                          | 神明詳細資訊                         | 2.2 |
| GET    | `/api/temples?lat=…&lng=…&radius=10`        | 附近寺廟                           | 2.1 |
| GET    | `/api/temples/:id`                          | 寺廟詳細資訊                         | 2.2 |
| GET    | `/api/temples/:id/activities`               | 特定寺廟活動                         | 2.1 |
| GET    | `/api/activities?event_id=`                 | 相關活動                           | 2.0 |
| POST   | `/api/lunar`                                | lunar→solar 批次換算 (Edge cached) | 1.1 |

### 5.3 通知系統

| Method | Path                          | 描述           | 版本  |
| ------ | ----------------------------- | ------------ | --- |
| GET    | `/api/user/settings`          | 取得通知設定       | 1.0 |
| PUT    | `/api/user/settings`          | 更新通知設定       | 1.0 |
| POST   | `/api/notifications/schedule` | 排程使用者通知      | 1.1 |
| GET    | `/api/groups`                 | 取得推薦群組列表     | 1.1 |
| GET    | `/api/groups/:id`             | 取得群組詳細資訊     | 1.1 |
| GET    | `/api/groups/:id/items`       | 取得群組包含的事件列表  | 1.1 |
| PUT    | `/api/user/group-subscriptions` | 更新用戶群組訂閱狀態 | 1.1 |

### 5.4 API 範例

#### Google 登入
```typescript
// POST /api/auth/google
{
  "idToken": "google_id_token_here"
}

// Response
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "display_name": "使用者",
    "avatar_url": "https://..."
  },
  "supabase_token": "jwt_token",
  "expires_at": "2025-01-01T00:00:00Z"
}
```

#### 事件列表
```typescript
// GET /api/events?from=2025-03-15&to=2025-04-30
[
  {
    "id": 88,
    "type": "deity",
    "title": "媽祖聖誕",
    "lunar": { "month": 3, "day": 23, "isLeap": false },
    "solar_date": "2025-04-20",
    "description": "海上女神媽祖的誕辰",
    "cover_url": "https://cdn.supabase.com/events/88.jpg",
    "countdown_days": 3
  }
]
```

#### 群組詳細資訊
```typescript
// GET /api/groups/1
{
  "id": 1,
  "name": "簡少年老師 2025 拜拜推薦",
  "description": "簡少年老師精選2025年最重要的拜拜時機",
  "enabled": true,
  "video_url": "https://www.youtube.com/watch?v=example123",
  "created_at": "2024-12-01T00:00:00Z"
}

// GET /api/groups/1/items
{
  "deities": [
    {
      "id": 88,
      "title": "媽祖",
      "lunar": { "month": 3, "day": 23 },
      "solar_date": "2025-04-20"
    },
    {
      "id": 45,
      "title": "財神爺",
      "lunar": { "month": 3, "day": 15 },
      "solar_date": "2025-04-12"
    }
  ],
  "festivals": [
    {
      "id": 1,
      "title": "農曆新年",
      "lunar": { "month": 1, "day": 1 },
      "solar_date": "2025-01-29"
    },
    {
      "id": 15,
      "title": "清明節",
      "solar_date": "2025-04-05"
    }
  ]
}
```

#### 附近廟宇查詢
```typescript
// GET /api/temples?lat=24.1477&lng=120.6736&radius=10&deity=媽祖
[
  {
    "id": 123,
    "name": "鹿港天后宮",
    "address": "彰化縣鹿港鎮中山路430號",
    "lat": 24.1477,
    "lng": 120.6736,
    "main_deity": "媽祖",
    "rating": 4.8,
    "distance": 1.2,
    "open_time": "05:00-22:00",
    "phone": "(04) 777-9899",
    "special_event": {
      "title": "媽祖聖誕慶典法會",
      "date": "2025-04-20",
      "time": "09:00-16:00"
    }
  }
]
```

---

## 6. iOS App 架構

### 6.1 專案結構

```
FolkloreApp/
  ├─ Core/
  │   ├─ DesignSystem/          # 設計系統
  │   │   ├─ Colors.swift
  │   │   ├─ Typography.swift
  │   │   ├─ Spacing.swift
  │   │   └─ Components/
  │   │       ├─ PrimaryButton.swift
  │   │       ├─ SecondaryButton.swift
  │   │       ├─ CheckboxListView.swift
  │   │       ├─ CheckboxRowView.swift
  │   │       ├─ SectionHeaderView.swift
  │   │       ├─ EventCardView.swift
  │   │       └─ TempleCardView.swift
  │   ├─ Model/                 # 資料模型
  │   │   ├─ Event.swift
  │   │   ├─ Temple.swift
  │   │   ├─ Activity.swift
  │   │   ├─ Group.swift
  │   │   ├─ User.swift
  │   │   └─ NotificationSettings.swift
  │   ├─ Network/               # 網路層
  │   │   ├─ APIService.swift
  │   │   ├─ AuthManager.swift
  │   │   └─ SupabaseClient.swift
  │   ├─ Auth/                  # 認證系統
  │   │   ├─ GoogleSignInManager.swift
  │   │   └─ AuthViewModel.swift
  │   └─ Services/              # 服務層
  │       ├─ NotificationManager.swift
  │       ├─ LocationManager.swift
  │       ├─ LunarCalendarService.swift
  │       └─ URLService.swift
  ├─ Features/
  │   ├─ Onboarding/           # V1.0 - 引導流程
  │   │   ├─ OnboardingView.swift
  │   │   ├─ PermissionView.swift
  │   │   └─ OnboardingViewModel.swift
  │   ├─ Home/                 # V1.0 - 首頁（Tab 1）
  │   │   ├─ HomeView.swift
  │   │   ├─ EventCardView.swift
  │   │   ├─ ActivityCardView.swift    # V2.0
  │   │   └─ HomeViewModel.swift
  │   ├─ Settings/             # V1.0 - 通知設定頁（Tab 2）
  │   │   ├─ SettingsView.swift
  │   │   ├─ NotificationSettingsView.swift
  │   │   ├─ DeitySelectionView.swift   # 頁面5：神明選擇
  │   │   ├─ FestivalSelectionView.swift # 頁面6：民俗節慶選擇
  │   │   ├─ GroupDetailView.swift      # 頁面7：簡少年老師推薦詳細
  │   │   └─ SettingsViewModel.swift
  │   ├─ Temple/               # V3.0 - 寺廟相關功能
  │   │   ├─ NearbyTemplesView.swift    # 頁面2：附近相關廟宇詳細
  │   │   ├─ TempleDetailView.swift     # 頁面8：寺廟詳細頁面
  │   │   ├─ TempleCardView.swift
  │   │   └─ TempleViewModel.swift
  │   ├─ Deity/               # V1.0 - 神明相關
  │   │   ├─ DeityDetailView.swift      # 頁面3：神明詳細頁面
  │   │   └─ DeityViewModel.swift
  │   └─ Activity/            # V2.0 - 活動功能
  │       ├─ ActivityListView.swift
  │       └─ ActivityViewModel.swift
  ├─ Resources/
  │   ├─ Assets.xcassets
  │   ├─ Localizable.strings
  │   ├─ GoogleService-Info.plist
  │   └─ Info.plist
  └─ AppEntry.swift
```

#### 對應 UI Mockup 的 8 個頁面：

| 頁面編號 | 頁面名稱              | SwiftUI 檔案                      | 觸發方式                     | 版本 |
| ---- | ----------------- | ------------------------------- | ------------------------ | ---- |
| 1    | 首頁（Tab 1）        | Features/Home/HomeView.swift    | Tab 導航                   | 1.0 |
| 2    | 附近相關廟宇詳細頁面      | Features/Temple/NearbyTemplesView.swift | 首頁「查看附近相關廟宇」按鈕       | 2.1 |
| 3    | 神明詳細頁面          | Features/Deity/DeityDetailView.swift | 點擊首頁神明生日卡片             | 2.2 |
| 4    | 通知設定頁面（Tab 2）   | Features/Settings/SettingsView.swift | Tab 導航                   | 1.0 |
| 5    | 神明選擇頁面          | Features/Settings/DeitySelectionView.swift | 通知設定「已選擇4位神明」         | 1.0 |
| 6    | 民俗節慶選擇頁面        | Features/Settings/FestivalSelectionView.swift | 通知設定「已選擇6個節慶」         | 1.0 |
| 7    | 簡少年老師推薦詳細頁面     | Features/Settings/GroupDetailView.swift | 通知設定「已選擇8項推薦」         | 1.1 |
| 8    | 寺廟詳細頁面          | Features/Temple/TempleDetailView.swift | 點擊寺廟卡片                 | 2.2 |

> **注意**：忽略今日運勢功能，首頁快速功能卡片僅作為預留區域。

### 6.2 核心特性

- **狀態管理**：ObservableObject + Combine
- **路由系統**：NavigationStack + DeepLink (`folklore://temple/:id`)
- **離線支援**：Event & Temple 緩存於 CoreData
- **無障礙**：支援 Dynamic Type、VoiceOver
- **通知**：UNUserNotificationCenter + FCM

### 6.3 頁面實作詳細

#### 群組詳細頁面（頁面7）
```swift
// Features/Settings/GroupDetailView.swift
import SwiftUI

struct GroupDetailView: View {
    let group: Group
    @StateObject private var viewModel = SettingsViewModel()
    @State private var showingVideoAlert = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Spacing.lg) {
                    // 群組介紹區塊
                    VStack(spacing: Spacing.md) {
                        HStack {
                            Rectangle()
                                .fill(Color.surfaceHighlight)
                                .frame(height: 120)
                                .cornerRadius(12)
                                .overlay(
                                    Text("📹 觀看推薦影片")
                                        .font(.bodyLarge)
                                        .fontWeight(.medium)
                                        .foregroundColor(.primaryColor)
                                )
                                .onTapGesture {
                                    openVideoURL()
                                }
                        }
                        .padding(.horizontal, Spacing.md)
                        
                        Text(group.description)
                            .font(.bodyLarge)
                            .foregroundColor(.textPrimary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, Spacing.md)
                    }
                    
                    // 已選擇的神明
                    if !viewModel.selectedDeities.isEmpty {
                        VStack(alignment: .leading, spacing: Spacing.sm) {
                            SectionHeaderView(title: "已選擇的神明 (\(viewModel.selectedDeities.count))", icon: "👸")
                            
                            LazyVStack(spacing: Spacing.sm) {
                                ForEach(viewModel.selectedDeities, id: \.id) { deity in
                                    CheckboxRowView(
                                        item: deity,
                                        isSelected: true,
                                        onToggle: { }  // 唯讀模式
                                    )
                                }
                            }
                            .padding(.horizontal, Spacing.md)
                        }
                    }
                    
                    // 已選擇的節慶
                    if !viewModel.selectedFestivals.isEmpty {
                        VStack(alignment: .leading, spacing: Spacing.sm) {
                            SectionHeaderView(title: "已選擇的節慶 (\(viewModel.selectedFestivals.count))", icon: "🏮")
                            
                            LazyVStack(spacing: Spacing.sm) {
                                ForEach(viewModel.selectedFestivals, id: \.id) { festival in
                                    CheckboxRowView(
                                        item: festival,
                                        isSelected: true,
                                        onToggle: { }  // 唯讀模式
                                    )
                                }
                            }
                            .padding(.horizontal, Spacing.md)
                        }
                    }
                }
            }
            .navigationTitle(group.name)
            .background(Color.backgroundColor)
            .task {
                await viewModel.loadGroupItems(groupId: group.id)
            }
        }
    }
    
    private func openVideoURL() {
        guard let videoURL = group.videoURL,
              let url = URL(string: videoURL) else {
            return
        }
        
        URLService.shared.openExternalURL(url)
    }
}
```

#### 地圖整合與地址功能
```swift
// Core/Services/URLService.swift
import UIKit

class URLService {
    static let shared = URLService()
    private init() {}
    
    // 開啟外部URL（YouTube影片）
    func openExternalURL(_ url: URL) {
        DispatchQueue.main.async {
            UIApplication.shared.open(url)
        }
    }
    
    // 複製地址到剪貼簿
    func copyAddressToClipboard(_ address: String) {
        UIPasteboard.general.string = address
        
        // 觸覺反饋
        let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
        impactFeedback.impactOccurred()
        
        // 顯示提示（可選）
        showCopySuccessToast()
    }
    
    // 開啟Google Maps
    func openGoogleMaps(for temple: Temple) {
        let addressEncoded = temple.address.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        let googleMapsURL = "https://www.google.com/maps/search/?api=1&query=\(addressEncoded)"
        
        if let url = URL(string: googleMapsURL) {
            openExternalURL(url)
        }
    }
    
    // 使用座標開啟Google Maps（更精確）
    func openGoogleMapsWithCoordinates(lat: Double, lng: Double, name: String) {
        let nameEncoded = name.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        let googleMapsURL = "https://www.google.com/maps/search/?api=1&query=\(lat),\(lng)&query_place_id=\(nameEncoded)"
        
        if let url = URL(string: googleMapsURL) {
            openExternalURL(url)
        }
    }
    
    private func showCopySuccessToast() {
        // 簡單的Toast提示實作
        DispatchQueue.main.async {
            guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                  let window = windowScene.windows.first else { return }
            
            let toastLabel = UILabel()
            toastLabel.text = "地址已複製到剪貼簿"
            toastLabel.textAlignment = .center
            toastLabel.font = UIFont.systemFont(ofSize: 14)
            toastLabel.textColor = .white
            toastLabel.backgroundColor = UIColor.black.withAlphaComponent(0.8)
            toastLabel.layer.cornerRadius = 8
            toastLabel.clipsToBounds = true
            
            let textSize = toastLabel.intrinsicContentSize
            toastLabel.frame = CGRect(
                x: (window.bounds.width - textSize.width - 32) / 2,
                y: window.bounds.height - 150,
                width: textSize.width + 32,
                height: textSize.height + 16
            )
            
            window.addSubview(toastLabel)
            
            UIView.animate(withDuration: 0.3, delay: 1.5, options: .curveEaseOut) {
                toastLabel.alpha = 0
            } completion: { _ in
                toastLabel.removeFromSuperview()
            }
        }
    }
}
```

#### 寺廟詳細頁面（頁面8）
```swift
// Features/Temple/TempleDetailView.swift
import SwiftUI

struct TempleDetailView: View {
    let temple: Temple
    @State private var showingActionSheet = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.lg) {
                    // 寺廟基本資訊
                    VStack(alignment: .leading, spacing: Spacing.md) {
                        HStack {
                            Text("🏛️")
                                .font(.system(size: 36))
                            
                            VStack(alignment: .leading) {
                                Text(temple.name)
                                    .font(.titleMedium)
                                    .fontWeight(.bold)
                                    .foregroundColor(.textPrimary)
                                
                                HStack {
                                    Text(temple.address)
                                        .font(.bodyLarge)
                                        .foregroundColor(.textSecondary)
                                    
                                    if let rating = temple.rating {
                                        HStack(spacing: 2) {
                                            Text("⭐")
                                            Text(String(format: "%.1f", rating))
                                                .font(.bodySmall)
                                                .foregroundColor(.textSecondary)
                                        }
                                    }
                                }
                            }
                            
                            Spacer()
                        }
                        
                        // 行動按鈕
                        HStack(spacing: Spacing.sm) {
                            SecondaryButton(title: "複製地址") {
                                URLService.shared.copyAddressToClipboard(temple.address)
                            }
                            
                            PrimaryButton(title: "開啟地圖") {
                                URLService.shared.openGoogleMapsWithCoordinates(
                                    lat: temple.lat,
                                    lng: temple.lng,
                                    name: temple.name
                                )
                            }
                        }
                    }
                    .padding(.horizontal, Spacing.md)
                    
                    // 基本資訊區塊
                    DetailSectionView(title: "基本資訊") {
                        VStack(alignment: .leading, spacing: Spacing.sm) {
                            InfoRowView(label: "主祀神明", value: temple.mainDeity)
                            InfoRowView(label: "開放時間", value: temple.openTime ?? "請電洽")
                            if let phone = temple.phone {
                                InfoRowView(label: "電話", value: phone)
                            }
                        }
                    }
                    
                    // 寺廟簡介
                    if let introduction = temple.introduction {
                        DetailSectionView(title: "寺廟簡介") {
                            Text(introduction)
                                .font(.bodyLarge)
                                .foregroundColor(.textPrimary)
                                .lineSpacing(4)
                        }
                    }
                    
                    // 參拜特色
                    if let features = temple.features {
                        DetailSectionView(title: "參拜特色") {
                            Text(features)
                                .font(.bodyLarge)
                                .foregroundColor(.textPrimary)
                                .lineSpacing(4)
                        }
                    }
                    
                    // 交通資訊
                    if let transportation = temple.transportation {
                        DetailSectionView(title: "交通資訊") {
                            Text(transportation)
                                .font(.bodyLarge)
                                .foregroundColor(.textPrimary)
                                .lineSpacing(4)
                        }
                    }
                    
                    // 參拜建議
                    if let worshipTips = temple.worshipTips {
                        DetailSectionView(title: "參拜建議") {
                            Text(worshipTips)
                                .font(.bodyLarge)
                                .foregroundColor(.textPrimary)
                                .lineSpacing(4)
                        }
                    }
                }
            }
            .navigationTitle(temple.name)
            .navigationBarTitleDisplayMode(.inline)
            .background(Color.backgroundColor)
        }
    }
}

// 輔助元件
struct DetailSectionView<Content: View>: View {
    let title: String
    let content: Content
    
    init(title: String, @ViewBuilder content: () -> Content) {
        self.title = title
        self.content = content()
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text(title)
                .font(.titleSmall)
                .fontWeight(.semibold)
                .foregroundColor(.textPrimary)
            
            content
        }
        .padding(.horizontal, Spacing.md)
    }
}

struct InfoRowView: View {
    let label: String
    let value: String
    
    var body: some View {
        HStack(alignment: .top) {
            Text(label)
                .font(.bodyLarge)
                .fontWeight(.medium)
                .foregroundColor(.textSecondary)
                .frame(width: 80, alignment: .leading)
            
            Text(value)
                .font(.bodyLarge)
                .foregroundColor(.textPrimary)
                .multilineTextAlignment(.leading)
            
            Spacer()
        }
    }
}
```

### 6.4 Google 登入整合

```swift
// Core/Auth/GoogleSignInManager.swift
import GoogleSignIn
import FirebaseAuth

class GoogleSignInManager: ObservableObject {
    @Published var isSignedIn = false
    @Published var currentUser: User?
    
    func signIn() async throws {
        guard let presentingViewController = await UIApplication.shared.windows.first?.rootViewController else {
            throw AuthError.noPresentingViewController
        }
        
        let result = try await GIDSignIn.sharedInstance.signIn(withPresenting: presentingViewController)
        let idToken = result.user.idToken?.tokenString
        
        // 發送到後端驗證並取得 Supabase token
        let response = try await APIService.shared.googleSignIn(idToken: idToken)
        
        // 設定 Supabase session
        try await SupabaseClient.shared.auth.setSession(
            accessToken: response.supabaseToken,
            refreshToken: response.refreshToken
        )
        
        await MainActor.run {
            self.isSignedIn = true
            self.currentUser = response.user
        }
    }
}
```

---

## 7. React Admin 後台

### 7.1 專案結構

```
admin/
├─ pages/app/
│   ├─ dashboard/            # 總覽儀表板
│   ├─ events/              # 民俗日期管理
│   │   ├─ index.tsx        # 列表頁
│   │   ├─ [id]/edit.tsx    # 編輯頁
│   │   └─ create.tsx       # 新增頁
│   ├─ temples/             # 寺廟管理 (V3.0)
│   ├─ activities/          # 活動管理 (V2.0)
│   ├─ groups/              # 群組管理
│   ├─ users/               # 用戶統計（唯讀）
│   └─ notifications/       # 推播記錄
├─ components/
│   ├─ LunarConverter.tsx   # 農曆轉換工具
│   ├─ ImageUploader.tsx    # 圖片上傳
│   └─ MapPicker.tsx        # 地圖選點 (V3.0)
└─ lib/
    ├─ supabase.ts
    └─ utils.ts
```

### 7.2 特殊功能

#### 農曆轉換器
```tsx
// components/LunarConverter.tsx
export function LunarConverter({ onConvert }: { onConvert: (dates: Date[]) => void }) {
  const [lunar, setLunar] = useState({ month: 1, day: 1 });
  
  const handleConvert = async () => {
    const response = await fetch('/api/lunar', {
      method: 'POST',
      body: JSON.stringify({ lunar })
    });
    const { solar_dates } = await response.json();
    onConvert(solar_dates);
  };
  
  return (
    <div className="flex gap-4 p-4 border rounded">
      <select value={lunar.month} onChange={e => setLunar({...lunar, month: +e.target.value})}>
        {Array.from({length: 12}, (_, i) => (
          <option key={i} value={i + 1}>農曆{i + 1}月</option>
        ))}
      </select>
      <select value={lunar.day} onChange={e => setLunar({...lunar, day: +e.target.value})}>
        {Array.from({length: 30}, (_, i) => (
          <option key={i} value={i + 1}>{i + 1}日</option>
        ))}
      </select>
      <button onClick={handleConvert} className="px-4 py-2 bg-blue-500 text-white rounded">
        轉換為國曆
      </button>
    </div>
  );
}
```

---

## 8. 部署 & CI/CD

### 8.1 環境配置

| 環境       | Vercel Project | Supabase Project | 用途       |
| -------- | -------------- | ---------------- | -------- |
| dev      | folklore-dev   | folklore-dev     | 開發測試     |
| preview  | folklore-preview | folklore-preview | PR 預覽    |
| prod     | folklore-prod  | folklore-prod    | 正式環境     |

### 8.2 環境變數

```bash
# Vercel Environment Variables
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
FCM_SERVER_KEY=AAAA...
LUNAR_CACHE_TTL=2592000
VERCEL_KV_REST_API_URL=https://...
VERCEL_KV_REST_API_TOKEN=...
```

### 8.3 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: pnpm install
      - run: pnpm test
      - run: pnpm build
      
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### 8.4 資料庫遷移

```bash
# 開發流程
supabase migration new add_google_auth
supabase db diff --schema public > migrations/xxx_add_google_auth.sql
supabase db push

# 生產部署
supabase db push --project-ref $PROD_PROJECT_REF
```

---

## 9. 測試策略

### 9.1 單元測試

#### 後端 (Jest)
```javascript
// __tests__/lunar.test.js
describe('Lunar Calendar Service', () => {
  test('should convert lunar date to solar correctly', () => {
    const result = lunarToSolar(2025, 3, 23);
    expect(result).toEqual(['2025-04-20']);
  });
  
  test('should handle leap month', () => {
    const result = lunarToSolar(2025, 3, 23, true);
    expect(result.isLeap).toBe(true);
  });
});
```

#### iOS (XCTest)
```swift
// FolkloreAppTests/LunarCalendarServiceTests.swift
class LunarCalendarServiceTests: XCTestCase {
    func testLunarDateFormatting() {
        let date = LunarDate(month: 3, day: 23, isLeap: false)
        XCTAssertEqual(date.displayString, "農曆三月廿三")
    }
    
    func testEventViewModel() {
        let viewModel = HomeViewModel()
        viewModel.loadEvents()
        
        XCTAssertTrue(viewModel.events.count > 0)
        XCTAssertEqual(viewModel.events.first?.type, .deity)
    }
}
```

### 9.2 整合測試

```javascript
// __tests__/api.integration.test.js
describe('API Integration', () => {
  test('Google auth flow', async () => {
    const response = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'mock_google_token' })
      .expect(200);
      
    expect(response.body.user.email).toBeDefined();
    expect(response.body.supabase_token).toBeDefined();
  });
});
```

### 9.3 E2E 測試 (iOS)

```swift
// FolkloreAppUITests/OnboardingTests.swift
class OnboardingTests: XCTestCase {
    func testCompleteOnboardingFlow() {
        let app = XCUIApplication()
        app.launch()
        
        // Google 登入
        app.buttons["使用 Google 登入"].tap()
        // 模擬 Google 登入成功
        
        // 權限請求
        app.buttons["允許通知"].tap()
        app.buttons["允許位置存取"].tap()
        
        // 驗證進入首頁
        XCTAssertTrue(app.navigationBars["民俗提醒"].exists)
        XCTAssertTrue(app.staticTexts["近期重要日子"].exists)
    }
}
```

### 9.4 推播測試方案

#### 開發環境推播測試工具
```typescript
// pages/api/admin/test-push.ts - 僅開發環境
export default async function handler(req: Request, res: Response) {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ error: 'Not found' });
  }
  
  const { userId, message, eventId } = req.body;
  
  // 手動觸發推播
  await sendPushNotification({
    userId,
    title: '測試通知',
    body: message,
    data: { eventId }
  });
  
  res.json({ success: true });
}
```

#### Admin 推播測試面板
```tsx
// components/PushTestPanel.tsx - 開發工具
export function PushTestPanel() {
  const [selectedUser, setSelectedUser] = useState('');
  const [testMessage, setTestMessage] = useState('媽祖聖誕即將到來！');
  
  const sendTestPush = async () => {
    await fetch('/api/admin/test-push', {
      method: 'POST',
      body: JSON.stringify({
        userId: selectedUser,
        message: testMessage,
        eventId: 88
      })
    });
  };
  
  return (
    <div className="p-6 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">推播測試工具</h3>
      <div className="space-y-4">
        <UserSelector value={selectedUser} onChange={setSelectedUser} />
        <textarea 
          value={testMessage} 
          onChange={e => setTestMessage(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="測試訊息內容"
        />
        <button 
          onClick={sendTestPush}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          發送測試推播
        </button>
      </div>
    </div>
  );
}
```

#### 時間模擬功能
```typescript
// lib/time-simulator.ts - 開發環境
export class TimeSimulator {
  private static mockDate: Date | null = null;
  
  static setMockDate(date: Date) {
    if (process.env.NODE_ENV === 'development') {
      this.mockDate = date;
    }
  }
  
  static now(): Date {
    return this.mockDate || new Date();
  }
  
  static isEventSoon(eventDate: Date, advanceDays: number): boolean {
    const now = this.now();
    const diffDays = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= advanceDays;
  }
}

// 使用範例：模擬今天是媽祖聖誕前1天
TimeSimulator.setMockDate(new Date('2025-04-19'));
```

### 9.5 測試覆蓋率要求

| 模組           | 最低覆蓋率 | 重點測試項目                 |
| ------------ | ----- | ---------------------- |
| API Routes   | 85%   | 認證、資料驗證、錯誤處理           |
| iOS ViewModels | 80%  | 狀態管理、資料轉換              |
| 農曆轉換服務       | 95%   | 邊界條件、閏月處理              |
| 推播系統         | 90%   | 排程邏輯、失敗重試              |

### 9.6 效能測試

```javascript
// __tests__/performance.test.js
import { check, sleep } from 'k6';
import http from 'k6/http';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // 爬升到 100 用戶
    { duration: '5m', target: 100 }, // 維持 100 用戶
    { duration: '2m', target: 0 },   // 降回 0 用戶
  ],
};

export default function () {
  // 測試農曆轉換 API
  let response = http.post('https://api.folklore.app/api/lunar', 
    JSON.stringify({ lunar: { month: 3, day: 23 } }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
```

---

## 10. 特殊注意事項

### 10.1 農曆系統

#### 閏月處理
```typescript
// lib/lunar-calendar.ts
export interface LunarDate {
  year: number;
  month: number;
  day: number;
  isLeap: boolean;
}

export function formatLunarDate(date: LunarDate): string {
  const leapPrefix = date.isLeap ? '閏' : '';
  const monthNames = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
  const dayNames = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
                   '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
                   '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];
  
  return `農曆${leapPrefix}${monthNames[date.month - 1]}月${dayNames[date.day - 1]}`;
}
```

#### Edge Function 快取
```typescript
// api/lunar.ts - Vercel Edge Function
import { kv } from '@vercel/kv';

export default async function handler(request: Request) {
  const { lunar } = await request.json();
  const cacheKey = `lunar:${lunar.year}:${lunar.month}:${lunar.day}:${lunar.isLeap}`;
  
  // 檢查快取
  let solarDates = await kv.get(cacheKey);
  
  if (!solarDates) {
    // 計算農曆轉國曆
    solarDates = calculateLunarToSolar(lunar);
    
    // 快取 30 天
    await kv.setex(cacheKey, 2592000, solarDates);
  }
  
  return Response.json({ solar_dates: solarDates });
}
```

### 10.2 通知系統可靠性

#### 多重排程策略
```typescript
// lib/notification-scheduler.ts
export class NotificationScheduler {
  async scheduleEventNotifications(eventId: number) {
    const event = await getEvent(eventId);
    const users = await getSubscribedUsers(eventId);
    
    for (const user of users) {
      const { advance_days, notify_time } = await getUserSettings(user.id);
      
      // 排程多個通知：3天前、1天前、當天
      const schedules = [
        { days: 3, type: 'early_reminder' },
        { days: advance_days, type: 'main_reminder' },
        { days: 0, type: 'day_of_event' }
      ].filter(s => s.days <= 3); // 最多提前3天
      
      for (const schedule of schedules) {
        await this.scheduleNotification({
          userId: user.id,
          eventId,
          scheduledAt: this.calculateScheduleTime(event.solar_date, schedule.days, notify_time),
          type: schedule.type,
          maxRetries: 3
        });
      }
    }
  }
  
  private async scheduleNotification(params: NotificationParams) {
    await supabase.from('notification_logs').insert({
      user_id: params.userId,
      event_id: params.eventId,
      scheduled_at: params.scheduledAt,
      status: 'queued',
      retry_count: 0
    });
  }
}
```

#### 失敗重試機制
```typescript
// api/cron/send-notifications.ts - Vercel Cron Job
export default async function handler(request: Request) {
  // 取得待發送的通知
  const notifications = await supabase
    .from('notification_logs')
    .select('*')
    .eq('status', 'queued')
    .lte('scheduled_at', new Date().toISOString())
    .lt('retry_count', 3);
  
  for (const notification of notifications.data) {
    try {
      await sendPushNotification(notification);
      
      // 標記為已發送
      await supabase
        .from('notification_logs')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', notification.id);
        
    } catch (error) {
      // 增加重試次數
      await supabase
        .from('notification_logs')
        .update({ 
          retry_count: notification.retry_count + 1,
          error_message: error.message,
          status: notification.retry_count >= 2 ? 'failed' : 'queued'
        })
        .eq('id', notification.id);
    }
  }
  
  return Response.json({ processed: notifications.data.length });
}
```

### 10.3 文化與無障礙

#### 文化正確性檢查清單
- [ ] 所有神明名稱經過文化顧問審核
- [ ] 節慶描述避免宗教偏見
- [ ] 拜拜須知符合傳統禮儀
- [ ] 農曆顯示格式正確（閏月標示）

#### 無障礙實作
```swift
// SwiftUI 無障礙支援
struct EventCardView: View {
    let event: Event
    
    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text(event.title)
                .font(.titleSmall)
                .accessibilityAddTraits(.isHeader)
            
            Text(event.description)
                .font(.bodyLarge)
                .accessibilityLabel("節慶描述：\(event.description)")
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(event.title)，\(event.description)")
        .accessibilityHint("點兩下查看詳細資訊")
    }
}
```

### 10.4 成本監控與優化

#### 資源用量 Alert
```typescript
// api/admin/usage-monitor.ts
export default async function handler(request: Request) {
  // Supabase 用量檢查
  const dbSize = await getSupabaseUsage();
  const vercelUsage = await getVercelUsage();
  
  const alerts = [];
  
  if (dbSize.percentage > 80) {
    alerts.push({
      type: 'database',
      message: `Database usage: ${dbSize.percentage}% (${dbSize.current}/${dbSize.limit})`
    });
  }
  
  if (vercelUsage.functions > 80) {
    alerts.push({
      type: 'functions',
      message: `Function invocations: ${vercelUsage.functions}% of monthly limit`
    });
  }
  
  // 發送 Alert（Email/Slack）
  if (alerts.length > 0) {
    await sendAlert(alerts);
  }
  
  return Response.json({ alerts });
}
```

#### 資料庫優化策略

##### 定期清理機制
```sql
-- 定期清理舊通知記錄（保留3個月）
CREATE OR REPLACE FUNCTION cleanup_old_notifications() 
RETURNS void AS $$
BEGIN
  DELETE FROM notification_logs 
  WHERE created_at < NOW() - INTERVAL '3 months'
    AND status IN ('sent', 'failed');
END;
$$ LANGUAGE plpgsql;

-- 設定定期執行（透過 pg_cron 或 Vercel Cron）
-- SELECT cron.schedule('cleanup-notifications', '0 2 * * *', 'SELECT cleanup_old_notifications();');
```

##### 資料庫索引優化
```sql
-- 核心查詢索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_solar_date ON events USING btree (solar_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_type_lunar ON events (type, lunar_month, lunar_day);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_logs_user_status ON notification_logs (user_id, status, scheduled_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_subscriptions_active ON user_event_subscriptions (user_id) WHERE enabled = true;

-- 地理查詢索引 (V3.0)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_temples_location ON temples USING gist (ll_to_earth(lat, lng));
```

##### 分區表策略（高用量時）
```sql
-- notification_logs 按月分區
CREATE TABLE notification_logs_partitioned (
    LIKE notification_logs INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- 建立月份分區
CREATE TABLE notification_logs_2025_01 PARTITION OF notification_logs_partitioned
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

#### 快取策略實作

##### 多層快取架構
```typescript
// lib/cache-manager.ts
export class CacheManager {
  // L1: Vercel KV (Edge Cache) - 全球分散
  // L2: Supabase 記憶體快取
  // L3: iOS 本地 CoreData 快取
  
  static async getEvents(dateRange: { from: string, to: string }) {
    const cacheKey = `events:${dateRange.from}:${dateRange.to}`;
    
    // L1: 檢查 Edge Cache
    let events = await kv.get(cacheKey);
    if (events) {
      return events;
    }
    
    // L2: 從資料庫查詢
    events = await supabase
      .from('events')
      .select('*')
      .gte('solar_date', dateRange.from)
      .lte('solar_date', dateRange.to);
    
    // 快取 1 小時
    await kv.setex(cacheKey, 3600, events);
    
    return events;
  }
  
  static async getLunarConversion(lunar: LunarDate) {
    const cacheKey = `lunar:${lunar.year}:${lunar.month}:${lunar.day}:${lunar.isLeap}`;
    
    // 農曆轉換結果快取 30 天（很少變動）
    let solarDates = await kv.get(cacheKey);
    if (!solarDates) {
      solarDates = calculateLunarToSolar(lunar);
      await kv.setex(cacheKey, 2592000, solarDates); // 30 天
    }
    
    return solarDates;
  }
}
```

##### iOS 本地快取
```swift
// Core/Services/CacheManager.swift
import CoreData

class CacheManager: ObservableObject {
    private let context: NSManagedObjectContext
    
    // 事件快取：24小時有效期
    func cacheEvents(_ events: [Event]) {
        let cacheEntry = EventCache(context: context)
        cacheEntry.data = try? JSONEncoder().encode(events)
        cacheEntry.cachedAt = Date()
        cacheEntry.expiresAt = Date().addingTimeInterval(24 * 60 * 60)
        
        try? context.save()
    }
    
    func getCachedEvents() -> [Event]? {
        let request: NSFetchRequest<EventCache> = EventCache.fetchRequest()
        request.predicate = NSPredicate(format: "expiresAt > %@", Date() as NSDate)
        
        guard let cacheEntry = try? context.fetch(request).first,
              let data = cacheEntry.data,
              let events = try? JSONDecoder().decode([Event].self, from: data) else {
            return nil
        }
        
        return events
    }
}
```

##### 快取失效策略
```typescript
// lib/cache-invalidation.ts
export class CacheInvalidation {
  // 當後台更新事件時，清除相關快取
  static async invalidateEventCaches(eventId: number) {
    const event = await getEvent(eventId);
    const year = new Date(event.solar_date[0]).getFullYear();
    
    // 清除該年份的所有事件快取
    const pattern = `events:${year}-*`;
    const keys = await kv.keys(pattern);
    
    if (keys.length > 0) {
      await kv.del(...keys);
    }
  }
  
  // 智能預熱：提前載入下個月的資料
  static async preloadNextMonth() {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const from = nextMonth.toISOString().split('T')[0];
    const to = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0)
      .toISOString().split('T')[0];
    
    // 觸發快取載入
    await CacheManager.getEvents({ from, to });
  }
}
```

##### CDN 圖片快取
```typescript
// 圖片上傳優化：使用外部 CDN 而非 Supabase Storage
export const uploadEventImage = async (file: File, eventId: number) => {
  // 使用 Cloudinary 免費 25GB
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'folklore_events');
  formData.append('public_id', `events/${eventId}`);
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );
  
  const result = await response.json();
  
  // 自動壓縮與格式優化的 URL
  return result.secure_url.replace('/upload/', '/upload/c_scale,w_800,f_auto,q_auto/');
};
```

##### 快取監控與統計
```typescript
// api/admin/cache-stats.ts
export default async function handler(request: Request) {
  const stats = {
    vercel_kv: {
      storage_used: await kv.info('memory'),
      hit_rate: await getCacheHitRate(), // 自定義統計
      keys_count: (await kv.keys('*')).length
    },
    cache_patterns: {
      events: (await kv.keys('events:*')).length,
      lunar: (await kv.keys('lunar:*')).length,
      temples: (await kv.keys('temples:*')).length
    }
  };
  
  return Response.json(stats);
}

// 快取命中率統計
async function getCacheHitRate() {
  // 記錄每次 cache hit/miss
  const hits = await kv.get('cache:hits') || 0;
  const misses = await kv.get('cache:misses') || 0;
  
  return hits / (hits + misses) * 100;
}
```
```

---

## 11. 待辦清單（AI 可直接執行）

## Version 1.0 (通知 app 雛形) - Week 0-2

### Phase 1: 基礎設施與核心功能 (Week 1-2)
- [x] 使用 XcodeGen 建立 iOS 專案結構
- [x] 實作設計系統（Colors, Typography, Spacing）基於 UI Guideline 純粹雙色系統
- [x] 建立資料模型（Event, User, NotificationSettings）與 Mock 資料
- [x] 建立 iOS HomeView 與 EventViewModel (Mock 資料)
- [x] 建立 iOS NotificationSettingsView ✅ **已完成**
- [x] 建立選擇頁面（DeitySelectionView、FestivalSelectionView）
- [x] 建立 TabView 底部導航系統
- [x] 建立 GroupDetailView (簡少年推薦詳細頁面)
- [x] 撰寫單元測試（iOS ViewModels）- 基礎測試完成
- [x] Git 專案管理建立 (project.yml, .gitignore, README.md)
- [ ] 部署到 TestFlight 進行內測

> **Version 1.0 完成標準**：iOS App 可正常顯示近期節慶、基礎通知設定（使用 Mock 資料）。對應UI mockup的頁面1、4、5、6完成。

---

## Version 1.1 (通知 app 完整版) - Week 3-4

### Phase 2: 後端整合與認證系統 (Week 3-4)
- [ ] 建立 Supabase 專案並執行 schema migration
- [ ] 設定 Vercel 專案與環境變數
- [ ] 整合 Google Sign-In SDK 與 Firebase FCM
- [ ] 實作 `/api/auth/google` endpoint
- [ ] 建立 iOS GoogleSignInManager
- [ ] 實作 Onboarding 流程（登入 + 權限請求）
- [ ] 實作 `/api/events` GET endpoint 與農曆轉換
- [ ] 實作通知設定 API (`/api/user/settings`)
- [ ] 實作群組 API endpoints (`/api/groups`, `/api/groups/:id`, `/api/groups/:id/items`)
- [ ] 建立 iOS GroupDetailView（簡少年老師推薦詳細頁）
- [ ] 實作推播排程系統
- [ ] 建立 React Admin 專案結構
- [ ] 實作 events CRUD 與農曆轉換器
- [ ] 建立 groups 管理介面

> **Version 1.1 完成標準**：完成後端整合，iOS App 可正常登入、設定通知並收到推播。對應UI mockup的頁面1、4、5、6、7完成。

---

## Version 2.0 (新增相關活動) - Week 5-6

### Phase 3: 活動模組 (Week 5-6)
- [ ] 建立 activities 資料表與 API
- [ ] 實作 `/api/activities?event_id=` endpoint
- [ ] 建立 Activity 資料模型（iOS）
- [ ] 修改 HomeView 新增「近期相關活動」Section
- [ ] 建立 ActivityCardView 元件
- [ ] 更新 HomeViewModel 包含活動資料
- [ ] 建立 React Admin activities CRUD 頁面
- [ ] 活動 API 單元測試
- [ ] iOS 活動顯示 UI 測試

> **Version 2.0 完成標準**：首頁正確顯示相關活動，後台可管理活動資料。首頁功能完整（對應UI mockup頁面1完整版）。

---

## Version 2.1 (新增附近廟宇) - Week 7-8

### Phase 4: 地理資料與廟宇功能 (Week 7-8)
- [ ] 建立 temples 資料表與地理索引
- [ ] 實作 `/api/temples` 地理查詢 API
- [ ] 建立 Temple 資料模型（iOS）
- [ ] 整合 iOS LocationManager
- [ ] 實作「查看附近相關廟宇」功能
- [ ] 建立 NearbyTemplesView（附近相關廟宇詳細頁面）
- [ ] 建立 React Admin temples CRUD 頁面
- [ ] 實作地圖選點功能（MapPicker）
- [ ] 地理查詢效能測試

> **Version 2.1 完成標準**：用戶可查看附近廟宇列表。對應UI mockup的頁面2完成。

---

## Version 2.2 (地圖整合) - Week 9-10

### Phase 5: 詳細頁面與地圖整合 (Week 9-10)
- [ ] 實作神明詳細頁面（DeityDetailView）
- [ ] 建立 TempleDetailView（寺廟詳細頁面）
- [ ] 實作 Google Maps 深度連結
- [ ] 建立複製地址功能
- [ ] 實作 URLService（地址複製、地圖開啟）
- [ ] iOS 地圖功能 UI 測試
- [ ] Google Maps API 整合測試
- [ ] 完整 E2E 測試流程
- [ ] App Store 上線準備

> **Version 2.2 完成標準**：用戶可查看神明和廟宇詳細資訊，複製地址或開啟地圖。對應UI mockup的頁面3、8完成。全部8個頁面功能完整。

---

## 後續擴充 (Version 3.0+)

### 可選功能模組
- [ ] **Android 版本開發**：React Native 或 Flutter 重構
- [ ] **Web PWA 版本**：Next.js 前端應用
- [ ] **帳號同步功能**：跨裝置資料同步
- [ ] **社群功能**：用戶分享與評論
- [ ] **個人化推薦**：基於用戶偏好的智能推薦
- [ ] **廟宇導覽**：AR 功能整合
- [ ] **多語言支援**：英文版本
- [ ] **付費功能**：進階通知與客製化

### 技術債務處理
- [ ] **架構重構**：微服務化考量
- [ ] **資料庫優化**：讀寫分離
- [ ] **CDN 優化**：全球內容分發
- [ ] **監控完善**：APM 與錯誤追蹤
- [ ] **安全強化**：滲透測試與修復

---

### 附錄 A. 開發環境設定

#### 必要工具版本
- **Node.js**: 20.x
- **pnpm**: 8.x
- **Xcode**: 15.x
- **Swift**: 5.9
- **iOS Deployment Target**: 16.0

#### 本地開發指令
```bash
# 後端開發
pnpm install
pnpm dev              # 啟動 Vercel dev server
supabase start        # 啟動本地 Supabase
supabase db reset     # 重置資料庫

# iOS 開發
xcodegen generate     # 生成 Xcode project（如使用 XcodeGen）
open FolkloreApp.xcworkspace

# 測試
pnpm test            # 後端測試
xcodebuild test      # iOS 測試
```

---

> **文件版本**: v2.1  
> **最後更新**: 2024-12-19  
> **適用版本**: Version 1.0 - 2.2
