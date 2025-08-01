//  APIService.swift
//  FolkloreApp
//
//  Created for Phase 2A - Connect iOS to local API
//
//  NOTE: This is minimal implementation written after tests (Red).
//  It will be expanded to satisfy failing tests following TDD cycle.

import Foundation

/// A thin wrapper around `URLSession` providing type-safe access to backend API.
/// Dependency-injectable for unit testing.
final class APIService {
    // MARK: - Singleton (used by production code)
    static let shared = APIService()

    // MARK: - Dependencies
    private let session: URLSession
    private let baseURL: URL

    // MARK: - Init
    init(session: URLSession = .shared, baseURL: URL? = nil) {
        self.session = session

        if let override = baseURL {
            self.baseURL = override
        } else {
            // Read from Env variable (xcconfig) or fallback
            let base = Bundle.main.infoDictionary?["API_BASE_URL"] as? String ?? "http://localhost:3000"
            self.baseURL = URL(string: base)!.appendingPathComponent("api")
        }
    }

    // MARK: - Public Endpoints
    /// Fetch all events.
    func fetchEvents() async throws -> [Event] {
        let url = baseURL.appendingPathComponent("events")
        let (data, response) = try await session.data(from: url)
        try Self.ensureSuccess(response: response)
        let wrapper = try JSONDecoder().decode(EventsWrapper.self, from: data)
        return wrapper.events
    }

    /// Fetch all groups.
    func fetchGroups() async throws -> [Group] {
        let url = baseURL.appendingPathComponent("groups")
        let (data, response) = try await session.data(from: url)
        try Self.ensureSuccess(response: response)
        let wrapper = try JSONDecoder().decode(GroupsWrapper.self, from: data)
        return wrapper.groups
    }

    /// Fetch single group detail
    func fetchGroup(groupId: Int) async throws -> Group {
        let url = baseURL.appendingPathComponent("groups/")
            .appendingPathComponent(String(groupId))
        let (data, response) = try await session.data(from: url)
        try Self.ensureSuccess(response: response)
        return try JSONDecoder().decode(Group.self, from: data)
    }

    /// Fetch items (events) in a group separated by type
    func fetchGroupItems(groupId: Int) async throws -> GroupItemsResponse {
        let url = baseURL.appendingPathComponent("groups/")
            .appendingPathComponent(String(groupId))
            .appendingPathComponent("items")
        let (data, response) = try await session.data(from: url)
        try Self.ensureSuccess(response: response)
        let decoded = try JSONDecoder().decode(GroupItemsResponse.self, from: data)
        return decoded
    }

    // MARK: - Helpers
    private static func ensureSuccess(response: URLResponse) throws {
        guard let http = response as? HTTPURLResponse, 200..<300 ~= http.statusCode else {
            throw URLError(.badServerResponse)
        }
    }
}

// MARK: - DTOs
private struct EventsWrapper: Codable {
    let events: [Event]
}

private struct GroupsWrapper: Codable {
    let groups: [Group]
}

/* moved to Models/GroupItemsResponse.swift */
private struct _DeprecatedGroupItemsResponse: Codable {
    let deities: [Event]?
    let festivals: [Event]?

    enum CodingKeys: String, CodingKey {
        case deities
        case festivals
    }
}
