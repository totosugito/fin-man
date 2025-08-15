import {format as formatDateFns, parseISO} from "date-fns";

export function convertOklchToRgbaStringFromString(oklchString: string, alpha = 1) {
  const match = oklchString.match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/i);
  if (!match) throw new Error('Invalid OKLCH format');

  const l = parseFloat(match[1]);
  const c = parseFloat(match[2]);
  const h = parseFloat(match[3]);

  return convertOklchToRgbaString(l, c, h, alpha);
}

export function convertOklchToRgbaString(l: number, c: number, h: number, alpha: number) {
  // 1. Convert OKLCH to OKLab
  const hRad = (h / 180) * Math.PI;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  // 2. Convert OKLab to linear sRGB
  const L = l;
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l3 = l_ ** 3;
  const m3 = m_ ** 3;
  const s3 = s_ ** 3;

  const r_lin = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const g_lin = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const b_lin = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

  // 3. Apply gamma correction (linear to sRGB)
  const gammaCorrect = (c: number) => {
    const v = Math.max(0, Math.min(1, c)); // Clamp
    return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  };

  const red = Math.round(gammaCorrect(r_lin) * 255);
  const green = Math.round(gammaCorrect(g_lin) * 255);
  const blue = Math.round(gammaCorrect(b_lin) * 255);

  if (alpha < 0) {
    return `rgb(${red}, ${green}, ${blue})`;
  }
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function hexToRGBA(hex: string, alpha = 0.3) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  if (alpha < 0) {
    return `rgb(${r}, ${g}, ${b})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const getShadcnColor = (color: string) => {
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  return computedStyle.getPropertyValue(color).trim() || '#000';
}

export const getShadcnRgbaColor = (color: any, alpha = 0.3) => {
  let tmpColor = getShadcnColor(color);
  if (tmpColor.startsWith('oklch')) {
    return(convertOklchToRgbaStringFromString(tmpColor, alpha));
  }
  return hexToRGBA(tmpColor, alpha);
}

export function to_decimal_formatted(value: number, precision = 2) {
  const formattedNumber = new Intl.NumberFormat('en', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  }).format(value);
  return (formattedNumber);
}

export function to_decimal_compact({value, intl = "en", maximumFractionDigits = 2}:
                             {
                               value: number,
                               intl?: string,
                               maximumFractionDigits?: number
                             }) {
  try {
    const formatter = new Intl.NumberFormat(intl, {
      notation: "compact",
      maximumFractionDigits
    });

    return formatter.format(value);
  } catch (e) {
    return (value);
  }
}

export function string_gmt_to_date(value: string, format = "yyyy/MM/dd") {
  try {
    const dateObject = parseISO(value);
    // const dateObject = parseDateFns(value.substr(0, 16), 'yyyy-MM-dd HH:mm', new Date());
    return (formatDateFns(dateObject, format));
  } catch (e) {
    return (formatDateFns(new Date(), format));
  }
}

export const string_to_date_yyyyMMMMdd = (localeId: string, dateString: string) => {
  if (!dateString) return null;

  const options: Record<string, any> = {
    // weekday: 'long',    // "Senin", "Selasa", etc.
    year: 'numeric',    // 2024
    month: 'long',      // "September"
    day: 'numeric'      // 19
  };

  const date = new Date(dateString)
  const formattedDate = date.toLocaleDateString(localeId, options)
  return `${formattedDate} `
}

export const date_to_string_yyyyMMdd = (date: Date, localeId: string) => {
  const options: Record<string, any> = {
    // weekday: 'long',    // "Senin", "Selasa", etc.
    year: 'numeric',    // 2024
    month: 'long',      // "September"
    day: 'numeric'      // 19
  };
  const formattedDate = date.toLocaleDateString(localeId, options)
  return `${formattedDate} `
}
export function date_to_string(value: Date, format = "yyyy-MM-dd") {
  try {
    return (formatDateFns(value, format));
  } catch (e) {
    return (formatDateFns(new Date(), format));
  }
}

export const string_to_date = (value: string, format = "yyyy-MM-dd") => {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return new Date(); // or return null / throw an error, as needed
  }
  return date;
}

export const string_gmt_to_string = (value: string) => {
  if(!value) return '';
  const v = value.split('T');
  return (v?.[0] ?? "");
}

export const string_date_to_formatted = (value: string, format = "yyyy-MM-dd HH:mm") => {
  try {
    const date = new Date(value);
    const yyyy = date.getUTCFullYear();
    const MM = String(date.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(date.getUTCDate()).padStart(2, '0');
    const HH = String(date.getUTCHours()).padStart(2, '0');
    const mm = String(date.getUTCMinutes()).padStart(2, '0');

    const formattedUTC = `${yyyy}-${MM}-${dd} ${HH}:${mm}`;
    return(formattedUTC);
  } catch (e) {
    return (formatDateFns(new Date(), format));
  }
}

export function getShortName(fullName: string): string {
  if(!fullName) return '';

  const parts = fullName.trim().split(/\s+/);

  if (parts.length >= 2) {
    // Use first character of first two words
    return (parts[0][0] + parts[1][0]).toUpperCase();
  } else if (parts[0].length >= 2) {
    // Use first and second character if only one word
    return (parts[0][0] + parts[0][1]).toUpperCase();
  } else {
    // Fallback for very short names
    return parts[0][0].toUpperCase();
  }
}

export function excelDateToJSDate(serial: number) {
  const excelEpoch = Date.UTC(1900, 0, 1); // Excel "zero" date in UTC
  let daysOffset = serial - 1;

  // Adjust for Excel's leap year bug (dates after Feb 28, 1900)
  if (serial >= 60) {
    daysOffset--;
  }

  return new Date(excelEpoch + (daysOffset * 86400000)); // 86400000 ms in a day, result in UTC
}

export function isDateExpired(date: Date) {
  const now = new Date();
  return date < now;
}

interface DateDifferenceResult {
  days: number;
  labels: string;
  style: string;
}

export function getDaysFromCurrentDate(t: (key: string) => string, date: Date | string | number): DateDifferenceResult {
  // Ensure the input date is a valid Date object
  const inputDate = date instanceof Date ? date : new Date(date);

  if (isNaN(inputDate.getTime())) {
    return ({
      days: 0,
      labels: "",
      style: "",
    })
  }

  const currentDate = new Date();
  const differenceInMilliseconds = currentDate.getTime() - inputDate.getTime();
  const days = Math.floor(differenceInMilliseconds / (1000 * 60 * 60 * 24));

  let labels = "";
  if (days < 1) {
    labels = t("labels.today"); // today
  } else if (days < 7) {
    labels = `${days} ${t("labels.dayAgo")}`; // X days ago
  } else if (days < 30) {
    const weeks = Math.floor(days / 7);
    labels = `${weeks} ${t("labels.weekAgo")}`; // X weeks ago
  } else if (days < 365) {
    const months = Math.floor(days / 30);
    labels = `${months} ${t("labels.monthAgo")}`; // X months ago
  } else {
    const years = Math.floor(days / 365);
    labels = `${years} ${t("labels.yearAgo")}`; // X years ago
  }

  let style = 'text-foreground bg-green-100 border-green-500';
  if (days < 3) {

  }
  else if (days < 7) {
    style = 'text-foreground bg-yellow-100 border-yellow-500';
  }
  else if (days < 30) {
    style = 'text-foreground bg-orange-100 border-orange-500';
  }
  else {
    style = 'text-foreground bg-gray-100 border-gray-500';
  }
  return ({
    days: days,
    labels: labels,
    style: style,
  })
}

export const ObjToOptionList = (obj: Record<string, string>) => {
  return Object.keys(obj).map((key) => ({value: key, label: obj[key]}));
}