//
//  Spacing.swift
//  fude
//
//  Created by AI Assistant on 2024-12-19.
//  Copyright © 2024 fude. All rights reserved.
//

import SwiftUI

/// 民俗通知 App 間距系統
/// 基於 8pt 網格系統，確保元件間距的一致性
enum Spacing {
    // MARK: - 基礎間距 (8pt Grid System)
    
    /// 極小間距 - 4px
    static let xs: CGFloat = 4
    
    /// 小間距 - 8px
    static let sm: CGFloat = 8
    
    /// 中等間距 - 16px
    static let md: CGFloat = 16
    
    /// 大間距 - 24px
    static let lg: CGFloat = 24
    
    /// 特大間距 - 32px
    static let xl: CGFloat = 32
    
    /// 超大間距 - 48px
    static let xxl: CGFloat = 48
    
    // MARK: - 語意化間距
    
    /// 元件內部間距
    static let componentPadding = md
    
    /// 卡片內部間距
    static let cardPadding = lg
    
    /// 頁面邊距
    static let screenPadding = md
    
    /// 區段間距
    static let sectionSpacing = xl
    
    /// 按鈕高度
    static let buttonHeight: CGFloat = 48
    
    /// 最小觸控區域
    static let minTouchTarget: CGFloat = 44
    
    // MARK: - 圓角系統
    
    /// 小圓角 - 4px
    static let radiusSmall: CGFloat = 4
    
    /// 中圓角 - 8px
    static let radiusMedium: CGFloat = 8
    
    /// 大圓角 - 12px
    static let radiusLarge: CGFloat = 12
    
    /// 特大圓角 - 16px
    static let radiusExtraLarge: CGFloat = 16
    
    /// 卡片圓角
    static let cardRadius = radiusLarge
    
    /// 按鈕圓角
    static let buttonRadius = radiusMedium
}

// MARK: - Spacing Preview Support
#if DEBUG
struct Spacing_Previews: PreviewProvider {
    static var previews: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.lg) {
                // 間距展示
                VStack(alignment: .leading, spacing: Spacing.md) {
                    Text("間距系統 (8pt Grid)")
                        .font(.titleSmall)
                        .foregroundColor(.secondaryColor)
                    
                    SpacingRow(name: "XS", value: Spacing.xs)
                    SpacingRow(name: "SM", value: Spacing.sm)
                    SpacingRow(name: "MD", value: Spacing.md)
                    SpacingRow(name: "LG", value: Spacing.lg)
                    SpacingRow(name: "XL", value: Spacing.xl)
                    SpacingRow(name: "XXL", value: Spacing.xxl)
                }
                
                Divider()
                
                // 圓角展示
                VStack(alignment: .leading, spacing: Spacing.md) {
                    Text("圓角系統")
                        .font(.titleSmall)
                        .foregroundColor(.secondaryColor)
                    
                    RadiusRow(name: "Small", value: Spacing.radiusSmall)
                    RadiusRow(name: "Medium", value: Spacing.radiusMedium)
                    RadiusRow(name: "Large", value: Spacing.radiusLarge)
                    RadiusRow(name: "Extra Large", value: Spacing.radiusExtraLarge)
                }
                
                Divider()
                
                // 語意化間距展示
                VStack(alignment: .leading, spacing: Spacing.md) {
                    Text("語意化間距")
                        .font(.titleSmall)
                        .foregroundColor(.secondaryColor)
                    
                    SemanticSpacingExample()
                }
            }
            .padding(Spacing.screenPadding)
        }
        .background(Color.backgroundColor)
    }
}

struct SpacingRow: View {
    let name: String
    let value: CGFloat
    
    var body: some View {
        HStack {
            Text(name)
                .font(.bodyLarge)
                .foregroundColor(.textPrimary)
                .frame(width: 40, alignment: .leading)
            
            Rectangle()
                .fill(Color.primaryColor)
                .frame(width: value, height: 8)
                .cornerRadius(4)
            
            Text("\(Int(value))px")
                .font(.caption)
                .foregroundColor(.textSecondary)
            
            Spacer()
        }
        .padding(.horizontal, Spacing.md)
        .padding(.vertical, Spacing.sm)
        .background(Color.surfaceColor)
        .cornerRadius(Spacing.radiusMedium)
    }
}

struct RadiusRow: View {
    let name: String
    let value: CGFloat
    
    var body: some View {
        HStack {
            Text(name)
                .font(.bodyLarge)
                .foregroundColor(.textPrimary)
                .frame(width: 100, alignment: .leading)
            
            Rectangle()
                .fill(Color.primaryColor)
                .frame(width: 50, height: 30)
                .cornerRadius(value)
            
            Text("\(Int(value))px")
                .font(.caption)
                .foregroundColor(.textSecondary)
            
            Spacer()
        }
        .padding(.horizontal, Spacing.md)
        .padding(.vertical, Spacing.sm)
        .background(Color.surfaceColor)
        .cornerRadius(Spacing.radiusMedium)
    }
}

struct SemanticSpacingExample: View {
    var body: some View {
        VStack(spacing: Spacing.sectionSpacing) {
            // 卡片範例
            VStack(alignment: .leading, spacing: Spacing.md) {
                Text("卡片範例")
                    .font(.cardTitle)
                    .foregroundColor(.textPrimary)
                
                Text("這是一個使用語意化間距的卡片範例。內部使用 cardPadding，元件間使用 componentPadding。")
                    .font(.bodyLarge)
                    .foregroundColor(.textSecondary)
            }
            .padding(Spacing.cardPadding)
            .background(Color.surfaceColor)
            .cornerRadius(Spacing.cardRadius)
            
            // 按鈕範例
            HStack(spacing: Spacing.md) {
                Button("主要按鈕") {}
                    .frame(height: Spacing.buttonHeight)
                    .frame(maxWidth: .infinity)
                    .background(Color.primaryColor)
                    .foregroundColor(.white)
                    .cornerRadius(Spacing.buttonRadius)
                
                Button("次要按鈕") {}
                    .frame(height: Spacing.buttonHeight)
                    .frame(maxWidth: .infinity)  
                    .background(Color.secondaryColor)
                    .foregroundColor(.white)
                    .cornerRadius(Spacing.buttonRadius)
            }
        }
    }
}
#endif
