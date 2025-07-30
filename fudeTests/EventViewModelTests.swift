//
//  EventViewModelTests.swift
//  fudeTests
//
//  Created by AI Assistant on 2024-12-30.
//  Copyright © 2024 fude. All rights reserved.
//

import Testing
import SwiftUI
@testable import fude

/// EventViewModel 單元測試
struct EventViewModelTests {
    
    // MARK: - Initialization Tests
    
    @Test func viewModelInitialization() async throws {
        // GIVEN: 創建 ViewModel
        let viewModel = await EventViewModel()
        
        // WHEN: 等待初始載入完成（模擬網路延遲）
        try await Task.sleep(for: .milliseconds(600))
        
        // THEN: 檢查初始狀態
        let upcomingEvents = await viewModel.upcomingEvents
        let isLoading = await viewModel.isLoading
        let errorMessage = await viewModel.errorMessage
        
        #expect(!upcomingEvents.isEmpty, "ViewModel should load events on initialization")
        #expect(isLoading == false, "Loading should be false after initialization")
        #expect(errorMessage == nil, "Error message should be nil on successful load")
    }
    
    // MARK: - Data Loading Tests
    
    @Test func loadUpcomingEventsSuccess() async throws {
        // GIVEN: 創建 ViewModel
        let viewModel = await EventViewModel()
        
        // WHEN: 載入事件
        await viewModel.loadUpcomingEvents()
        
        // 等待異步載入完成
        try await Task.sleep(for: .milliseconds(600))
        
        // THEN: 檢查結果
        let upcomingEvents = await viewModel.upcomingEvents
        let isLoading = await viewModel.isLoading
        
        #expect(!upcomingEvents.isEmpty, "Should load upcoming events")
        #expect(isLoading == false, "Loading should be false after completion")
        
        // 檢查事件都是近期的（30天內）
        for event in upcomingEvents {
            #expect(event.countdownDays <= 30, "All events should be within 30 days")
        }
    }
    
    @Test func refreshFunctionality() async throws {
        // GIVEN: 創建 ViewModel
        let viewModel = await EventViewModel()
        
        // 等待初始載入完成
        try await Task.sleep(for: .milliseconds(600))
        let initialEventCount = await viewModel.upcomingEvents.count
        
        // WHEN: 刷新資料
        await viewModel.refresh()
        
        // 等待刷新完成
        try await Task.sleep(for: .milliseconds(600))
        
        // THEN: 檢查資料已更新
        let refreshedEventCount = await viewModel.upcomingEvents.count
        let isLoading = await viewModel.isLoading
        
        #expect(refreshedEventCount == initialEventCount, "Event count should remain consistent after refresh")
        #expect(isLoading == false, "Loading should be false after refresh")
    }
    
    // MARK: - Data Filtering Tests
    
    @Test func eventsFilteringByType() async throws {
        // GIVEN: 創建 ViewModel
        let viewModel = await EventViewModel()
        
        // 等待初始載入完成
        try await Task.sleep(for: .milliseconds(600))
        
        // WHEN: 取得不同類型的事件
        let deityEvents = await viewModel.events(ofType: .deity)
        let festivalEvents = await viewModel.events(ofType: .festival)
        let customEvents = await viewModel.events(ofType: .custom)
        
        // THEN: 檢查篩選結果
        #expect(!deityEvents.isEmpty, "Should have deity events")
        #expect(!festivalEvents.isEmpty, "Should have festival events")
        
        // 確認每個篩選結果的類型正確
        for event in deityEvents {
            #expect(event.type == .deity, "Deity events should have deity type")
        }
        
        for event in festivalEvents {
            #expect(event.type == .festival, "Festival events should have festival type")
        }
        
        for event in customEvents {
            #expect(event.type == .custom, "Custom events should have custom type")
        }
    }
    
    @Test func computedPropertiesCorrectness() async throws {
        // GIVEN: 創建 ViewModel
        let viewModel = await EventViewModel()
        
        // 等待初始載入完成
        try await Task.sleep(for: .milliseconds(600))
        
        // WHEN: 取得 computed properties
        let deityEvents = await viewModel.deityEvents
        let festivalEvents = await viewModel.festivalEvents
        let upcomingThisWeek = await viewModel.upcomingThisWeek
        let allEvents = await viewModel.upcomingEvents
        
        // THEN: 檢查 computed properties 正確性
        let manualDeityEvents = allEvents.filter { $0.type == .deity }
        let manualFestivalEvents = allEvents.filter { $0.type == .festival }
        let manualUpcomingThisWeek = allEvents.filter { $0.isUpcoming }
        
        #expect(deityEvents.count == manualDeityEvents.count, "deityEvents should match manual filter")
        #expect(festivalEvents.count == manualFestivalEvents.count, "festivalEvents should match manual filter")
        #expect(upcomingThisWeek.count == manualUpcomingThisWeek.count, "upcomingThisWeek should match manual filter")
    }
    
