export function formatDuration (duration: number): [string, string] {
  if (duration < 100) {
    return [duration.toFixed(2), 'ms']
  } else if (duration > 2000) {
    return [(duration / 1000).toFixed(2), 's']
  } else {
    return [Math.round(duration).toString(), 'ms']
  }
}

export function formatDurationToString (duration: number): string {
  const [durationStr, durationUnit] = formatDuration(duration)
  return `${durationStr}${durationUnit}`
}
