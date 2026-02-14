# My SNS App

Supabase を利用したシンプルな SNS アプリです。

## 主な機能

- **認証**: 会員登録・ログイン・ログアウト
- **プロフィール**: 表示名・ユーザーID・自己紹介の編集
- **タイムライン**: 投稿の作成・表示
- **レスポンシブ**: スマホにも対応

## セットアップ

### 1. Supabase のテーブル作成

1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. プロジェクトを選択
3. **SQL Editor** を開く
4. `supabase-setup.sql` の内容をコピーして実行

### 2. アプリの起動

`index.html` をブラウザで開くか、ローカルサーバーで起動してください。

```bash
# VS Code Live Server や Python などで
python -m http.server 8000
```

## フォルダ構成

```
sns/
├── index.html        # メインHTML
├── style.css         # スタイル
├── app.js            # アプリケーションロジック
├── supabase-setup.sql # DB設定用SQL
└── README.md         # このファイル
```

## 注意事項

- Supabase の API キーは現在コード内に記載しています。本番環境では環境変数などで管理してください
- 認証メールの確認は Supabase の Authentication 設定で有効化できます
