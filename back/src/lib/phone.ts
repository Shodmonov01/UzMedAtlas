export const DIAL_CODES = [
  { country: "Kazakhstan", dial: "+7" },
  { country: "Kyrgyzstan", dial: "+996" },
  { country: "Tajikistan", dial: "+992" },
  { country: "Turkmenistan", dial: "+993" },
  { country: "Russia", dial: "+7" },
  { country: "Turkey", dial: "+90" },
  { country: "United Arab Emirates", dial: "+971" },
  { country: "India", dial: "+91" },
  { country: "China", dial: "+86" },
  { country: "South Korea", dial: "+82" },
  { country: "Germany", dial: "+49" },
  { country: "United Kingdom", dial: "+44" },
  { country: "United States", dial: "+1" },
  { country: "Uzbekistan", dial: "+998" },
  { country: "Other", dial: "+" },
] as const;

export function combinePhone(dial: string, national: string) {
  const digits = national.replace(/[^\d]/g, "");
  const prefix = dial.replace(/[^\d+]/g, "") || "+";
  return `${prefix}${digits}`;
}

export function whatsappLink(phone: string) {
  const digits = phone.replace(/[^\d]/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

export function telegramLink(usernameOrPhone: string) {
  if (usernameOrPhone.startsWith("@") || /^[a-zA-Z]/.test(usernameOrPhone)) {
    return `https://t.me/${usernameOrPhone.replace(/^@/, "")}`;
  }
  const digits = usernameOrPhone.replace(/[^\d]/g, "");
  return digits ? `https://t.me/+${digits}` : null;
}
