//
//  NotificationSchedulerTests.swift
//  fudeTests
//
//  Created by AI Assistant on 2025-01-02.
//  Copyright © 2025 fude. All rights reserved.
//

import XCTest
import UserNotifications
@testable import fude

// 使用 NotificationServiceTests 中的 MockUNUserNotificationCenter
typealias MockUNUserNotificationCenterFromService = MockUNUserNotificationCenter

@MainActor
final class NotificationSchedulerTests: XCTestCase {
    
    var scheduler: NotificationScheduler!
    var mockNotificationCenter: MockUNUserNotificationCenterFromService!
    var mockAPIService: MockAPIService!
    
    override func setUp() async throws {
        try await super.setUp()
        
        mockNotificationCenter = MockUNUserNotificationCenterFromService()
        mockAPIService = MockAPIService()
        scheduler = NotificationScheduler(
            notificationCenter: mockNotificationCenter,
            apiService: mockAPIService
        )
    }
    
    override func tearDown() async throws {
        scheduler = nil
        mockNotificationCenter = nil
        mockAPIService = nil
        try await super.tearDown()
    }
    
    // MARK: - 基本功能測試
    
    func testClearAllScheduledNotifications() async {
        // Given
        mockNotificationCenter.pendingRequests = [
            UNNotificationRequest(identifier: "test1", content: UNMutableNotificationContent(), trigger: nil),
            UNNotificationRequest(identifier: "test2", content: UNMutableNotificationContent(), trigger: nil)
        ]
        
        // When
        await scheduler.clearAllScheduledNotifications()
        
        // Then
        XCTAssertTrue(mockNotificationCenter.removeAllPendingNotificationRequestsCalled)
        XCTAssertEqual(mockNotificationCenter.pendingRequests.count, 0)
    }
    
    func testGetPendingNotificationCount() async {
        // Given
        mockNotificationCenter.pendingRequests = [
            UNNotificationRequest(identifier: "test1", content: UNMutableNotificationContent(), trigger: nil),
            UNNotificationRequest(identifier: "test2", content: UNMutableNotificationContent(), trigger: nil),
            UNNotificationRequest(identifier: "test3", content: UNMutableNotificationContent(), trigger: nil)
        ]
        
        // When
        let count = await scheduler.getPendingNotificationCount()
        
        // Then
        XCTAssertEqual(count, 3)
    }
    
    // MARK: - 通知排程測試
    
    func testScheduleNotificationsWhenDisabled() async {
        // Given
        let settings = NotificationSettings(
            userId: "test-user",
            enableAll: false,
            selectedEventIds: [1, 2]
        )
        
        mockAPIService.mockEvents = [
            createMockEvent(id: 1, title: "媽祖聖誕", type: .deity, countdownDays: 5),
            createMockEvent(id: 2, title: "清明節", type: .festival, countdownDays: 10)
        ]
        
        // When
        await scheduler.scheduleNotifications(for: settings)
        
        // Then
        XCTAssertTrue(mockNotificationCenter.removeAllPendingNotificationRequestsCalled)
        XCTAssertFalse(mockNotificationCenter.addRequestCalled)
        XCTAssertEqual(mockNotificationCenter.addedRequests.count, 0)
    }
    
    func testScheduleNotificationsForSelectedEvents() async {
        // Given
        let settings = NotificationSettings(
            userId: "test-user",
            enableAll: true,
            advanceDays: 1,
            notifyTime: "08:00",
            newmoonEnabled: false,
            fullmoonEnabled: false,
            customEnabled: false, // 關閉類型開關，只使用 selectedEventIds
            selectedEventIds: [1, 3],
            selectedGroupIds: []
        )
        
        mockAPIService.mockEvents = [
            createMockEvent(id: 1, title: "媽祖聖誕", type: .deity, countdownDays: 5),
            createMockEvent(id: 2, title: "關公聖誕", type: .deity, countdownDays: 7),
            createMockEvent(id: 3, title: "清明節", type: .festival, countdownDays: 10)
        ]
        
        // When
        await scheduler.scheduleNotifications(for: settings)
        
        // Then
        XCTAssertTrue(mockNotificationCenter.removeAllPendingNotificationRequestsCalled)
        XCTAssertTrue(mockNotificationCenter.addRequestCalled)
        XCTAssertEqual(mockNotificationCenter.addedRequests.count, 2) // 只有 ID 1 和 3 被選中
        
        // 檢查通知內容
        let request1 = mockNotificationCenter.addedRequests.first { $0.identifier.contains("event_1") }
        let request3 = mockNotificationCenter.addedRequests.first { $0.identifier.contains("event_3") }
        
        XCTAssertNotNil(request1)
        XCTAssertNotNil(request3)
        XCTAssertTrue(request1!.content.body.contains("媽祖聖誕"))
        XCTAssertTrue(request3!.content.body.contains("清明節"))
    }
    
    func testScheduleNotificationsForSpecialTypes() async {
        // Given
        let settings = NotificationSettings(
            userId: "test-user",
            enableAll: true,
            newmoonEnabled: true,
            fullmoonEnabled: false,
            customEnabled: true,
            selectedEventIds: []
        )
        
        mockAPIService.mockEvents = [
            createMockEvent(id: 1, title: "媽祖聖誕", type: .deity, countdownDays: 5)
        ]
        
        // When
        await scheduler.scheduleNotifications(for: settings)
        
        // Then
        XCTAssertEqual(mockNotificationCenter.addedRequests.count, 1) // 只有媽祖聖誕
        
        let deityRequest = mockNotificationCenter.addedRequests.first { $0.content.body.contains("媽祖聖誕") }
        
        XCTAssertNotNil(deityRequest)
    }
    
