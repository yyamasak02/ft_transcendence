import type { I18nKey } from "@/i18n/lang";

export type NavItem = {
  path: string;
  labelKey?: I18nKey;
  label?: string;
};
