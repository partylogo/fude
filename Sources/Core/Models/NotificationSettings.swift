//
//  NotificationSettings.swift
//  fude
//
//  Created by AI Assistant on 2024-12-19.
//  Copyright © 2024 fude. All rights reserved.
//

import Foundation

/// 通知設定模型
struct NotificationSettings: Codable, Equatable {
    let userId: String
    
    // 基礎設定
    var enableAll: Bool           // 總開關
    var advanceDays: Int         // 提前通知天數
    var notifyTime: String       // 通知時間 (HH:mm 格式)
    
    // 通知類型設定
    var newmoonEnabled: Bool     // 初一提醒
    var fullmoonEnabled: Bool    // 十五提醒
    var customEnabled: Bool      // 自定提醒
    
    // 已選擇的事件和群組
    var selectedEventIds: [Int]  // 已選擇的事件ID
    var selectedGroupIds: [Int]  // 已選擇的群組ID
    
    let createdAt: Date
    var updatedAt: Date
    
    /// 初始化通知設定
    init(
        userId: String,
        enableAll: Bool = true,
        advanceDays: Int = 1,
        notifyTime: String = "08:00",
        newmoonEnabled: Bool = false,
        fullmoonEnabled: Bool = false,
        customEnabled: Bool = true,
        selectedEventIds: [Int] = [],
        selectedGroupIds: [Int] = [],
        createdAt: Date = Date(),
        updatedAt: Date = Date()
    ) {
        self.userId = userId
        self.enableAll = enableAll
        self.advanceDays = advanceDays
        self.notifyTime = notifyTime
        self.newmoonEnabled = newmoonEnabled
        self.fullmoonEnabled = fullmoonEnabled
        self.customEnabled = customEnabled
        self.selectedEventIds = selectedEventIds
        self.selectedGroupIds = selectedGroupIds
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
    
    /// 通知時間轉換為 Date
    var notifyTimeAsDate: Date? {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        return formatter.date(from: notifyTime)
    }
    
    /// 是否啟用特定事件通知
    func isEventEnabled(_ eventId: Int) -> Bool {
        return enableAll && customEnabled && selectedEventIds.contains(eventId)
    }
    
    /// 是否啟用特定群組通知
    func isGroupEnabled(_ groupId: Int) -> Bool {
        return enableAll && selectedGroupIds.contains(groupId)
    }
    
    /// 更新設定
    mutating func updateSettings(
        enableAll: Bool? = nil,
        advanceDays: Int? = nil,
        notifyTime: String? = nil,
        newmoonEnabled: Bool? = nil,
        fullmoonEnabled: Bool? = nil,
        customEnabled: Bool? = nil
    ) {
        if let enableAll = enableAll { self.enableAll = enableAll }
        if let advanceDays = advanceDays { self.advanceDays = advanceDays }
        if let notifyTime = notifyTime { self.notifyTime = notifyTime }
        if let newmoonEnabled = newmoonEnabled { self.newmoonEnabled = newmoonEnabled }
        if let fullmoonEnabled = fullmoonEnabled { self.fullmoonEnabled = fullmoonEnabled }
        if let customEnabled = customEnabled { self.customEnabled = customEnabled }
        
        self.updatedAt = Date()
    }
    
    /// 新增選擇的事件
    mutating func addSelectedEvent(_ eventId: Int) {
        if !selectedEventIds.contains(eventId) {
            selectedEventIds.append(eventId)
            updatedAt = Date()
        }
    }
    
    /// 移除選擇的事件
    mutating func removeSelectedEvent(_ eventId: Int) {
        selectedEventIds.removeAll { $0 == eventId }
        updatedAt = Date()
    }
    
    /// 新增選擇的群組
    mutating func addSelectedGroup(_ groupId: Int) {
        if !selectedGroupIds.contains(groupId) {
            selectedGroupIds.append(groupId)
            updatedAt = Date()
        }
    }
    
    /// 移除選擇的群組
    mutating func removeSelectedGroup(_ groupId: Int) {
        selectedGroupIds.removeAll { $0 == groupId }
        updatedAt = Date()
    }
}

// MARK: - Group Model
/// 推薦群組模型
struct Group: Identifiable, Codable, Equatable {
    private enum CodingKeys: String, CodingKey {
        case id, name, description, enabled
        case videoUrl = "video_url"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case eventIds = "event_ids"
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(Int.self, forKey: .id)
        name = try container.decode(String.self, forKey: .name)
        description = try container.decode(String.self, forKey: .description)
        enabled = (try? container.decodeIfPresent(Bool.self, forKey: .enabled)) ?? true
        videoUrl = try? container.decodeIfPresent(String.self, forKey: .videoUrl)

