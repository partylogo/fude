//
//  NotificationSettingsManagerTests.swift
//  fudeTests
//
//  Created by AI Assistant on 2025-01-02.
//  Copyright © 2025 fude. All rights reserved.
//

import XCTest
@testable import fude

@MainActor
final class NotificationSettingsManagerTests: XCTestCase {
    
    var settingsManager: NotificationSettingsManager!
    var mockUserDefaults: UserDefaults!
    
    override func setUp() {
        super.setUp()
        
        // 使用專用的測試 UserDefaults
        mockUserDefaults = UserDefaults(suiteName: "test.notification.settings")!
        settingsManager = NotificationSettingsManager(userDefaults: mockUserDefaults)
        
        // 清除測試數據
        settingsManager.clearAllSettings()
    }
    
    override func tearDown() {
        settingsManager.clearAllSettings()
        settingsManager = nil
        mockUserDefaults = nil
        super.tearDown()
    }
    
    // MARK: - 保存和加載測試
    
    func testSaveAndLoadSettings() {
        // Arrange
        let testSettings = NotificationSettings(
            userId: "test-user",
            enableAll: true,
            advanceDays: 3,
            notifyTime: "09:30",
            newmoonEnabled: true,
            fullmoonEnabled: false,
            customEnabled: true,
            selectedEventIds: [1, 2, 3],
            selectedGroupIds: [1]
        )
        
        // Act
        settingsManager.saveSettings(testSettings)
        let loadedSettings = settingsManager.loadSettings()
        
        // Assert
        XCTAssertEqual(loadedSettings.userId, testSettings.userId)
        XCTAssertEqual(loadedSettings.enableAll, testSettings.enableAll)
        XCTAssertEqual(loadedSettings.advanceDays, testSettings.advanceDays)
        XCTAssertEqual(loadedSettings.notifyTime, testSettings.notifyTime)
        XCTAssertEqual(loadedSettings.newmoonEnabled, testSettings.newmoonEnabled)
        XCTAssertEqual(loadedSettings.fullmoonEnabled, testSettings.fullmoonEnabled)
        XCTAssertEqual(loadedSettings.customEnabled, testSettings.customEnabled)
        XCTAssertEqual(loadedSettings.selectedEventIds, testSettings.selectedEventIds)
        XCTAssertEqual(loadedSettings.selectedGroupIds, testSettings.selectedGroupIds)
    }
    
    func testLoadDefaultSettingsWhenNoSavedData() {
        // Arrange - 確保沒有保存的數據
        XCTAssertFalse(settingsManager.hasStoredSettings)
        
        // Act
        let loadedSettings = settingsManager.loadSettings()
        
        // Assert - 檢查默認值
        XCTAssertEqual(loadedSettings.userId, "local-user")
        XCTAssertFalse(loadedSettings.enableAll) // 默認關閉
        XCTAssertEqual(loadedSettings.advanceDays, 1)
        XCTAssertEqual(loadedSettings.notifyTime, "08:00")
        XCTAssertFalse(loadedSettings.newmoonEnabled)
        XCTAssertFalse(loadedSettings.fullmoonEnabled)
        XCTAssertTrue(loadedSettings.customEnabled)
        XCTAssertTrue(loadedSettings.selectedEventIds.isEmpty)
        XCTAssertTrue(loadedSettings.selectedGroupIds.isEmpty)
    }
    
    func testHasStoredSettings() {
        // Arrange
        XCTAssertFalse(settingsManager.hasStoredSettings)
        
        let testSettings = NotificationSettings(userId: "test")
        
        // Act
        settingsManager.saveSettings(testSettings)
        
        // Assert
        XCTAssertTrue(settingsManager.hasStoredSettings)
    }
    
    // MARK: - 錯誤處理測試
    
    func testLoadSettingsWithCorruptedData() {
        // Arrange - 保存無效的 JSON 數據
        let corruptedData = "invalid json data".data(using: .utf8)!
        mockUserDefaults.set(corruptedData, forKey: "notification_settings_v1")
        
        // Act
        let loadedSettings = settingsManager.loadSettings()
        
        // Assert - 應該返回默認設定
        XCTAssertEqual(loadedSettings.userId, "local-user")
        XCTAssertFalse(loadedSettings.enableAll)
    }
    
    // MARK: - 清除設定測試
    
    func testClearAllSettings() {
        // Arrange
        let testSettings = NotificationSettings(userId: "test")
        settingsManager.saveSettings(testSettings)
        XCTAssertTrue(settingsManager.hasStoredSettings)
        
        // Act
        settingsManager.clearAllSettings()
        
        // Assert
        XCTAssertFalse(settingsManager.hasStoredSettings)
        
        // 加載設定應該返回默認值
        let loadedSettings = settingsManager.loadSettings()
        XCTAssertEqual(loadedSettings.userId, "local-user")
        XCTAssertFalse(loadedSettings.enableAll)
    }
    
    // MARK: - 設定變更持久化測試
    
    func testSettingsChangePersistence() {
        // Arrange
        var settings = settingsManager.loadSettings()
        XCTAssertFalse(settings.enableAll) // 初始為 false
        
        // Act - 修改設定並保存
        settings.enableAll = true
        settings.advanceDays = 7
        settings.selectedEventIds = [1, 2, 3, 4, 5]
        settingsManager.saveSettings(settings)
        
        // 重新創建 manager 模擬 App 重啟
        let newManager = NotificationSettingsManager(userDefaults: mockUserDefaults)
        let reloadedSettings = newManager.loadSettings()
        
        // Assert
        XCTAssertTrue(reloadedSettings.enableAll)
        XCTAssertEqual(reloadedSettings.advanceDays, 7)
        XCTAssertEqual(reloadedSettings.selectedEventIds, [1, 2, 3, 4, 5])
    }
    
    // MARK: - 複雜設定測試
    
    func testComplexSettingsConfiguration() {
        // Arrange
        let complexSettings = NotificationSettings(
            userId: "complex-user",
            enableAll: true,
            advanceDays: 5,
            notifyTime: "18:30",
            newmoonEnabled: true,
            fullmoonEnabled: true,
            customEnabled: false,
            selectedEventIds: [1, 3, 5, 7, 9, 11, 13, 15],
            selectedGroupIds: [1, 2, 3]
        )
        
        // Act
        settingsManager.saveSettings(complexSettings)
        let loadedSettings = settingsManager.loadSettings()
        
        // Assert
        XCTAssertEqual(loadedSettings, complexSettings)
    }
}