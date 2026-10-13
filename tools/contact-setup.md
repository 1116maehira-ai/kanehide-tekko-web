# お問い合わせフォームの接続

GitHub Pagesの静的フォームをFormSubmitへHTTPS POSTします。メールアプリの起動は不要です。サーバー側の認証画面はFormSubmitの標準reCAPTCHAを利用し、無効化していません。

## テスト中の受信先

- 主宛先: 1116maehira@gmail.com（前平さんが初回認証を実施）
- CC: shuya.sakihama@kanehide.co.jp / haruka.kiyuna@kanehide.co.jp / ya-miyagi@kanehide.co.jp / i-isiki@kanehide.co.jp

先方4名の受信先は残しています。テスト送信も先方へCCされます。本番では主宛先を先方に戻し、新しい主宛先で認証と受信確認を行います。

## 運用開始前の作業

1. 前平さんのGmailでFormSubmitの初回認証メールを承認する準備をする。
2. 公開フォームで、先方と調整したテストの内容を入力し送信する。認証画面を完了する。
3. 主宛先に届くFormSubmitの認証メールで承認する。迷惑メールも確認する。認証前のテスト内容が問い合わせとして配送されるとは扱わない。
4. 再度テスト送信し、受付ページへの遷移と先方4名と前平さんの計5名の受信を確認する。
5. 返信操作の宛先が入力者のメールアドレスになっているか確認する。
6. 公式ドメインへ接続後も、新URLで認証と受信を確認する。

本作業では実際のメール送信・受信テストと、受信者側の初回認証は実施していません。以上が終わるまで本番用として案内しないでください。

## 入力と挙動

必須入力・メール形式・同意を検証し、空白だけの入力を防ぎます。電話での回答を希望する場合は電話番号を必須とします。送信中の連打を防ぎ、送信画面へ進む前に入力を消しません。JavaScriptが無効でもHTMLフォームで送信できます。標準reCAPTCHAとハニーポットを利用します。受付ページはnoindexです。

このフォームは送信サービスから戻った際に受付を案内します。メール配送成功をサイト自身が検証しているわけではありません。APIキーは公開コードに含めません。CMSやSupabaseの構築は行っていません。

受信先を変更する場合は `tools/configure-contact.mjs` の recipients を変更して `node tools/configure-contact.mjs` を実行し、生成された公開ファイルもコミットしてください。`tools/build-export.mjs` を実行した場合もこの設定が適用されます。

公式資料: https://formsubmit.co/documentation / https://formsubmit.co/help
