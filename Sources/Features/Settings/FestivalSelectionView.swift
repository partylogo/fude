//
//  FestivalSelectionView.swift
//  fude
//
//  Created by AI Assistant on 2024-12-19.
//  Copyright © 2024 fude. All rights reserved.
//

import SwiftUI

/// 民俗節慶選擇頁面
struct FestivalSelectionView: View {
    
    @StateObject private var viewModel = SettingsViewModel()
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Spacing.sectionSpacing) {
                    // 已選擇的節慶
                    if !viewModel.selectedFestivals.isEmpty {
                        selectedFestivalsSection
                    }
                    
                    // 其他節慶
                    otherFestivalsSection
                }
                .padding(.horizontal, Spacing.screenPadding)
            }
            .navigationTitle("選擇民俗節慶")
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
    }
    
    // MARK: - View Components
    
    /// 已選擇的節慶區塊
    private var selectedFestivalsSection: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            SectionHeader(
                title: "已選擇的節慶 (\(viewModel.selectedFestivals.count))",
                icon: "✅"
            )
            
            LazyVStack(spacing: Spacing.sm) {
                ForEach(viewModel.selectedFestivals, id: \.id) { festival in
                    CheckboxRow(
                        item: festival,
                        isSelected: true,
                        onToggle: {
                            viewModel.toggleEventSelection(festival)
                        }
                    )
                    .transition(.opacity.combined(with: .scale))
                }
            }
        }
    }
    
    /// 其他節慶區塊
    private var otherFestivalsSection: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            SectionHeader(title: "其他節慶", icon: "📅")
            
            LazyVStack(spacing: Spacing.sm) {
                ForEach(unselectedFestivals, id: \.id) { festival in
                    CheckboxRow(
                        item: festival,
                        isSelected: false,
                        onToggle: {
                            withAnimation(.easeInOut(duration: 0.3)) {
                                viewModel.toggleEventSelection(festival)
                            }
                        }
                    )
                    .transition(.opacity.combined(with: .scale))
                }
            }
        }
    }
    
    // MARK: - Computed Properties
    
    /// 未選擇的節慶
    private var unselectedFestivals: [Event] {
        viewModel.availableFestivals.filter { festival in
            !viewModel.isEventSelected(festival)
        }
    }
}

// MARK: - Preview

#Preview {
    FestivalSelectionView()
}