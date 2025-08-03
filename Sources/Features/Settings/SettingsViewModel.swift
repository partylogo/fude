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
    
    /// 通知服務
    private let notificationService = NotificationService.shared
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
        self.notificationSettings = NotificationSettings.mockSettings
        
        // 監聽通知服務權限狀態變化
        notificationService.$authorizationStatus
            .sink { [weak self] status in
                // 當權限被拒絕時，自動關閉通知功能
                if status == .denied {
                    print("🔔 Permission denied, disabling notifications")
                    self?.notificationSettings.enableAll = false
                }
                // 當權限狀態變化時，觸發 UI 更新
                self?.objectWillChange.send()
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
            print("🔔 User wants to enable notifications, requesting permission...")
            Task {
                let granted = await notificationService.requestAuthorizationForced()
                
                await MainActor.run {
                    if granted {
                        print("🔔 Permission granted, enabling notifications")
                        notificationSettings.enableAll = true
                    } else {
                        print("🔔 Permission denied or needs system settings, keeping notifications disabled")
                        notificationSettings.enableAll = false
                    }
                }
            }
        } else {
            // 用戶要關閉通知
            print("🔔 User disabling notifications")
            notificationSettings.enableAll = false
        }
    }
    
    /// 更新提前通知天數
    func updateAdvanceDays(_ days: Int) {
        notificationSettings.advanceDays = days
    }
    
    /// 更新通知時間
    func updateNotifyTime(_ time: Date) {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        notificationSettings.notifyTime = formatter.string(from: time)
    }
    
    /// 切換新月提醒（初一）
    func toggleNewMoonEnabled() {
        notificationSettings.newmoonEnabled.toggle()
    }
    
    /// 切換滿月提醒（十五）
    func toggleFullMoonEnabled() {
        notificationSettings.fullmoonEnabled.toggle()
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
    }
    
    /// 切換群組訂閱
    func toggleGroupSubscription(groupId: Int) {
        if let index = notificationSettings.selectedGroupIds.firstIndex(of: groupId) {
            notificationSettings.selectedGroupIds.remove(at: index)
        } else {
            notificationSettings.selectedGroupIds.append(groupId)
        }
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
}