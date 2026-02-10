import { langManager } from "@/i18n";
import { router } from "@/router";
import "@/style.css";

router.init();
langManager.initDomBindings();

// MutationObserverのメモリリーク対策
window.addEventListener("pagehide", () => langManager.dispose());
window.addEventListener("beforeunload", () => langManager.dispose());
