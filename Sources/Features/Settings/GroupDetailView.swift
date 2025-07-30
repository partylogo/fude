//
//  GroupDetailView.swift
//  fude
//
//  Created by AI Assistant on 2024-12-19.
//  Copyright © 2024 fude. All rights reserved.
//

import SwiftUI

/// 群組詳細頁面（簡少年老師推薦詳細頁面）
struct GroupDetailView: View {
    
    let group: Group
    @StateObject private var viewModel = SettingsViewModel()
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Spacing.sectionSpacing) {
                    // 推薦影片區塊
                    videoRecommendationSection
                    
                    // 已選擇的神明
                    if !selectedDeities.isEmpty {
                        selectedDeitiesSection
                    }
                    
                    // 已選擇的節慶
                    if !selectedFestivals.isEmpty {
                        selectedFestivalsSection
                    }
                }
                .padding(.horizontal, Spacing.screenPadding)
            }
            .navigationTitle(group.name)
            .navigationBarTitleDisplayMode(.inline)
            .background(Color.backgroundColor)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("完成") {
                        dismiss()
                    }
                    .fontWeight(.semibold)
                    .foregroundColor(.primaryColor)
                }
            }
        }
        .task {
            await viewModel.loadGroupItems(groupId: group.id)
        }
    }
    
    // MARK: - View Components
    
    /// 推薦影片區塊
    private var videoRecommendationSection: some View {
        VStack(spacing: Spacing.sm) {
            HStack {
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Text(group.description ?? "簡少年老師精選2025年最重要的拜拜時機")
                        .font(.bodyLarge)
                        .foregroundColor(.textPrimary)
                        .multilineTextAlignment(.leading)
                    
                    Button(action: openVideoURL) {
                        HStack {
                            Text("📹 觀看推薦影片")
                                .font(.bodySmall)
                                .fontWeight(.medium)
                                .foregroundColor(.surfaceColor)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, Spacing.sm)
                        .background(Color.primaryColor)
                        .cornerRadius(Spacing.cardRadius)
                    }
                    .disabled(group.videoUrl == nil)
                }
                Spacer()
            }
            .padding(Spacing.cardPadding)
            .background(
                Color.primaryColor.opacity(0.05)
            )
            .cornerRadius(Spacing.cardRadius)
            .overlay(
                RoundedRectangle(cornerRadius: Spacing.cardRadius)
                    .stroke(Color.primaryColor.opacity(0.2), lineWidth: 1)
            )
        }
    }
    
    /// 已選擇的神明區塊
    private var selectedDeitiesSection: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            SectionHeader(
                title: "已選擇的神明 (\(selectedDeities.count))",
                icon: "👸"
            )
            
            LazyVStack(spacing: Spacing.sm) {
                ForEach(selectedDeities, id: \.id) { deity in
                    ReadOnlyEventRow(item: deity)
                }
            }
        }
    }
    
    /// 已選擇的節慶區塊
    private var selectedFestivalsSection: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            SectionHeader(
                title: "已選擇的節慶 (\(selectedFestivals.count))",
                icon: "🏮"
            )
            
            LazyVStack(spacing: Spacing.sm) {
                ForEach(selectedFestivals, id: \.id) { festival in
                    ReadOnlyEventRow(item: festival)
                }
            }
        }
    }
    
    // MARK: - Computed Properties
    
    /// 群組中已選擇的神明
    private var selectedDeities: [Event] {
        group.getEvents().filter { $0.type == .deity }
    }
    
    /// 群組中已選擇的節慶
    private var selectedFestivals: [Event] {
        group.getEvents().filter { $0.type == .festival }
    }
    
    // MARK: - Actions
    
    /// 開啟推薦影片
    private func openVideoURL() {
        guard let videoURLString = group.videoUrl,
              let url = URL(string: videoURLString) else {
            return
        }
        
        UIApplication.shared.open(url)
    }
}

/// 只讀事件行（不可點擊的版本）
struct ReadOnlyEventRow: View {
    let item: Event
    
    var body: some View {
        HStack(spacing: Spacing.sm) {
            // 已選中標記
            ZStack {
                RoundedRectangle(cornerRadius: 6)
                    .fill(Color.primaryColor)
                    .frame(width: 24, height: 24)
                
                Image(systemName: "checkmark")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(.surfaceColor)
            }
            
            // 項目資訊
            VStack(alignment: .leading, spacing: 2) {
                Text(item.title)
                    .font(.bodyLarge)
                    .fontWeight(.medium)
                    .foregroundColor(.textPrimary)
                
                Text(item.lunarDateString)
                    .font(.caption)
                    .foregroundColor(.textSecondary)
            }
            
            Spacer()
        }
        .padding(Spacing.cardPadding)
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

// MARK: - Preview

#Preview {
    GroupDetailView(group: Group.mockGroups[0])
}