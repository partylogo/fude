//
//  Typography.swift
//  fude
//
//  Created by AI Assistant on 2024-12-19.
//  Copyright © 2024 fude. All rights reserved.
//

import SwiftUI

/// 民俗通知 App 字體系統
/// 基於系統字體確保最佳效能與可讀性
extension Font {
    // MARK: - 標題字體
    
    /// H1 標題 - 32px/Bold
    static let titleLarge = Font.system(size: 32, weight: .bold)
    
    /// H2 標題 - 24px/Bold
    static let titleMedium = Font.system(size: 24, weight: .bold)
    
    /// H3 標題 - 20px/Medium
    static let titleSmall = Font.system(size: 20, weight: .medium)
    
    // MARK: - 內文字體
    
    /// 內文 - 16px/Regular
    static let bodyLarge = Font.system(size: 16, weight: .regular)
    
    /// 輔助資訊 - 14px/Regular
    static let bodySmall = Font.system(size: 14, weight: .regular)
    
    /// 小標籤 - 12px/Regular
    static let labelSmall = Font.system(size: 12, weight: .regular)
    
    // MARK: - 特殊用途字體
    
    /// 按鈕文字 - 16px/Medium
    static let buttonText = Font.system(size: 16, weight: .medium)
    
    /// 導航標題 - 18px/Semibold
    static let navigationTitle = Font.system(size: 18, weight: .semibold)
    
    /// 卡片標題 - 16px/Semibold
    static let cardTitle = Font.system(size: 16, weight: .semibold)
    
    /// 說明文字 - 13px/Regular
    static let caption = Font.system(size: 13, weight: .regular)
}

// MARK: - Typography Preview Support
#if DEBUG
struct Typography_Previews: PreviewProvider {
    static var previews: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // 標題字體
                VStack(alignment: .leading, spacing: 16) {
                    Text("標題字體")
                        .font(.titleSmall)
                        .foregroundColor(.secondaryColor)
                    
                    TypographyRow(text: "H1 大標題", font: .titleLarge)
                    TypographyRow(text: "H2 中標題", font: .titleMedium)
                    TypographyRow(text: "H3 小標題", font: .titleSmall)
                }
                
                Divider()
                
                // 內文字體
                VStack(alignment: .leading, spacing: 16) {
                    Text("內文字體")
                        .font(.titleSmall)
                        .foregroundColor(.secondaryColor)
                    
                    TypographyRow(text: "大內文 - 主要內容使用", font: .bodyLarge)
                    TypographyRow(text: "小內文 - 輔助資訊使用", font: .bodySmall)
                    TypographyRow(text: "標籤文字 - 標記和提示", font: .labelSmall)
                }
                
                Divider()
                
                // 特殊用途字體
                VStack(alignment: .leading, spacing: 16) {
                    Text("特殊用途字體")
                        .font(.titleSmall)
                        .foregroundColor(.secondaryColor)
                    
                    TypographyRow(text: "按鈕文字", font: .buttonText)
                    TypographyRow(text: "導航標題", font: .navigationTitle)
                    TypographyRow(text: "卡片標題", font: .cardTitle)
                    TypographyRow(text: "說明文字", font: .caption)
                }
            }
            .padding()
        }
        .background(Color.backgroundColor)
    }
}

struct TypographyRow: View {
    let text: String
    let font: Font
    
    var body: some View {
        HStack {
            Text(text)
                .font(font)
                .foregroundColor(.textPrimary)
            
            Spacer()
            
            Text(fontDescription(font))
                .font(.caption)
                .foregroundColor(.textSecondary)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color.surfaceColor)
        .cornerRadius(12)
    }
    
    private func fontDescription(_ font: Font) -> String {
        // 簡化的字體描述，實際應用中可以更詳細
        switch font {
        case .titleLarge: return "32px/Bold"
        case .titleMedium: return "24px/Bold"
        case .titleSmall: return "20px/Medium"
        case .bodyLarge: return "16px/Regular"
        case .bodySmall: return "14px/Regular"
        case .labelSmall: return "12px/Regular"
        case .buttonText: return "16px/Medium"
        case .navigationTitle: return "18px/Semibold"
        case .cardTitle: return "16px/Semibold"
        case .caption: return "13px/Regular"
        default: return "System"
        }
    }
}
#endif
