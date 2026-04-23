import type { LocalizedHelp } from './types';

export const manualContent: LocalizedHelp = {
  ja: {
    title: 'マニュアル',
    lead: 'fragments は **エスノグラフィ（民族誌）のためのライティング環境** です。左上の 4 つの数字ボタンでフェーズを切り替えながら、書く・つなぐ・分析する・書きあげるを自由に往復できます。',
    sections: [
      {
        heading: 'はじめに',
        body: [
          { type: 'p', text: 'fragments は、**エスノグラフィ（民族誌）のライティングに特化** したツールです。社会学的な質的分析がしばしば「大きな理論の発見」を目指すのに対して、エスノグラフィは **理論に回収されない小さな断片のなかに現場の厚みを見出す**ことを大事にしてきました。このアプリは、その立場からつくられています。' },
          { type: 'p', text: '書くプロセスを1つのアプリにまとめ、断片を書いて、つないで、分析して、書きあげる — この4つを行き来する作業空間として使ってください。' },
          { type: 'callout', text: '**画面左上の数字ボタン (1/2/3/4)** でフェーズを切り替えます。どのフェーズからでも前にも次にも自由に行き来できます。' },
        ],
      },
      {
        heading: 'フェーズ1：フィールドノート — 書き留める',
        body: [
          { type: 'h3', text: '新しい断片をつくる' },
          { type: 'ul', items: [
            '左サイドバーの「**+ 新しい断片**」で作成',
            'タイトルと本文を自由に記述。本文は **Markdown 対応**（見出し `#`、リスト `-`、`**太字**`、`*斜体*`、引用 `>`、コード `` ` ``、リンク `[...](...)` など）',
            '自動保存。ブラウザを閉じても保持されます（localStorage）',
          ]},
          { type: 'h3', text: 'Obsidian風の拡張記法（右のプレビューで描画）' },
          { type: 'ul', items: [
            '`[[タイトル]]` / `[[タイトル#見出し]]` / `[[タイトル|表示名]]` — 断片へのリンク',
            '`![[タイトル]]` — 他の断片をその場に埋め込み表示',
            '`![[image.png]]` / `![[image.png|400]]` — 画像を埋め込み（幅指定可）',
            '`==ハイライト==`、`#タグ`、`%% コメント %%`',
            '`> [!note]` / `[!tip]` / `[!warning]` / `[!quote]` など Callout',
            '`[^1]` と `[^1]: 定義` — 脚注は末尾に自動集約',
          ]},
          { type: 'h3', text: '断片どうしをリンクする' },
          { type: 'ul', items: [
            '本文で `[[` と入力 → 既存の断片のタイトルが候補として表示されます',
            '↑↓ で候補を選び、**Enter / Tab** で挿入',
            '候補にない語を入力してEnterすると、**その名前の新しい断片が自動で作られます**',
            '右のプレビューでは `[[リンク]]` をクリックして遷移できます（未作成なら作成して遷移）',
          ]},
          { type: 'h3', text: '画像を埋め込む' },
          { type: 'ul', items: [
            'エディタ右上の **🖼 画像** ボタンから画像ファイルを選択',
            'エディタへ **ドラッグ＆ドロップ** でも追加可能',
            'クリップボードからの **ペースト**（スクリーンショットなど）も可',
            '追加された画像は本文に `![[ファイル名]]` が挿入され、プレビューで描画されます',
            '画像は localStorage に Base64 で保存されるため、オフラインでも再表示できます',
          ]},
          { type: 'h3', text: 'ファイル / フォルダの取り込み' },
          { type: 'ul', items: [
            '**📄 ファイル** ボタン：複数の .md / .markdown / .txt を選択して追加',
            '**📁 フォルダ** ボタン：フォルダを丸ごと取り込み（Obsidian の vault もそのまま）',
          ]},
          { type: 'h3', text: 'バックリンクと検索' },
          { type: 'ul', items: [
            'プレビュー下部に「**この断片へのリンク元**」が自動表示',
            '左サイドバーの検索ボックスでタイトル・本文を横断検索',
          ]},
        ],
      },
      {
        heading: 'フェーズ2：つながり — 整理する',
        body: [
          { type: 'p', text: '断片どうしの `[[リンク]]` をもとに、ネットワーク図を自動生成します。' },
          { type: 'ul', items: [
            '**ノード**＝断片、**エッジ**＝ `[[リンク]]`',
            '**ノードをクリック** すると、その断片を開いた状態でフェーズ1に戻ります',
            '未作成のリンク先は **破線のゴーストノード** として表示（フェーズ1で作成するとソリッドに）',
            'ミニマップ・ズーム・パン対応',
          ]},
        ],
      },
      {
        heading: 'フェーズ3：コーディング — 意味を探る',
        body: [
          { type: 'p', text: '既存の minimal-qda 機能を取り込み、**テキストの断片と画像の断片を同じ分析空間でコーディング**できます。' },
          { type: 'callout', text: '質的分析は「大きな理論」を探すだけではありません。**どのコードにも分類しきれない断片・孤立した断片** こそ、エスノグラフィが大事にしてきた「発見の種」です。うまくまとまらない違和感は、消さずに残してください。' },
          { type: 'h3', text: '断片の取り込み' },
          { type: 'ul', items: [
            '画面左下の「**+ 断片から追加**」で断片を分析対象として取り込み',
            '断片に `![[image.png]]` の形で画像が埋め込まれている場合、**画像ファイルも同時にQDA対象として取り込まれます**',
            '既に取り込み済みの断片はグレーアウト表示で重複を防止',
            '「すべて取り込む（未取込のみ）」で一括取り込み可能',
          ]},
          { type: 'h3', text: 'テキストの断片をコーディング' },
          { type: 'ul', items: [
            'マーカー色を選んでテキストを範囲選択 → コード付与',
            '左のコードツリーには **全ファイルのコード** を表示（同名カテゴリは自動マージ）',
            'コードをクリックすると該当ファイルへ自動遷移、ビューアでハイライト表示',
            'コードガターは右端をドラッグで幅調整、ラベルは折り返し表示で全文が読めます',
          ]},
          { type: 'h3', text: '画像の断片をコーディング' },
          { type: 'ul', items: [
            '画像ファイルをビューアで開き、**ドラッグで矩形範囲を選択**してコードを付与',
            '画像ごとの「注目領域」を複数のコードで記述でき、テキストと同じカテゴリー体系に統合できます',
            'テキストと画像のコードはコードマップ・メモマップ上で横断的に俯瞰可能',
          ]},
          { type: 'h3', text: 'コード間リンクとメモ' },
          { type: 'ul', items: [
            'コードをドラッグしてカテゴリーにまとめられます',
            '各コードにメモを付与し、書き手自身の思考を可視化',
            'コード同士にリンクを張ってコード間関係も記録できます',
          ]},
          { type: 'h3', text: 'エクスポート' },
          { type: 'ul', items: [
            'コードブック・ビューア画像・カテゴリマップを HTML / PNG / PDF / CSV / REFI-QDA (.qdpx) で書き出し可能',
          ]},
        ],
      },
      {
        heading: 'フェーズ4：民族誌 — 書きあげる',
        body: [
          { type: 'p', text: 'Scrivener 風のバインダー構造で、分析した断片を組み合わせて長い文章を組み立てます。**画像を含む断片も、コンパイル・PDF 書き出しで埋め込み画像ごと出力**されます。' },
          { type: 'ul', items: [
            '上部タブで **ドキュメント** を切り替え / 新規作成。タイトル欄で改名',
            '**バインダー（左）**：セクションを追加、↑↓で並べ替え、ダブルクリックで改名',
            '**セクションエディタ（中央）**：Markdown で本文を記述（`![[image.png]]` で画像も埋め込み可）',
            '**断片ライブラリ（右）**：検索して断片を「**本文を挿入**」（blockquote 引用）または「**リンク**」（`[[...]]`）で差し込み',
            '参照した断片は、エディタ下部に縮小プレビューで常に確認可能',
            '上部「**コンパイル**」で全セクションを結合。プレビューでは画像や Callout などの Obsidian 流記法も描画されます',
            '`[[リンク]]` の展開オプション付きで **.md ダウンロード** / クリップボードコピー、**PDF** はブラウザの印刷ダイアログから保存',
          ]},
        ],
      },
      {
        heading: 'データ操作（左上「データ」メニュー）',
        body: [
          { type: 'ul', items: [
            '**プロジェクトを保存**：4フェーズすべて（断片・ドキュメント・QDA）を1つの `.fragments.json` に書き出し',
            '**プロジェクトを読み込む**：同形式のファイルから完全に復元（上書き）',
            '**サンプルを読み込む**：気候変動民族誌のサンプル（42断片・26コード・民族誌1本）を一括ロード。※ このサンプルは **AI が生成した架空のデータ** であり、実在の人物・場所とは関係ありません。',
            '**Markdownファイル / フォルダ追加**：既存のメモを断片として取り込み',
            '**言語切替**：日本語 ⇄ English（設定はブラウザに保存）',
            '**すべてのデータをクリア**：全データを削除（確認あり）',
          ]},
        ],
      },
      {
        heading: 'ショートカット',
        body: [
          { type: 'ul', items: [
            '`[[` → リンクのオートコンプリート。↑↓ で候補選択、Enter/Tab で挿入、Esc で閉じる',
            '`Esc`：このマニュアルを閉じる',
            'バインダー：↑↓ ボタンでセクション並べ替え、ダブルクリックで改名',
          ]},
        ],
      },
    ],
    footer: 'このマニュアルはアプリと一緒にアップデートされます。左上「データ」メニューから**プロジェクトを保存**しておくと、後で同じ状態に戻せます。',
  },
  en: {
    title: 'Manual',
    lead: 'fragments is **a writing environment for ethnography**. Switch between four phases using the number buttons in the top-left bar, and move freely between writing, linking, analyzing, and composing.',
    sections: [
      {
        heading: 'Overview',
        body: [
          { type: 'p', text: 'fragments is designed specifically for **ethnographic writing**. Where sociological qualitative analysis often aims at finding a grand theory, ethnography has always cared about the **small fragments that resist theory** — the textures of the field that give writing its depth. This app is built from that stance.' },
          { type: 'p', text: 'It bundles the whole writing process — capture fragments, link them, analyze them, and weave them into a document — into a single workspace.' },
          { type: 'callout', text: 'Use the **number buttons (1/2/3/4)** in the top-left to switch phases. You can always go back or forward from any phase.' },
        ],
      },
      {
        heading: 'Phase 1 — Fieldnotes (capture)',
        body: [
          { type: 'h3', text: 'Create a fragment' },
          { type: 'ul', items: [
            'Left sidebar → **+ New fragment**',
            'Title and body are fully editable. Body supports **Markdown** (`#` headings, `-` lists, `**bold**`, `*italic*`, `>` quotes, `` ` `` code, `[text](url)`)',
            'Autosaved to your browser (localStorage) — persists across sessions',
          ]},
          { type: 'h3', text: 'Obsidian-flavoured extensions (rendered in the preview)' },
          { type: 'ul', items: [
            '`[[Title]]` / `[[Title#Heading]]` / `[[Title|alias]]` — fragment links',
            '`![[Title]]` — inline embed of another fragment',
            '`![[image.png]]` / `![[image.png|400]]` — image embed with optional width',
            '`==highlight==`, `#tag`, `%% comment %%`',
            '`> [!note]` / `[!tip]` / `[!warning]` / `[!quote]` and other callouts',
            '`[^1]` references with `[^1]: definition` — footnotes are aggregated at the bottom',
          ]},
          { type: 'h3', text: 'Link fragments' },
          { type: 'ul', items: [
            'Type `[[` → existing fragment titles appear as suggestions',
            '↑↓ to navigate, **Enter / Tab** to insert',
            'Type a new title + Enter to **create that fragment on the fly**',
            'In the preview, `[[links]]` are clickable — creates the target if missing',
          ]},
          { type: 'h3', text: 'Embed images' },
          { type: 'ul', items: [
            'Use the **🖼 Image** button in the editor toolbar to pick image files',
            '**Drag & drop** images straight onto the editor',
            '**Paste** clipboard images (screenshots work)',
            'Inserts `![[filename]]` at the caret; the preview renders it inline',
            'Images are stored locally as base64 — they stay with the project',
          ]},
          { type: 'h3', text: 'Import files / folders' },
          { type: 'ul', items: [
            '**📄 Files**: pick multiple .md / .markdown / .txt files',
            '**📁 Folder**: import an entire vault (Obsidian folders work as-is)',
          ]},
          { type: 'h3', text: 'Backlinks & search' },
          { type: 'ul', items: [
            'Preview shows automatic **backlinks** at the bottom',
            'Search box in the sidebar searches across titles and body',
          ]},
        ],
      },
      {
        heading: 'Phase 2 — Links (organize)',
        body: [
          { type: 'p', text: 'The network graph is generated automatically from `[[wikilinks]]`.' },
          { type: 'ul', items: [
            'Nodes = fragments, edges = `[[links]]`',
            '**Click a node** to open that fragment in Phase 1',
            'Unresolved link targets show as **dashed ghost nodes** (become solid once created in Phase 1)',
            'Minimap, zoom, pan supported',
          ]},
        ],
      },
      {
        heading: 'Phase 3 — Coding (interpret)',
        body: [
          { type: 'p', text: 'Built on minimal-qda. **Code text fragments and image fragments in the same workspace** — both share one category tree.' },
          { type: 'callout', text: 'Qualitative analysis isn\'t only about finding one big theory. **Fragments that resist classification — and fragments that stay isolated — are exactly what ethnography has cared about.** Let awkward, unassimilated fragments stay; they are seeds for your next discovery.' },
          { type: 'h3', text: 'Import' },
          { type: 'ul', items: [
            'Bottom-left **+ From fragments** imports fragments as QDA files',
            'Any `![[image.png]]` references inside the fragment are imported as image files too, so you can code them directly',
            'Duplicates are grayed out; **Import all (unimported only)** for bulk',
          ]},
          { type: 'h3', text: 'Coding text' },
          { type: 'ul', items: [
            'Select text and apply a color-coded marker',
            'The codes panel shows **all codes across all files** (same-named categories are merged)',
            'Click a code to auto-switch to its file; the viewer highlights it',
            'The code gutter has a drag handle on its right edge; labels wrap to show their full name',
          ]},
          { type: 'h3', text: 'Coding images' },
          { type: 'ul', items: [
            'Open an image file; **drag a rectangle** on the image to apply a code',
            'Images and text codes coexist in the same category tree — analyse them together on the code map / memo map',
          ]},
          { type: 'h3', text: 'Links & memos' },
          { type: 'ul', items: [
            'Drag codes into categories, link code → code, attach memos',
            'Export the codebook and viewer as HTML / PNG / PDF / CSV / REFI-QDA (.qdpx)',
          ]},
        ],
      },
      {
        heading: 'Phase 4 — Ethnography (write)',
        body: [
          { type: 'p', text: 'Scrivener-style binder for weaving analyzed fragments into long-form writing. **Embedded images come through to compile and PDF output.**' },
          { type: 'ul', items: [
            'Tabs at the top switch / create **documents**. Edit the title inline',
            '**Binder (left)**: add sections, reorder with ↑↓, rename via double-click',
            '**Editor (center)**: Markdown body — `![[image.png]]` embeds images inline',
            '**Fragment library (right)**: search and **Insert body** (blockquote) or **Link** (`[[...]]`) into the current section',
            'Referenced fragments always visible in a panel below the editor',
            '**Compile** at the top joins all sections. The preview renders Obsidian-style extensions (images, callouts, highlights, …)',
            'Download as `.md`, copy to clipboard, or print to PDF from the browser dialog',
          ]},
        ],
      },
      {
        heading: 'Data menu (top-left)',
        body: [
          { type: 'ul', items: [
            '**Save project**: export all 4 phases as one `.fragments.json`',
            '**Load project**: fully restore from the same file format (replaces current state)',
            '**Load sample**: climate-change ethnography sample (42 fragments, 26 codes, 1 document). Note: this sample is **AI-generated fictional data** — no real persons or places.',
            '**Add Markdown files / folder**: bring existing notes in as fragments',
            '**Language**: toggle 日本語 ⇄ English (persisted)',
            '**Clear all data**: wipe everything (with confirmation)',
          ]},
        ],
      },
      {
        heading: 'Shortcuts',
        body: [
          { type: 'ul', items: [
            '`[[` → link autocomplete. ↑↓ to navigate, Enter/Tab to insert, Esc to dismiss',
            '`Esc` closes this manual',
            'Binder: ↑↓ buttons reorder sections, double-click to rename',
          ]},
        ],
      },
    ],
    footer: 'This manual evolves with the app. Use **Save project** from the top-left data menu to take snapshots of your work.',
  },
};
