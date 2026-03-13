# ミヤタステーション - オンラインサロン会員専用サイト

メール認証・Zoomイベント情報・デジタル会員証・週次フォーム（Googleスプレッドシート連携）を備えた会員専用サイトです。

## 機能

- **認証**: メールアドレス + パスワードでログイン（アカウントは管理者のみ発行可能）
- **イベント**: Zoomイベントのスケジュール表示、入室情報のワンクリックコピー
- **デジタル会員証**: 会員名・会員番号・QRコード表示、画像ダウンロード
- **週次フォーム**: テーマに沿った質問への回答、Googleスプレッドシートへ自動送信
- **管理画面**: アカウント発行・イベント・フォームテーマの追加・編集・削除（管理者のみ）

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabase のセットアップ

1. [Supabase](https://supabase.com) でプロジェクトを作成
2. プロジェクトの URL と anon key を取得
3. SQL Editor で `supabase/migrations/` 内のマイグレーションを**順番に**実行:
   - `20240302000000_initial_schema.sql`
   - `20240302100000_chat_schema.sql`
   - `20240303000000_site_config.sql`
   - `20240304000000_add_poster_role.sql`
   - `20240305000000_profile_onboarding.sql`
   - `20240306000000_birthday_celebrations.sql`
   - `20240307000000_profiles_select_authenticated.sql`
   - `20240308000000_user_section_views.sql`（NEW ラベル用・任意）
4. Authentication > Providers > Email で以下を設定:
   - Email を有効化（デフォルトで有効）
   - **「Enable email signup」をオフ** にし、一般ユーザーの自己登録を無効化

### 3. 環境変数

`.env.example` をコピーして `.env.local` を作成し、値を設定してください。

```bash
cp .env.example .env.local
```

| 変数名 | 説明 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | アカウント発行に必須（管理者のみ） |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Google サービスアカウントのメール |
| `GOOGLE_PRIVATE_KEY` | サービスアカウントの秘密鍵（改行は `\n` でエスケープ） |
| `GOOGLE_SPREADSHEET_ID` | スプレッドシート ID |

### 4. 管理者の設定

アカウントは管理者のみが発行できます。最初の管理者は次の手順で作成してください。

1. **Supabase ダッシュボード** > Authentication > Users > **Add user** で、管理者用のメールアドレス・パスワードでユーザーを作成
2. `handle_new_user` トリガーにより `profiles` が自動作成される
3. 以下のいずれかで `role` を `admin` に更新:
   - SQL: `UPDATE public.profiles SET role = 'admin' WHERE email = 'your-admin@email.com';`
   - または `node scripts/set-admin-supabase.js` を実行（スクリプト内の `ADMIN_EMAIL` を変更）

### 5. Google スプレッドシート連携（任意）

週次フォームの回答をスプレッドシートに送信する場合:

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成
2. Google Sheets API を有効化
3. サービスアカウントを作成し、JSON キーをダウンロード
4. 対象スプレッドシートをサービスアカウントのメールアドレスに「編集者」で共有
5. スプレッドシートに「フォーム回答」という名前のシートを作成（1行目にヘッダーを推奨）

### 6. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアクセスできます。

## デプロイ

Vercel へのデプロイを推奨します。

### 1. リポジトリを GitHub にプッシュ

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Vercel でプロジェクトをインポート

1. [Vercel](https://vercel.com) にログイン（GitHub アカウントで連携が簡単）
2. **Add New** → **Project** をクリック
3. 対象の GitHub リポジトリを選択して **Import**
4. Framework Preset は **Next.js** のまま（自動検出されます）

### 3. 環境変数の設定

Vercel のプロジェクト設定で、以下の環境変数を追加してください。

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `NEXT_PUBLIC_SITE_URL` | 本番サイトURL（OGP画像用。例: `https://miyata-station.com`） | カスタムドメイン使用時 |
| `NEXT_PUBLIC_FB_APP_ID` | Facebook App ID（OGPのfb:app_id用） | Facebookシェア最適化時 |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | アカウント発行に必須 | ✅ |
| `NEXT_PUBLIC_GOOGLE_FORM_URL` | 各種フォームの Google フォーム URL | 任意 |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | 週次フォーム用サービスアカウント | 週次フォーム使用時 |
| `GOOGLE_PRIVATE_KEY` | サービスアカウントの秘密鍵 | 週次フォーム使用時 |
| `GOOGLE_SPREADSHEET_ID` | スプレッドシート ID | 週次フォーム使用時 |

> **注意**: `GOOGLE_PRIVATE_KEY` は改行を `\n` でエスケープした 1 行の文字列で設定してください。

### 4. Supabase の URL 設定

デプロイ後、Supabase で本番 URL を許可する必要があります。

1. **Supabase ダッシュボード** → **Authentication** → **URL Configuration**
2. **Site URL** に Vercel の本番 URL を設定（例: `https://miyatastation.vercel.app`）
3. **Redirect URLs** に以下を追加:
   - `https://あなたのドメイン.vercel.app/**`
   - `https://あなたのドメイン.vercel.app/auth/callback`（認証コールバック用）
   - `https://あなたのドメイン.vercel.app/auth/callback`（認証コールバック・パスワードリセット用）
   - `https://あなたのドメイン.vercel.app/login/update-password`（パスワードリセット用）

### 5. デプロイ実行

**Deploy** をクリックするとビルドが開始されます。完了後、表示された URL でサイトにアクセスできます。

### 6. カスタムドメイン（任意）

Vercel のプロジェクト設定 → **Domains** から、独自ドメインを追加できます。

## ディレクトリ構成

```
src/
├── app/
│   ├── (auth)/           # ログイン・会員登録
│   ├── (member)/         # 会員専用ページ
│   │   ├── dashboard/
│   │   ├── events/
│   │   ├── member-card/
│   │   ├── forms/
│   │   └── admin/
│   └── api/              # API Routes
├── components/
├── lib/
└── types/
```
