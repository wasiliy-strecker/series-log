import { View } from 'react-native';
import type { EpisodeEntry, SeriesRecord } from '../../core/domain/models';
import { progress } from '../../core/domain/progress';
import { Body, useTheme } from '../../core/ui/components';

export function ProgressCard({
  record,
  entry,
  compact = false,
}: {
  record: SeriesRecord;
  entry: EpisodeEntry | null;
  compact?: boolean;
}) {
  const c = useTheme();
  const value = progress(record, entry);
  return (
    <View style={{ gap: 8, marginVertical: compact ? 4 : 12 }}>
      <Body muted style={{ fontSize: compact ? 12 : 14 }}>
        {value.text}
      </Body>
      {value.percent !== null && (
        <>
          <View
            accessibilityRole="progressbar"
            accessibilityLabel="Gesehene Folgen"
            accessibilityValue={{ min: 0, max: 100, now: value.percent }}
            style={{
              height: 5,
              backgroundColor: c.border,
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                height: '100%',
                width: `${Math.min(100, value.percent)}%`,
                backgroundColor: c.primary,
              }}
            />
          </View>
          {!compact && (
            <Body strong>
              {value.percent === 100
                ? 'Auf dem aktuellen Stand'
                : `${value.percent} % gesehen`}
            </Body>
          )}
        </>
      )}
    </View>
  );
}
