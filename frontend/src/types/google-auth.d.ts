export {};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            allowed_parent_origin?: string | string[];
          }) => void;

          renderButton: (
            parent: HTMLElement | null,
            options: {
              theme?: string;
              size?: string;
              type?: string;
              text?: string;
              shape?: string;
              logo_alignment?: string;
              width?: number;
            },
          ) => void;
        };
      };
    };
  }
}
