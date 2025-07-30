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
    
    // MARK: - Initialization
    
    init() {
        self.notificationSettings = NotificationSettings.mockSettings
        loadData()
    }
    
    // MARK: - Data Loading
    
    /// 載入所有資料
    func loadData() {
        isLoading = true
        
        // 載入可選擇的事件
        let allEvents = Event.mockEvents
        availableDeities = allEvents.filter { $0.type == .deity }
        availableFestivals = allEvents.filter { $0.type == .festival }
        
        // 載入簡少年推薦群組
        teacherRecommendations = Group.mockGroups.first { $0.name.contains("簡少年") }
        
        isLoading = false
    }
    
    // MARK: - Settings Actions
    
    /// 切換總通知開關
    func toggleAllNotifications() {
        notificationSettings.enableAll.toggle()
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
        guard let group = Group.mockGroups.first(where: { $0.id == groupId }) else { return }
        
        await MainActor.run {
            self.teacherRecommendations = group
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