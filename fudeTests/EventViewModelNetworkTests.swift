//  EventViewModelNetworkTests.swift
//  fudeTests
//
//  Validate that EventViewModel pulls data from API when provided with injected APIService
//

import XCTest
@testable import fude

final class EventViewModelNetworkTests: XCTestCase {
    private var api: APIService!

    override func setUp() {
        super.setUp()
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [MockURLProtocol.self]
        let session = URLSession(configuration: config)
        api = APIService(session: session, baseURL: URL(string: "http://localhost:3000/api"))
        MockURLProtocol.mockResponses = [:]
    }

    func testViewModelLoadsDataFromAPI() async throws {
        // Arrange mock response
        let json = """
        {"events":[{"id":1,"type":"deity","title":"媽祖聖誕","description":"海上女神","solar_month":8,"solar_day":2}]}
        """
        MockURLProtocol.mockResponses["/api/events"] = (200, json)

        // Act
        let viewModel = await EventViewModel(api: api)
        // Allow async task to finish
        try await Task.sleep(for: .milliseconds(200))

        // Assert
        let events = await viewModel.upcomingEvents
        XCTAssertEqual(events.count, 1)
        XCTAssertEqual(events.first?.title, "媽祖聖誕")
    }
}
