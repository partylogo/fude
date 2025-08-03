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
        }
    }
    
    // MARK: - Public Methods
    
    /// 智能權限請求 - 只在需要時請求
    func requestAuthorizationIfNeeded() async {
        // 只在 notDetermined 狀態下請求權限
        guard authorizationStatus == .notDetermined else { return }
        
        do {
            let granted = try await notificationCenter.requestAuthorization(
                options: [UNAuthorizationOptions.alert, .sound, .badge]
            )
            
            // 權限請求完成後更新狀態
            await checkAuthorizationStatus()
            
            print("通知權限請求結果：\(granted ? "已授權" : "被拒絕")")
        } catch {
            print("權限請求錯誤：\(error)")
        }
    }
    
    /// 檢查當前權限狀態
    func checkAuthorizationStatus() async {
        let settings = await notificationCenter.getNotificationSettings()
        authorizationStatus = settings.authorizationStatus
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
}