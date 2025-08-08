//
//  SettingsViewModel.swift
//  fude
//
//  Created by AI Assistant on 2024-12-19.
//  Copyright © 2024 fude. All rights reserved.
//

import SwiftUI
import Combine

/// 通知設定頁面的 ViewModel
@MainActor
class SettingsViewModel: ObservableObject {
    
    // MARK: - Published Properties
    
    /// 通知設定
    @Published var notificationSettings: NotificationSettings
    
    /// 可選擇的神明列表
    @Published var availableDeities: [Event] = []
    
    /// 可選擇的節慶列表
    @Published var availableFestivals: [Event] = []
    
    /// 簡少年推薦群組
    @Published var teacherRecommendations: Group?
    
    /// 載入狀態
    @Published var isLoading = false
    
    /// 顯示權限設定提示 Alert
    @Published var showPermissionAlert = false
    
    /// 通知服務
    private let notificationService = NotificationService.shared
    
    /// 通知設定管理器
    private let settingsManager = NotificationSettingsManager.shared
    
    /// 通知排程器
    private let notificationScheduler = NotificationScheduler()
    
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Computed Properties
    
    /// 已選擇的神明
    var selectedDeities: [Event] {
        availableDeities.filter { deity in
            notificationSettings.selectedEventIds.contains(deity.id)
        }
    }
    
    /// 已選擇的節慶
    var selectedFestivals: [Event] {
        availableFestivals.filter { festival in
            notificationSettings.selectedEventIds.contains(festival.id)
        }
    }
    
    /// 已選擇的推薦項目數量
    var selectedRecommendationsCount: Int {
        guard let group = teacherRecommendations else { return 0 }
        return group.eventIds.filter { eventId in
            notificationSettings.selectedEventIds.contains(eventId)
        }.count
    }
    
    /// 是否可以啟用通知功能（基於系統權限）
    var canEnableNotifications: Bool {
        return notificationService.canEnableNotifications
    }
    
    private let api: APIService
    // MARK: - Initialization
    
    init(api: APIService = .shared) {
        self.api = api
        
        // 從本地存儲加載通知設定
        self.notificationSettings = settingsManager.loadSettings()
        
        // 監聽通知服務權限狀態變化
        notificationService.$authorizationStatus
            .sink { [weak self] status in
                self?.handlePermissionStatusChange(status)
            }
            .store(in: &cancellables)
        
        Task {
            await loadData()
        }
    }
    
    // MARK: - Data Loading
    
    /// 載入所有資料
    /// 重新載入資料；呼叫端可 `await` 等待完成（在測試中更穩定）
    func loadData() async {
        isLoading = true
        defer { isLoading = false }
        do {
            // 從 API 取得事件
            let events = try await APIService.shared.fetchEvents()
            self.availableDeities = events.filter { $0.type == .deity }
            self.availableFestivals = events.filter { $0.type == .festival }
        } catch {
            // 回退 Mock
            let allEvents = Event.mockEvents
            self.availableDeities = allEvents.filter { $0.type == .deity }
            self.availableFestivals = allEvents.filter { $0.type == .festival }
        }

        do {
            // 取得群組
            let groups = try await api.fetchGroups()
            self.teacherRecommendations = groups.first { $0.name.contains("簡少年") }
        } catch {
            self.teacherRecommendations = Group.mockGroups.first { $0.name.contains("簡少年") }
        }
    }
    
    // MARK: - Settings Actions
    
    /// 切換總通知開關
    func toggleAllNotifications() {
        let newValue = !notificationSettings.enableAll
        print("🔔 toggleAllNotifications called: \(notificationSettings.enableAll) → \(newValue)")
        
        // 如果用戶要開啟通知，嘗試請求權限
        if newValue {
            print("🔔 User wants to enable notifications, checking permission...")
            
            // 如果權限已經被拒絕，直接顯示 Alert
            if notificationService.authorizationStatus == .denied {
                print("🔔 Permission denied, showing alert")
                showPermissionAlert = true
                return
            }
            
            // 嘗試請求權限
            Task {
                let granted = await notificationService.requestAuthorizationForced()
                
                await MainActor.run {
                    if granted {
                        print("🔔 Permission granted, enabling notifications")
                        notificationSettings.enableAll = true
                        saveSettings()
                    } else {
                        print("🔔 Permission denied, showing alert")
                        showPermissionAlert = true
                        notificationSettings.enableAll = false
                        saveSettings()
                    }
                }
            }
        } else {
            // 用戶要關閉通知
            print("🔔 User disabling notifications")
            notificationSettings.enableAll = false
            saveSettings()
        }
    }
    
    /// 更新提前通知天數
    func updateAdvanceDays(_ days: Int) {
        notificationSettings.advanceDays = days
        saveSettings()
    }
    
    /// 更新通知時間
    func updateNotifyTime(_ time: Date) {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        notificationSettings.notifyTime = formatter.string(from: time)
        saveSettings()
    }
    
    /// 切換新月提醒（初一）
    func toggleNewMoonEnabled() {
        notificationSettings.newmoonEnabled.toggle()
        saveSettings()
    }
    
    /// 切換滿月提醒（十五）
    func toggleFullMoonEnabled() {
        notificationSettings.fullmoonEnabled.toggle()
        saveSettings()
    }
    
    /// 切換初二十六提醒
    func toggleSecondSixteenthEnabled() {
        // 這裡可以添加初二十六提醒的邏輯
        // 目前使用 customEnabled 作為示例
        notificationSettings.customEnabled.toggle()
    }
    
