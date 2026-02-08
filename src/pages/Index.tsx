import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StatusBadge } from '@/components/StatusBadge';
import { CountdownTimer } from '@/components/CountdownTimer';
import { FirstPrize } from '@/components/FirstPrize';
import { QuickResults } from '@/components/QuickResults';
import { PrizeTable } from '@/components/PrizeTable';
import { PreviousDraws } from '@/components/PreviousDraws';
import { NumberChecker } from '@/components/NumberChecker';
import { HistoricalSearch } from '@/components/HistoricalSearch';
import { useLatestLotteryResult, usePreviousDraws } from '@/hooks/useLotteryData';
import { Helmet } from 'react-helmet-async';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';

const LoadingSkeleton = () => (
  <div className="space-y-6">
    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-12 w-full md:w-80" />
    </div>
    <Skeleton className="h-48 w-full rounded-xl" />
    <div className="grid grid-cols-3 gap-4">
      <Skeleton className="h-32 rounded-lg" />
      <Skeleton className="h-32 rounded-lg" />
      <Skeleton className="h-32 rounded-lg" />
    </div>
    <Skeleton className="h-64 w-full rounded-lg" />
  </div>
);

const Index = () => {
  const { t } = useTranslation();
  const { data: currentResult, isLoading: isLoadingCurrent, error: currentError } = useLatestLotteryResult();
  const { data: previousDraws, isLoading: isLoadingPrevious } = usePreviousDraws(5);

  return (
    <>
      <Helmet>
        <title>Thai Lottery Live - Official Results & Real-Time Updates</title>
        <meta 
          name="description" 
          content="Check the latest Thai Government Lottery results instantly. Real-time updates for 1st prize, front 3 digits, last 3 digits, and last 2 digits. Trusted source for lottery results." 
        />
        <meta name="keywords" content="Thai lottery, lottery results, Thai government lottery, winning numbers, หวยรัฐบาล" />
        <link rel="canonical" href="https://thailotterylive.com" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Thai Lottery Live",
            "url": "https://thailotterylive.com",
            "description": "Official Thai Government Lottery results updated in real-time",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://thailotterylive.com/search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <main className="flex-1 container py-6 md:py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {isLoadingCurrent ? (
              <LoadingSkeleton />
            ) : currentError ? (
              <div className="text-center py-12">
                <p className="text-destructive text-lg mb-4">{t('errors.loadFailed')}</p>
                <p className="text-muted-foreground">{t('errors.tryAgain')}</p>
              </div>
            ) : currentResult ? (
              <>
                {/* Status & Countdown Row */}
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <StatusBadge status={currentResult.status} fetchedAt={currentResult.fetchedAt} />
                  <div className="w-full md:w-auto md:min-w-[320px]">
                    <CountdownTimer />
                  </div>
                </div>

                {/* First Prize */}
                <section aria-label="First Prize">
                  <FirstPrize 
                    number={currentResult.firstPrize} 
                    drawDate={currentResult.drawDate}
                    isWaiting={currentResult.status === 'waiting'}
                  />
                </section>

                {/* Quick Results */}
                <section aria-label="Quick Results">
                  <QuickResults 
                    front3={currentResult.front3}
                    last3={currentResult.last3}
                    last2={currentResult.last2}
                    isWaiting={currentResult.status === 'waiting'}
                  />
                </section>

                {/* Number Checker */}
                <section aria-label="Number Checker">
                  <NumberChecker result={currentResult} />
                </section>

                {/* Prize Table */}
                <section aria-label="Prize Breakdown">
                  <PrizeTable prizes={currentResult.prizes} />
                </section>

                {/* Historical Search */}
                <section aria-label="Historical Search">
                  <HistoricalSearch />
                </section>

                {/* Previous Draws */}
                <section aria-label="Previous Results">
                  {isLoadingPrevious ? (
                    <Skeleton className="h-48 w-full rounded-lg" />
                  ) : previousDraws && previousDraws.length > 0 ? (
                    <PreviousDraws draws={previousDraws} />
                  ) : null}
                </section>
              </>
            ) : null}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Index;
