const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];
const TENS = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

function twoDigits(n) {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return `${TENS[t]}${o ? ` ${ONES[o]}` : ''}`.trim();
}

function threeDigits(n) {
  if (n < 100) return twoDigits(n);
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return `${ONES[h]} Hundred${rest ? ` ${twoDigits(rest)}` : ''}`.trim();
}

function chunkToWords(n, scale) {
  if (!n) return '';
  return `${threeDigits(n)} ${scale}`.trim();
}

/** Whole rupees only (paise rounded). */
export function amountInWordsInr(amount) {
  const n = Math.round(Math.max(0, Number(amount) || 0));
  if (n === 0) return 'Zero Rupees';

  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;

  const parts = [
    chunkToWords(crore, 'Crore'),
    chunkToWords(lakh, 'Lakh'),
    chunkToWords(thousand, 'Thousand'),
    rest ? threeDigits(rest) : '',
  ].filter(Boolean);

  return `${parts.join(' ')} Rupees`;
}
