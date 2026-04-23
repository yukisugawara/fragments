import type { LocalizedHelp } from './types';

export const philosophyContent: LocalizedHelp = {
  ja: {
    title: '設計思想',
    lead: '**fragments は、エスノグラフィ（民族誌）のためのライティング環境** です。書くことを直線的な作業ではなく、**循環的な思考のプロセス** として支え、理論に回収されない小さな断片をも大切に残していく道具を目指しています。',
    sections: [
      {
        heading: 'エスノグラフィのためのツールとして',
        body: [
          { type: 'p', text: '質的データを扱うツールは数多くありますが、それらの多くは **社会学的な質的分析** — データから **再現性のある理論や類型を発見する** ことを目標とする営み — を前提に設計されています。カテゴリーに分類し、頻度や共起を数え、理論的飽和を求める。そのアプローチには固有の強みがあります。' },
          { type: 'p', text: 'けれどエスノグラフィは、少しちがう場所に軸足を置いてきました。現場で出会う出来事や語り、身体感覚、沈黙、違和感 — それらを **分類しきれないまま残しておく** ことで、既存の枠組みでは捉えきれない現実の厚みを浮かび上がらせる。Geertz の「厚い記述（thick description）」、Emerson の「in-process memo」、ネガティブ・ケースへの注目 — 伝統的に、理論の外側にこぼれる断片を **ほぐして育てる** ことを重視してきました。' },
          { type: 'callout', text: 'fragments は、この **エスノグラフィ的態度** を支える道具です。カテゴリー化・コーディング・理論構築の機能は備えますが、それらに吸収されなかった断片がいつでも **目に見える形で残り続ける** よう設計されています。分類できないものを、分類できないまま育てる環境です。' },
        ],
      },
      {
        heading: 'なぜ書くプロセス全体を1つのアプリに？',
        body: [
          { type: 'p', text: 'Emerson, Fretz & Shaw の *Writing Ethnographic Fieldnotes* (1995) が示すように、エスノグラフィの書き物は、**ジョッティング（現場での走り書き）→ 書斎での本格的記述 → オープンコーディング → 焦点化されたコーディング → 統合的メモ → 民族誌として書きあげる** という、複数の段階を **行き来しながら** 進みます。' },
          { type: 'p', text: '従来は各段階に別々のツールを使ってきました。**Obsidian** は断片の記述と相互参照に、**QDA系ソフト**（MAXQDA / NVivo など）は質的分析に、**Scrivener** は長文の組み立てに。しかしアプリを切り替えるたびに、データも、文脈も、思考もが分断されてしまう。' },
          { type: 'callout', text: 'fragments は、Emerson のフィールドノーツ方法論と、菅原 (2026)『人文学におけるデジタルツール活用の手引き』で整理された書くプロセスに基づき、**ひとつの連続した空間** の中で4つのフェーズを往復できるよう設計されています。' },
        ],
      },
      {
        heading: '4つのフェーズの位置づけ',
        body: [
          { type: 'h3', text: 'フェーズ1：フィールドノート — Jottings × Fieldnotes' },
          { type: 'p', text: 'Emerson は現場で取り落とさないための **jottings（走り書き）** と、書斎で再構成する **fieldnotes（フィールドノーツ）** を区別します。このフェーズは両方を受け入れる柔軟な器です。短いメモでも、引用文献メモでも、長い記述でも構いません。' },
          { type: 'p', text: 'ツェッテルカステン（Zettelkasten）の原則 **「1つの概念に1つのノート」** に従い、粒度を小さく保ちます。大事なのは **すぐ書き留める習慣**。' },
          { type: 'callout', text: '空の断片を前にして書くことに詰まったら、Emerson の3つの観察軸を参考に：\n**(1) 五感で気づいたこと**\n**(2) 注目すべき出来事**\n**(3) 自分自身の反応・違和感**' },
          { type: 'h3', text: 'フェーズ2：つながり — Open coding' },
          { type: 'p', text: 'Emerson のオープンコーディングに相当する、**軽量な関連付け** の段階です。`[[二重括弧]]` でノート同士をリンクし、ネットワーク図で全体を俯瞰します。' },
          { type: 'p', text: '原則は **「まず広く、多く」**。網の目を編むように、思いついた関連をどんどん張っていきます。未作成のリンク（ゴーストノード）も、未来のノートへの約束として残しておきます。' },
          { type: 'h3', text: 'フェーズ3：コーディング — Focused coding × Integrative memos' },
          { type: 'p', text: '広くリンクを張った後、**中核となる主題を絞り込む** のがこの段階です。断片にマーカーを引き、コードを付け、カテゴリーに束ねます。' },
          { type: 'p', text: 'コードにメモを付与することで、書き手自身の思考が可視化されます。Emerson のいう **in-process memo（過程メモ）** から **integrative memo（統合的メモ）** への発展が、ここで起きます。' },
          { type: 'callout', text: '分析は、断片を並べて眺めるだけでは見えない構造を **浮かび上がらせる** 作業です。コードマップやカテゴリーマップを使って、テーマの星座を作り出してください。' },
          { type: 'h3', text: 'フェーズ4：民族誌 — Writing up' },
          { type: 'p', text: 'Emerson の writing up は、**テーゼ（主張）を中心に、印象的なエピソードを引用しながら物語を組み立てる** 作業です。Scrivener 的なバインダー構造で、セクションを入れ替えながら書けます。' },
          { type: 'p', text: '断片ライブラリから、blockquote として証拠を取り込んだり、`[[リンク]]` として参照したり。**書き手自身が証拠を選び、並べ、注釈する** という行為こそが執筆です。自動生成ではありません。' },
        ],
      },
      {
        heading: '大きな理論の影に隠れた小さな断片を大切に',
        body: [
          { type: 'p', text: '質的分析では、**多くの断片を束ねて説明できる理論**（grand theory）を発見することが目標として語られがちです。しかしエスノグラフィが本当に大事にしてきたのは、その理論からこぼれ落ちる小さな断片 — 周縁のノイズ、例外、違和感、うまく分類できない異物 — にこそ、新しい見方の芽が潜んでいる、という感覚です。' },
          { type: 'p', text: 'Geertz の「厚い記述（thick description）」や、グラウンデッド・セオリー以降の「ネガティブ・ケース分析」が示すように、**理論の外にこぼれる断片を丁寧に拾い上げる**ことで、既存の枠組みは少しずつ組み替えられていきます。' },
          { type: 'callout', text: 'fragments は、**未回収の断片が消えないように** 設計されています。大きなカテゴリーにまとまらなかった断片、コーディングされずに残っている断片、ネットワーク図で孤立しているノード — それらを「失敗」ではなく「次の発見の種」として大切に育ててください。' },
          { type: 'p', text: '具体的には、フェーズ3のコードパネルは**全断片のコードを横断表示**し、どの断片がまだ主要なテーマに回収されていないかを可視化します。フェーズ2のネットワーク図では孤立したノードが一目でわかります。フェーズ1の検索・バックリンクで、忘れかけた断片をいつでも掘り返せます。' },
        ],
      },
      {
        heading: 'なぜ「循環的」なのか',
        body: [
          { type: 'p', text: '書くことは、一方向ではありません。' },
          { type: 'ul', items: [
            'フェーズ4で書いていて論点が足りないと気づいたら → フェーズ1に戻って新しい断片を書く',
            'フェーズ3のコーディングで現れたパターンを確認したくなったら → フェーズ2のネットワーク図を見直す',
            'フェーズ1で書き足した断片が、フェーズ3で新しいコードを生むこともある',
          ]},
          { type: 'p', text: '画面左上のフェーズ切替（数字ボタン 1/2/3/4）は、この往復運動を支える入口として常に表示されています。どのフェーズからでも次にも前にも自由に移動できます。画面左上の **fragments ロゴ** をクリックするとフェーズ1（断片）に戻ります。' },
          { type: 'callout', text: '**「線的」ではなく「循環的」**であること自体が、このアプリの設計思想です。プロセスが止まっても、どこからでも再び書き始められる。' },
        ],
      },
      {
        heading: 'ローカルファースト',
        body: [
          { type: 'p', text: 'データはすべて **ブラウザ内（localStorage）** に保存されます。サーバーへのアップロードはなく、あなたのPCに留まります。プロジェクト保存機能は、そのスナップショットを `.fragments.json` として手元に書き出すためのものです。' },
          { type: 'p', text: 'Obsidian の **「ローカル & Markdown」** 思想を引き継ぎ、書き手の思考がクラウドに人質にならない設計を守ります。エクスポートされるのは Markdown や JSON といった、**未来も読めるフォーマット** です。' },
        ],
      },
      {
        heading: 'デジタル技術は手段である',
        body: [
          { type: 'quote', text: 'デジタル技術の活用は目的ではなく手段です。道具に振り回されず、あくまで自分自身の思考と言葉が主役であることを忘れないようにしましょう。', cite: '菅原裕輝 (2026)『人文学におけるデジタルツール活用の手引き』第5章' },
          { type: 'p', text: 'このアプリは、あなたの思考と言葉をあくまで主役にして、その周りで静かに支える道具を目指しています。' },
          { type: 'p', text: '機能を増やすことよりも、**書く行為そのものを遮らないこと**。フェーズの切替は軽く、データの復元は確実に、エクスポートはシンプルに。そうした細部の積み重ねで「思考を支える」ツールを作っています。' },
        ],
      },
      {
        heading: '参考文献',
        body: [
          { type: 'ul', items: [
            'Emerson, R. M., Fretz, R. I., & Shaw, L. L. (1995). *Writing Ethnographic Fieldnotes*. University of Chicago Press. （邦訳：佐藤郁哉ほか訳『方法としてのフィールドノーツ』新曜社）',
            'Ahrens, S. (2017). *How to Take Smart Notes*. — Zettelkasten の現代的解説',
            '菅原裕輝 (2026) 『人文学におけるデジタルツール活用の手引き』. https://yukisugawara.github.io/digital-tools-manual/ ― 本アプリの設計の下敷きとなった「書くプロセスの5ステップ」を整理した資料',
          ]},
        ],
      },
    ],
    footer: '**コンセプト：書くことは発見である。** データを入れるだけでは文章は生まれない。断片を書き、関係を張り、意味を探り、物語を組み立てる — この往復運動そのものが、書くという行為です。',
  },
  en: {
    title: 'Design philosophy',
    lead: '**fragments is a writing environment for ethnography.** It treats writing as a **cyclical thinking process** rather than a linear task, and keeps visible the small fragments that refuse to be absorbed into theory.',
    sections: [
      {
        heading: 'A tool for ethnography',
        body: [
          { type: 'p', text: 'Many qualitative-data tools are built around **sociological qualitative analysis** — the work of finding reproducible categories, types, or theories that account for the data. Classify, count frequencies and co-occurrences, reach theoretical saturation. That approach has real strengths.' },
          { type: 'p', text: 'Ethnography, though, has always stood in a slightly different place. Encounters in the field, utterances, bodily sensations, silences, dissonances — the point is often to **keep them unresolved**, so the thickness of the world that exceeds any framework can surface. Geertz\'s "thick description," Emerson\'s "in-process memo," the attention to negative cases — the ethnographic tradition has cultivated the **fragments that fall outside theory** rather than disposing of them.' },
          { type: 'callout', text: 'fragments is built to support this **ethnographic stance**. It provides categorisation, coding, and theory-building tools — but it is deliberately designed so that fragments not absorbed into any category **remain visible**. It is an environment in which the unclassifiable can be raised *as* unclassifiable.' },
        ],
      },
      {
        heading: 'Why one app for the whole writing process?',
        body: [
          { type: 'p', text: 'As Emerson, Fretz & Shaw argue in *Writing Ethnographic Fieldnotes* (1995), ethnographic writing proceeds through several stages — **jottings → written-up fieldnotes → open coding → focused coding → integrative memos → writing up** — that researchers **move back and forth between**, not in a straight line.' },
          { type: 'p', text: 'Conventionally, each stage lives in a different tool: **Obsidian** for fragments and wikilinks, **QDA software** (MAXQDA, NVivo) for qualitative analysis, **Scrivener** for long-form composition. Switching tools fragments the data, the context, and the thought.' },
          { type: 'callout', text: 'fragments brings these stages together, following Emerson\'s fieldnotes methodology and the writing process outlined in Sugawara (2026) *A Guide to Digital Tools in the Humanities*, so that you can move through four phases in **one continuous workspace**.' },
        ],
      },
      {
        heading: 'The four phases, positioned',
        body: [
          { type: 'h3', text: 'Phase 1: Fieldnotes — Jottings × Fieldnotes' },
          { type: 'p', text: 'Emerson distinguishes **jottings** (short in-situ notes to not lose moments) from **fieldnotes** (the fuller written-up account). Phase 1 welcomes both. A one-liner, a quote, a full description — all are fragments.' },
          { type: 'p', text: 'Following the Zettelkasten principle **"one concept per note"**, keep the granularity small. The essential discipline is **writing it down, fast**.' },
          { type: 'callout', text: 'Stuck in front of an empty fragment? Use Emerson\'s three observational axes:\n**(1) sensory details**\n**(2) events worth noticing**\n**(3) your own reaction or sense of strangeness**' },
          { type: 'h3', text: 'Phase 2: Links — Open coding' },
          { type: 'p', text: 'Phase 2 corresponds to Emerson\'s **open coding** — a light-touch association step. Link notes with `[[double brackets]]` and overview the whole in the network graph.' },
          { type: 'p', text: 'The rule is **"broad first, many first."** Build the mesh. Ghost nodes (unresolved links) are promises to future notes — keep them.' },
          { type: 'h3', text: 'Phase 3: Coding — Focused coding × Integrative memos' },
          { type: 'p', text: 'After broad linking, Phase 3 **narrows in on core themes**. Mark fragments, apply codes, organize them into categories.' },
          { type: 'p', text: 'Attaching memos to codes makes your own thinking visible. Emerson\'s **in-process memos** grow into **integrative memos** right here.' },
          { type: 'callout', text: 'Analysis is the work of **surfacing structure** that isn\'t visible just from looking at fragments. Use the code map and category map to build constellations of themes.' },
          { type: 'h3', text: 'Phase 4: Ethnography — Writing up' },
          { type: 'p', text: 'Emerson\'s **writing up** is assembling a narrative around a **thesis**, citing memorable episodes. A Scrivener-like binder lets you rearrange sections as you go.' },
          { type: 'p', text: 'From the fragment library, pull in evidence as blockquotes or reference it as `[[links]]`. **Writing is you choosing, ordering, and annotating evidence** — not auto-generation.' },
        ],
      },
      {
        heading: 'Small fragments the big theory leaves behind',
        body: [
          { type: 'p', text: 'Qualitative analysis is often framed as finding a **grand theory** that accounts for many fragments. But what ethnography has really cared about are the small fragments the theory **fails** to explain — the marginal noise, the exceptions, the friction, the oddities that resist classification. That is where a new way of seeing tends to hide.' },
          { type: 'p', text: 'Geertz\'s **thick description** and the **negative-case analysis** familiar from grounded theory both insist on this: by carefully picking up the fragments that fall outside the frame, the frame itself gets re-worked.' },
          { type: 'callout', text: 'fragments is designed so that **unassimilated fragments don\'t disappear**. Fragments that wouldn\'t fit any category, codes that never made it into a theme, isolated nodes in the graph — treat them not as failures but as **seeds for the next discovery**.' },
          { type: 'p', text: 'Concretely, Phase 3\'s code panel shows all codes across all fragments, so you can see which fragments haven\'t been absorbed into the main themes yet. Phase 2\'s graph reveals isolated nodes at a glance. Phase 1\'s search and backlinks let you re-surface fragments you had almost forgotten.' },
        ],
      },
      {
        heading: 'Why cyclical?',
        body: [
          { type: 'p', text: 'Writing never runs in one direction.' },
          { type: 'ul', items: [
            'Composing in Phase 4, you realize you\'re missing an angle → back to Phase 1 to write new fragments',
            'A pattern emerges in Phase 3 coding → revisit Phase 2 to re-read the graph',
            'A new fragment in Phase 1 spawns a new code in Phase 3',
          ]},
          { type: 'p', text: 'The phase switcher in the top-left bar (buttons 1/2/3/4) is always available so you can step backward or forward from any phase. Click the **fragments logo** in the top-left to jump back to Phase 1 (Fragments).' },
          { type: 'callout', text: 'Being **cyclical rather than linear** is itself the core design stance of this app. When your process stalls, you can always pick it back up from anywhere.' },
        ],
      },
      {
        heading: 'Local-first',
        body: [
          { type: 'p', text: 'All data lives in your browser (localStorage). Nothing is uploaded. The project save feature exports a snapshot as `.fragments.json` that you own.' },
          { type: 'p', text: 'In the **"local & Markdown"** spirit of Obsidian, your thinking isn\'t held hostage in some cloud. Exports use formats — Markdown, JSON — that will still be readable in the future.' },
        ],
      },
      {
        heading: 'Tools are means, not ends',
        body: [
          { type: 'quote', text: 'Digital tools are means, not ends. Don\'t be controlled by the tool — keep your own thinking and words as the real protagonist.', cite: 'Sugawara, Y. (2026) *A Guide to Digital Tools in the Humanities*, Ch. 5' },
          { type: 'p', text: 'This app aims to stay in the background while supporting your thinking.' },
          { type: 'p', text: 'More important than adding features is **not interrupting the act of writing**. Lightweight phase switches, reliable restoration, simple exports — details like these add up to a tool that supports thought.' },
        ],
      },
      {
        heading: 'References',
        body: [
          { type: 'ul', items: [
            'Emerson, R. M., Fretz, R. I., & Shaw, L. L. (1995). *Writing Ethnographic Fieldnotes*. University of Chicago Press.',
            'Ahrens, S. (2017). *How to Take Smart Notes*. — A modern introduction to the Zettelkasten method',
            'Sugawara, Y. (2026). *A Guide to Digital Tools in the Humanities* [*Jinbungaku ni okeru dejitaru tsūru katsuyō no tebiki*]. https://yukisugawara.github.io/digital-tools-manual/ — the five-step writing process that grounds this app',
          ]},
        ],
      },
    ],
    footer: '**Concept: writing is discovery.** Putting data in doesn\'t produce prose. Writing fragments, drawing relations, seeking meaning, building a narrative — that back-and-forth motion itself **is** the act of writing.',
  },
};
