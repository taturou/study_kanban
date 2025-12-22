import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export const I18N_LANG = "ja-JP";

const resources = {
  [I18N_LANG]: {
    common: {
      appTitle: "学習計画カンバン",
      status: {
        backlog: "Backlog",
        today: "Today",
        inPro: "InPro",
        onHold: "OnHold",
        done: "Done",
        wontFix: "WontFix",
      },
      actions: {
        addTask: "タスクを追加",
        editTask: "タスクを編集",
      },
    },
  },
} as const;

export async function initI18n(force = false) {
  if (!i18n.isInitialized || force) {
    await i18n.use(initReactI18next).init({
      lng: I18N_LANG,
      fallbackLng: I18N_LANG,
      supportedLngs: [I18N_LANG],
      ns: ["common"],
      defaultNS: "common",
      resources,
      interpolation: { escapeValue: false },
    });
  }
  return i18n;
}

export function t(key: string) {
  const [maybeNs, ...rest] = key.split(".");
  if (rest.length > 0) {
    return i18n.t(rest.join("."), { ns: maybeNs });
  }
  return i18n.t(key);
}

export function setLanguage(lang: string) {
  if (lang !== I18N_LANG) {
    throw new Error("Language is fixed to ja-JP");
  }
  void i18n.changeLanguage(I18N_LANG);
  return I18N_LANG;
}
