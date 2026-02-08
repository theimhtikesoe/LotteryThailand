import { useTranslation } from 'react-i18next';

interface QuickResultsProps {
  front3: string[];
  last3: string[];
  last2: string;
  isWaiting?: boolean;
}

export function QuickResults({ front3, last3, last2, isWaiting = false }: QuickResultsProps) {
  const { t } = useTranslation();
  // Reverse front3 only to match official lottery display format (694 347 not 347 694)
  const displayFront3 = isWaiting ? ['XXX', 'XXX'] : [...front3].reverse();
  const displayLast3 = isWaiting ? ['XXX', 'XXX'] : last3;
  const displayLast2 = isWaiting ? 'XX' : last2;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
      <ResultCard title={t('quickResults.front3')} numbers={displayFront3} prize={`฿4,000 ${t('quickResults.each')}`} isWaiting={isWaiting} />
      <ResultCard title={t('quickResults.last3')} numbers={displayLast3} prize={`฿4,000 ${t('quickResults.each')}`} isWaiting={isWaiting} />
      <ResultCard title={t('quickResults.last2')} numbers={[displayLast2]} prize="฿2,000" single isWaiting={isWaiting} />
    </div>
  );
}

function ResultCard({ 
  title, 
  numbers, 
  prize, 
  single = false,
  isWaiting = false
}: { 
  title: string; 
  numbers: string[]; 
  prize: string;
  single?: boolean;
  isWaiting?: boolean;
}) {
  return (
    <div className="bg-card rounded-lg p-5 shadow-card border border-border">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">{title}</h3>
      <div className={single ? 'text-center' : 'flex justify-center gap-4'}>
        {numbers.map((num, idx) => (
          <span 
            key={idx} 
            className={`lottery-number ${single ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl'} ${isWaiting ? 'text-muted-foreground/50' : 'text-foreground'}`}
          >
            {num}
          </span>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-3 text-center">{prize}</p>
    </div>
  );
}