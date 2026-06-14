// search data shape
export interface SearchData {
  fromCity: string;
  toCity: string;
  travelDate: string;
  travelDateLabel: string;
}

// quick helper for setting future dates
function getFutureDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Test route (ahmedabad to mumbai)
export const defaultSearchData: SearchData = {
  fromCity: 'Ahmedabad',
  toCity: 'Mumbai',
  travelDate: '18 Jul 2026',
  travelDateLabel: '18 Jul 2026',
};

// other route to test
export const alternateSearchData: SearchData = {
  fromCity: 'Surat',
  toCity: 'Pune',
  travelDate: getFutureDate(7),
  travelDateLabel: getFutureDate(7),
};
