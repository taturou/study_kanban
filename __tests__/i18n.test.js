import assert from "node:assert/strict";
import { test, beforeEach } from "node:test";

// 実装前提: src/i18n.js で初期化関数と固定言語の制御を提供する
import { initI18n, t, setLanguage, I18N_LANG } from "../src/i18n.js";

beforeEach(async () => {
  // 各テストの独立性を保つため再初期化
  await initI18n(true);
});

test("デフォルト言語が ja-JP で、サポート言語も ja-JP のみ", async () => {
  const i18n = await initI18n();
  assert.equal(i18n.language, I18N_LANG);
  assert.deepEqual(i18n.options.supportedLngs, [I18N_LANG]);
  assert.equal(i18n.options.fallbackLng, I18N_LANG);
});

test("定義済みの UI 文字列を i18n ライブラリ経由で取得できる", async () => {
  await initI18n();
  assert.equal(t("common.appTitle"), "学習計画カンバン");
  assert.equal(t("common.status.backlog"), "Backlog");
});

test("ja-JP 以外の言語切替を拒否する", async () => {
  await initI18n();
  assert.throws(() => setLanguage("en-US"), /ja-JP/);
  // 同一言語は許可される
  assert.doesNotThrow(() => setLanguage(I18N_LANG));
});
