//  APIServiceTests.swift
//  FolkloreAppTests
//
//  TDD Red phase: tests should fail until APIService implementation is complete.

import XCTest
@testable import fude

final class APIServiceTests: XCTestCase {
    private var api: APIService!

    override func setUp() {
        super.setUp()
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [MockURLProtocol.self]
        let session = URLSession(configuration: config)
        api = APIService(session: session, baseURL: URL(string: "http://localhost:3000/api"))
        MockURLProtocol.mockResponses = [:]
    }

    func testFetchEventsSuccess() async throws {
        let json = """
        {"events":[{"id":1,"type":"deity","title":"媽祖聖誕","description":"海上女神","solar_date":"2025-04-20"}]}
        """
        MockURLProtocol.mockResponses["/api/events"] = (200, json)
        let events = try await api.fetchEvents()
        XCTAssertEqual(events.count, 1)
        XCTAssertEqual(events[0].title, "媽祖聖誕")
    }

    func testFetchGroupsSuccess() async throws {
        let json = """
        {"groups":[{"id":1,"name":"簡少年","description":"Desc","enabled":true,"video_url":null,"created_at":"2024-12-01T00:00:00Z","updated_at":"2024-12-01T00:00:00Z"}]}
        """
        MockURLProtocol.mockResponses["/api/groups"] = (200, json)
        let groups = try await api.fetchGroups()
        XCTAssertEqual(groups.count, 1)
        XCTAssertEqual(groups[0].name, "簡少年")
    }

    func testFetchGroups404() async {
        MockURLProtocol.mockResponses["/api/groups"] = (404, "{}")
        do {
            _ = try await api.fetchGroups()
            XCTFail("Should throw for 404")
        } catch {
            // expected
        }
    }
}
