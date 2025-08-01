//
//  SettingsViewModelTests.swift
//  fudeTests
//
//  Created by AI Assistant on 2024-12-30.
//  Copyright © 2024 fude. All rights reserved.
//

import Testing
import SwiftUI
@testable import fude

/// SettingsViewModel 單元測試
struct SettingsViewModelTests {
    
    // MARK: - Initialization Tests
    
    @Test func viewModelInitialization() async throws {
        // GIVEN: 創建 ViewModel
        let viewModel = await SettingsViewModel()
        try? await Task.sleep(for: .milliseconds(600))
        
        // THEN: 檢查初始狀態
        let notificationSettings = await viewModel.notificationSettings
        let availableDeities = await viewModel.availableDeities
        let availableFestivals = await viewModel.availableFestivals
        let teacherRecommendations = await viewModel.teacherRecommendations
        let isLoading = await viewModel.isLoading
        
        #expect(notificationSettings.userId == NotificationSettings.mockSettings.userId, "Should initialize with mock settings")
        #expect(!availableDeities.isEmpty, "Should have available deities")
        #expect(!availableFestivals.isEmpty, "Should have available festivals")
        #expect(teacherRecommendations != nil, "Should load teacher recommendations")
        #expect(isLoading == false, "Loading should be false after initialization")
    }
    
    // MARK: - Data Loading Tests
    
    @Test func loadDataFunctionality() async throws {
        // GIVEN: 創建 ViewModel
        let viewModel = await SettingsViewModel()
        try? await Task.sleep(for: .milliseconds(600))
        
        // WHEN: 重新載入資料
        await viewModel.loadData()
        
        // THEN: 檢查資料載入結果
        let availableDeities = await viewModel.availableDeities
        let availableFestivals = await viewModel.availableFestivals
        let teacherRecommendations = await viewModel.teacherRecommendations
        let isLoading = await viewModel.isLoading
        
        #expect(!availableDeities.isEmpty, "Should load deity events")
        #expect(!availableFestivals.isEmpty, "Should load festival events")
        #expect(teacherRecommendations?.name.contains("簡少年") == true, "Should load teacher recommendations")
        #expect(isLoading == false, "Loading should be false after completion")
        
        // 檢查資料類型正確性
        for deity in availableDeities {
            #expect(deity.type == .deity, "Available deities should have deity type")
        }
        
        for festival in availableFestivals {
            #expect(festival.type == .festival, "Available festivals should have festival type")
        }
    }
    
    // MARK: - Settings Toggle Tests
    
    @Test func toggleAllNotifications() async throws {
        // GIVEN: 創建 ViewModel
        let viewModel = await SettingsViewModel()
        try? await Task.sleep(for: .milliseconds(600))
        let initialState = await viewModel.notificationSettings.enableAll
        
        // WHEN: 切換總通知開關
        await viewModel.toggleAllNotifications()
        
        // THEN: 檢查狀態變化
        let newState = await viewModel.notificationSettings.enableAll
        #expect(newState == !initialState, "Toggle should change the enableAll state")
        
        // WHEN: 再次切換
        await viewModel.toggleAllNotifications()
        
        // THEN: 應該回到原始狀態
        let finalState = await viewModel.notificationSettings.enableAll
        #expect(finalState == initialState, "Double toggle should return to original state")
    }
    
    @Test func updateAdvanceDays() async throws {
        // GIVEN: 創建 ViewModel
        let viewModel = await SettingsViewModel()
        try? await Task.sleep(for: .milliseconds(600))
        
        // WHEN: 更新提前天數
        await viewModel.updateAdvanceDays(3)
        
        // THEN: 檢查更新結果
        let advanceDays = await viewModel.notificationSettings.advanceDays
        #expect(advanceDays == 3, "Advance days should be updated to 3")
        
        // WHEN: 測試邊界值
        await viewModel.updateAdvanceDays(0)
        let zeroDays = await viewModel.notificationSettings.advanceDays
        #expect(zeroDays == 0, "Should accept 0 advance days")
        
        await viewModel.updateAdvanceDays(7)
        let sevenDays = await viewModel.notificationSettings.advanceDays
        #expect(sevenDays == 7, "Should accept 7 advance days")
    }
    
