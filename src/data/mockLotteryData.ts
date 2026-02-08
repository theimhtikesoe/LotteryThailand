import { LotteryResult, PreviousDraw } from '@/types/lottery';

export const currentResult: LotteryResult = {
  drawDate: '1 January 2026',
  drawTime: '15:00',
  isLatest: true,
  status: 'updated',
  firstPrize: '835492',
  front3: ['583', '142'],
  last3: ['927', '456'],
  last2: '81',
  prizes: [
    { name: '1st Prize', numbers: ['835492'], amount: '6,000,000' },
    { name: '2nd Prize', numbers: ['247891', '536284', '891234', '427156', '983271'], amount: '200,000' },
    { name: '3rd Prize', numbers: ['528417', '934156', '162839', '847291', '516283', '729418', '384156', '941627', '215839', '638492'], amount: '80,000' },
    { name: '4th Prize', numbers: ['291847', '516293', '847162', '293847', '516283', '847291', '293516', '847162', '291516', '516847', '847293', '291847', '516283', '847162', '293516', '847291', '291516', '516847', '847293', '291847', '516283', '847162', '293516', '847291', '291516', '516847', '847293', '291847', '516283', '847162', '293516', '847291', '291516', '516847', '847293', '291847', '516283', '847162', '293516', '847291', '291516', '516847', '847293', '291847', '516283', '847162', '293516', '847291', '291516', '516847'], amount: '40,000' },
    { name: '5th Prize', numbers: ['183749', '284716', '918274', '472918', '829471', '394827', '182947', '928374', '472918', '829147', '394827', '182749', '928374', '472918', '829471', '394827', '182947', '928374', '472918', '829147', '394827', '182749', '928374', '472918', '829471', '394827', '182947', '928374', '472918', '829147', '394827', '182749', '928374', '472918', '829471', '394827', '182947', '928374', '472918', '829147', '394827', '182749', '928374', '472918', '829471', '394827', '182947', '928374', '472918', '829147', '394827', '182749', '928374', '472918', '829471', '394827', '182947', '928374', '472918', '829147', '394827', '182749', '928374', '472918', '829471', '394827', '182947', '928374', '472918', '829147', '394827', '182749', '928374', '472918', '829471', '394827', '182947', '928374', '472918', '829147', '394827', '182749', '928374', '472918', '829471', '394827', '182947', '928374', '472918', '829147', '394827', '182749', '928374', '472918', '829471', '394827', '182947', '928374', '472918', '829147'], amount: '20,000' },
  ],
};

export const previousDraws: PreviousDraw[] = [
  {
    drawDate: '16 December 2025',
    firstPrize: '472918',
    front3: ['294', '817'],
    last3: ['639', '182'],
    last2: '47',
  },
  {
    drawDate: '1 December 2025',
    firstPrize: '918274',
    front3: ['715', '392'],
    last3: ['548', '291'],
    last2: '63',
  },
  {
    drawDate: '16 November 2025',
    firstPrize: '629184',
    front3: ['183', '529'],
    last3: ['716', '394'],
    last2: '28',
  },
  {
    drawDate: '1 November 2025',
    firstPrize: '384729',
    front3: ['492', '718'],
    last3: ['839', '472'],
    last2: '91',
  },
  {
    drawDate: '16 October 2025',
    firstPrize: '716293',
    front3: ['847', '291'],
    last3: ['628', '194'],
    last2: '54',
  },
];

export function getNextDrawDate(): Date {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let nextDraw: Date;

  if (currentDay < 1) {
    nextDraw = new Date(currentYear, currentMonth, 1, 15, 0, 0);
  } else if (currentDay < 16) {
    nextDraw = new Date(currentYear, currentMonth, 16, 15, 0, 0);
  } else {
    // Next month's 1st
    nextDraw = new Date(currentYear, currentMonth + 1, 1, 15, 0, 0);
  }

  // If we've passed today's draw, move to the next one
  if (nextDraw <= now) {
    if (nextDraw.getDate() === 1) {
      nextDraw = new Date(nextDraw.getFullYear(), nextDraw.getMonth(), 16, 15, 0, 0);
    } else {
      nextDraw = new Date(nextDraw.getFullYear(), nextDraw.getMonth() + 1, 1, 15, 0, 0);
    }
  }

  return nextDraw;
}
