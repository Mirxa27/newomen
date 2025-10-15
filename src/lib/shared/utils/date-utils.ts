// Date formatting utilities using native JavaScript
// Fallback implementation if date-fns is not available

export function format(date: Date | string, pattern: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }

  // Basic formatting patterns
  const patterns: Record<string, () => string> = {
    'MMM d': () => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[d.getMonth()]} ${d.getDate()}`;
    },
    'yyyy': () => d.getFullYear().toString(),
    'h:mm a': () => {
      const hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes} ${ampm}`;
    },
    'MMM d, yyyy': () => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    },
    'MMM d, yyyy h:mm a': () => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} ${displayHours}:${minutes} ${ampm}`;
    },
    'MMM dd': () => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[d.getMonth()]} ${d.getDate().toString().padStart(2, '0')}`;
    }
  };

  // Default to ISO string if pattern not found
  return patterns[pattern]?.() || d.toISOString();
}

// Time ago formatting
export function formatDistanceToNow(date: Date | string, options: { addSuffix?: boolean } = {}): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMs = now.getTime() - d.getTime();
  const diffInMins = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMs / 3600000);
  const diffInDays = Math.floor(diffInMs / 86400000);
  
  if (diffInMins < 1) return 'just now';
  if (diffInMins === 1) return options.addSuffix ? '1 minute ago' : '1 minute';
  if (diffInMins < 60) return `${diffInMins} minutes${options.addSuffix ? ' ago' : ''}`;
  if (diffInHours === 1) return options.addSuffix ? '1 hour ago' : '1 hour';
  if (diffInHours < 24) return `${diffInHours} hours${options.addSuffix ? ' ago' : ''}`;
  if (diffInDays === 1) return options.addSuffix ? '1 day ago' : '1 day';
  if (diffInDays < 30) return `${diffInDays} days${options.addSuffix ? ' ago' : ''}`;
  
  return format(d, 'MMM d, yyyy');
}

// Is today check
export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  return d.getDate() === now.getDate() && 
         d.getMonth() === now.getMonth() && 
         d.getFullYear() === now.getFullYear();
}

// Is this week check  
export function isThisWeek(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return d.getTime() >= startOfWeek.getTime() && d.getTime() <= endOfWeek.getTime();
}
