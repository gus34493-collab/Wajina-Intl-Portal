const SMALL_NUMBERS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];

const TENS = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
];

const SCALES = ["", "thousand", "million", "billion", "trillion"];

function convertHundreds(value: number): string {
  let words: string[] = [];

  if (value >= 100) {
    words.push(`${SMALL_NUMBERS[Math.floor(value / 100)]} hundred`);
    value = value % 100;
  }

  if (value >= 20) {
    words.push(TENS[Math.floor(value / 10)]);
    if (value % 10 !== 0) {
      words.push(SMALL_NUMBERS[value % 10]);
    }
  } else if (value > 0) {
    words.push(SMALL_NUMBERS[value]);
  }

  return words.join(" ");
}

export function numberToWords(value: number): string {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return "zero";
  }

  const wholeValue = Math.floor(Math.abs(value));
  if (wholeValue === 0) {
    return "zero";
  }

  const chunks: string[] = [];
  let remainder = wholeValue;
  let scaleIndex = 0;

  while (remainder > 0) {
    const chunk = remainder % 1000;
    if (chunk !== 0) {
      const chunkWords = convertHundreds(chunk);
      chunks.unshift(`${chunkWords}${SCALES[scaleIndex] ? ` ${SCALES[scaleIndex]}` : ""}`);
    }
    remainder = Math.floor(remainder / 1000);
    scaleIndex += 1;
  }

  const words = chunks.join(" ").replace(/\s+/g, " ").trim();
  return value < 0 ? `minus ${words}` : words;
}