    // MARK: - Formatting Tests
    
    @Test func countdownFormatting() async throws {
        // GIVEN: 創建 ViewModel
        let viewModel = await EventViewModel()
        
        // WHEN & THEN: 測試倒數天數格式化
        let todayFormat = await viewModel.formatCountdown(0)
        let tomorrowFormat = await viewModel.formatCountdown(1)
        let threeDaysFormat = await viewModel.formatCountdown(3)
        let tenDaysFormat = await viewModel.formatCountdown(10)
        
        #expect(todayFormat == "今天", "0 days should format as '今天'")
        #expect(tomorrowFormat == "明天", "1 day should format as '明天'")
        #expect(threeDaysFormat == "3天後", "3 days should format as '3天後'")
        #expect(tenDaysFormat == "10天後", "10 days should format as '10天後'")
    }
    
    @Test func eventColorMapping() async throws {
        // GIVEN: 創建 ViewModel
        let viewModel = await EventViewModel()
        
        // WHEN: 創建不同類型的事件
        let deityEvent = Event(
            id: 999,
            type: .deity,
            title: "測試神明",
            description: "測試",
            lunarDate: LunarDate(month: 1, day: 1, isLeap: false),
            solarDate: [Date()],
            coverUrl: nil,
            deityRole: "測試",
            worshipNotes: "測試"
        )
        
        let festivalEvent = Event(
            id: 998,
            type: .festival,
            title: "測試節慶",
            description: "測試",
            lunarDate: LunarDate(month: 1, day: 1, isLeap: false),
            solarDate: [Date()],
            coverUrl: nil,
            deityRole: nil,
            worshipNotes: nil
        )
        
        let customEvent = Event(
            id: 997,
            type: .custom,
            title: "測試自定",
            description: "測試",
            lunarDate: nil,
            solarDate: [Date()],
            coverUrl: nil,
            deityRole: nil,
            worshipNotes: nil
        )
        
        // THEN: 檢查顏色映射
        let deityColor = await viewModel.eventColor(deityEvent)
        let festivalColor = await viewModel.eventColor(festivalEvent)
        let customColor = await viewModel.eventColor(customEvent)
        
        #expect(deityColor == .primaryColor, "Deity events should use primary color")
        #expect(festivalColor == .secondaryColor, "Festival events should use secondary color")
        #expect(customColor == .primaryColor, "Custom events should use primary color")
    }
    
    // MARK: - Async Loading Tests
    
    @Test func loadingStateTransitions() async throws {
        // GIVEN: 創建 ViewModel
        let viewModel = await EventViewModel()
        
        // WHEN: 開始載入前檢查狀態
        await viewModel.loadUpcomingEvents()
        
        // 等待載入完成
        try await Task.sleep(for: .milliseconds(600))
        
        // THEN: 載入完成後檢查狀態
        let finalLoadingState = await viewModel.isLoading
        let finalEvents = await viewModel.upcomingEvents
        
        #expect(finalLoadingState == false, "Loading should be false after completion")
        #expect(!finalEvents.isEmpty, "Should have events after loading")
    }
    
    // MARK: - Edge Cases Tests
    
    @Test func emptyFilterResults() async throws {
        // GIVEN: 創建 ViewModel
        let viewModel = await EventViewModel()
        
        // WHEN: 篩選一個不存在的類型（假設沒有 custom 類型的事件）
        let customEvents = await viewModel.events(ofType: .custom)
        
        // THEN: 應該返回空陣列而不是 nil
        #expect(customEvents.isEmpty == true, "Non-existent event types should return empty array")
    }
    
    @Test func eventConsistency() async throws {
        // GIVEN: 創建 ViewModel
        let viewModel = await EventViewModel()
        
        // WHEN: 多次取得事件資料
        let events1 = await viewModel.upcomingEvents
        let events2 = await viewModel.upcomingEvents
        
        // THEN: 資料應該一致
        #expect(events1.count == events2.count, "Event data should be consistent")
        
        for (event1, event2) in zip(events1, events2) {
            #expect(event1.id == event2.id, "Event IDs should match")
            #expect(event1.title == event2.title, "Event titles should match")
        }
    }
}