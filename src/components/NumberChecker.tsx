import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LotteryResult } from '@/types/lottery';
import { Search, Check, X, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NumberCheckerProps {
  result: LotteryResult;
}

interface PrizeMatch {
  prizeName: string;
  prizeAmount: string;
  matchType: 'full' | 'front3' | 'last3' | 'last2';
}

export function NumberChecker({ result }: NumberCheckerProps) {
  const { t } = useTranslation();
  const [ticketNumber, setTicketNumber] = useState('');
  const [matches, setMatches] = useState<PrizeMatch[] | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  const checkNumber = () => {
    if (ticketNumber.length !== 6 || !/^\d+$/.test(ticketNumber)) {
      return;
    }

    const found: PrizeMatch[] = [];
    const front3 = ticketNumber.slice(0, 3);
    const last3 = ticketNumber.slice(-3);
    const last2 = ticketNumber.slice(-2);

    // Check first prize
    if (ticketNumber === result.firstPrize) {
      found.push({ prizeName: t('firstPrize.title'), prizeAmount: '6,000,000', matchType: 'full' });
    }

    // Check other full number prizes
    result.prizes.forEach(prize => {
      if (prize.numbers.includes(ticketNumber)) {
        found.push({ prizeName: prize.name, prizeAmount: prize.amount, matchType: 'full' });
      }
    });

    // Check front 3 digits
    if (result.front3.includes(front3)) {
      found.push({ prizeName: t('quickResults.front3'), prizeAmount: '4,000', matchType: 'front3' });
    }

    // Check last 3 digits
    if (result.last3.includes(last3)) {
      found.push({ prizeName: t('quickResults.last3'), prizeAmount: '4,000', matchType: 'last3' });
    }

    // Check last 2 digits
    if (result.last2 === last2) {
      found.push({ prizeName: t('quickResults.last2'), prizeAmount: '2,000', matchType: 'last2' });
    }

    setMatches(found);
    setHasChecked(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setTicketNumber(value);
    setHasChecked(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && ticketNumber.length === 6) {
      checkNumber();
    }
  };

  return (
    <Card className="animate-fade-in bg-card border-border shadow-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Search className="h-5 w-5 text-primary" />
          {t('numberChecker.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder={t('numberChecker.placeholder')}
            value={ticketNumber}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            maxLength={6}
            className="text-lg tracking-widest text-center font-mono"
          />
          <Button 
            onClick={checkNumber} 
            disabled={ticketNumber.length !== 6}
            className="px-6"
          >
            {t('numberChecker.checkButton')}
          </Button>
        </div>

        {hasChecked && (
          <div className="mt-4 animate-fade-in">
            {matches && matches.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Trophy className="h-5 w-5" />
                  <span className="font-semibold">{t('numberChecker.congratulations')}</span>
                </div>
                <div className="space-y-2">
                  {matches.map((match, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800"
                    >
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="font-medium text-foreground">{match.prizeName}</span>
                      </div>
                      <span className="font-bold text-green-600 dark:text-green-400">
                        ฿{match.prizeAmount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg text-muted-foreground">
                <X className="h-4 w-4" />
                <span>{t('numberChecker.noWin')}</span>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {t('numberChecker.hint')}
        </p>
      </CardContent>
    </Card>
  );
}