//
//  Event.swift
//  fude
//
//  Created by AI Assistant on 2024-12-19.
//  Copyright © 2024 fude. All rights reserved.
//

import Foundation

/// 民俗事件類型
enum EventType: String, CaseIterable, Codable {
    case festival = "festival"     // 民俗節慶
    case deity = "deity"          // 神明生日
    case custom = "custom"        // 自定義提醒
}

/// 農曆日期結構
struct LunarDate: Codable, Equatable {
    let month: Int      // 1-12
    let day: Int        // 1-30
    let isLeap: Bool    // 是否閏月
    
    /// 格式化顯示農曆日期
    var displayString: String {
        let monthNames = ["正", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"]
        let dayNames = ["初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十",
                       "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十",
                       "廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿七", "廿八", "廿九", "三十"]
        
        let leapPrefix = isLeap ? "閏" : ""
        let monthName = monthNames[month - 1]
        let dayName = dayNames[day - 1]
        
        return "農曆\(leapPrefix)\(monthName)月\(dayName)"
    }
}

/// 民俗事件模型
struct Event: Identifiable, Codable, Equatable {
    let id: Int
    let type: EventType
    let title: String
    let description: String
    let lunarDate: LunarDate?
    let solarDate: [Date]  // 一年可能有多個對應日期
    let coverUrl: String?
    
    // 神明相關欄位 (Version 2.2 使用)
    let deityRole: String?      // 神明職掌
    let worshipNotes: String?   // 拜拜須知
    
    /// 距離下次發生的天數
    var countdownDays: Int {
        let today = Date()
        let calendar = Calendar.current
        
        // 找到最近的未來日期
        let futureDates = solarDate.filter { $0 > today }
        guard let nextDate = futureDates.min() else {
            // 如果今年沒有未來日期，計算到明年的天數
            let nextYear = calendar.component(.year, from: today) + 1
            if let nextYearDate = solarDate.first {
                let components = calendar.dateComponents([.month, .day], from: nextYearDate)
                if let nextYearEvent = calendar.date(from: DateComponents(year: nextYear, month: components.month, day: components.day)) {
                    return calendar.dateComponents([.day], from: today, to: nextYearEvent).day ?? 0
                }
            }
            return 365
        }
        
        return calendar.dateComponents([.day], from: today, to: nextDate).day ?? 0
    }
    
