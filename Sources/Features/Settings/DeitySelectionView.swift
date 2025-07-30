//
//  DeitySelectionView.swift
//  fude
//
//  Created by AI Assistant on 2024-12-19.
//  Copyright © 2024 fude. All rights reserved.
//

import SwiftUI

/// 神明選擇頁面
struct DeitySelectionView: View {
    
    @StateObject private var viewModel = SettingsViewModel()
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Spacing.sectionSpacing) {
                    // 已選擇的神明
                    if !viewModel.selectedDeities.isEmpty {
                        selectedDeitiesSection
                    }
                    
                    // 其他神明
                    otherDeitiesSection
                }
                .padding(.horizontal, Spacing.screenPadding)
            }
            .navigationTitle("選擇神明生日")
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
    
    /// 已選擇的神明區塊
    private var selectedDeitiesSection: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            SectionHeader(
                title: "已選擇的神明 (\(viewModel.selectedDeities.count))",
                icon: "✅"
            )
            
            LazyVStack(spacing: Spacing.sm) {
                ForEach(viewModel.selectedDeities, id: \.id) { deity in
                    CheckboxRow(
                        item: deity,
                        isSelected: true,
                        onToggle: {
                            viewModel.toggleEventSelection(deity)
                        }
                    )
                    .transition(.opacity.combined(with: .scale))
                }
            }
        }
    }
    
    /// 其他神明區塊
    private var otherDeitiesSection: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            SectionHeader(title: "其他神明", icon: "📅")
            
            LazyVStack(spacing: Spacing.sm) {
                ForEach(unselectedDeities, id: \.id) { deity in
                    CheckboxRow(
                        item: deity,
                        isSelected: false,
                        onToggle: {
                            withAnimation(.easeInOut(duration: 0.3)) {
                                viewModel.toggleEventSelection(deity)
                            }
                        }
                    )
                    .transition(.opacity.combined(with: .scale))
                }
            }
        }
    }
    
    // MARK: - Computed Properties
    
    /// 未選擇的神明
    private var unselectedDeities: [Event] {
        viewModel.availableDeities.filter { deity in
            !viewModel.isEventSelected(deity)
        }
    }
}

/// 可選擇項目的 Checkbox 行
struct CheckboxRow: View {
    let item: Event
    let isSelected: Bool
    let onToggle: () -> Void
    
    var body: some View {
        Button(action: onToggle) {
            HStack(spacing: Spacing.sm) {
                // Checkbox
                CheckboxView(isSelected: isSelected)
                
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
        .buttonStyle(PlainButtonStyle())
    }
}

/// Checkbox 視圖
struct CheckboxView: View {
    let isSelected: Bool
    
    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 6)
                .fill(isSelected ? Color.primaryColor : Color.clear)
                .frame(width: 24, height: 24)
                .overlay(
                    RoundedRectangle(cornerRadius: 6)
                        .stroke(
                            isSelected ? Color.primaryColor : Color.borderColor,
                            lineWidth: 2
                        )
                )
            
            if isSelected {
                Image(systemName: "checkmark")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(.surfaceColor)
                    .transition(.scale.combined(with: .opacity))
            }
        }
        .animation(.easeInOut(duration: 0.2), value: isSelected)
    }
}

// MARK: - Extensions

extension Event {
    /// 農曆日期字串顯示
    var lunarDateString: String {
        if let lunarDate = lunarDate {
            return "農曆 \(lunarDate.month)/\(lunarDate.day)"
        }
        // 使用第一個國曆日期
        if let firstDate = solarDate.first {
            let formatter = DateFormatter()
            formatter.dateStyle = .short
            return formatter.string(from: firstDate)
        }
        return ""
    }
}

// MARK: - Preview

#Preview {
    DeitySelectionView()
}