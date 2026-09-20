import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type PromptEvent = Event & { prompt: () => Promise<void> };

export function InstallHome() {
  const [promptEvent, setPromptEvent] = useState<PromptEvent | null>(null);
  const [standalone, setStandalone] = useState(false);
  const ios =
    typeof navigator !== "undefined" &&
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !("MSStream" in window);

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const nav = window.navigator as Navigator & { standalone?: boolean };
    setStandalone(media.matches || nav.standalone === true);

    function onPrompt(event: Event) {
      event.preventDefault();
      setPromptEvent(event as PromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (standalone) return null;

  async function install() {
    if (promptEvent) {
      await promptEvent.prompt();
      setPromptEvent(null);
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set("install", "1");
    url.searchParams.set("platform", "ios");
    window.location.assign(url.toString());
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-3">
        <img src="/icon-halo.svg" alt="" className="size-12 rounded-[14px]" />
        <div className="min-w-0">
          <p className="text-sm font-medium">Keep Axiom on the home screen</p>
          <p className="mt-0.5 text-xs text-subtle">
            {ios
              ? "Share → Add to Home Screen. The neon ring is the mark."
              : "Install the app. The halo icon sits with your other tools."}
          </p>
        </div>
      </div>
      <Button className="mt-3 w-full" variant="secondary" onClick={() => void install()}>
        {promptEvent ? "Add to home screen" : ios ? "How to add" : "Add to home screen"}
      </Button>
    </div>
  );
}
