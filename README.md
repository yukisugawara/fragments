# fragments

**エスノグラフィ（民族誌）のためのライティング環境 / A writing environment for ethnography**

🌐 **公開デモ**: <https://fragments-iota.vercel.app>


単一のウェブアプリで、**フィールドノート → つながり → コーディング → 民族誌**
という書くプロセスの4つのフェーズを循環的に往復できるツールです。
Obsidian 風の Markdown ノート、ネットワーク図、質的データ分析
（minimal-qda ベース）、Scrivener 風のバインダーを 1 つの空間に統合し、
理論に回収されない小さな断片も可視化して残す設計になっています。

> 社会学的な質的分析が「大きな理論の発見」を目指すのに対し、
> エスノグラフィは理論からこぼれる断片のなかに現場の厚みを見出します。
> 本アプリはその立場から設計されています。

## 4 つのフェーズ

| # | フェーズ | 役割 |
|---|---|---|
| 1 | **フィールドノート** (Fieldnotes) | Obsidian 風の Markdown エディタ。`[[リンク]]` / `![[埋め込み]]` / `![[image.png]]` / Callout / ハイライト / タグ / 脚注 |
| 2 | **つながり** (Links) | 断片間リンクをグラフ可視化（@xyflow/react） |
| 3 | **コーディング** (Coding) | 質的分析。テキスト断片と画像断片を同じカテゴリ体系でコーディング |
| 4 | **民族誌** (Ethnography) | バインダー／コルクボード／分割ビュー。Markdown・PDF で書き出し |

画面左上のフェーズ切替ボタン（1/2/3/4）でいつでも循環的に往復できます。

## 主な特徴

- **ローカルファースト**: データはすべてブラウザの localStorage に保存。
  サーバーへのアップロードは一切なし
- **Obsidian 流 Markdown** を Phase 1 プレビューで描画
  （`==ハイライト==` / `#タグ` / `%% コメント %%` / `> [!note]` Callout / `[^1]` 脚注 ほか）
- **画像埋め込み**: 断片にドラッグ＆ドロップ・ペースト・ボタンから画像を追加し、
  `![[image.png]]` で引用。Phase 3 では画像ファイルをバウンディングボックスで
  コーディング、Phase 4 の執筆・PDF 書き出しにも反映
- **プロジェクト保存 / 読み込み**: 4 フェーズまとめて `.fragments.json` に
  エクスポート可能

## 開発

```bash
npm install
npm run dev    # http://localhost:5173/
npm run build
npm run preview
```

### 技術スタック

React 19 + Vite + TypeScript + Zustand + Tailwind CSS 4.2 +
@xyflow/react + i18next + marked

## サンプル

「データ」メニュー → 「サンプルを読み込む」で、気候変動民族誌のサンプル
（46 断片・7 画像・26 コード・民族誌 1 本）を一括ロードできます。
**このサンプルは AI が生成した架空のデータ** で、実在の人物・場所とは関係ありません。

## 背景

本ツールは、Emerson, Fretz & Shaw *Writing Ethnographic Fieldnotes* (1995) の
方法論と、菅原 (2026) 『人文学におけるデジタルツール活用の手引き』で整理された
「書くプロセスの 5 ステップ」を下敷きにしています。
MIT ライセンスの [minimal-qda](https://github.com/yukisugawara/minimal-qda)
から派生しています。

## License

[MIT](./LICENSE)
