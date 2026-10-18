type DurationLabels = {seconds: string; minutes: string; hours: string; days: string};

const DEFAULT_LABELS: DurationLabels = {seconds: 's', minutes: 'm', hours: 'h', days: 'd'};

// biome-ignore lint/complexity/noStaticOnlyClass: Justification: Utility class with static methods is fine
export class DurationFormatter {
  static formatMilliseconds(
    milliseconds: number | null | undefined,
    labels: DurationLabels = DEFAULT_LABELS,
  ): string | null {
    if (!milliseconds) {
      return null;
    }

    const seconds = Math.round(milliseconds / 1000);
    if (seconds < 60) {
      return `${seconds}${labels.seconds}`;
    }

    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes}${labels.minutes}`;
    }

    const hours = Math.round(minutes / 60);
    if (hours < 24) {
      return `${hours}${labels.hours}`;
    }

    return `${Math.round(hours / 24)}${labels.days}`;
  }
}
