//
//  fudeApp.swift
//  fude
//
//  Created by 謝守澤 on 2025/7/30.
//

import SwiftUI

@main
struct fudeApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .onReceive(NotificationCenter.default.publisher(for: UIApplication.didBecomeActiveNotification)) { _ in
                    // App 從後台恢復時檢查通知權限狀態
                    Task {
                        await NotificationService.shared.checkAuthorizationStatus()
                        print("🔔 App became active, refreshed notification permission status")
                    }
                }
        }
    }
}