        let createdStr = try? container.decodeIfPresent(String.self, forKey: .createdAt)
        let updatedStr = try? container.decodeIfPresent(String.self, forKey: .updatedAt)
        createdAt = Group.dateFormatter.date(from: createdStr ?? "") ?? Date()
        updatedAt = Group.dateFormatter.date(from: updatedStr ?? "") ?? Date()

        eventIds = (try? container.decodeIfPresent([Int].self, forKey: .eventIds)) ?? []
    }

    // Manual memberwise init (required because we implemented Decodable)
    init(id: Int,
         name: String,
         description: String,
         enabled: Bool = true,
         videoUrl: String? = nil,
         createdAt: Date = Date(),
         updatedAt: Date = Date(),
         eventIds: [Int] = []) {
        self.id = id
        self.name = name
        self.description = description
        self.enabled = enabled
        self.videoUrl = videoUrl
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.eventIds = eventIds
    }

    static let dateFormatter: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime]
        return f
    }()

    let id: Int
    let name: String
    let description: String
    let enabled: Bool
    let videoUrl: String?
    let createdAt: Date
    let updatedAt: Date
    
    // 群組包含的事件ID
    let eventIds: [Int]
    
    /// 取得群組包含的事件
    func getEvents() -> [Event] {
        return Event.mockEvents.filter { eventIds.contains($0.id) }
    }
    
    /// 取得神明事件
    var deityEvents: [Event] {
        return getEvents().filter { $0.type == .deity }
    }
    
    /// 取得節慶事件
    var festivalEvents: [Event] {
        return getEvents().filter { $0.type == .festival }
    }
}

// MARK: - Mock Data
extension NotificationSettings {
    /// Version 1.0 使用的 Mock 設定
    static let mockSettings = NotificationSettings(
        userId: "mock-user-001",
        enableAll: true,
        advanceDays: 1,
        notifyTime: "08:00",
        newmoonEnabled: true,
        fullmoonEnabled: true,
        customEnabled: true,
        selectedEventIds: [1, 2, 3, 4], // 媽祖、關公、觀音、玉皇大帝
        selectedGroupIds: [1] // 簡少年老師推薦
    )
}

extension Group {
    /// Version 1.0 使用的 Mock 群組資料
    static let mockGroups: [Group] = [
        Group(
            id: 1,
            name: "簡少年老師 2025 拜拜推薦",
            description: "簡少年老師精選2025年最重要的拜拜時機，根據流年運勢和傳統民俗精心挑選",
            enabled: true,
            videoUrl: "https://www.youtube.com/watch?v=example123",
            createdAt: Date(),
            updatedAt: Date(),
            eventIds: [1, 2, 3, 5, 6, 7, 8, 9] // 包含主要神明和節慶
        ),
        
        Group(
            id: 2,
            name: "財運招福組合",
            description: "專門針對財運和事業運的神明生日組合",
            enabled: true,
            videoUrl: nil,
            createdAt: Date(),
            updatedAt: Date(),
            eventIds: [2, 4] // 關公、玉皇大帝
        ),
        
        Group(
            id: 3,
            name: "平安健康組合",
            description: "祈求平安健康的神明與節慶組合",
            enabled: true,
            videoUrl: nil,
            createdAt: Date(),
            updatedAt: Date(),
            eventIds: [1, 3] // 媽祖、觀音
        )
    ]
}
