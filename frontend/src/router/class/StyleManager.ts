export class StyleManager {
	// private global?: HTMLLinkElement; // Tailwind用
  private current?: HTMLLinkElement;

	// Tailwind用に追加
	// mountGlobal(cssPath: string) {
	// 	// 1回だけ常駐
	// 	if (this.global) return;
	// 	const link = document.createElement("link");
	// 	link.rel = "stylesheet";
	// 	link.href = cssPath;
	// 	link.setAttribute("data-global-style", cssPath);
	// 	document.head.appendChild(link);
	// 	this.global = link;
	// }

  async mount(cssPath: string) {
    if (this.current?.getAttribute("href") === cssPath) return;
    this.unmount();
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssPath;
    link.setAttribute("data-route-style", cssPath);
    const loaded = new Promise<void>((resolve, reject) => {
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load css: ${cssPath}`));
    });
    document.head.appendChild(link);
    await loaded;
    this.current = link;
  }

  unmount() {
    this.current?.remove();
    this.current = undefined;
  }

	// Tailwind用に追加
	// unmountAll() {
	// 	this.unmount();
	// 	this.global?.remove();
	// 	this.global = undefined;
	// }	
}
