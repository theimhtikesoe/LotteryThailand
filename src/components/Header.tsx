import { useTranslation } from 'react-i18next';
import { LanguageToggle } from './LanguageToggle';

export function Header() {
  const { t } = useTranslation();

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/Lottery.png"
              alt="Lottery logo"
              className="w-10 h-10 rounded-lg object-cover"
              loading="eager"
            />
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">
                {t('header.title')}
              </h1>
              <p className="text-xs text-muted-foreground">
                {t('header.subtitle')}
              </p>
            </div>
          </div>
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}
