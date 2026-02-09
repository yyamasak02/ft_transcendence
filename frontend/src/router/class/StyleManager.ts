export class StyleManager {
  private current?: HTMLLinkElement;

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
}