    @Test func updateNotifyTime() async throws {
        // GIVEN: 創建 ViewModel 和測試時間
        let viewModel = await SettingsViewModel()
        try? await Task.sleep(for: .milliseconds(600))
        let testDate = Date()
        
        // WHEN: 更新通知時間
        await viewModel.updateNotifyTime(testDate)
        
        // THEN: 檢查時間格式
        let notifyTime = await viewModel.notificationSettings.notifyTime
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        let expectedTime = formatter.string(from: testDate)
        
        #expect(notifyTime == expectedTime, "Notify time should be formatted correctly")
    }
    
    @Test func toggleSpecificNotifications() async throws {
        // GIVEN: 創建 ViewModel
        let viewModel = await SettingsViewModel()
        try? await Task.sleep(for: .milliseconds(600))
        
        // WHEN & THEN: 測試各種通知開關
        let initialNewMoon = await viewModel.notificationSettings.newmoonEnabled
        await viewModel.toggleNewMoonEnabled()
        let newNewMoon = await viewModel.notificationSettings.newmoonEnabled
        #expect(newNewMoon == !initialNewMoon, "New moon toggle should work")
        
        let initialFullMoon = await viewModel.notificationSettings.fullmoonEnabled
        await viewModel.toggleFullMoonEnabled()
        let newFullMoon = await viewModel.notificationSettings.fullmoonEnabled
        #expect(newFullMoon == !initialFullMoon, "Full moon toggle should work")
        
        let initialCustom = await viewModel.notificationSettings.customEnabled
        await viewModel.toggleCustomEnabled()
        let newCustom = await viewModel.notificationSettings.customEnabled
        #expect(newCustom == !initialCustom, "Custom toggle should work")
    }
    
    // MARK: - Event Selection Tests
    
    @Test func toggleEventSelection() async throws {
        // GIVEN: 創建 ViewModel 和測試事件
        let viewModel = await SettingsViewModel()
        try? await Task.sleep(for: .milliseconds(600))
        let availableDeities = await viewModel.availableDeities
        let testEvent = availableDeities.first!
        
        // WHEN: 初始狀態檢查
        let initiallySelected = await viewModel.isEventSelected(testEvent)
        
        // WHEN: 切換選擇狀態
        await viewModel.toggleEventSelection(testEvent)
        
        // THEN: 檢查狀態變化
        let afterToggle = await viewModel.isEventSelected(testEvent)
        #expect(afterToggle == !initiallySelected, "Event selection should toggle")
        
        // WHEN: 再次切換
        await viewModel.toggleEventSelection(testEvent)
        
        // THEN: 應該回到原始狀態
        let finalState = await viewModel.isEventSelected(testEvent)
        #expect(finalState == initiallySelected, "Double toggle should return to original state")
    }
    
    @Test func eventSelectionIntegrity() async throws {
        // GIVEN: 創建 ViewModel
        let viewModel = await SettingsViewModel()
        try? await Task.sleep(for: .milliseconds(600))
        let availableDeities = await viewModel.availableDeities
        let testEvent = availableDeities.first!
        
        // WHEN: 確保事件未選中，然後選中
        if await viewModel.isEventSelected(testEvent) {
            await viewModel.toggleEventSelection(testEvent)
        }
        await viewModel.toggleEventSelection(testEvent)
        
        // THEN: 檢查 selectedEventIds 包含該事件
        let selectedEventIds = await viewModel.notificationSettings.selectedEventIds
        #expect(selectedEventIds.contains(testEvent.id), "Selected event IDs should contain the event")
        
        // WHEN: 取消選擇
        await viewModel.toggleEventSelection(testEvent)
        
        // THEN: 檢查 selectedEventIds 不包含該事件
        let updatedSelectedEventIds = await viewModel.notificationSettings.selectedEventIds
        #expect(!updatedSelectedEventIds.contains(testEvent.id), "Selected event IDs should not contain the event after deselection")
    }
    
    // MARK: - Group Management Tests
    
