export interface LotteryResult {
  drawDate: string;
  drawTime: string;
  isLatest: boolean;
  status: 'waiting' | 'updated';
  firstPrize: string;
  front3: string[];
  last3: string[];
  last2: string;
  prizes: Prize[];
  fetchedAt?: string;
}

export interface Prize {
  id?: string;
  name: string;
  numbers: string[];
  amount: string;
}

export interface PreviousDraw {
  drawDate: string;
  firstPrize: string;
  front3: string[];
  last3: string[];
  last2: string;
  prizes?: Prize[];
}
