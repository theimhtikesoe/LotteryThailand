import { useState, useEffect } from 'react';
import { getNextDrawDate } from '@/data/mockLotteryData';
import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function CountdownTimer() {
  const { t, i18n } = useTranslation();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [nextDrawDate, setNextDrawDate] = useState<Date>(getNextDrawDate());

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = nextDrawDate.getTime() - now.getTime();

      if (difference <= 0) {
        setNextDrawDate(getNextDrawDate());
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [nextDrawDate]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(i18n.language === 'th' ? 'th-TH' : 'en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-card rounded-lg p-6 shadow-card border border-border">
      <div className="flex items-center gap-2 text-muted-foreground mb-4">
        <Clock className="w-5 h-5" />
        <span className="text-sm font-medium">{t('countdown.nextDraw')}</span>
      </div>
      
      <p className="text-foreground font-semibold mb-4">
        {formatDate(nextDrawDate)} {t('countdown.at')}
      </p>

      <div className="grid grid-cols-4 gap-2">
        <TimeBlock value={timeLeft.days} label={t('countdown.days')} />
        <TimeBlock value={timeLeft.hours} label={t('countdown.hours')} />
        <TimeBlock value={timeLeft.minutes} label={t('countdown.min')} />
        <TimeBlock value={timeLeft.seconds} label={t('countdown.sec')} />
      </div>
    </div>
  );
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-secondary rounded-md p-3 text-center">
      <div className="font-mono text-2xl md:text-3xl font-bold text-foreground">
        {String(value).padStart(2, '0')}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}