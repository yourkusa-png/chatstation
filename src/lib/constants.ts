export const GENDERS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
  { value: "unspecified", label: "Prefer not to say" },
] as const;

export const COUNTRIES = [
  { value: "XX", label: "Not set" },
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
  { value: "IN", label: "India" },
  { value: "PK", label: "Pakistan" },
  { value: "BD", label: "Bangladesh" },
  { value: "PH", label: "Philippines" },
  { value: "ID", label: "Indonesia" },
  { value: "BR", label: "Brazil" },
  { value: "MX", label: "Mexico" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "ES", label: "Spain" },
  { value: "IT", label: "Italy" },
  { value: "NL", label: "Netherlands" },
  { value: "SE", label: "Sweden" },
  { value: "PL", label: "Poland" },
  { value: "TR", label: "Turkey" },
  { value: "EG", label: "Egypt" },
  { value: "NG", label: "Nigeria" },
  { value: "ZA", label: "South Africa" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "SA", label: "Saudi Arabia" },
  { value: "JP", label: "Japan" },
  { value: "KR", label: "South Korea" },
  { value: "CN", label: "China" },
  { value: "VN", label: "Vietnam" },
  { value: "TH", label: "Thailand" },
  { value: "RU", label: "Russia" },
  { value: "UA", label: "Ukraine" },
  { value: "AR", label: "Argentina" },
  { value: "CO", label: "Colombia" },
] as const;

export const REPORT_REASONS = [
  { value: "nudity", label: "Nudity or sexual content" },
  { value: "harassment", label: "Harassment or hate" },
  { value: "minor", label: "Appears to be a minor" },
  { value: "spam", label: "Spam or advertising" },
  { value: "other", label: "Something else" },
] as const;

export function countryLabel(code: string | null | undefined) {
  return COUNTRIES.find((c) => c.value === code)?.label ?? "Unknown";
}

export function genderLabel(value: string | null | undefined) {
  return GENDERS.find((g) => g.value === value)?.label ?? "Unspecified";
}
