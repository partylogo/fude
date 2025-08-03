//
//  NotificationSettingsManager.swift
//  fude
//
//  Created by AI Assistant on 2025-01-02.
//  Copyright © 2025 fude. All rights reserved.
//

import Foundation

/// 通知設定本地存儲管理器
/// Version 1.1: 使用 UserDefaults 本地存儲
/// Version 2.0: 將提供遷移到用戶系統的接口
@MainActor
final class NotificationSettingsManager: ObservableObject {
    
    // MARK: - Constants
    
    private enum Keys {
        static let notificationSettings = "notification_settings_v1"
        static let hasDefaultSettings = "has_default_settings_v1"
    }
    
    // MARK: - Properties
    
    private let userDefaults: UserDefaults
    
    // MARK: - Singleton
    
    static let shared = NotificationSettingsManager()
    
    private init() {
        self.userDefaults = .standard
    }
    
    // For testing
    init(userDefaults: UserDefaults) {
        self.userDefaults = userDefaults
    }
    
    // MARK: - Public Methods
    
    /// 保存通知設定到本地存儲
    func saveSettings(_ settings: NotificationSettings) {
        print("💾 Saving notification settings to UserDefaults...")
        
        do {
            let data = try JSONEncoder().encode(settings)
            userDefaults.set(data, forKey: Keys.notificationSettings)
            userDefaults.set(true, forKey: Keys.hasDefaultSettings)
            print("💾 Settings saved successfully")
        } catch {
            print("❌ Failed to save settings: \(error)")
        }
    }
    
    /// 從本地存儲加載通知設定
    /// - Returns: 保存的設定，如果沒有則返回默認設定
    func loadSettings() -> NotificationSettings {
        print("📂 Loading notification settings from UserDefaults...")
        
        guard let data = userDefaults.data(forKey: Keys.notificationSettings) else {
            print("📂 No saved settings found, using default settings")
            return createDefaultSettings()
        }
        
        do {
            let settings = try JSONDecoder().decode(NotificationSettings.self, from: data)
            print("📂 Settings loaded successfully")
            return settings
        } catch {
            print("❌ Failed to decode settings: \(error), using default settings")
            return createDefaultSettings()
        }
    }
    
    /// 檢查是否有保存的設定
    var hasStoredSettings: Bool {
        return userDefaults.bool(forKey: Keys.hasDefaultSettings)
    }
    
    /// 清除所有保存的設定（用於測試或重置）
    func clearAllSettings() {
        print("🗑️ Clearing all notification settings...")
        userDefaults.removeObject(forKey: Keys.notificationSettings)
        userDefaults.removeObject(forKey: Keys.hasDefaultSettings)
        print("🗑️ Settings cleared successfully")
    }
    
    // MARK: - Version 2.0 Migration Interface
    
    /// 預留給 Version 2.0 的用戶系統遷移接口
    /// 將本地設定遷移到用戶帳號系統
    func migrateToUserSystem(userId: String) async throws {
        // TODO: Version 2.0 實作
        // 1. 讀取本地設定
        // 2. 上傳到用戶系統
        // 3. 清除本地設定
        print("🔄 Migration to user system not implemented yet (Version 2.0)")
    }
    
    // MARK: - Private Methods
    
    /// 創建默認通知設定
    private func createDefaultSettings() -> NotificationSettings {
        return NotificationSettings(
            userId: "local-user", // Version 1.1 使用固定 ID
            enableAll: false,     // 默認關閉，需要用戶主動開啟
            advanceDays: 1,
            notifyTime: "08:00",
            newmoonEnabled: false,
            fullmoonEnabled: false,
            customEnabled: true,
            selectedEventIds: [],
            selectedGroupIds: []
        )
    }
}