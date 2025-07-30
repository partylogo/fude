//
//  NotificationSettingsView.swift
//  fude
//
//  Created by AI Assistant on 2024-12-19.
//  Copyright © 2024 fude. All rights reserved.
//

import SwiftUI

/// 通知設定頁面
struct NotificationSettingsView: View {
    
    @StateObject private var viewModel = SettingsViewModel()
    @State private var showingTimePicker = false
    @State private var tempTime = Date()
    @State private var showingAdvanceDaysPicker = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Spacing.sectionSpacing) {
                    // 總開關
                    masterToggleSection
                    
                    // 通知時間設定
                    timeSettingsSection
                    
                    // 通知類型
                    notificationTypesSection
                }
                .padding(.horizontal, Spacing.screenPadding)
                .padding(.bottom, 100) // 為底部導航留空間
            }
            .navigationTitle("通知設定")
            .navigationBarTitleDisplayMode(.inline)
            .background(Color.backgroundColor)
        }
        .sheet(isPresented: $showingTimePicker) {
            timePickerSheet
        }
        .confirmationDialog("選擇提前通知天數", isPresented: $showingAdvanceDaysPicker, titleVisibility: .visible) {
            Button("當天通知") {
                viewModel.updateAdvanceDays(0)
            }
            Button("1天前") {
                viewModel.updateAdvanceDays(1)
            }
            Button("2天前") {
                viewModel.updateAdvanceDays(2)
            }
            Button("3天前") {
                viewModel.updateAdvanceDays(3)
            }
            Button("7天前") {
                viewModel.updateAdvanceDays(7)
            }
            Button("取消", role: .cancel) { }
        }
    }
    
    // MARK: - View Components
    
    /// 總開關區塊
    private var masterToggleSection: some View {
        SettingsCard {
            SettingsRow(
                title: "啟用所有通知",
                trailing: {
                    Toggle("", isOn: $viewModel.notificationSettings.enableAll)
                        .toggleStyle(CustomToggleStyle())
                }
            )
        }
    }
    
    /// 通知時間設定區塊
    private var timeSettingsSection: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            SectionHeader(title: "通知時間設定", icon: "⏰")
            
            SettingsCard {
                VStack(spacing: 0) {
                    SettingsRow(
                        title: "提前通知",
                        trailing: {
                            Text(viewModel.formattedAdvanceDays)
                                .font(.bodySmall)
                                .foregroundColor(.primaryColor)
                        }
                    )
                    .onTapGesture {
                        showingAdvanceDaysPicker = true
                    }
                    
                    Divider()
                        .padding(.leading, Spacing.screenPadding)
                    
                    SettingsRow(
                        title: "通知時間",
                        trailing: {
                            Text(viewModel.formattedNotifyTime)
                                .font(.bodySmall)
                                .foregroundColor(.primaryColor)
                        }
                    )
                    .onTapGesture {
                        showingTimePicker = true
                    }
                }
            }
        }
    }
    
    /// 通知類型區塊
    private var notificationTypesSection: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            SectionHeader(title: "通知類型", icon: "🔔")
            
            SettingsCard {
                VStack(spacing: 0) {
                    // 初一十五提醒
                    SettingsRow(
                        title: "初一十五提醒",
                        trailing: {
                            Toggle("", isOn: $viewModel.notificationSettings.newmoonEnabled)
                                .toggleStyle(CustomToggleStyle())
                        }
                    )
                    
                    Divider().padding(.leading, Spacing.screenPadding)
                    
                    // 初二十六提醒
                    SettingsRow(
                        title: "初二十六提醒",
                        trailing: {
                            Toggle("", isOn: $viewModel.notificationSettings.fullmoonEnabled)
                                .toggleStyle(CustomToggleStyle())
                        }
                    )
                    
                    Divider().padding(.leading, Spacing.screenPadding)
                    
                    // 簡少年老師推薦
                    SettingsRow(
                        title: "簡少年老師 2025 拜拜推薦",
                        trailing: {
                            Toggle("", isOn: Binding(
                                get: { viewModel.isSubscribedToTeacherRecommendations },
                                set: { _ in 
                                    if let group = viewModel.teacherRecommendations {
                                        viewModel.toggleGroupSubscription(groupId: group.id)
                                    }
                                }
                            ))
                            .toggleStyle(CustomToggleStyle())
                        }
                    )
                    
                    // 簡少年推薦詳細
                    if viewModel.isSubscribedToTeacherRecommendations {
                        if let group = viewModel.teacherRecommendations {
                            NavigationLink(destination: GroupDetailView(group: group).environmentObject(viewModel)) {
                                SettingsSubRow(
                                    title: "✓ 已選擇 \(viewModel.selectedRecommendationsCount) 項推薦"
                                )
                            }
                        }
                    }
                    
                    Divider().padding(.leading, Spacing.screenPadding)
                    
                    // 自定提醒
                    SettingsRow(
                        title: "自定提醒",
                        trailing: {
                            Toggle("", isOn: $viewModel.notificationSettings.customEnabled)
                                .toggleStyle(CustomToggleStyle())
                        }
                    )
                    
                    // 自定提醒子項目
                    if viewModel.notificationSettings.customEnabled {
                        // 已選擇節慶
                        NavigationLink(destination: FestivalSelectionView().environmentObject(viewModel)) {
                            SettingsSubRow(
                                title: "✓ 已選擇 \(viewModel.selectedFestivals.count) 個節慶"
                            )
                        }
                        
                        // 已選擇神明
                        NavigationLink(destination: DeitySelectionView().environmentObject(viewModel)) {
                            SettingsSubRow(
                                title: "✓ 已選擇 \(viewModel.selectedDeities.count) 位神明"
                            )
                        }
                    }
                }
            }
        }
    }
    
    /// 時間選擇器彈窗
    private var timePickerSheet: some View {
        NavigationStack {
            VStack {
                DatePicker(
                    "選擇通知時間",
                    selection: $tempTime,
                    displayedComponents: .hourAndMinute
                )
                .datePickerStyle(.wheel)
                .labelsHidden()
                
                Spacer()
            }
            .padding()
            .navigationTitle("通知時間")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("取消") {
                        showingTimePicker = false
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("完成") {
                        viewModel.updateNotifyTime(tempTime)
                        showingTimePicker = false
                    }
                    .fontWeight(.semibold)
                }
            }
        }
        .presentationDetents([.medium])
    }
}

