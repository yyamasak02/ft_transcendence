export interface Routes {
  [path: string]: {
    linkLabel?: string;
    content: string;
    onMount?: () => void;
    onUnmount?: () => void;
    head?: { title: string };
  };
}
