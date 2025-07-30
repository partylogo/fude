//
//  Colors.swift
//  fude
//
//  Created by AI Assistant on 2024-12-19.
//  Copyright © 2024 fude. All rights reserved.
//

import SwiftUI

/// 民俗通知 App 色彩系統
/// 基於 UI Guideline 的純粹雙色系統設計哲學
extension Color {
    // MARK: - 核心色彩系統 - 純粹雙色系統
    
    /// 深赭紅 #9D4F4A - 專門用於行動召喚
    static let brickRed = Color(red: 0.616, green: 0.310, blue: 0.290)
    
    /// 煙燻灰 #2F2B27 - 專門用於系統回饋
    static let smokyCharcoal = Color(red: 0.184, green: 0.168, blue: 0.153)
    
    /// 米杏白 #F7F3E8 - 溫暖背景色
    static let warmIvory = Color(red: 0.969, green: 0.953, blue: 0.910)
    
    // MARK: - 煙燻灰延伸系列
    
    /// 淺煙燻灰 #4A453F
    static let charcoalLight = Color(red: 0.290, green: 0.271, blue: 0.247)
    
    /// 中煙燻灰 #3A3530
    static let charcoalMedium = Color(red: 0.227, green: 0.208, blue: 0.188)
    
    /// 柔和煙燻灰 - 60% 透明度
    static let charcoalSoft = Color(red: 0.184, green: 0.168, blue: 0.153).opacity(0.6)
    
    /// 微妙煙燻灰 - 10% 透明度
    static let charcoalSubtle = Color(red: 0.184, green: 0.168, blue: 0.153).opacity(0.1)
    
    /// 邊框煙燻灰 - 15% 透明度
    static let charcoalBorder = Color(red: 0.184, green: 0.168, blue: 0.153).opacity(0.15)
    
    // MARK: - 米杏白延伸系列
    
    /// 溫米色 #F2EDE0
    static let ivoryWarm = Color(red: 0.949, green: 0.929, blue: 0.878)
    
    /// 冷米色 #FDFCF7
    static let ivoryCool = Color(red: 0.992, green: 0.988, blue: 0.969)
    
    /// 純白色
    static let ivoryPure = Color.white
    
    // MARK: - 語意化命名（基於UI Guideline純粹雙色哲學）
    
    /// 主要色彩 - 紅色專門用於行動召喚
    static let primaryColor = brickRed
    
    /// 次要色彩 - 灰色專門用於系統回饋
    static let secondaryColor = charcoalLight
    
    /// 背景色彩
    static let backgroundColor = warmIvory
    
    /// 表面色彩
    static let surfaceColor = ivoryPure
    
    /// 溫暖表面色彩
    static let surfaceWarm = ivoryWarm
    
    /// 高光表面色彩
    static let surfaceHighlight = ivoryCool
    
    /// 主要文字色彩
    static let textPrimary = smokyCharcoal
    
    /// 次要文字色彩
    static let textSecondary = charcoalSoft
    
    /// 微妙文字色彩
    static let textSubtle = charcoalSubtle
    
    /// 邊框色彩
    static let borderColor = charcoalBorder
}

// MARK: - UIColor Extensions for UIKit Compatibility
extension UIColor {
    /// 主要色彩 - UIColor 版本
    static let primaryColor = UIColor(red: 0.616, green: 0.310, blue: 0.290, alpha: 1.0)
    
    /// 次要色彩 - UIColor 版本
    static let secondaryColor = UIColor(red: 0.290, green: 0.271, blue: 0.247, alpha: 1.0)
    
    /// 表面色彩 - UIColor 版本
    static let surfaceColor = UIColor.white
    
    /// 次要文字色彩 - UIColor 版本
    static let textSecondary = UIColor(red: 0.184, green: 0.168, blue: 0.153, alpha: 0.6)
}

// MARK: - Color Preview Support
#if DEBUG
struct Colors_Previews: PreviewProvider {
    static var previews: some View {
        ScrollView {
            VStack(spacing: 16) {
                // 核心色彩
                ColorRow(name: "Primary (Brick Red)", color: .primaryColor)
                ColorRow(name: "Secondary (Charcoal Light)", color: .secondaryColor)
                ColorRow(name: "Background (Warm Ivory)", color: .backgroundColor)
                
                Divider()
                
                // 煙燻灰系列
                ColorRow(name: "Smoky Charcoal", color: .smokyCharcoal)
                ColorRow(name: "Charcoal Light", color: .charcoalLight)
                ColorRow(name: "Charcoal Medium", color: .charcoalMedium)
                ColorRow(name: "Charcoal Soft", color: .charcoalSoft)
                
                Divider()
                
                // 米杏白系列
                ColorRow(name: "Ivory Pure", color: .ivoryPure)
                ColorRow(name: "Ivory Warm", color: .ivoryWarm)
                ColorRow(name: "Ivory Cool", color: .ivoryCool)
            }
            .padding()
        }
        .background(Color.backgroundColor)
    }
}

struct ColorRow: View {
    let name: String
    let color: Color
    
    var body: some View {
        HStack {
            Rectangle()
                .fill(color)
                .frame(width: 50, height: 30)
                .cornerRadius(8)
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color.borderColor, lineWidth: 1)
                )
            
            Text(name)
                .font(.body)
                .foregroundColor(.textPrimary)
            
            Spacer()
        }
        .padding(.horizontal)
        .padding(.vertical, 4)
        .background(Color.surfaceColor)
        .cornerRadius(12)
    }
}
#endif
