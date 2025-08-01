// GroupItemsResponse.swift
// fude
// Represents /api/groups/:id/items response

import Foundation

struct GroupItemsResponse: Codable {
    let deities: [Event]?
    let festivals: [Event]?
}
