//
//  NotificationScheduler.swift
//  fude
//
//  Created by AI Assistant on 2025-01-02.
//  Copyright © 2025 fude. All rights reserved.
//

import Foundation
import UserNotifications

/// 本地通知排程器
/// Version 1.1: 處理 iOS 本地通知排程
/// Version 2.0: 將與雲端推播系統整合，作為備援機制
@MainActor
final class NotificationScheduler {
    
    // MARK: - Properties
    
    private let notificationCenter: any UNUserNotificationCenterProtocol
    private let apiService: any APIServiceProtocol
    
    // MARK: - Initialization
    
    /// 預設初始化器
    init(
        notificationCenter: any UNUserNotificationCenterProtocol = UNUserNotificationCenter.current(),
        apiService: any APIServiceProtocol = APIService.shared
    ) {
        self.notificationCenter = notificationCenter
        self.apiService = apiService
    }
    
    // MARK: - Public Methods
    
    /// 根據通知設定排程所有相關通知
    /// - Parameter settings: 用戶通知設定
    func scheduleNotifications(for settings: NotificationSettings) async {
        print("📅 Starting notification scheduling for user settings...")
        
        // 1. 清除所有現有通知
        await clearAllScheduledNotifications()
        
        // 2. 如果通知被關閉，直接返回
        guard settings.enableAll else {
            print("📅 Notifications disabled, skipping scheduling")
            return
        }
        
        // 3. 獲取需要排程的事件
        let events = await getEventsToSchedule(for: settings)
        print("📅 Found \(events.count) events to schedule")
        
        // 4. 為每個事件排程通知
        var scheduledCount = 0
        for event in events {
            if await scheduleNotification(for: event, settings: settings) {
                scheduledCount += 1
            }
        }
        
        print("📅 Successfully scheduled \(scheduledCount) notifications")
    }
    
    /// 清除所有已排程的通知
    func clearAllScheduledNotifications() async {
        print("🗑️ Clearing all scheduled notifications...")
        await notificationCenter.removeAllPendingNotificationRequests()
        print("🗑️ All notifications cleared")
    }
    
    /// 獲取當前已排程的通知數量（用於調試）
    func getPendingNotificationCount() async -> Int {
        let requests = await notificationCenter.getPendingNotificationRequests()
        return requests.count
    }
    
    // MARK: - Private Methods
    
    /// 獲取需要排程通知的事件
    private func getEventsToSchedule(for settings: NotificationSettings) async -> [Event] {
        print("📅 Starting to fetch events from API...")
        
        do {
            print("📅 Calling apiService.fetchEvents()...")
            let allEvents = try await apiService.fetchEvents()
            print("📅 ✅ Successfully fetched \(allEvents.count) events from API")
            
            // 調試：顯示所有事件
            for event in allEvents {
                print("  - \(event.title) (type: \(event.type), id: \(event.id))")
                print("    solarDate: \(event.solarDate)")
                if let month = event.solarMonth, let day = event.solarDay {
                    print("    solarMonth/Day: \(month)/\(day)")
                }
            }
            
            print("📅 Starting event filtering...")
            print("📅 Settings: selectedEventIds=\(settings.selectedEventIds), customEnabled=\(settings.customEnabled)")
            
            // 根據設定篩選事件
            let filteredEvents = allEvents.filter { event in
                var shouldInclude = false
                
                // 檢查是否在選中的事件列表中
                if settings.selectedEventIds.contains(event.id) {
                    print("  ✅ \(event.title) included: in selectedEventIds")
                    shouldInclude = true
                }
                
                // 檢查特殊類型的事件
                if !shouldInclude {
                    switch event.type {
                    case .deity, .festival:
                        shouldInclude = settings.customEnabled
                        print("  \(shouldInclude ? "✅" : "❌") \(event.title): deity/festival, customEnabled=\(settings.customEnabled)")
                    case .solarTerm:
                        shouldInclude = settings.customEnabled // 節氣歸類為自定提醒
                        print("  \(shouldInclude ? "✅" : "❌") \(event.title): solarTerm, customEnabled=\(settings.customEnabled)")
                    case .custom:
                        shouldInclude = settings.customEnabled
                        print("  \(shouldInclude ? "✅" : "❌") \(event.title): custom, customEnabled=\(settings.customEnabled)")
                    }
                }
                
                return shouldInclude
            }
            
            print("📅 ✅ Filtered to \(filteredEvents.count) events after applying settings")
            return filteredEvents
        } catch {
            print("❌ CRITICAL ERROR: Failed to fetch events for scheduling: \(error)")
            print("❌ Error type: \(type(of: error))")
            if let urlError = error as? URLError {
                print("❌ URLError code: \(urlError.code.rawValue)")
                print("❌ URLError description: \(urlError.localizedDescription)")
            }
            return []
        }
    }
    
