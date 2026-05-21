export const en = {
  locale: "en",
  localeName: "English",
  translatePrompt: "View this site in your language?",
  translateAccept: "Switch language",
  translateDismiss: "Stay in English",
  translateBannerLead: "We detected your language as",
  translateBannerQuestion: "Would you like to translate the website?",
  translateBannerAccept: "Yes, translate",
  translateBannerDecline: "No thanks",
  returnToEnglish: "Return to English",
  plateScan: "Scan vehicle",
  plateScanning: "Scanning…",
  createAccount: "Create free account",
  accountCtaTitle: "Unlock your full vehicle report",
  accountCtaSubtitle:
    "Create a Dan Auto account to save your vehicle and unlock workshop intelligence.",
} as const;

export type Messages = {
  locale: "en" | "ru" | "pl" | "ro" | "uk";
  localeName: string;
  translatePrompt: string;
  translateAccept: string;
  translateDismiss: string;
  translateBannerLead: string;
  translateBannerQuestion: string;
  translateBannerAccept: string;
  translateBannerDecline: string;
  returnToEnglish: string;
  plateScan: string;
  plateScanning: string;
  createAccount: string;
  accountCtaTitle: string;
  accountCtaSubtitle: string;
};
