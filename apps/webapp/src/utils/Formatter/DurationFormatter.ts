// biome-ignore lint/complexity/noStaticOnlyClass: Justification: Utility class with static methods is fine
export class DurationFormatter {
  static formatMilliseconds(milliseconds: number | null | undefined): string | null {
    if (!milliseconds) {
      return null;
    }

    const seconds = Math.round(milliseconds / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }

    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes}m`;
    }

    const hours = Math.round(minutes / 60);
    if (hours < 24) {
      return `${hours}h`;
    }

    return `${Math.round(hours / 24)}d`;
  }
}
