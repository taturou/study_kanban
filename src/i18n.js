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
};

let state = null;

export function initI18n(force = false) {
  if (state && !force) {
    return state;
  }

  state = {
    language: I18N_LANG,
    options: {
      supportedLngs: [I18N_LANG],
      fallbackLng: I18N_LANG,
      resources,
    },
  };

  return state;
}

export function t(key) {
  const segments = key.split(".");
  let current = resources[I18N_LANG];
  for (const segment of segments) {
    if (current && Object.prototype.hasOwnProperty.call(current, segment)) {
      current = current[segment];
    } else {
      current = undefined;
      break;
    }
  }
  if (typeof current === "string") {
    return current;
  }
  throw new Error(`Missing translation: ${key}`);
}

export function setLanguage(lang) {
  if (lang !== I18N_LANG) {
    throw new Error("Language is fixed to ja-JP");
  }
  if (!state) {
    initI18n();
  }
  state.language = I18N_LANG;
  return state.language;
}
