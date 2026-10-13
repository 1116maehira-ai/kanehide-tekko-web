# 元サイトの送信方法へ復帰

GitHubのフォーム → 元サイトの /api/contact → 元のGoogle Apps Script、という経路です。送信先URLは元サイトのCONTACT_FORM_ENDPOINT設定を引き継ぎ、ブラウザには公開しません。新しいメールサービスへの契約や課金は行っていません。

## 現状

公開フォームには元のAPIを接続します。Google Apps Scriptの内部コードと実際の受信は未確認です。宛先はGoogle Apps Script側の設定で決まります。前平さんのGmailを追加するには、元のGoogle Apps Scriptのコードまたは設定を確認する必要があります。フロントのCC設定だけで追加済みとは扱いません。

## 運用開始前

1. 元のGoogle Apps Scriptの宛先設定を確認する（先方4名とテスト確認用Gmail）。
2. 許可を得たテスト送信で実際の受信を確認する。
3. 公式ドメイン接続後もフォーム送信と受信を確認する。

## 構成

- `publish/site-config.js`: 元の送信APIのURL
- `source-original/app/api/contact/route.ts`: 元のAPI。GitHub Pagesでは実行せず、既存のSites上で実行します。
- `tools/configure-contact.mjs`: 公開フォームの生成設定

送信APIはGitHub PagesのOriginと公式ドメインを許可しています。Google Apps Scriptから完了を確認できるJSON応答が返らなければ成功表示しません。秘密鍵・認証トークンを公開コードに格納しません。表示のデザインは保持します。