    /// 切換自定提醒
    func toggleCustomEnabled() {
        notificationSettings.customEnabled.toggle()
        saveSettings()
    }
    
    /// 切換群組訂閱
    func toggleGroupSubscription(groupId: Int) {
        if let index = notificationSettings.selectedGroupIds.firstIndex(of: groupId) {
            notificationSettings.selectedGroupIds.remove(at: index)
        } else {
            notificationSettings.selectedGroupIds.append(groupId)
        }
        saveSettings()
    }
    
    // MARK: - Event Selection
    
    /// 切換事件選擇狀態
    func toggleEventSelection(_ event: Event) {
        objectWillChange.send()
        if let index = notificationSettings.selectedEventIds.firstIndex(of: event.id) {
            notificationSettings.selectedEventIds.remove(at: index)
        } else {
            notificationSettings.selectedEventIds.append(event.id)
        }
        saveSettings()
    }
    
    /// 檢查事件是否已選擇
    func isEventSelected(_ event: Event) -> Bool {
        notificationSettings.selectedEventIds.contains(event.id)
    }
    
    // MARK: - Group Management
    
    /// 載入群組項目
    func loadGroupItems(groupId: Int) async {
        do {
            let items = try await api.fetchGroupItems(groupId: groupId)
            await MainActor.run {
                // 目前只更新 selected lists 供 UI 顯示
                if let deities = items.deities {
                    self.availableDeities = deities
                }
                if let festivals = items.festivals {
                    self.availableFestivals = festivals
                }
            }
        } catch {
            // fallback mock 行為保持
            guard let group = Group.mockGroups.first(where: { $0.id == groupId }) else { return }
            await MainActor.run {
                self.teacherRecommendations = group
            }
        }
    }
    
    /// 獲取群組中的事件
    func getGroupEvents(groupId: Int) -> [Event] {
        guard let group = Group.mockGroups.first(where: { $0.id == groupId }) else { return [] }
        return group.getEvents()
    }
}

// MARK: - Helper Extensions

extension SettingsViewModel {
    
    /// 格式化通知時間顯示
    var formattedNotifyTime: String {
        return notificationSettings.notifyTime
    }
    
    /// 格式化提前天數顯示
    var formattedAdvanceDays: String {
        if notificationSettings.advanceDays == 0 {
            return "當天通知"
        } else {
            return "\(notificationSettings.advanceDays)天前"
        }
    }
    
    /// 檢查是否訂閱了簡少年推薦
    var isSubscribedToTeacherRecommendations: Bool {
        guard let group = teacherRecommendations else { return false }
        return notificationSettings.selectedGroupIds.contains(group.id)
    }
    
    // MARK: - Settings Persistence
    
    /// 保存通知設定到本地存儲
    private func saveSettings() {
        settingsManager.saveSettings(notificationSettings)
        
        // 重新排程通知
        Task {
            await rescheduleNotifications()
        }
    }
    
    /// 重新排程通知
    private func rescheduleNotifications() async {
        print("📅 Rescheduling notifications due to settings change...")
        print("📅 Current settings:")
        print("  - enableAll: \(notificationSettings.enableAll)")
        print("  - customEnabled: \(notificationSettings.customEnabled)")
        print("  - selectedEventIds: \(notificationSettings.selectedEventIds)")
        print("  - advanceDays: \(notificationSettings.advanceDays)")
        print("  - notifyTime: \(notificationSettings.notifyTime)")
        
        // 只有在權限允許的情況下才排程通知
        guard notificationService.canEnableNotifications else {
            print("📅 No notification permission, clearing all notifications")
            await notificationScheduler.clearAllScheduledNotifications()
            return
        }
        
        // 根據新設定重新排程通知
        await notificationScheduler.scheduleNotifications(for: notificationSettings)
        
        // 調試：顯示當前排程的通知數量
        let pendingCount = await notificationScheduler.getPendingNotificationCount()
        print("📅 Currently scheduled notifications: \(pendingCount)")
    }
    
    // MARK: - Permission Management
    
    /// 刷新通知權限狀態
    func refreshNotificationStatus() async {
        print("🔔 Refreshing notification permission status...")
        await notificationService.checkAuthorizationStatus()
        
        // 如果系統權限被拒絕，強制關閉 App 內的開關
        if !notificationService.canEnableNotifications {
            print("🔔 System permission denied, disabling app notification toggle")
            notificationSettings.enableAll = false
        }
        
        print("🔔 Permission status refreshed: \(notificationService.authorizationStatus)")
    }
    
    /// 處理權限狀態變化
    private func handlePermissionStatusChange(_ status: UNAuthorizationStatus) {
        print("🔔 Permission status changed to: \(status)")
        
        switch status {
        case .denied:
            // 權限被拒絕時，強制關閉 App 內的通知開關
            print("🔔 Permission denied, disabling app notifications")
            notificationSettings.enableAll = false
            saveSettings()
            
        case .authorized:
            // 權限被授予時，不自動開啟開關，讓用戶自己決定
            print("🔔 Permission authorized, keeping current app setting")
            
        case .notDetermined:
            // 權限未決定時，保持當前設定
            print("🔔 Permission not determined, keeping current app setting")
            
        case .provisional:
            // 臨時權限，類似於 authorized
            print("🔔 Permission provisional, keeping current app setting")
            
        case .ephemeral:
            // 短暫權限，類似於 authorized
            print("🔔 Permission ephemeral, keeping current app setting")
            
        @unknown default:
            print("🔔 Unknown permission status: \(status)")
        }
        
        // 觸發 UI 更新
        objectWillChange.send()
    }
}