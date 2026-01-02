export const loadGsi = () =>
  new Promise<typeof globalThis.google | null>((resolve, reject) => {
    if (globalThis.google?.accounts?.id) {
      resolve(globalThis.google);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(globalThis.google ?? null);
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
