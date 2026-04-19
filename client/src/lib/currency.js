// Format number to Rupiah display: 14700000 → "14.700.000"
export function formatRupiah(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return Number(num).toLocaleString('id-ID');
}

// Format with Rp prefix: 14700000 → "Rp 14.700.000"
export function formatRp(num) {
  return `Rp ${formatRupiah(num)}`;
}

// Parse formatted string back to number: "14.700.000" → 14700000
export function parseRupiah(str) {
  if (typeof str === 'number') return str;
  return Number(String(str).replace(/\./g, '').replace(/,/g, '.').replace(/[^0-9.-]/g, '')) || 0;
}