    /// 是否即將到來 (7天內)
    var isUpcoming: Bool {
        return countdownDays <= 7 && countdownDays >= 0
    }
}

// MARK: - Mock Data
extension Event {
    /// Version 1.0 使用的 Mock 資料
    static let mockEvents: [Event] = [
        // 神明生日
        Event(
            id: 1,
            type: .deity,
            title: "媽祖聖誕",
            description: "海上女神媽祖的誕辰，祈求平安順利",
            lunarDate: LunarDate(month: 3, day: 23, isLeap: false),
            solarDate: [
                Calendar.current.date(byAdding: .day, value: 3, to: Date())!,
                Calendar.current.date(byAdding: .day, value: 368, to: Date())!
            ],
            coverUrl: nil,
            deityRole: "海上平安、航海保護",
            worshipNotes: "供品：鮮花、水果、清茶；禁忌：避免葷腥"
        ),
        
        Event(
            id: 2,
            type: .deity,
            title: "關聖帝君聖誕",
            description: "關公生日，祈求事業順利、正氣護身",
            lunarDate: LunarDate(month: 6, day: 24, isLeap: false),
            solarDate: [
                Calendar.current.date(byAdding: .day, value: 7, to: Date())!,
                Calendar.current.date(byAdding: .day, value: 372, to: Date())!
            ],
            coverUrl: nil,
            deityRole: "武財神、正義之神",
            worshipNotes: "供品：關刀豆、紅棗、酒類"
        ),
        
        Event(
            id: 3,
            type: .deity,
            title: "觀音菩薩聖誕",
            description: "觀世音菩薩誕辰，祈求慈悲護佑",
            lunarDate: LunarDate(month: 2, day: 19, isLeap: false),
            solarDate: [
                Calendar.current.date(from: DateComponents(year: 2024, month: 3, day: 28))!,
                Calendar.current.date(from: DateComponents(year: 2025, month: 3, day: 17))!
            ],
            coverUrl: nil,
            deityRole: "慈悲救苦、祈福平安",
            worshipNotes: "供品：素食、鮮花、清水；避免葷腥"
        ),
        
        Event(
            id: 4,
            type: .deity,
            title: "玉皇大帝聖誕",
            description: "天公生日，最重要的神明節日",
            lunarDate: LunarDate(month: 1, day: 9, isLeap: false),
            solarDate: [
                Calendar.current.date(from: DateComponents(year: 2024, month: 2, day: 18))!,
                Calendar.current.date(from: DateComponents(year: 2025, month: 2, day: 7))!
            ],
            coverUrl: nil,
            deityRole: "天界至尊、萬神之首",
            worshipNotes: "天公金、壽桃、鮮花、清茶"
        ),
        
        // 民俗節慶
        Event(
            id: 5,
            type: .festival,
            title: "農曆新年",
            description: "春節，最重要的傳統節日",
            lunarDate: LunarDate(month: 1, day: 1, isLeap: false),
            solarDate: [
                Calendar.current.date(byAdding: .day, value: 1, to: Date())!,
                Calendar.current.date(byAdding: .day, value: 366, to: Date())!
            ],
            coverUrl: nil,
            deityRole: nil,
            worshipNotes: nil
        ),
        
        Event(
            id: 6,
            type: .festival,
            title: "元宵節",
            description: "上元節，觀燈祈福的節日",
            lunarDate: LunarDate(month: 1, day: 15, isLeap: false),
            solarDate: [
                Calendar.current.date(byAdding: .day, value: 5, to: Date())!,
                Calendar.current.date(byAdding: .day, value: 370, to: Date())!
            ],
            coverUrl: nil,
            deityRole: nil,
            worshipNotes: nil
        ),
        
        Event(
            id: 7,
            type: .festival,
            title: "清明節",
            description: "慎終追遠，掃墓祭祖的重要節日",
            lunarDate: nil,
            solarDate: [
                Calendar.current.date(byAdding: .day, value: 10, to: Date())!,
                Calendar.current.date(byAdding: .day, value: 375, to: Date())!
            ],
            coverUrl: nil,
            deityRole: nil,
            worshipNotes: nil
        ),
        
        Event(
            id: 8,
            type: .festival,
            title: "端午節",
            description: "龍舟競渡，驅邪避疫",
            lunarDate: LunarDate(month: 5, day: 5, isLeap: false),
            solarDate: [
                Calendar.current.date(from: DateComponents(year: 2024, month: 6, day: 10))!,
                Calendar.current.date(from: DateComponents(year: 2025, month: 5, day: 31))!
            ],
            coverUrl: nil,
            deityRole: nil,
            worshipNotes: nil
        ),
        
        Event(
            id: 9,
            type: .festival,
            title: "中秋節",
            description: "月圓人團圓，家庭團聚的節日",
            lunarDate: LunarDate(month: 8, day: 15, isLeap: false),
            solarDate: [
                Calendar.current.date(from: DateComponents(year: 2024, month: 9, day: 17))!,
                Calendar.current.date(from: DateComponents(year: 2025, month: 10, day: 6))!
            ],
            coverUrl: nil,
            deityRole: nil,
            worshipNotes: nil
        ),
        
        Event(
            id: 10,
            type: .festival,
            title: "重陽節",
            description: "登高望遠，敬老孝親",
            lunarDate: LunarDate(month: 9, day: 9, isLeap: false),
            solarDate: [
                Calendar.current.date(from: DateComponents(year: 2024, month: 10, day: 11))!,
                Calendar.current.date(from: DateComponents(year: 2025, month: 10, day: 29))!
            ],
            coverUrl: nil,
            deityRole: nil,
            worshipNotes: nil
        )
    ]
    
    /// 取得近期事件 (30天內)
    static var upcomingEvents: [Event] {
        let thirtyDaysFromNow = Calendar.current.date(byAdding: .day, value: 30, to: Date()) ?? Date()
        return mockEvents
            .filter { event in
                event.solarDate.contains { date in
                    date >= Date() && date <= thirtyDaysFromNow
                }
            }
            .sorted { $0.countdownDays < $1.countdownDays }
    }
    
    /// 取得指定類型的事件
    static func events(ofType type: EventType) -> [Event] {
        return mockEvents.filter { $0.type == type }
    }
}
