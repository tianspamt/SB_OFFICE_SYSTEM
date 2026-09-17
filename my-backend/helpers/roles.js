// The only position values the app's UI, position-gated middleware
// (secretaryOnly, clerkOnly, viceMayorOnly), and frontend access-control
// logic (canManageUsers, canViewArchives, etc.) actually understand. Kept in
// one place so every create/update route validates against the same list
// instead of silently accepting arbitrary strings.
const ROLE_POSITIONS = {
  admin: ['secretary', 'clerk'],
  // Liga ng mga Barangay and SK Federated are ex-officio Sangguniang Bayan
  // members — RBAC-wise they're treated identically to an elected Councilor
  // everywhere else in the backend (see canCreateDraft in middleware/auth.js
  // and canArchiveLegislativeRecord in helpers/utils.js), they just get
  // their own position value so the account still records which seat they
  // actually hold.
  user: ['councilor', 'vice_mayor', 'liga_ng_mga_barangay', 'sk_federated'],
}

const ALL_POSITIONS = [...ROLE_POSITIONS.admin, ...ROLE_POSITIONS.user]

const isValidPositionForRole = (role, position) =>
  Array.isArray(ROLE_POSITIONS[role]) && ROLE_POSITIONS[role].includes(position)

module.exports = { ROLE_POSITIONS, ALL_POSITIONS, isValidPositionForRole }
