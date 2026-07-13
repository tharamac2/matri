export const PERMISSIONS = {
  super_admin: ['all'],
  moderator: ['users.read', 'users.write', 'reports.*', 'subscriptions.read', 'subscriptions.write', 'analytics.read', 'moderation.*', 'matches.read'],
  viewer: ['users.read', 'analytics.read', 'matches.read'],
}

/**
 * Checks whether a role can perform an action.
 * Supports exact matches, the 'all' wildcard, and 'namespace.*' wildcards.
 */
export function hasPermission(role, action) {
  const granted = PERMISSIONS[role]
  if (!granted) return false
  if (granted.includes('all')) return true
  if (granted.includes(action)) return true

  const [namespace] = action.split('.')
  return granted.includes(`${namespace}.*`)
}
