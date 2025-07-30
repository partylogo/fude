//
//  fudeTests.swift
//  fudeTests
//
//  Created by 謝守澤 on 2025/7/30.
//

import Testing
@testable import fude

struct fudeTests {

    // MARK: - Event Model Tests
    
    @Test func eventMockDataNotEmpty() async throws {
        // RED: 測試 Mock 資料不為空
        #expect(!Event.mockEvents.isEmpty, "Mock events should not be empty")
        #expect(Event.mockEvents.count >= 5, "Should have at least 5 mock events")
    }
    
    @Test func eventTypesAreCorrect() async throws {
        // RED: 測試事件類型正確
        let deityEvents = Event.events(ofType: .deity)
        let festivalEvents = Event.events(ofType: .festival)
        
        #expect(!deityEvents.isEmpty, "Should have deity events")
        #expect(!festivalEvents.isEmpty, "Should have festival events")
        
        // 確認每個神明事件都有神明相關欄位
        for event in deityEvents {
            #expect(event.deityRole != nil, "Deity event should have deity role")
            #expect(event.worshipNotes != nil, "Deity event should have worship notes")
        }
    }
    
    @Test func lunarDateDisplayString() async throws {
        // RED: 測試農曆日期顯示格式
        let lunarDate = LunarDate(month: 3, day: 23, isLeap: false)
        #expect(lunarDate.displayString == "農曆三月廿三", "Lunar date display should be correct")
        
        let leapLunarDate = LunarDate(month: 3, day: 23, isLeap: true)
        #expect(leapLunarDate.displayString == "農曆閏三月廿三", "Leap lunar date display should be correct")
    }
    
    @Test func upcomingEventsFiltering() async throws {
        // RED: 測試近期事件篩選
        let upcomingEvents = Event.upcomingEvents
        
        // 所有近期事件的倒數天數都應該 <= 30
        for event in upcomingEvents {
            #expect(event.countdownDays <= 30, "Upcoming event should be within 30 days")
        }
        
        // 近期事件應該按倒數天數排序
        for i in 0..<(upcomingEvents.count - 1) {
            #expect(upcomingEvents[i].countdownDays <= upcomingEvents[i + 1].countdownDays,
                   "Upcoming events should be sorted by countdown days")
        }
    }
    
    // MARK: - NotificationSettings Model Tests
    
    @Test func notificationSettingsInitialization() async throws {
        // RED: 測試通知設定初始化
        let settings = NotificationSettings(userId: "test-user")
        
        #expect(settings.userId == "test-user")
        #expect(settings.enableAll == true, "Enable all should be true by default")
        #expect(settings.advanceDays == 1, "Advance days should be 1 by default")
        #expect(settings.notifyTime == "08:00", "Notify time should be 08:00 by default")
    }
    
    @Test func notificationSettingsEventManagement() async throws {
        // RED: 測試事件管理功能
        var settings = NotificationSettings(userId: "test-user")
        
        // 測試新增事件
        settings.addSelectedEvent(1)
        #expect(settings.selectedEventIds.contains(1), "Should contain added event")
        
        // 測試重複新增
        settings.addSelectedEvent(1)
        #expect(settings.selectedEventIds.filter { $0 == 1 }.count == 1, "Should not add duplicate events")
        
        // 測試移除事件
        settings.removeSelectedEvent(1)
        #expect(!settings.selectedEventIds.contains(1), "Should not contain removed event")
    }
    
    // MARK: - Group Model Tests
    
    @Test func groupMockDataNotEmpty() async throws {
        // RED: 測試群組 Mock 資料不為空
        #expect(!Group.mockGroups.isEmpty, "Mock groups should not be empty")
        
        let firstGroup = Group.mockGroups.first!
        #expect(!firstGroup.eventIds.isEmpty, "Group should contain events")
        #expect(!firstGroup.getEvents().isEmpty, "Group should return events")
    }
    
    @Test func groupEventFiltering() async throws {
        // RED: 測試群組事件篩選
        let group = Group.mockGroups.first!
        
        let deityEvents = group.deityEvents
        let festivalEvents = group.festivalEvents
        
        // 確認神明事件類型正確
        for event in deityEvents {
            #expect(event.type == .deity, "Deity events should have deity type")
        }
        
        // 確認節慶事件類型正確
        for event in festivalEvents {
            #expect(event.type == .festival, "Festival events should have festival type")
        }
    }

}
