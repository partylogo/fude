//
//  ContentView.swift
//  fude
//
//  Created by 謝守澤 on 2025/7/30.
//

import SwiftUI

/// 主要內容視圖 - Version 1.0 包含首頁和通知設定
struct ContentView: View {
    var body: some View {
        TabView {
            HomeView()
                .tabItem {
                    Image(systemName: "house")
                    Text("首頁")
                }
            
            NotificationSettingsView()
                .tabItem {
                    Image(systemName: "bell")
                    Text("通知")
                }
        }
        .accentColor(.primaryColor)
        .onAppear {
            // 自定義 Tab Bar 外觀
            let appearance = UITabBarAppearance()
            appearance.configureWithOpaqueBackground()
            appearance.backgroundColor = UIColor.surfaceColor
            
            // 設定選中和未選中的顏色
            appearance.stackedLayoutAppearance.selected.iconColor = UIColor.primaryColor
            appearance.stackedLayoutAppearance.selected.titleTextAttributes = [
                .foregroundColor: UIColor.primaryColor
            ]
            appearance.stackedLayoutAppearance.normal.iconColor = UIColor.textSecondary
            appearance.stackedLayoutAppearance.normal.titleTextAttributes = [
                .foregroundColor: UIColor.textSecondary
            ]
            
            UITabBar.appearance().standardAppearance = appearance
            UITabBar.appearance().scrollEdgeAppearance = appearance
        }
    }
}

#Preview {
    ContentView()
}
