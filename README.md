# Clovia High Creative PM Prototype

フロントエンドのみのNext.jsプロトタイプです。案件管理、画像ごとの要件整理、チェック画面をダミーデータで確認できます。

## Run

```bash
npm install
npm run dev
```

## Deploy to Vercel

1. このディレクトリをGitHubリポジトリへpush
2. VercelでNew Projectを作成
3. Framework PresetはNext.jsを選択
4. Build Commandは`npm run build`
5. Output Directoryは未指定

## Notes

- バックエンド、DB、認証、実ファイルアップロードは未実装です。
- 画面検証用に、案件・画像・コメント・進捗は`app/page.tsx`内のダミーデータで管理しています。
