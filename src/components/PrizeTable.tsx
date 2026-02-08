import { Prize } from '@/types/lottery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Award, Medal, Star, Gift } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PrizeTableProps {
  prizes: Prize[];
}

const prizeConfig: Record<string, { 
  icon: React.ReactNode; 
  gradient: string; 
  badge: string;
  showAll?: boolean;
}> = {
  'prizeFirst': { 
    icon: <Trophy className="w-5 h-5" />, 
    gradient: 'from-yellow-500 to-amber-600',
    badge: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
  },
  'prizeFirstNear': { 
    icon: <Star className="w-5 h-5" />, 
    gradient: 'from-orange-400 to-orange-600',
    badge: 'bg-orange-500/20 text-orange-700 dark:text-orange-400'
  },
  'prizeSecond': { 
    icon: <Award className="w-5 h-5" />, 
    gradient: 'from-slate-400 to-slate-600',
    badge: 'bg-slate-500/20 text-slate-700 dark:text-slate-400'
  },
  'prizeThird': { 
    icon: <Medal className="w-5 h-5" />, 
    gradient: 'from-amber-600 to-amber-800',
    badge: 'bg-amber-600/20 text-amber-700 dark:text-amber-400'
  },
  'prizeForth': { 
    icon: <Gift className="w-5 h-5" />, 
    gradient: 'from-blue-400 to-blue-600',
    badge: 'bg-blue-500/20 text-blue-700 dark:text-blue-400'
  },
  'prizeFifth': { 
    icon: <Gift className="w-5 h-5" />, 
    gradient: 'from-green-400 to-green-600',
    badge: 'bg-green-500/20 text-green-700 dark:text-green-400'
  },
};

const prizeIdToKey: Record<string, string> = {
  'prizeFirst': 'first',
  'prizeFirstNear': 'sideFirst',
  'prizeSecond': 'second',
  'prizeThird': 'third',
  'prizeForth': 'fourth',
  'prizeFifth': 'fifth',
};

interface ExtendedPrize extends Prize {
  id?: string;
}

export function PrizeTable({ prizes }: PrizeTableProps) {
  const { t } = useTranslation();

  // Filter to show only the main prizes (exclude 1st prize as it's shown separately)
  const displayPrizes = (prizes as ExtendedPrize[]).filter(p => 
    p.id && ['prizeFirstNear', 'prizeSecond', 'prizeThird', 'prizeForth', 'prizeFifth'].includes(p.id)
  );

  return (
    <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
        <Trophy className="w-5 h-5 text-primary" />
        {t('prizeTable.title')}
      </h2>
      
      <div className="grid gap-4">
        {displayPrizes.map((prize, idx) => {
          const prizeId = (prize as ExtendedPrize).id || '';
          const config = prizeConfig[prizeId] || prizeConfig['prizeFifth'];
          const key = prizeIdToKey[prizeId] || 'fifth';
          const name = t(`prizeTable.prizes.${key}`);
          const desc = t(`prizeTable.descriptions.${key}`);
          
          return (
            <Card key={idx} className="overflow-hidden border-border shadow-card">
              <CardHeader className={`py-3 px-4 bg-gradient-to-r ${config.gradient} text-white`}>
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    {config.icon}
                    {name}
                  </span>
                  <span className="text-sm font-normal opacity-90">{desc}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  {prize.numbers.map((num, nIdx) => (
                    <span 
                      key={nIdx} 
                      className={`lottery-number text-sm px-3 py-1.5 rounded-lg font-mono font-semibold ${config.badge}`}
                    >
                      {num}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  {t('prizeTable.prizeAmount')}: <span className="font-semibold text-foreground">฿{prize.amount}</span> {t('prizeTable.each')}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}