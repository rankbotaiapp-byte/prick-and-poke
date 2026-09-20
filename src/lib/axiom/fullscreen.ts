export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const media = window.matchMedia("(display-mode: standalone), (display-mode: fullscreen)").matches;
  const apple = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return media || apple || Boolean(document.fullscreenElement);
}

export async function enterFullscreen(): Promise<boolean> {
  const node = document.documentElement;
  const anyNode = node as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
    webkitRequestFullScreen?: () => Promise<void> | void;
  };
  try {
    if (document.fullscreenElement) return true;
    if (node.requestFullscreen) {
      await node.requestFullscreen({ navigationUI: "hide" } as FullscreenOptions);
      return true;
    }
    if (anyNode.webkitRequestFullscreen) {
      await anyNode.webkitRequestFullscreen();
      return true;
    }
    if (anyNode.webkitRequestFullScreen) {
      await anyNode.webkitRequestFullScreen();
      return true;
    }
  } catch {
    return false;
  }
  return false;
}