    @Test func toggleGroupSubscription() async throws {
        // GIVEN: 創建 ViewModel
        let viewModel = await SettingsViewModel()
        try? await Task.sleep(for: .milliseconds(600))
        let testGroupId = 1
        
        // WHEN: 檢查初始訂閱狀態
        let initialGroupIds = await viewModel.notificationSettings.selectedGroupIds
        let initiallySubscribed = initialGroupIds.contains(testGroupId)
        
        // WHEN: 切換群組訂閱
        await viewModel.toggleGroupSubscription(groupId: testGroupId)
        
        // THEN: 檢查訂閱狀態變化
        let updatedGroupIds = await viewModel.notificationSettings.selectedGroupIds
        let nowSubscribed = updatedGroupIds.contains(testGroupId)
        #expect(nowSubscribed == !initiallySubscribed, "Group subscription should toggle")
        
        // WHEN: 再次切換
        await viewModel.toggleGroupSubscription(groupId: testGroupId)
        
        // THEN: 應該回到原始狀態
        let finalGroupIds = await viewModel.notificationSettings.selectedGroupIds
        let finallySubscribed = finalGroupIds.contains(testGroupId)
        #expect(finallySubscribed == initiallySubscribed, "Double toggle should return to original state")
    }
    
    @Test func loadGroupItems() async throws {
        // GIVEN: 創建 ViewModel 和測試群組 ID
        let viewModel = await SettingsViewModel()
        try? await Task.sleep(for: .milliseconds(600))
        let testGroupId = Group.mockGroups.first!.id
        
        // WHEN: 載入群組項目
        await viewModel.loadGroupItems(groupId: testGroupId)
        
        // THEN: 檢查群組資料載入
        let teacherRecommendations = await viewModel.teacherRecommendations
        #expect(teacherRecommendations?.id == testGroupId, "Should load the correct group")
    }
    
    @Test func getGroupEvents() async throws {
        // GIVEN: 創建 ViewModel
        let viewModel = await SettingsViewModel()
        try? await Task.sleep(for: .milliseconds(600))
        let testGroup = Group.mockGroups.first!
        
        // WHEN: 取得群組事件
        let groupEvents = await viewModel.getGroupEvents(groupId: testGroup.id)
        
        // THEN: 檢查事件數量和內容
        #expect(!groupEvents.isEmpty, "Group should have events")
        #expect(groupEvents.count == testGroup.eventIds.count, "Event count should match group's event IDs")
        
        // 檢查事件 ID 是否在群組的 eventIds 中
        for event in groupEvents {
            #expect(testGroup.eventIds.contains(event.id), "Event should be in group's event IDs")
        }
    }
    
    // MARK: - Computed Properties Tests
    
    @Test func selectedEventsProperties() async throws {
        // GIVEN: 創建 ViewModel
        let viewModel = await SettingsViewModel()
        try? await Task.sleep(for: .milliseconds(600))
        let availableDeities = await viewModel.availableDeities
        let availableFestivals = await viewModel.availableFestivals
        
        // WHEN: 選擇一些事件
        if let firstDeity = availableDeities.first {
            await viewModel.toggleEventSelection(firstDeity)
        }
        if let firstFestival = availableFestivals.first {
            await viewModel.toggleEventSelection(firstFestival)
        }
        
        // THEN: 檢查 computed properties
        let selectedDeities = await viewModel.selectedDeities
        let selectedFestivals = await viewModel.selectedFestivals
        
        if availableDeities.first != nil {
            #expect(!selectedDeities.isEmpty, "Should have selected deities")
            #expect(selectedDeities.allSatisfy { $0.type == .deity }, "Selected deities should all be deity type")
        }
        
        if availableFestivals.first != nil {
            #expect(!selectedFestivals.isEmpty, "Should have selected festivals")
            #expect(selectedFestivals.allSatisfy { $0.type == .festival }, "Selected festivals should all be festival type")
        }
    }
    
    @Test func selectedRecommendationsCount() async throws {
        // GIVEN: 創建 ViewModel
        let viewModel = await SettingsViewModel()
        try? await Task.sleep(for: .milliseconds(600))
        
        // WHEN: 取得推薦項目數量
        let count = await viewModel.selectedRecommendationsCount
        
        // THEN: 檢查數量合理性
        #expect(count >= 0, "Recommendations count should be non-negative")
        
        // 如果有推薦群組，檢查數量計算正確性
        if let group = await viewModel.teacherRecommendations {
            let selectedEventIds = await viewModel.notificationSettings.selectedEventIds
            let expectedCount = group.eventIds.filter { selectedEventIds.contains($0) }.count
            #expect(count == expectedCount, "Recommendations count should match manual calculation")
        }
    }
    
