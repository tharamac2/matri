const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

export function isOnline(lastActive) {
  if (!lastActive) return false;
  const diff = Date.now() - new Date(lastActive).getTime();
  return diff >= 0 && diff < ONLINE_THRESHOLD_MS;
}

export function presenceLabel(lastActive) {
  if (!lastActive) return 'Last seen a while ago';
  const diffMs = Date.now() - new Date(lastActive).getTime();
  if (diffMs < 0) return 'Online now';
  if (diffMs < ONLINE_THRESHOLD_MS) return 'Online now';

  const minutes = Math.floor(diffMs / (60 * 1000));
  if (minutes < 60) return `Active ${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Active ${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `Active ${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `Active ${months}mo ago`;

  return 'Active a while ago';
}
