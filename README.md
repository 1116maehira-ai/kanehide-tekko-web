# 金秀鉄工 Webサイト

ローカルで確認済みの静的公開データと元ソースを格納しています。

- `publish/`: GitHub Pagesで公開するサイト
- `source-original/`: 元ソース
- `data-backup/`: 記事データのバックアップ
- `tools/`: 静的書き出し・SEO設定
- `README.html`: 詳細な説明

## 公開

Settings → Pages → Build and deployment → Source を **GitHub Actions** に設定してください。公開ワークフローは `.github/workflows/pages.yml` です。公開するディレクトリは `publish/` です。

大容量の社員インタビュー動画は `asset-parts/` に分割して保存し、公開ワークフローが自動復元します。復元時にSHA-256を照合します。画質・内容は元動画と同一です。

## ローカル確認

リポジトリをダウンロードまたはcloneしたら、最初に以下を実行してください。

```sh
python3 tools/restore-assets.py
python3 -m http.server 8000 --directory publish
```

ブラウザで http://localhost:8000 を開いてください。先にお渡ししたZIPは復元済みのため、この復元手順は不要です。

## 現在の状態

お問い合わせはFormSubmitへPOSTする方式です。主宛先での初回認証と4名の受信確認は未実施です。運用開始前の手順は [tools/contact-setup.md](tools/contact-setup.md) を参照してください。CMS・データベース開発は引き続き待機しています。記事バックアップは21件で、旧サイトの全記事本文の完全移行は未完了です。SEOの正規URLは今後接続する `https://kanehide-tekko.co.jp` を設定しています。
