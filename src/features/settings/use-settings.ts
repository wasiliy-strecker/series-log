import { t } from '../../core/i18n/runtime';
import { useLocalization } from '../../core/i18n/react';
import { useState } from 'react';
import { useServices } from '../../core/composition';
import { useTask } from '../../core/ui/use-task';
import { useFeedback } from '../../core/ui/feedback';
import { useLeaveGuard } from '../../core/ui/use-leave-guard';
import { errorText } from '../../core/ui/components';
import type { PreparedBackup } from '../../core/media/media-service';
import { privacyUrl } from './project-links';
import type { BackupProgress } from '../../core/backup/backup-progress';
function progressLabel(progress: BackupProgress): string {
  const label = {
    preparing: t('Backup wird vorbereitet'),
    checking: t('Dateien werden geprüft'),
    encrypting: t('Backup wird verschlüsselt'),
    decrypting: t('Backup wird entschlüsselt'),
    restoring: t('Backup wird wiederhergestellt'),
  }[progress.phase];
  return progress.totalFiles && progress.completedFiles !== undefined
    ? `${label} · ${progress.completedFiles} von ${progress.totalFiles}`
    : `${label} …`;
}
export function useSettings(
  askPassword: (confirm: boolean) => Promise<string | null>,
) {
  useLocalization();
  const { backup, media, links, refresh } = useServices();
  const task = useTask(),
    feedback = useFeedback();
  const [phase, setPhase] = useState('');
  const onProgress = (progress: BackupProgress) =>
    setPhase(progressLabel(progress));
  useLeaveGuard({ dirty: false, busy: task.busy, discard: async () => {} });
  return {
    ...task,
    phase,
    openPrivacy: async () => {
      try {
        await links.open(privacyUrl());
      } catch {
        feedback.notify(
          t(
            'Die Datenschutzerklärung konnte nicht geöffnet werden. Bitte versuche es erneut.',
          ),
        );
      }
    },
    create: () =>
      task.run(async () => {
        const password = await askPassword(true);
        if (password === null) return;
        let prepared: PreparedBackup | undefined;
        try {
          setPhase(t('Backup wird vorbereitet …'));
          const bytes = await backup.create(password, onProgress);
          setPhase(t('Speicherort wird vorbereitet …'));
          await new Promise<void>((resolve) => setTimeout(resolve, 0));
          prepared = await media.prepareBackup(bytes);
          setPhase('');
          let finished = false;
          while (!finished) {
            let saved = false;
            let failure = '';
            try {
              saved = (await media.saveBackup(prepared)) === 'saved';
            } catch (e) {
              failure = errorText(e);
            }
            if (saved) {
              const action = await feedback.choose({
                title: t('Backup gespeichert'),
                message: t(
                  '{p0} wurde im gewählten Speicherort abgelegt. Bewahre die Datei und dein Passwort sicher auf.',
                  { p0: prepared.name },
                ),
                dialog: true,
                stackedActions: true,
                options: [
                  {
                    value: 'done',
                    label: t('Fertig'),
                    filled: true,
                    icon: 'check',
                  },
                  {
                    value: 'share',
                    label: t('Teilen'),
                    icon: 'ios_share_outlined',
                    outlined: true,
                  },
                ],
              });
              if (action === 'share') await media.shareBackup(prepared);
              finished = true;
            } else {
              const action = await feedback.choose({
                title: t('Backup noch nicht gespeichert'),
                message:
                  failure ||
                  t(
                    'Die Speicherortauswahl wurde abgebrochen. Du kannst erneut einen Speicherort wählen.',
                  ),
                dialog: true,
                stackedActions: true,
                options: [
                  {
                    value: 'discard',
                    label: t('Backup verwerfen'),
                    danger: true,
                    filled: true,
                    icon: 'delete_outline',
                  },
                  {
                    value: 'retry',
                    label: t('Speicherort wählen'),
                    outlined: true,
                    icon: 'folder_open_outlined',
                  },
                ],
              });
              finished = action !== 'retry';
            }
          }
        } finally {
          setPhase('');
          if (prepared) await media.discardBackup(prepared).catch(() => {});
        }
      }),
    restore: () =>
      task.run(async () => {
        const bytes = await media.pickBackup();
        if (!bytes) return;
        const password = await askPassword(false);
        if (password === null) return;
        try {
          setPhase(t('Backup wird geprüft …'));
          const decoded = await backup.codec.decode(
            bytes,
            password,
            onProgress,
          );
          setPhase('');
          if (
            !(await feedback.confirm(
              t('Backup wiederherstellen?'),
              t(
                '{p0} Serien, {p1} Einträge und {p2} Serienprotokolle werden importiert. Neuere lokale Einträge werden nicht überschrieben.',
                {
                  p0: decoded.data.records.length,
                  p1: decoded.data.entries.length,
                  p2: decoded.data.reports.length,
                },
              ),
              t('Wiederherstellen'),
              false,
            ))
          )
            return;
          setPhase(t('Backup wird wiederhergestellt …'));
          const result = await backup.restore(decoded, onProgress);
          refresh();
          feedback.notify(
            [
              t(
                'Backup wiederhergestellt. Die Daten sind sofort in deinen Serien sichtbar.',
              ),
              ...result.warnings,
            ].join('\n'),
          );
        } finally {
          setPhase('');
        }
      }),
  };
}
