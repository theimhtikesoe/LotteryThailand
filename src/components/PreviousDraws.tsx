import { PreviousDraw } from '@/types/lottery';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Trophy, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PreviousDrawsProps {
  draws: PreviousDraw[];
}

export function PreviousDraws({ draws }: PreviousDrawsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          {t('previousDraws.title')}
        </h2>
        <span className="text-sm text-muted-foreground">
          {t('previousDraws.lastDraws', { count: draws.length })}
        </span>
      </div>
      
      <div className="grid gap-3">
        {draws.map((draw, idx) => (
          <Card 
            key={idx} 
            className="overflow-hidden border-border shadow-card hover:shadow-lg transition-all duration-300 hover:border-primary/30"
          >
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row md:items-center">
                {/* Date Section */}
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 md:w-48 flex-shrink-0">
                  <div className="flex items-center gap-2 text-primary">
                    <Calendar className="w-4 h-4" />
                    <span className="font-semibold text-sm">{draw.drawDate}</span>
                  </div>
                </div>
                
                {/* Results Section */}
                <div className="flex-1 p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* 1st Prize */}
                    <div className="col-span-2 md:col-span-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                        <span className="text-xs font-medium text-muted-foreground">{t('firstPrize.title')}</span>
                      </div>
                      <span className="lottery-number text-xl md:text-2xl font-bold text-primary">
                        {draw.firstPrize}
                      </span>
                    </div>
                    
                    {/* Front 3 */}
                    <div>
                      <span className="text-xs font-medium text-muted-foreground block mb-1">{t('previousDraws.front3')}</span>
                      <div className="flex gap-1.5">
                        {[...draw.front3].reverse().map((num, nIdx) => (
                          <span 
                            key={nIdx} 
                            className="lottery-number text-sm bg-secondary/80 px-2 py-0.5 rounded font-semibold"
                          >
                            {num}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Last 3 */}
                    <div>
                      <span className="text-xs font-medium text-muted-foreground block mb-1">{t('previousDraws.last3')}</span>
                      <div className="flex gap-1.5">
                        {draw.last3.map((num, nIdx) => (
                          <span 
                            key={nIdx} 
                            className="lottery-number text-sm bg-secondary/80 px-2 py-0.5 rounded font-semibold"
                          >
                            {num}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Last 2 */}
                    <div>
                      <span className="text-xs font-medium text-muted-foreground block mb-1">{t('previousDraws.last2')}</span>
                      <span className="lottery-number text-lg bg-primary/10 text-primary px-3 py-0.5 rounded font-bold">
                        {draw.last2}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* View Arrow */}
                <div className="hidden md:flex items-center pr-4">
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {draws.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground">
            {t('previousDraws.noResults')}
          </CardContent>
        </Card>
      )}
    </div>
  );
}