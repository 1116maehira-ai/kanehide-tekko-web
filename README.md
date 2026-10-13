# 金秀鉄工 Webサイト

- `publish/`: GitHub Pages公開データ
- `source-original/`: 元ソース
- `data-backup/`: 記事バックアップ
- `tools/`: 書き出し・SEO・フォーム設定
- `README.html`: 詳細な説明

## 公開

Settings → Pages → Source は GitHub Actions。公開対象は `publish/` です。

大容量の社員インタビュー動画は `asset-parts/` に分割して保存しています。公開ワークフローが自動復元し、SHA-256を照合します。

## ローカル確認

```sh
python3 tools/restore-assets.py
python3 -m http.server 8000 --directory publish
```

http://localhost:8000 を開いてください。

## お問い合わせ

元サイトの `/api/contact` と、元の `CONTACT_FORM_ENDPOINT` に設定済みのGoogle Apps Scriptを再利用します。送信APIは既存Sitesサーバー上で実行し、GitHub Pagesから接続します。新しいフォームサービスや有料契約は使用しません。実際の受信は未確認です。メールの受信先はGoogle Apps Script側で管理するため、テスト用Gmailの追加にはその設定確認が必要です。[接続の説明](tools/contact-setup.md)を参照してください。

## 残る開発

CMS・データベース開発は待機しています。記事バックアップは21件で、旧サイトの全記事本文の完全移行は未完了です。SEOの正規URLは `https://kanehide-tekko.co.jp` です。
