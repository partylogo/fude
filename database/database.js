// Database Connection Module - Mock implementation for local development
// This will be replaced with actual Supabase connection in production

/**
 * Simple query function for local development
 * In production, this will connect to Supabase PostgreSQL
 */
async function query(sql, params = []) {
  // Mock implementation - returns empty result by default
  // Individual tests will mock this function with specific responses
  return { rows: [], rowCount: 0 };
}

module.exports = {
  query
};