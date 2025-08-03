//
//  EventViewModel.swift
//  fude
//
//  Created by AI Assistant on 2024-12-19.
//  Copyright © 2024 fude. All rights reserved.
//

import Foundation
import Combine
import SwiftUI

/// 首頁事件 ViewModel
@MainActor
class EventViewModel: ObservableObject {
    // MARK: - Published Properties
    
    @Published var upcomingEvents: [Event] = []
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    
    // MARK: - Private Properties
    
    private var cancellables = Set<AnyCancellable>()

    private let api: APIService
    // MARK: - Initialization
    
    init(api: APIService = .shared) {
        self.api = api
        loadUpcomingEvents()
    }
    
    // MARK: - Public Methods
    
    /// 載入近期事件：先嘗試從 API 抓取，失敗回退 Mock
    func loadUpcomingEvents() {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                let events = try await api.fetchEvents()

                await MainActor.run {
                    self.upcomingEvents = events.filter { $0.countdownDays >= 0 && $0.countdownDays <= 10 }.sorted { $0.countdownDays < $1.countdownDays }
                    self.isLoading = false
                }
            } catch {
                print("API ERROR:", error)
                // 回退 Mock
                await MainActor.run {
                    self.upcomingEvents = Event.upcomingEvents
                    self.errorMessage = error.localizedDescription
                    self.isLoading = false
                }
            }
            
            //
            
        }
    }
    
    /// 重新載入資料
    func refresh() {
        loadUpcomingEvents()
    }
    
    /// 取得指定類型的事件
    func events(ofType type: EventType) -> [Event] {
        return upcomingEvents.filter { $0.type == type }
    }
    
    /// 取得神明生日事件
    var deityEvents: [Event] {
        return events(ofType: .deity)
    }
    
    /// 取得節慶事件
    var festivalEvents: [Event] {
        return events(ofType: .festival)
    }
    
    /// 取得即將到來的事件 (7天內)
    var upcomingThisWeek: [Event] {
        return upcomingEvents.filter { $0.isUpcoming }
    }
    
    /// 格式化倒數天數顯示
    func formatCountdown(_ days: Int) -> String {
        if days == 0 {
            return "今天"
        } else if days == 1 {
            return "明天"
        } else {
            return "\(days)天後"
        }
    }
    
    /// 格式化日期顯示 (農曆 + 國曆)
    func formatEventDate(_ event: Event) -> String {
        var dateString = ""
        
        // 農曆日期
        if let lunarDate = event.lunarDate {
            dateString += lunarDate.displayString
        }
        
        // 國曆日期 (顯示最近的一個)
        if let nextDate = event.solarDate.first(where: { $0 >= Date() }) {
            let formatter = DateFormatter()
            formatter.dateFormat = "M/d"
            formatter.locale = Locale(identifier: "zh_TW")
            
            if !dateString.isEmpty {
                dateString += " • "
            }
            dateString += "國曆 \(formatter.string(from: nextDate))"
        }
        
        return dateString
    }
    
    /// 取得事件圖示
    func eventIcon(_ event: Event) -> String {
        switch event.type {
        case .deity:
            return "hands.sparkles"  // 神明生日
        case .festival:
            return "star.fill"       // 民俗節慶
        case .custom:
            return "bell.fill"       // 自定義提醒
        case .solarTerm:
            return "leaf.fill"       // 節氣
        }
    }
    
    /// 取得事件顏色 (基於類型)
    func eventColor(_ event: Event) -> Color {
        switch event.type {
        case .deity:
            return .primaryColor    // 深赭紅
        case .festival:
            return .secondaryColor  // 煙燻灰
        case .custom:
            return .primaryColor
        case .solarTerm:
            return .secondaryColor
        }
    }
}

// MARK: - Preview Support
#if DEBUG
extension EventViewModel {
    /// 預覽用的 Mock ViewModel
    static var preview: EventViewModel {
        let viewModel = EventViewModel()
        viewModel.upcomingEvents = Array(Event.mockEvents.prefix(5))
        return viewModel
    }
}
#endif
