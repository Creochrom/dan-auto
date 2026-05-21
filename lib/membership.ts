export const MOT_BOOKING_DEPOSIT_GBP = 10;
export const PREMIUM_MEMBERSHIP_FROM = "£0.99/month";

const MEMBER_STORAGE_KEY = "dan-auto-vip-member";

export function readMemberStatus(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MEMBER_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMemberStatus(isMember: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (isMember) {
      window.localStorage.setItem(MEMBER_STORAGE_KEY, "1");
    } else {
      window.localStorage.removeItem(MEMBER_STORAGE_KEY);
    }
  } catch {
    /* noop */
  }
}
