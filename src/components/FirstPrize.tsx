import { Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FirstPrizeProps {
  number: string;
  drawDate: string;
  isWaiting?: boolean;
}

export function FirstPrize({ number, drawDate, isWaiting = false }: FirstPrizeProps) {
  const { t } = useTranslation();

  return (
    <div className="prize-highlight bg-card rounded-lg p-6 md:p-8 shadow-card animate-fade-in">
      <div className="flex items-center justify-center gap-2 text-primary mb-4">
        <Trophy className="w-6 h-6" />
        <span className="text-lg font-semibold">{t('firstPrize.title')}</span>
      </div>
      
      <div className="text-center">
        {isWaiting ? (
          <div className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg">
            <span className="lottery-number text-4xl md:text-5xl lg:text-6xl tracking-[0.1em]">
              XXXXXX
            </span>
          </div>
        ) : (
          <div className="lottery-number text-5xl md:text-7xl lg:text-8xl text-foreground tracking-[0.15em]">
            {number}
          </div>
        )}
        <p className="text-muted-foreground mt-4 text-sm">
          {t('firstPrize.drawDate')}: {drawDate}
        </p>
        <p className="text-primary font-semibold mt-2 text-lg">
          {t('firstPrize.prize')}: ฿6,000,000
        </p>
      </div>
    </div>
  );
}