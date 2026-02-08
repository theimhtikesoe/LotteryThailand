import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';

interface StatusBadgeProps {
  status: 'waiting' | 'updated';
  fetchedAt?: string;
}

export function StatusBadge({ status, fetchedAt }: StatusBadgeProps) {
  const { t, i18n } = useTranslation();

  const formatLastUpdated = (isoDate: string) => {
    const date = new Date(isoDate);
    if (i18n.language === 'th') {
      return date.toLocaleString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return date.toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium',
          status === 'updated'
            ? 'bg-success/10 text-success'
            : 'bg-waiting/10 text-waiting-foreground'
        )}
      >
        <span
          className={cn(
            'w-2 h-2 rounded-full',
            status === 'updated' ? 'bg-success' : 'bg-waiting animate-pulse-soft'
          )}
        />
        {status === 'updated' ? t('status.updated') : t('status.waiting')}
      </div>
      {fetchedAt && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{t('status.lastUpdated')}: {formatLastUpdated(fetchedAt)}</span>
        </div>
      )}
    </div>
  );
}