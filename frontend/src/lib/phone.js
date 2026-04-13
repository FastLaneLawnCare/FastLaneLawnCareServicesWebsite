export const formatPhoneNumber = (value) => {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 10);
  if (digits.length === 0) return '';
  if (digits.length < 4) return `(${digits}`;
  if (digits.length < 7) return `(${digits.slice(0, 3)})-${digits.slice(3)}`;
  return `(${digits.slice(0, 3)})-${digits.slice(3, 6)}-${digits.slice(6)}`;
};

export const formatPhoneNumberForDisplay = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 10) return formatPhoneNumber(digits);
  return value || '';
};
