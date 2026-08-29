export function formatNumber(num) {
  if (num === null || num === undefined) return "0";
  return new Intl.NumberFormat("id-ID").format(num);
}

export function formatPercent(num) {
  if (num === null || num === undefined) return "0%";
  return `${Number(num).toFixed(1)}%`;
}

export function truncateText(str, maxLength = 100) {
  if (!str) return "";
  return str.length > maxLength ? `${str.substring(0, maxLength)}...` : str;
}