    func testScheduleNotificationsSkipsPastEvents() async {
        // Given
        let settings = NotificationSettings(
            userId: "test-user",
            enableAll: true,
            selectedEventIds: [1, 2]
        )
        
        // 創建一個真正過去的事件（不會被排程）和一個未來的事件
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        let pastDate = calendar.date(byAdding: .day, value: -5, to: today)!
        let futureDate = calendar.date(byAdding: .day, value: 5, to: today)!
        
        let pastEvent = Event(
            id: 1,
            type: .deity,
            title: "過去事件",
            description: "",
            lunarDate: nil,
            solarDate: [pastDate], // 過去的日期，會被 countdownDays 過濾
            solarMonth: nil,
            solarDay: nil,
            coverUrl: nil,
            deityRole: nil,
            worshipNotes: nil
        )
        
        let futureEvent = Event(
            id: 2,
            type: .deity,
            title: "未來事件",
            description: "",
            lunarDate: nil,
            solarDate: [futureDate], // 未來的日期
            solarMonth: nil,
            solarDay: nil,
            coverUrl: nil,
            deityRole: nil,
            worshipNotes: nil
        )
        
        mockAPIService.mockEvents = [pastEvent, futureEvent]
        
        // When
        await scheduler.scheduleNotifications(for: settings)
        
        // Then
        XCTAssertEqual(mockNotificationCenter.addedRequests.count, 1) // 只排程未來事件
        
        let request = mockNotificationCenter.addedRequests.first
        XCTAssertNotNil(request)
        XCTAssertTrue(request!.content.body.contains("未來事件"))
    }
    
    // MARK: - 通知內容測試
    
    func testNotificationContentGeneration() async {
        // Given
        let settings = NotificationSettings(
            userId: "test-user",
            enableAll: true,
            advanceDays: 3,
            selectedEventIds: [1]
        )
        
        mockAPIService.mockEvents = [
            createMockEvent(id: 1, title: "媽祖聖誕", type: .deity, countdownDays: 10)
        ]
        
        // When
        await scheduler.scheduleNotifications(for: settings)
        
        // Then
        XCTAssertEqual(mockNotificationCenter.addedRequests.count, 1)
        
        let request = mockNotificationCenter.addedRequests.first!
        XCTAssertEqual(request.content.title, "📿 重要日子提醒")
        XCTAssertTrue(request.content.body.contains("3天後"))
        XCTAssertTrue(request.content.body.contains("媽祖聖誕"))
        XCTAssertEqual(request.content.sound, .default)
        XCTAssertEqual(request.content.badge, 1)
        XCTAssertEqual(request.content.categoryIdentifier, "EVENT_REMINDER")
        
        // 檢查 userInfo
        XCTAssertEqual(request.content.userInfo["eventId"] as? Int, 1)
        XCTAssertEqual(request.content.userInfo["eventName"] as? String, "媽祖聖誕")
        XCTAssertEqual(request.content.userInfo["eventType"] as? String, "deity")
    }
    
    func testNotificationContentForSameDayReminder() async {
        // Given
        let settings = NotificationSettings(
            userId: "test-user",
            enableAll: true,
            advanceDays: 0, // 當天提醒
            selectedEventIds: [1]
        )
        
        mockAPIService.mockEvents = [
            createMockEvent(id: 1, title: "今日事件", type: .deity, countdownDays: 5)
        ]
        
        // When
        await scheduler.scheduleNotifications(for: settings)
        
        // Then
        let request = mockNotificationCenter.addedRequests.first!
        XCTAssertTrue(request.content.body.contains("今天"))
        XCTAssertTrue(request.content.body.contains("今日事件"))
    }
    
    // MARK: - Helper Methods
    
    private func createMockEvent(id: Int, title: String, type: EventType, countdownDays: Int) -> Event {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        
        // 對於負數的 countdownDays，我們不設定任何日期，讓 Event.countdownDays 返回預期的負值
        if countdownDays < 0 {
            // 創建一個沒有有效日期的事件，這樣 countdownDays 會計算為負數或大數值
            return Event(
                id: id,
                type: type,
                title: title,
                description: "",
                lunarDate: nil,
                solarDate: [], // 空數組
                solarMonth: nil,
                solarDay: nil,
                coverUrl: nil,
                deityRole: nil,
                worshipNotes: nil
            )
        } else {
            // 對於非負數，正常設定日期
            let targetDate = calendar.date(byAdding: .day, value: countdownDays, to: today) ?? today
            return Event(
                id: id,
                type: type,
                title: title,
                description: "",
                lunarDate: nil,
                solarDate: [targetDate],
                solarMonth: nil,
                solarDay: nil,
                coverUrl: nil,
                deityRole: nil,
                worshipNotes: nil
            )
        }
    }
}

// MARK: - Mock Classes

class MockAPIService: APIServiceProtocol {
    var mockEvents: [Event] = []
    var shouldThrowError = false
    
    func fetchEvents() async throws -> [Event] {
        if shouldThrowError {
            throw NSError(domain: "TestError", code: 1, userInfo: [NSLocalizedDescriptionKey: "Mock error"])
        }
        return mockEvents
    }
}

