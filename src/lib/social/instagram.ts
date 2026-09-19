export const INSTAGRAM_CREATE_STYLE_PATH = "/create/style/";

export function instagramComposerUrl() {
  return `https://www.instagram.com/accounts/login/?next=${encodeURIComponent(INSTAGRAM_CREATE_STYLE_PATH)}`;
}

export function instagramAppCameraUrl() {
  return "instagram://camera";
}

export function isMobileUserAgent(userAgent: string) {
  return /iPhone|iPad|iPod|Android/i.test(userAgent);
}

export function openInstagramComposer() {
  const web = instagramComposerUrl();
  if (typeof window === "undefined") return web;

  if (isMobileUserAgent(window.navigator.userAgent)) {
    const started = Date.now();
    window.location.href = instagramAppCameraUrl();
    window.setTimeout(() => {
      if (Date.now() - started < 1800) {
        window.open(web, "_blank", "noopener,noreferrer");
      }
    }, 700);
    return web;
  }

  window.open(web, "_blank", "noopener,noreferrer");
  return web;
}
