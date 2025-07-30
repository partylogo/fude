//
//  User.swift
//  fude
//
//  Created by AI Assistant on 2024-12-19.
//  Copyright © 2024 fude. All rights reserved.
//

import Foundation

/// 使用者模型
struct User: Identifiable, Codable, Equatable {
    let id: String          // UUID 或 Supabase Auth UID
    let email: String       // 電子郵件
    let displayName: String // 顯示名稱
    let googleId: String?   // Google OAuth ID
    let avatarUrl: String?  // 頭像 URL
    let locale: String      // 語言設定，預設 zh-TW
    let createdAt: Date     // 建立時間
    let updatedAt: Date     // 更新時間
    
    /// 初始化使用者
    init(
        id: String = UUID().uuidString,
        email: String,
        displayName: String,
        googleId: String? = nil,
        avatarUrl: String? = nil,
        locale: String = "zh-TW",
        createdAt: Date = Date(),
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.email = email
        self.displayName = displayName
        self.googleId = googleId
        self.avatarUrl = avatarUrl
        self.locale = locale
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

// MARK: - Mock Data
extension User {
    /// Version 1.0 使用的 Mock 使用者
    static let mockUser = User(
        id: "mock-user-001",
        email: "user@example.com",
        displayName: "測試使用者",
        googleId: "google-123456",
        avatarUrl: nil,
        locale: "zh-TW"
    )
}
