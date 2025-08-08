//
//  NotificationServiceTests.swift
//  fudeTests
//
//  Created by AI Assistant on 2025-01-01.
//  Copyright © 2025 fude. All rights reserved.
//

import XCTest
import UserNotifications
@testable import fude

/// 通知服務單元測試
/// 遵循 TDD 原則：Red → Green → Refactor
final class NotificationServiceTests: XCTestCase {
    
    var notificationService: NotificationService!
    var mockNotificationCenter: MockUNUserNotificationCenter!
    
    @MainActor
    override func setUp() {
        super.setUp()
        mockNotificationCenter = MockUNUserNotificationCenter()
        notificationService = NotificationService(notificationCenter: mockNotificationCenter)
    }
    
    override func tearDown() {
        notificationService = nil
        mockNotificationCenter = nil
        super.tearDown()
    }
    
    // MARK: - 權限狀態管理測試
    
    /// 測試初始權限狀態為 notDetermined
    @MainActor
    func testInitialAuthorizationStatus() {
        // GIVEN: 新建立的 NotificationService
        // WHEN: 檢查初始狀態
        // THEN: 權限狀態應為 notDetermined
        XCTAssertEqual(notificationService.authorizationStatus, .notDetermined)
    }
    
    /// 測試權限狀態更新
    @MainActor
    func testAuthorizationStatusUpdate() async {
        // GIVEN: Mock 返回已授權狀態
        mockNotificationCenter.mockAuthorizationStatus = UNAuthorizationStatus.authorized
        
        // WHEN: 檢查權限狀態
        await notificationService.checkAuthorizationStatus()
        
        // THEN: 狀態應更新為已授權
        XCTAssertEqual(notificationService.authorizationStatus, .authorized)
    }
    
    // MARK: - 權限請求測試
    
    /// 測試當權限為 notDetermined 時請求權限
    @MainActor
    func testRequestAuthorizationWhenNotDetermined() async {
        // GIVEN: 權限狀態為 notDetermined
        mockNotificationCenter.mockAuthorizationStatus = UNAuthorizationStatus.notDetermined
        mockNotificationCenter.shouldGrantAuthorization = true
        
        // WHEN: 請求權限
        await notificationService.requestAuthorizationIfNeeded()
        
        // THEN: 應該呼叫權限請求
        XCTAssertTrue(mockNotificationCenter.didCallRequestAuthorization)
        XCTAssertEqual(mockNotificationCenter.requestedOptions, [UNAuthorizationOptions.alert, UNAuthorizationOptions.sound, UNAuthorizationOptions.badge])
    }
    
    /// 測試當權限已授權時不重複請求
    @MainActor
    func testNoRequestWhenAlreadyAuthorized() async {
        // GIVEN: 權限狀態為已授權
        mockNotificationCenter.mockAuthorizationStatus = UNAuthorizationStatus.authorized
        notificationService.authorizationStatus = .authorized
        
        // WHEN: 請求權限
        await notificationService.requestAuthorizationIfNeeded()
        
        // THEN: 不應該呼叫權限請求
        XCTAssertFalse(mockNotificationCenter.didCallRequestAuthorization)
    }
    
    /// 測試當權限被拒絕時不重複請求
    @MainActor
    func testNoRequestWhenDenied() async {
        // GIVEN: 權限狀態為被拒絕
        mockNotificationCenter.mockAuthorizationStatus = UNAuthorizationStatus.denied
        notificationService.authorizationStatus = .denied
        
        // WHEN: 請求權限
        await notificationService.requestAuthorizationIfNeeded()
        
        // THEN: 不應該呼叫權限請求
        XCTAssertFalse(mockNotificationCenter.didCallRequestAuthorization)
    }
    
    /// 測試權限請求成功後狀態更新
    @MainActor
    func testAuthorizationGrantedUpdatesStatus() async {
        // GIVEN: 權限請求會成功
        mockNotificationCenter.mockAuthorizationStatus = UNAuthorizationStatus.notDetermined
        mockNotificationCenter.shouldGrantAuthorization = true
        
        // WHEN: 請求權限
        await notificationService.requestAuthorizationIfNeeded()
        
        // THEN: 狀態應更新為已授權
        // 需要等待異步狀態更新
        try? await Task.sleep(for: .milliseconds(100))
        XCTAssertEqual(notificationService.authorizationStatus, .authorized)
    }
    
    /// 測試權限請求被拒絕後狀態更新
    @MainActor
    func testAuthorizationDeniedUpdatesStatus() async {
        // GIVEN: 權限請求會被拒絕
        mockNotificationCenter.mockAuthorizationStatus = UNAuthorizationStatus.notDetermined
        mockNotificationCenter.shouldGrantAuthorization = false
        
        // WHEN: 請求權限
        await notificationService.requestAuthorizationIfNeeded()
        
        // THEN: 狀態應更新為被拒絕
        // 需要等待異步狀態更新
        try? await Task.sleep(for: .milliseconds(100))
        XCTAssertEqual(notificationService.authorizationStatus, .denied)
    }
}

// MARK: - Mock Objects

/// Mock UNUserNotificationCenter 用於測試
class MockUNUserNotificationCenter: UNUserNotificationCenterProtocol {
    var mockAuthorizationStatus: UNAuthorizationStatus = .notDetermined
    var shouldGrantAuthorization = false
    var didCallRequestAuthorization = false
    var requestedOptions: UNAuthorizationOptions = []
    
    // 新增的屬性用於 NotificationScheduler 測試
    var pendingRequests: [UNNotificationRequest] = []
    var addedRequests: [UNNotificationRequest] = []
    var removeAllPendingNotificationRequestsCalled = false
    var addRequestCalled = false
    
    func getNotificationSettings() async -> NotificationSettingsProtocol {
        return MockNotificationSettings(authorizationStatus: mockAuthorizationStatus)
    }
    
    func requestAuthorization(options: UNAuthorizationOptions) async throws -> Bool {
        didCallRequestAuthorization = true
        requestedOptions = options
        
        // 模擬用戶回應後狀態變更
        if shouldGrantAuthorization {
            mockAuthorizationStatus = .authorized
        } else {
            mockAuthorizationStatus = .denied
        }
        
        return shouldGrantAuthorization
    }
    
    func add(_ request: UNNotificationRequest) async throws {
        addRequestCalled = true
        addedRequests.append(request)
        pendingRequests.append(request)
    }
    
    func removeAllPendingNotificationRequests() async {
        removeAllPendingNotificationRequestsCalled = true
        pendingRequests.removeAll()
    }
    
    func getPendingNotificationRequests() async -> [UNNotificationRequest] {
        return pendingRequests
    }
}

/// Mock NotificationSettings for testing
class MockNotificationSettings: NotificationSettingsProtocol {
    let authorizationStatus: UNAuthorizationStatus
    
    init(authorizationStatus: UNAuthorizationStatus) {
        self.authorizationStatus = authorizationStatus
    }
}