    // MARK: - Formatting Tests
    
    @Test func formattedAdvanceDays() async throws {
        // GIVEN: 創建 ViewModel
        let viewModel = await SettingsViewModel()
        try? await Task.sleep(for: .milliseconds(600))
        
        // WHEN & THEN: 測試不同天數的格式化
        await viewModel.updateAdvanceDays(0)
        let zeroFormat = await viewModel.formattedAdvanceDays
        #expect(zeroFormat == "當天通知", "0 days should format as '當天通知'")
        
        await viewModel.updateAdvanceDays(1)
        let oneFormat = await viewModel.formattedAdvanceDays
        #expect(oneFormat == "1天前", "1 day should format as '1天前'")
        
        await viewModel.updateAdvanceDays(3)
        let threeFormat = await viewModel.formattedAdvanceDays
        #expect(threeFormat == "3天前", "3 days should format as '3天前'")
    }
    
    @Test func formattedNotifyTime() async throws {
        // GIVEN: 創建 ViewModel
        let viewModel = await SettingsViewModel()
        try? await Task.sleep(for: .milliseconds(600))
        
        // WHEN: 檢查通知時間格式
        let formattedTime = await viewModel.formattedNotifyTime
        let actualTime = await viewModel.notificationSettings.notifyTime
        
        // THEN: 格式化時間應該與實際時間一致
        #expect(formattedTime == actualTime, "Formatted notify time should match actual notify time")
    }
    
    @Test func isSubscribedToTeacherRecommendations() async throws {
        // GIVEN: 創建 ViewModel
        let viewModel = await SettingsViewModel()
        try? await Task.sleep(for: .milliseconds(600))
        
        // WHEN: 檢查初始訂閱狀態
        let initialSubscription = await viewModel.isSubscribedToTeacherRecommendations
        
        // WHEN: 如果有推薦群組，測試訂閱切換
        if let group = await viewModel.teacherRecommendations {
            await viewModel.toggleGroupSubscription(groupId: group.id)
            let afterToggle = await viewModel.isSubscribedToTeacherRecommendations
            #expect(afterToggle == !initialSubscription, "Teacher recommendations subscription should toggle")
        }
    }
    
    // MARK: - Edge Cases Tests
    
    @Test func nonExistentGroupHandling() async throws {
        // GIVEN: 創建 ViewModel
        let viewModel = await SettingsViewModel()
        try? await Task.sleep(for: .milliseconds(600))
        let nonExistentGroupId = 99999
        
        // WHEN: 嘗試取得不存在的群組事件
        let events = await viewModel.getGroupEvents(groupId: nonExistentGroupId)
        
        // THEN: 應該返回空陣列
        #expect(events.isEmpty, "Non-existent group should return empty events array")
        
        // WHEN: 嘗試載入不存在的群組項目
        await viewModel.loadGroupItems(groupId: nonExistentGroupId)
        
        // THEN: teacherRecommendations 應該保持不變
        let recommendations = await viewModel.teacherRecommendations
        #expect(recommendations != nil, "Teacher recommendations should remain unchanged for non-existent group")
    }
    
    @Test func duplicateEventSelectionHandling() async throws {
        // GIVEN: 創建 ViewModel
        let viewModel = await SettingsViewModel()
        try? await Task.sleep(for: .milliseconds(600))
        let availableDeities = await viewModel.availableDeities
        let testEvent = availableDeities.first!
        
        // WHEN: 確保事件已選中
        let isInitiallySelected = await viewModel.isEventSelected(testEvent)
        if !isInitiallySelected {
            await viewModel.toggleEventSelection(testEvent)
        }
        
        let selectedEventIds = await viewModel.notificationSettings.selectedEventIds
        let initialCount = selectedEventIds.filter { $0 == testEvent.id }.count
        
        // WHEN: 再次選擇相同事件（應該取消選擇）
        await viewModel.toggleEventSelection(testEvent)
        
        // THEN: 事件應該被移除，而不是重複添加
        let finalSelectedEventIds = await viewModel.notificationSettings.selectedEventIds
        let finalCount = finalSelectedEventIds.filter { $0 == testEvent.id }.count
        
        #expect(finalCount < initialCount, "Event should be removed, not duplicated")
        #expect(finalCount == 0, "Event should be completely removed")
    }
}