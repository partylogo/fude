# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### iOS App Development
```bash
# Generate/regenerate Xcode project after file changes
xcodegen generate

# Open the Xcode project
open fude.xcodeproj

# iOS tests (run in Xcode)
# Unit tests: fudeTests
# UI tests: fudeUITests
```

### Backend API Development
```bash
# Start development server with live reload
npm run dev

# Run all tests
npm test

# Watch tests during development
npm run test:watch

# Start local Supabase instance
npm run supabase:start

# Stop local Supabase
npm run supabase:stop

# Reset local database
npm run supabase:reset

# Pull environment variables from Vercel
npm run vercel:env
```

### Admin Dashboard Development
```bash
cd admin/

# Start admin development server
npm run dev

# Build admin dashboard
npm run build

# Run admin tests
npm test

# Run tests with UI
npm run test:ui
```

### Testing Scripts
```bash
# Run phase 1 CRUD smoke tests
node scripts/run-phase1-tests.js

# Run phase 2 occurrence generation tests  
node scripts/run-phase2-tests.js

# Run admin display tests
node scripts/run-admin-display-tests.js

# Test solar term calculations
node scripts/test-solar-term.js

# Regenerate event occurrences
node scripts/regenerate-occurrences.js
```

## Project Architecture

This is a folklore notification iOS app with three main components:

### 1. iOS App (`fude/`, `Sources/`)
- **SwiftUI + Swift 5.9** with MVVM architecture
- **XcodeGen** project management - NEVER modify `.xcodeproj` directly
- **Core modules**: DesignSystem, Models, Network, Services
- **Features**: Home (event display), Settings (notifications)
- **Design System**: Pure dual-color system (brick red #9D4F4A, smoky charcoal #2F2B27, warm ivory #F7F3E8)

### 2. Backend API (`api/`, `database/`, `services/`)
- **Vercel Serverless Functions** with Express.js routing
- **Supabase PostgreSQL** database with migrations
- **Key Services**: 
  - Events management with lunar calendar support
  - Groups management for organizing events
  - Lunar calendar conversion service
  - Occurrence generation for repeating events
- **Main endpoints**: `/api/events`, `/api/groups`, `/api/lunar`

### 3. Admin Dashboard (`admin/`)
- **React 18 + Vite** with React Admin framework
- CRUD interface for managing events, groups, and system data
- **Testing**: Vitest with Testing Library

## Development Principles

### TDD (Test-Driven Development)
- Follow Red → Green → Refactor cycle
- Write failing tests first, then minimal implementation
- All tests must pass before committing
- Separate structural changes from behavioral changes

### XcodeGen Project Management
- **NEVER** manually edit `.xcodeproj` files
- All project configuration in `project.yml`
- Run `xcodegen generate` after file structure changes
- When creating new Swift files, place in appropriate `Sources/` subdirectory

### File Management Rules
- Create new `.swift` files directly in `Sources/` subdirectories
- Follow existing folder structure: Core/, Features/
- Use automatic project regeneration after file changes
- Maintain separation between Core (shared) and Features (specific)

## Data Models

### Event Model
- Supports both lunar and solar dates
- Types: festival, deity, custom, solarTerm
- Custom Codable implementation for backend integration
- Mock data available for development/testing

### Date Handling
- Lunar calendar integration with Chinese formatting
- Solar date arrays support multiple occurrences per year
- Countdown calculation for upcoming events
- Complex date rules for recurring events

## Key Services

### Backend Services
- `eventsService.js`: Event CRUD operations
- `lunarCalendarService.js`: Lunar-solar date conversions
- `occurrenceGenerationService.js`: Generate recurring event instances
- `dateGenerationService.js`: Advanced date rule processing

### iOS Services
- `APIService.swift`: Network layer with Combine
- `NotificationService.swift`: Local notification management
- `NotificationScheduler.swift`: Scheduling logic

## Environment Setup

### Required Tools
- **iOS**: Xcode 15+, XcodeGen (`brew install xcodegen`)
- **Backend**: Node.js 20+, Supabase CLI
- **Database**: Local Supabase instance or cloud connection

### Local Development
1. Start Supabase: `npm run supabase:start`
2. Start API server: `npm run dev`
3. Generate Xcode project: `xcodegen generate`
4. Run tests to verify setup

## Testing Strategy

### Backend Testing
- **API Tests**: CRUD operations, data validation
- **Service Tests**: Business logic, date calculations
- **Integration Tests**: Database operations, external APIs

### iOS Testing
- **Unit Tests**: ViewModels, Models, Services
- **UI Tests**: User flows, navigation
- Run all tests before commits

### Test Data
- Mock events for iOS development
- Realistic lunar calendar data
- Complex date rule scenarios

## Version Progression

- **v1.0**: Basic notification app with mock data
- **v1.1**: Backend integration, admin dashboard  
- **v2.0**: User system, activities
- **v2.1**: Nearby temples
- **v2.2**: Map integration, detailed pages

Focus on current version requirements and maintain backward compatibility.