    /// 為單一事件排程通知
    private func scheduleNotification(for event: Event, settings: NotificationSettings) async -> Bool {
        // 計算通知觸發日期
        guard let triggerDate = calculateTriggerDate(for: event, settings: settings) else {
            print("⚠️ Cannot calculate trigger date for event: \(event.title)")
            return false
        }
        
        // 檢查日期是否在未來
        guard triggerDate > Date() else {
            print("⚠️ Trigger date is in the past for event: \(event.title)")
            return false
        }
        
        // 創建通知內容
        let content = createNotificationContent(for: event, settings: settings)
        
        // 創建觸發器
        let trigger = createNotificationTrigger(for: triggerDate, settings: settings)
        
        // 創建通知請求
        let identifier = "event_\(event.id)_\(Int(triggerDate.timeIntervalSince1970))"
        let request = UNNotificationRequest(identifier: identifier, content: content, trigger: trigger)
        
        // 排程通知
        do {
            try await notificationCenter.add(request)
            print("✅ Scheduled notification for \(event.title) at \(triggerDate)")
            return true
        } catch {
            print("❌ Failed to schedule notification for \(event.title): \(error)")
            return false
        }
    }
    
    /// 計算通知觸發日期
    private func calculateTriggerDate(for event: Event, settings: NotificationSettings) -> Date? {
        // 獲取事件的下次發生日期
        guard let nextOccurrenceDate = getNextOccurrenceDate(for: event) else {
            return nil
        }
        
        // 減去提前通知天數
        let advanceDays = TimeInterval(settings.advanceDays * 24 * 60 * 60)
        let baseDate = nextOccurrenceDate.addingTimeInterval(-advanceDays)
        
        // 設定通知時間
        guard let notifyTime = settings.notifyTimeAsDate else {
            return nil
        }
        
        let calendar = Calendar.current
        let components = calendar.dateComponents([.year, .month, .day], from: baseDate)
        let timeComponents = calendar.dateComponents([.hour, .minute], from: notifyTime)
        
        var triggerComponents = DateComponents()
        triggerComponents.year = components.year
        triggerComponents.month = components.month
        triggerComponents.day = components.day
        triggerComponents.hour = timeComponents.hour
        triggerComponents.minute = timeComponents.minute
        
        return calendar.date(from: triggerComponents)
    }
    
    /// 獲取事件的下次發生日期
    private func getNextOccurrenceDate(for event: Event) -> Date? {
        // 檢查事件是否有實際的未來日期
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        
        // 首先檢查 solarDate 中是否有未來的日期
        let futureDates = event.solarDate.map { calendar.startOfDay(for: $0) }.filter { $0 >= today }
        if let nextDate = futureDates.min() {
            // 有實際的未來日期，使用它
            return nextDate
        }
        
        // 如果沒有未來的 solarDate，但有 solarMonth 和 solarDay，檢查今年或明年
        if let month = event.solarMonth, let day = event.solarDay {
            let year = calendar.component(.year, from: today)
            
            // 檢查今年的日期
            if let thisYearDate = calendar.date(from: DateComponents(year: year, month: month, day: day)),
               calendar.startOfDay(for: thisYearDate) >= today {
                return thisYearDate
            }
            
            // 今年已過，使用明年
            if let nextYearDate = calendar.date(from: DateComponents(year: year + 1, month: month, day: day)) {
                return nextYearDate
            }
        }
        
        // 如果 countdownDays 看起來像是一個合理的未來天數（不是回退值 365）
        if event.countdownDays > 0 && event.countdownDays < 365 {
            return calendar.date(byAdding: .day, value: event.countdownDays, to: today)
        }
        
        // 無法確定下次發生日期
        return nil
    }
    
    /// 創建通知內容
    private func createNotificationContent(for event: Event, settings: NotificationSettings) -> UNMutableNotificationContent {
        let content = UNMutableNotificationContent()
        
        // 設定標題和內容
        content.title = "📿 重要日子提醒"
        
        let daysText = settings.advanceDays == 0 ? "今天" : "\(settings.advanceDays)天後"
        content.body = "\(daysText)是「\(event.title)」，記得準備相關事宜！"
        
        // 設定聲音
        content.sound = .default
        
        // 設定 badge（可選）
        content.badge = 1
        
        // 設定分類（用於自定義操作，未來版本可擴展）
        content.categoryIdentifier = "EVENT_REMINDER"
        
        // 設定用戶資訊（用於處理通知點擊）
        content.userInfo = [
            "eventId": event.id,
            "eventName": event.title,
            "eventType": event.type.rawValue
        ]
        
        return content
    }
    
    /// 創建通知觸發器
    private func createNotificationTrigger(for date: Date, settings: NotificationSettings) -> UNNotificationTrigger {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.year, .month, .day, .hour, .minute], from: date)
        
        return UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
    }
}

// MARK: - APIServiceProtocol

/// API 服務協議，用於依賴注入和測試
protocol APIServiceProtocol {
    func fetchEvents() async throws -> [Event]
}

/// APIService 的預設實作
extension APIService: APIServiceProtocol {
    // APIService 已經有 fetchEvents() 方法，直接符合協議
}

