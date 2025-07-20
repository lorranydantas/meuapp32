# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 開発コマンド

- `pnpm dev` - Turbopackを使用した開発サーバーの起動
- `pnpm build` - 本番用アプリケーションのビルド
- `pnpm start` - 本番サーバーの起動

### データベースコマンド

- `pnpm db:setup` - データベース設定用の.envファイル作成
- `pnpm db:migrate` - データベースマイグレーションの実行
- `pnpm db:seed` - テストユーザーでのデータベースシード (test@test.com / admin123)
- `pnpm db:generate` - スキーマ変更からのデータベースマイグレーション生成
- `pnpm db:studio` - データベース管理用のDrizzle Studioを開く

## アーキテクチャ概要

これはApp RouterとServer Componentsを使用したマルチテナントチーム構造のNext.js SaaSスターターです。

### 主要なアーキテクチャパターン

**認証とセッション管理**
- HTTP-onlyクッキーに保存されるJWTベースのセッション (lib/auth/session.ts:40)
- ダッシュボードルートを保護するグローバルミドルウェア (middleware.ts:5)
- リクエスト毎の自動セッション更新 (middleware.ts:21-33)
- Server Actions用のカスタム検証ヘルパー (lib/auth/middleware.ts:17-29)

**データベース層**
- PostgreSQLを使用したDrizzle ORM
- マルチテナント設計：ユーザーはteam_membersテーブル経由でチームに所属
- 全ユーザーアクションの活動ログ記録 (lib/db/schema.ts:46-55)
- チームコラボレーション用の招待システム (lib/db/schema.ts:57-69)

**決済統合**
- チームを顧客とするStripe統合
- teamsテーブルに保存される購読データ (lib/db/schema.ts:27-32)
- 購読更新用のWebhook処理 (app/api/stripe/webhook/route.ts)

**ルート構造**
- `(dashboard)` - 認証が必要な保護されたルート
- `(login)` - 公開認証ページ
- `/api/stripe/*` - 決済WebhookとCheckout

### コアデータフロー

1. ユーザー登録 → ユーザーとチーム作成 → ダッシュボードへリダイレクト
2. チームオーナーがメンバー招待 → 招待レコード作成 → メール送信
3. 購読変更 → Stripe webhook → チームレコード更新
4. 全ユーザーアクション → 活動ログエントリ作成

### 開発セットアップ

1. `pnpm db:setup`で環境ファイル作成
2. `pnpm db:migrate && pnpm db:seed`でデータベースセットアップ
3. Stripeテスト用にテストカード使用：4242 4242 4242 4242

コードベースはNext.js App Routerパターンに従い、デフォルトでServer Componentsを使用し、インタラクティビティが必要な場合のみ'use client'を使用します。