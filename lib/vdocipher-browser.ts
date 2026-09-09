/** A presentation guard for Safari while FairPlay is unavailable, not a DRM capability check. */
export function isUnsupportedVdoCipherBrowser(userAgent: string): boolean {
  // iPadOS can identify as Macintosh in desktop mode, so do not rely on an iPad token.
  const isAppleDevice = /Macintosh|Mac OS X|iPhone|iPad|iPod/i.test(userAgent);
  const isSafari = /AppleWebKit\//i.test(userAgent) && /Version\//i.test(userAgent) && /Safari\//i.test(userAgent);
  // Chromium (including desktop Brave) and other iOS browsers also contain Safari.
  const isOtherBrowser = /(?:Chrome|Chromium|CriOS|Firefox|FxiOS|Edg|Edge|EdgiOS|EdgA|OPR|Opera|OPiOS|Brave)\//i.test(userAgent);
  return isAppleDevice && isSafari && !isOtherBrowser;
}