// MARK: - Supporting Views

/// 設定區塊標題
struct SectionHeader: View {
    let title: String
    let icon: String
    
    var body: some View {
        HStack(spacing: Spacing.sm) {
            ZStack {
                Circle()
                    .fill(Color.primaryColor)
                    .frame(width: 26, height: 26)
                
                Text(icon)
                    .font(.system(size: 13))
            }
            
            Text(title)
                .font(.cardTitle)
                .fontWeight(.semibold)
                .foregroundColor(.textPrimary)
            
            Spacer()
        }
    }
}

/// 設定卡片容器
struct SettingsCard<Content: View>: View {
    let content: Content
    
    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    var body: some View {
        content
            .background(Color.surfaceColor)
            .cornerRadius(Spacing.cardRadius)
            .shadow(
                color: Color.textSubtle.opacity(0.1),
                radius: 2,
                x: 0,
                y: 2
            )
    }
}

/// 設定項目行
struct SettingsRow<Trailing: View>: View {
    let title: String
    let trailing: Trailing
    
    init(title: String, @ViewBuilder trailing: () -> Trailing) {
        self.title = title
        self.trailing = trailing()
    }
    
    var body: some View {
        HStack {
            Text(title)
                .font(.bodyLarge)
                .foregroundColor(.textPrimary)
            
            Spacer()
            
            trailing
        }
        .padding(.horizontal, Spacing.screenPadding)
        .padding(.vertical, Spacing.cardPadding)
    }
}

/// 設定子項目行
struct SettingsSubRow: View {
    let title: String
    
    var body: some View {
        HStack {
            Text(title)
                .font(.bodySmall)
                .foregroundColor(.primaryColor)
                .padding(.leading, Spacing.screenPadding)
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.textSecondary)
        }
        .padding(.horizontal, Spacing.screenPadding)
        .padding(.vertical, Spacing.sm)
        .background(Color.surfaceWarm)
    }
}

/// 自定義開關樣式
struct CustomToggleStyle: ToggleStyle {
    func makeBody(configuration: Configuration) -> some View {
        ZStack {
            RoundedRectangle(cornerRadius: 14)
                .fill(configuration.isOn ? Color.primaryColor : Color.borderColor)
                .frame(width: 48, height: 28)
            
            Circle()
                .fill(Color.white)
                .frame(width: 24, height: 24)
                .offset(x: configuration.isOn ? 10 : -10)
                .animation(.easeInOut(duration: 0.2), value: configuration.isOn)
        }
        .onTapGesture {
            configuration.isOn.toggle()
        }
    }
}

// MARK: - Preview

#Preview {
    NotificationSettingsView()
}