# Icon Studio

VSCodeライクなアイコン制作用IDE

## 機能

- VSCodeスタイルのUI
- ファイルエクスプローラー
- ツールパレット
- キャンバスエディター
- ズーム機能

## セットアップ

```bash
# 依存関係のインストール
npm install

# 開発モードで起動
npm run dev

# ビルド
npm run build

# パッケージング
npm run package
```

## 技術スタック

- Electron
- TypeScript
- React
- Webpack

## 開発

- `src/main.ts` - Electronメインプロセス
- `src/renderer.tsx` - Reactレンダラーエントリーポイント
- `src/components/` - Reactコンポーネント
- `src/styles/` - CSSスタイル

## ライセンス

MIT