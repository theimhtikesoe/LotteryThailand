import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-100 border-t border-border mt-auto">
      <div className="container py-6">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            {t('footer.disclaimer')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('footer.dataSource')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
          <p className="text-xs text-gray-600">
            Developed by Rz99 Systems
          </p>
        </div>
      </div>
    </footer>
  );
}
