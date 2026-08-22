// The only position values the app's UI, position-gated middleware
// (secretaryOnly, clerkOnly, viceMayorOnly), and frontend access-control
// logic (canManageUsers, canViewArchives, etc.) actually understand. Kept in
// one place so every create/update route validates against the same list
// instead of silently accepting arbitrary strings.
const ROLE_POSITIONS = {
  admin: ['secretary', 'clerk'],
  user: ['councilor', 'vice_mayor'],
}

const ALL_POSITIONS = [...ROLE_POSITIONS.admin, ...ROLE_POSITIONS.user]

const isValidPositionForRole = (role, position) =>
  Array.isArray(ROLE_POSITIONS[role]) && ROLE_POSITIONS[role].includes(position)

module.exports = { ROLE_POSITIONS, ALL_POSITIONS, isValidPositionForRole }
