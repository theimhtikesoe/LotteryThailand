import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Search, Trophy, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useSearchLotteryByDate } from '@/hooks/useLotteryData';
import { PreviousDraw } from '@/types/lottery';

export function HistoricalSearch() {
  const { t, i18n } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [searchResult, setSearchResult] = useState<PreviousDraw | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [open, setOpen] = useState(false);

  const { mutate: searchByDate, isPending } = useSearchLotteryByDate();

  const handleSearch = () => {
    if (!selectedDate) return;

    searchByDate(selectedDate, {
      onSuccess: (result) => {
        setSearchResult(result);
        setHasSearched(true);
      },
      onError: () => {
        setSearchResult(null);
        setHasSearched(true);
      }
    });
  };

  const handleClear = () => {
    setSelectedDate(undefined);
    setSearchResult(null);
    setHasSearched(false);
  };

  // Format date based on language
  const formatDate = (date: Date) => {
    if (i18n.language === 'th') {
      const day = date.getDate();
      const month = date.getMonth();
      const year = date.getFullYear() + 543;
      const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 
                          'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
      return `${day} ${thaiMonths[month]} ${year}`;
    }
    return format(date, "PPP");
  };

  // Thai lottery draws are on 1st and 16th of each month
  const isDrawDay = (date: Date) => {
    const day = date.getDate();
    return day === 1 || day === 16;
  };

  // Disable future dates and non-draw days
  const disabledDays = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today || !isDrawDay(date);
  };

  return (
    <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.25s' }}>
      <div className="flex items-center gap-2">
        <Search className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">{t('historicalSearch.title')}</h2>
      </div>

      <Card className="border-border shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    formatDate(selectedDate)
                  ) : (
                    <span>{t('historicalSearch.selectDate')}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setOpen(false);
                  }}
                  disabled={disabledDays}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <div className="flex gap-2">
              <Button 
                onClick={handleSearch} 
                disabled={!selectedDate || isPending}
                className="flex-1 sm:flex-none"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                {t('historicalSearch.search')}
              </Button>
              
              {(selectedDate || hasSearched) && (
                <Button 
                  variant="outline" 
                  onClick={handleClear}
                  className="flex-1 sm:flex-none"
                >
                  <X className="h-4 w-4 mr-2" />
                  {t('historicalSearch.clear')}
                </Button>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            {t('historicalSearch.hint')}
          </p>

          {/* Search Result */}
          {hasSearched && (
            <div className="mt-4 pt-4 border-t border-border">
              {searchResult ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{searchResult.drawDate}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* 1st Prize */}
                    <div className="col-span-2 md:col-span-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                        <span className="text-xs font-medium text-muted-foreground">{t('firstPrize.title')}</span>
                      </div>
                      <span className="lottery-number text-xl md:text-2xl font-bold text-primary">
                        {searchResult.firstPrize}
                      </span>
                    </div>
                    
                    {/* Front 3 */}
                    <div>
                      <span className="text-xs font-medium text-muted-foreground block mb-1">{t('previousDraws.front3')}</span>
                      <div className="flex gap-1.5">
                        {[...searchResult.front3].reverse().map((num, nIdx) => (
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
                        {searchResult.last3.map((num, nIdx) => (
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
                        {searchResult.last2}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p>{t('historicalSearch.noResults')}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
