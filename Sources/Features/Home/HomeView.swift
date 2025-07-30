//
//  HomeView.swift
//  fude
//
//  Created by AI Assistant on 2024-12-19.
//  Copyright © 2024 fude. All rights reserved.
//

import SwiftUI

/// 首頁視圖 - 顯示近期重要日子
struct HomeView: View {
    @StateObject private var eventViewModel = EventViewModel()
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: Spacing.sectionSpacing) {
                    // 頁面標題
                    headerSection
                    
                    // 近期重要日子 Section
                    upcomingEventsSection
                }
                .padding(Spacing.screenPadding)
            }
            .background(Color.backgroundColor)
            .navigationBarHidden(true)
            .refreshable {
                eventViewModel.refresh()
            }
        }
    }
    
    // MARK: - Header Section
    
    private var headerSection: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            HStack {
                VStack(alignment: .leading, spacing: Spacing.xs) {
                    Text("民俗提醒")
                        .font(.titleLarge)
                        .foregroundColor(.textPrimary)
                    
                    Text("不錯過每個重要的拜拜日子")
                        .font(.bodySmall)
                        .foregroundColor(.textSecondary)
                }
                
                Spacer()
            }
        }
    }
    
    // MARK: - Upcoming Events Section
    
    private var upcomingEventsSection: some View {
        VStack(alignment: .leading, spacing: Spacing.lg) {
            // Section 標題
            HStack {
                Text("近期重要日子")
                    .font(.titleSmall)
                    .foregroundColor(.textPrimary)
                
                Spacer()
                
                Text("\(eventViewModel.upcomingEvents.count) 個節日")
                    .font(.caption)
                    .foregroundColor(.textSecondary)
            }
            
            // 事件列表
            if eventViewModel.isLoading {
                loadingView
            } else if eventViewModel.upcomingEvents.isEmpty {
                emptyStateView
            } else {
                LazyVStack(spacing: Spacing.md) {
                    ForEach(eventViewModel.upcomingEvents) { event in
                        EventCard(
                            event: event,
                            viewModel: eventViewModel
                        )
                    }
                }
            }
        }
    }
    
    // MARK: - Loading View
    
    private var loadingView: some View {
        VStack(spacing: Spacing.lg) {
            ForEach(0..<3, id: \.self) { _ in
                EventCardSkeleton()
            }
        }
    }
    
    // MARK: - Empty State View
    
    private var emptyStateView: some View {
        VStack(spacing: Spacing.lg) {
            Image(systemName: "calendar.badge.clock")
                .font(.system(size: 48))
                .foregroundColor(.textSecondary)
            
            VStack(spacing: Spacing.sm) {
                Text("目前沒有近期節日")
                    .font(.titleSmall)
                    .foregroundColor(.textPrimary)
                
                Text("請稍後再檢查或調整通知設定")
                    .font(.bodySmall)
                    .foregroundColor(.textSecondary)
                    .multilineTextAlignment(.center)
            }
            
            Button("重新載入") {
                eventViewModel.refresh()
            }
            .font(.buttonText)
            .foregroundColor(.white)
            .frame(height: Spacing.buttonHeight)
            .frame(maxWidth: 200)
            .background(Color.primaryColor)
            .cornerRadius(Spacing.buttonRadius)
        }
        .padding(Spacing.cardPadding)
    }
}

// MARK: - Event Card
struct EventCard: View {
    let event: Event
    let viewModel: EventViewModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            // 事件標題和倒數
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: Spacing.xs) {
                    // 事件標題
                    Text(event.title)
                        .font(.cardTitle)
                        .foregroundColor(.textPrimary)
                    
                    // 事件描述
                    Text(event.description)
                        .font(.bodySmall)
                        .foregroundColor(.textSecondary)
                        .lineLimit(2)
                }
                
                Spacer()
                
                // 天數顯示
                Text(viewModel.formatCountdown(event.countdownDays))
                    .font(.cardTitle)
                    .foregroundColor(.primaryColor)
            }
            
            // 日期資訊
            HStack {
                Text(viewModel.formatEventDate(event))
                    .font(.caption)
                    .foregroundColor(.textSecondary)
                
                Spacer()
                
                // Version 1.0: 移除查看附近廟宇功能，Version 2.1 再實作
            }
        }
        .padding(Spacing.cardPadding)
        .background(Color.surfaceColor)
        .cornerRadius(Spacing.cardRadius)
        .shadow(color: Color.charcoalSubtle, radius: 2, x: 0, y: 1)
    }
}

// MARK: - Event Card Skeleton (Loading State)
struct EventCardSkeleton: View {
    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            HStack {
                VStack(alignment: .leading, spacing: Spacing.xs) {
                    // 標題骨架
                    Rectangle()
                        .fill(Color.charcoalSubtle)
                        .frame(height: 20)
                        .frame(maxWidth: 200)
                        .cornerRadius(4)
                    
                    // 描述骨架
                    Rectangle()
                        .fill(Color.charcoalSubtle)
                        .frame(height: 16)
                        .frame(maxWidth: 150)
                        .cornerRadius(4)
                }
                
                Spacer()
                
                // 倒數骨架
                Rectangle()
                    .fill(Color.charcoalSubtle)
                    .frame(width: 60, height: 40)
                    .cornerRadius(8)
            }
            
            // 日期骨架
            Rectangle()
                .fill(Color.charcoalSubtle)
                .frame(height: 14)
                .frame(maxWidth: 180)
                .cornerRadius(4)
        }
        .padding(Spacing.cardPadding)
        .background(Color.surfaceColor)
        .cornerRadius(Spacing.cardRadius)
        .redacted(reason: .placeholder)
    }
}

// MARK: - Preview
#if DEBUG
struct HomeView_Previews: PreviewProvider {
    static var previews: some View {
        HomeView()
            .preferredColorScheme(.light)
        
        HomeView()
            .preferredColorScheme(.dark)
    }
}

struct EventCard_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: Spacing.md) {
            EventCard(
                event: Event.mockEvents[0], // 媽祖聖誕
                viewModel: EventViewModel.preview
            )
            
            EventCard(
                event: Event.mockEvents[4], // 農曆新年
                viewModel: EventViewModel.preview
            )
            
            EventCardSkeleton()
        }
        .padding()
        .background(Color.backgroundColor)
    }
}
#endif
