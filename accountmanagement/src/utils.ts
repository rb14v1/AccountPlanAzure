 
export const formatGBP = (n: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n);
 
export const validateTotals = (maintain: number, growth: number, total: number) => {
  const ok = Math.abs((maintain + growth) - total) < 0.0001;
  return { ok, message: ok ? 'Valid' : 'Maintain + Growth must equal Total' };
};
 
export const ragEmoji = (rag: 'Green' | 'Amber' | 'Red') =>
  rag === 'Green' ? '🟢' : rag === 'Amber' ? '🟡' : '🔴';
 
 