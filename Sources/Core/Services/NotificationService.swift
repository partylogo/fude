//
//  NotificationService.swift
//  fude
//
//  Created by AI Assistant on 2025-01-01.
//  Copyright © 2025 fude. All rights reserved.
//

import Foundation
import UserNotifications
import Combine

/// 通知服務 - 管理 iOS 本地通知權限與排程
/// 遵循 TDD 原則設計，支援依賴注入用於測試
@MainActor
final class NotificationService: NSObject, ObservableObject {
    
    // MARK: - Published Properties
    
    /// 當前通知權限狀態
    @Published var authorizationStatus: UNAuthorizationStatus = .notDetermined
    
    /// 是否可以啟用通知功能（權限已授權）
    var canEnableNotifications: Bool {
        return authorizationStatus == .authorized
    }
    
    // MARK: - Private Properties
    
    private let notificationCenter: any UNUserNotificationCenterProtocol
    
    // MARK: - Singleton
    
    static let shared = NotificationService()
    
    // MARK: - Initialization
    
    /// 預設初始化器 - 使用系統 UNUserNotificationCenter
    private override init() {
        self.notificationCenter = UNUserNotificationCenter.current()
        super.init()
        setupNotificationCenter()
    }
    
    /// 測試用初始化器 - 支援依賴注入
    init(notificationCenter: any UNUserNotificationCenterProtocol) {
        self.notificationCenter = notificationCenter
        super.init()
        setupNotificationCenter()
    }
    
    // MARK: - Setup
    
    private func setupNotificationCenter() {
        // 設定 delegate（只對真實的 UNUserNotificationCenter）
        if let realCenter = notificationCenter as? UNUserNotificationCenter {
            realCenter.delegate = self
        }
        
        // 初始化時檢查權限狀態
        Task {
            await checkAuthorizationStatus()
            // App 首次啟動時主動請求權限
            await requestAuthorizationOnFirstLaunch()
        }
    }
    
    /// App 首次啟動時主動請求權限
    private func requestAuthorizationOnFirstLaunch() async {
        // 只在 notDetermined 狀態下主動請求權限
        guard authorizationStatus == .notDetermined else { return }
        
        print("🔔 First launch: requesting notification permission proactively")
        await requestAuthorizationIfNeeded()
    }
    
    // MARK: - Public Methods
    
    /// 智能權限請求 - 只在需要時請求
    func requestAuthorizationIfNeeded() async {
        print("🔔 NotificationService.requestAuthorizationIfNeeded called")
        print("🔔 Current authorization status: \(authorizationStatus)")
        
        // 只在 notDetermined 狀態下請求權限
        guard authorizationStatus == .notDetermined else { 
            print("🔔 Permission already determined, skipping request")
            return 
        }
        
        print("🔔 Requesting authorization...")
        do {
            let granted = try await notificationCenter.requestAuthorization(
                options: [UNAuthorizationOptions.alert, .sound, .badge]
            )
            
            // 權限請求完成後更新狀態
            await checkAuthorizationStatus()
            
            print("🔔 通知權限請求結果：\(granted ? "已授權" : "被拒絕")")
            print("🔔 Updated authorization status: \(authorizationStatus)")
        } catch {
            print("🔔 權限請求錯誤：\(error)")
        }
    }
    
    /// 強制請求權限 - 用於用戶在 App 內主動開啟通知時
    func requestAuthorizationForced() async -> Bool {
        print("🔔 NotificationService.requestAuthorizationForced called")
        print("🔔 Current authorization status: \(authorizationStatus)")
        
        // 對於 denied 狀態，iOS 不會再顯示對話框，需要引導用戶到設定
        if authorizationStatus == .denied {
            print("🔔 Permission denied, cannot show dialog again. User must go to Settings.")
            return false
        }
        
        // 對於 notDetermined，直接請求
        if authorizationStatus == .notDetermined {
            await requestAuthorizationIfNeeded()
            return authorizationStatus == .authorized
        }
        
        // 已經授權
        if authorizationStatus == .authorized {
            print("🔔 Permission already authorized")
            return true
        }
        
        print("🔔 Permission in other state: \(authorizationStatus)")
        return false
    }
    
    /// 檢查當前權限狀態
    func checkAuthorizationStatus() async {
        print("🔔 Checking notification authorization status...")
        let settings = await notificationCenter.getNotificationSettings()
        let oldStatus = authorizationStatus
        authorizationStatus = settings.authorizationStatus
        
        if oldStatus != authorizationStatus {
            print("🔔 Authorization status changed: \(oldStatus) → \(authorizationStatus)")
        } else {
            print("🔔 Authorization status unchanged: \(authorizationStatus)")
        }
    }
}

// MARK: - UNUserNotificationCenterDelegate

extension NotificationService: @preconcurrency UNUserNotificationCenterDelegate {
    
    /// 處理前景通知顯示
    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        // 在前景顯示通知
        completionHandler([.banner, .sound, .badge])
    }
    
    /// 處理通知點擊
    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        // 處理通知點擊邏輯
        print("通知被點擊：\(response.notification.request.identifier)")
        completionHandler()
    }
}

// MARK: - Protocol for Dependency Injection

/// Protocol 用於依賴注入測試
protocol UNUserNotificationCenterProtocol {
    func getNotificationSettings() async -> NotificationSettingsProtocol
    func requestAuthorization(options: UNAuthorizationOptions) async throws -> Bool
    func add(_ request: UNNotificationRequest) async throws
    func removeAllPendingNotificationRequests() async
    func getPendingNotificationRequests() async -> [UNNotificationRequest]
}

/// Protocol for notification settings
protocol NotificationSettingsProtocol {
    var authorizationStatus: UNAuthorizationStatus { get }
}

/// 擴展 UNNotificationSettings 實作 protocol
extension UNNotificationSettings: NotificationSettingsProtocol {}

/// 擴展 UNUserNotificationCenter 實作 protocol
extension UNUserNotificationCenter: UNUserNotificationCenterProtocol {
    func getNotificationSettings() async -> NotificationSettingsProtocol {
        return await withCheckedContinuation { continuation in
            getNotificationSettings { settings in
                continuation.resume(returning: settings)
            }
        }
    }
    
    func requestAuthorization(options: UNAuthorizationOptions) async throws -> Bool {
        return try await withCheckedThrowingContinuation { continuation in
            requestAuthorization(options: options) { granted, error in
                if let error = error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume(returning: granted)
                }
            }
        }
    }
    
    func add(_ request: UNNotificationRequest) async throws {
        return try await withCheckedThrowingContinuation { continuation in
            add(request) { error in
                if let error = error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume(returning: ())
                }
            }
        }
    }
    
    func removeAllPendingNotificationRequests() async {
        return await withCheckedContinuation { continuation in
            removeAllPendingNotificationRequests()
            continuation.resume(returning: ())
        }
    }
    
    func getPendingNotificationRequests() async -> [UNNotificationRequest] {
        return await withCheckedContinuation { continuation in
            getPendingNotificationRequests { requests in
                continuation.resume(returning: requests)
            }
        }
    }
}