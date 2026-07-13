const READ_KEY = 'matri_read_notifications';

export function getReadNotificationIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY)) || []);
  } catch {
    return new Set();
  }
}

export function markNotificationRead(id) {
  const ids = getReadNotificationIds();
  ids.add(id);
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
}
