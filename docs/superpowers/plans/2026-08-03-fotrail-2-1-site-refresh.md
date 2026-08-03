# Fotrail 2.1 Site Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 現在の外観を維持したまま、Fotrailのトップ、サポート、プライバシーポリシーをApp Store公開版2.1.0の機能とデータ処理へ同期し、トップにApp Store導線を追加する。

**Architecture:** 既存の静的HTML 3ページと共通CSSをそのまま利用する。トップは製品概要、サポートは利用手順とFAQ、プライバシーは取得・端末内処理・共有・保存・削除の説明に責務を分け、JavaScriptや外部依存は追加しない。

**Tech Stack:** HTML5、CSS、Python 3標準ライブラリ、Playwrightによるローカル表示確認

## Global Constraints

- 2026年8月3日時点でApp Store公開中のFotrail 2.1.0だけを説明する。
- 現在のダークテーマ、ルートビジュアル、カード、FAQ、レスポンシブ構成を維持する。
- 新しいJavaScript、画像、外部フォント、分析、Cookie、フォーム、開発者サーバー通信を追加しない。
- 写真ライブラリ全体の自動走査、未選択写真の収集、待機中の継続測位を行うように読める表現を使わない。
- 写真位置は撮影時刻とGPSログに基づく目安であり、厳密な撮影地点を保証しない。
- 写真アプリの更新、ファイルの新規コピー、RAW用XMP、Live Photos、4形式の共有、完全バックアップを混同しない。
- 変更対象は`Fotrail/index.html`、`Fotrail/support.html`、`Fotrail/privacy-policy.html`、設計文書、実装計画だけとする。既存CSSで3ボタンの折り返しに対応できるため`Fotrail/styles.css`は変更しない。
- Gitでは対象パスだけを明示的にステージする。

---

### Task 1: トップページを2.1.0へ同期する

**Files:**
- Modify: `Fotrail/index.html`
- Test: one-shot Python assertions against `Fotrail/index.html`

**Interfaces:**
- Consumes: 公開App Store URL `https://apps.apple.com/jp/app/fotrail/id6792297035`
- Produces: App Store導線と、GPS記録・写真照合・位置情報追加・原画質共有・システム操作・ローカル処理を要約したトップページ

- [ ] **Step 1: Write and run the failing content contract**

```bash
python3 -c 'from pathlib import Path; s=Path("Fotrail/index.html").read_text(); required=["https://apps.apple.com/jp/app/fotrail/id6792297035","Exif撮影時刻","写真への位置情報追加","原画質のルート共有","Live Photos","写真ライブラリ全体を自動走査しません"]; missing=[x for x in required if x not in s]; assert not missing, missing'
```

Expected: FAIL listing the new 2.1.0 copy and App Store URL.

- [ ] **Step 2: Update metadata, hero, actions, feature cards, and local-first copy**

Use this exact information architecture inside the existing elements:

```html
<meta name="description" content="Fotrailは、撮影中のGPSを記録し、写真のExif撮影時刻と照合して撮影場所をあとから確認・追加できるローカルファーストのiPhoneアプリです。">

<span class="eyebrow">GPS記録から、撮影場所の追加まで</span>
<h1 class="gradient-text">写真に、<br>旅した軌跡を。</h1>
<p class="lead">Fotrailは、撮影中の移動をiPhoneで記録し、写真のExif撮影時刻とGPSログを端末内で照合して、撮影場所をあとから確認・追加できる写真用GPSロガーです。</p>
<div class="actions">
  <a class="button primary" href="https://apps.apple.com/jp/app/fotrail/id6792297035" aria-label="App StoreでFotrailを見る">App Storeで見る</a>
  <a class="button" href="support.html">使い方を見る</a>
  <a class="button" href="privacy-policy.html">データの扱いを確認</a>
</div>
```

Replace the six existing cards with these headings and facts:

```html
<h3>バックグラウンドGPS</h3>
<p>画面ロック中や別のアプリを使用中も、明示的に終了するまで撮影ルートを記録します。</p>

<h3>写真と位置を照合</h3>
<p>写真のExif撮影時刻とGPSログを照合し、カメラ時計のずれを補正しながら候補地点と信頼度を確認できます。</p>

<h3>写真への位置情報追加</h3>
<p>確認後に写真アプリの位置情報を更新。JPEG・HEIC等は新規コピー、RAWはXMPとして元ファイルを変更せず出力します。</p>

<h3>原画質のルート共有</h3>
<p>JPEG・HEIC・PNG・Live Photosを添付し、ルートカード、原本ZIP、個別項目、オフラインHTMLの4形式で共有できます。</p>

<h3>すばやい記録操作</h3>
<p>Live Activity、ホーム画面Widget、コントロールセンター、Siri、ショートカットから記録を操作できます。</p>

<h3>ローカルファースト</h3>
<p>位置情報、写真、照合結果は端末内で処理。GPXは任意でユーザー自身のiCloud Driveにも保存できます。</p>
```

Set the local-first paragraph to:

```html
<p>位置情報ログ、写真、Exif撮影情報、照合結果、生成したGPXや共有データは端末内で処理します。写真ライブラリ全体を自動走査しません。ユーザーが選んだ項目だけを扱い、開発者の独自サーバーへの送信、広告、トラッキング、利用分析SDKはありません。iCloud Drive保存もユーザーが選んだ場合だけ有効になります。</p>
```

- [ ] **Step 3: Run the content contract and legacy-copy check**

```bash
python3 -c 'from pathlib import Path; s=Path("Fotrail/index.html").read_text(); required=["https://apps.apple.com/jp/app/fotrail/id6792297035","Exif撮影時刻","写真への位置情報追加","原画質のルート共有","Live Photos","写真ライブラリ全体を自動走査しません"]; missing=[x for x in required if x not in s]; assert not missing, missing; assert "写真ライブラリやカメラを使用せず" not in s'
```

Expected: PASS.

- [ ] **Step 4: Commit the top-page update**

```bash
git add -- Fotrail/index.html
git diff --cached --check
git commit -m "Update Fotrail landing page for 2.1"
```

### Task 2: サポートページを3つの利用フローとFAQへ更新する

**Files:**
- Modify: `Fotrail/support.html`
- Test: one-shot Python assertions against `Fotrail/support.html`

**Interfaces:**
- Consumes: Task 1で確立した2.1.0の用語「写真と位置を照合」「原画質のルート共有」
- Produces: GPS記録、写真への位置情報追加、写真付きルート共有を独立して案内するサポートページ

- [ ] **Step 1: Run the failing support-page contract**

```bash
python3 -c 'from pathlib import Path; s=Path("Fotrail/support.html").read_text(); required=["GPSを記録する","写真へ位置情報を追加する","写真付きルートを共有する","外部GPXを使えますか？","写真ライブラリ全体を自動検索","位置情報の変更を取り消せますか？","オフラインHTMLアルバム"]; missing=[x for x in required if x not in s]; assert not missing, missing'
```

Expected: FAIL listing the new workflows and FAQ copy.

- [ ] **Step 2: Replace the single basic flow with three focused content cards**

Use these headings and ordered steps:

```html
<h2>GPSを記録する</h2>
<ol>
  <li><strong>記録名を入力する</strong> — 空欄でも開始でき、現在地から地名候補を選ぶこともできます。</li>
  <li><strong>「記録を開始」をタップする</strong> — 初回だけ用途を説明してから位置情報の許可を求めます。</li>
  <li><strong>安全に持ち歩く</strong> — 画面ロック中や別アプリの使用中も継続し、一時停止・再開できます。</li>
  <li><strong>安全な場所で終了する</strong> — 端末内へGPSログとGPXを保存します。</li>
  <li><strong>履歴から確認・共有する</strong> — ルート、精度、撮影メモを確認し、GPXを共有できます。</li>
</ol>

<h2>写真へ位置情報を追加する</h2>
<ol>
  <li><strong>記録を選ぶ</strong> — Fotrailの履歴または読み込んだ外部GPXを開きます。</li>
  <li><strong>写真を選ぶ</strong> — 写真アプリまたはファイルから対象だけを選択します。</li>
  <li><strong>時刻を確認する</strong> — タイムゾーンとカメラ時計のずれを必要に応じて補正します。</li>
  <li><strong>候補地点を確認する</strong> — 一致方法、信頼度、既存の位置情報を確認します。</li>
  <li><strong>出力方法を選んで実行する</strong> — 写真アプリの更新、新規画像コピー、RAW用XMPから選びます。</li>
</ol>

<h2>写真付きルートを共有する</h2>
<ol>
  <li><strong>完了した記録を開く</strong> — 撮影ルート共有から写真を添付します。</li>
  <li><strong>JPEG・HEIC・PNG・Live Photosを選ぶ</strong> — 選択した項目だけを記録へ保存します。</li>
  <li><strong>目安位置を確認する</strong> — 撮影時刻とGPSログから求めた配置を確認します。</li>
  <li><strong>共有形式を選ぶ</strong> — ルートカード、GPX＋原本ZIP、個別項目、オフラインHTMLアルバムから選びます。</li>
</ol>
```

- [ ] **Step 3: Replace the obsolete photo FAQ and add 2.1.0-specific answers**

The FAQ must state these exact boundaries:

```html
<details><summary>どの写真へアクセスしますか？</summary><p>写真へ位置情報を追加するとき、または撮影ルートへ写真を添付するときに、ユーザーが選んだ項目だけを処理します。写真ライブラリ全体を自動検索したり、未選択の写真を収集したりしません。</p></details>
<details><summary>位置情報の変更を取り消せますか？</summary><p>写真アプリの写真は、変更前の位置情報を処理履歴に保持し、その履歴が残っている間は完了画面から直前の値へ戻せます。Filesへ作成した新規コピーやXMPは、ファイルAppから削除してください。</p></details>
<details><summary>JPEG・HEIC・RAWでは何が違いますか？</summary><p>JPEG・HEIC等のファイルは元ファイルを上書きせず、位置情報付きの新規コピーを作ります。RAWは元ファイルを変更せず、GPS情報を記録したXMPサイドカーを作ります。</p></details>
<details><summary>外部GPXを使えますか？</summary><p>GPX 1.1ファイルを、元ファイルや既存履歴を変更せず、新しい記録として読み込めます。その記録を使って写真の撮影時刻と位置を照合できます。</p></details>
<details><summary>撮影時刻と位置が一致しません</summary><p>写真のタイムゾーン、カメラ時計のずれ、記録範囲、一時停止やGPS欠落区間をご確認ください。候補地点は撮影時刻とGPSログに基づく目安で、厳密な撮影地点を保証するものではありません。</p></details>
<details><summary>Live Photosはどのように共有されますか？</summary><p>原本を含む形式では静止画とペア動画を保持します。ルートカードやHTMLアルバムでは表示用の派生画像を使用します。不完全なLive Photoは静止画へ黙って変換せず、対象外として案内します。</p></details>
<details><summary>4つの共有形式の違いは？</summary><p>ルートカードは最大6枚の写真を載せた画像、GPX＋原本ZIPは経路と原本をまとめたファイル、個別項目は共有先へ原本等を個別に渡す形式、オフラインHTMLアルバムはブラウザでルートと写真を閲覧する形式です。原本を含む形式では解像度とメタデータを保持します。</p></details>
```

Retain and update the existing background recording, precision, interval, iCloud Drive, deletion, contact, and safety entries. Delete the obsolete answer beginning with `いいえ。Fotrailは写真ライブラリやカメラを使用せず`.

- [ ] **Step 4: Run support-page green and contradiction checks**

```bash
python3 -c 'from pathlib import Path; s=Path("Fotrail/support.html").read_text(); required=["GPSを記録する","写真へ位置情報を追加する","写真付きルートを共有する","外部GPXを使えますか？","写真ライブラリ全体を自動検索","位置情報の変更を取り消せますか？","オフラインHTMLアルバム"]; missing=[x for x in required if x not in s]; assert not missing, missing; forbidden=["写真ライブラリやカメラを使用せず","写真データへ直接変更を加えません"]; found=[x for x in forbidden if x in s]; assert not found, found'
```

Expected: PASS.

- [ ] **Step 5: Commit the support update**

```bash
git add -- Fotrail/support.html
git diff --cached --check
git commit -m "Update Fotrail support for photo workflows"
```

### Task 3: プライバシーポリシーを2.1.0の情報処理へ同期する

**Files:**
- Modify: `Fotrail/privacy-policy.html`
- Test: one-shot Python assertions against `Fotrail/privacy-policy.html`

**Interfaces:**
- Consumes: Task 2の3利用フローと出力形式の定義
- Produces: 位置情報、選択写真、Exif、位置情報更新、ルート共有、バックアップ、削除を区別する公開ポリシー

- [ ] **Step 1: Run the failing privacy contract**

```bash
python3 -c 'from pathlib import Path; s=Path("Fotrail/privacy-policy.html").read_text(); required=["最終更新日：2026年8月3日","ユーザーが選択した写真と撮影情報","写真付きルート共有","ペア動画","写真メタデータを除いた派生画像","位置情報付きの新規コピー","XMPサイドカー","撮影ルート共有用の原本","写真ライブラリ全体を自動走査しません"]; missing=[x for x in required if x not in s]; assert not missing, missing'
```

Expected: FAIL listing the missing 2.0 and 2.1 privacy disclosures.

- [ ] **Step 2: Rewrite the policy using the existing card layout**

Use the following top-level sections:

```html
<h2>1. 基本方針</h2>
<h2>2. 取り扱う情報</h2>
<h2>3. 写真への位置情報追加</h2>
<h2>4. 写真付きルート共有</h2>
<h2>5. iCloud Drive、共有、完全バックアップ</h2>
<h2>6. 利用目的</h2>
<h2>7. 第三者への提供とAppleのサービス</h2>
<h2>8. 保存期間と削除</h2>
<h2>9. お子様のプライバシー</h2>
<h2>10. セキュリティ</h2>
<h2>11. ポリシーの変更</h2>
<h2>12. お問い合わせ</h2>
```

The policy body must state all of these concrete rules:

```text
- 地名候補では現在地を一時的に取得し、完了・失敗・キャンセル後に終了する。
- GPS記録はユーザーが開始してから終了するまでバックグラウンドでも継続する。
- 参考写真はユーザーがカメラ操作を選んだ場合だけ撮影し、写真アプリへの追加は初期設定でオフである。
- 写真への位置情報追加では、ユーザーが写真アプリまたはFilesから選んだ項目だけを処理する。
- Exif撮影日時、タイムゾーン、既存GPS、形式、画像寸法、向きを端末内で読み取る。
- 実行前に候補地点、信頼度、既存GPS、時刻補正、出力方法を確認する。
- 写真アプリでは選択写真の位置情報を更新し、取り消し用の直前値を端末内に保持する。
- JPEG・HEIC等は元ファイルを上書きせず、位置情報付きの新規コピーを作る。
- RAWは元ファイルを変更せず、XMPサイドカーを作る。
- 中断後に自動で写真変更を再開しない。
- 写真付きルート共有では、明示的に選択したJPEG・HEIC・PNG・Live Photosだけを記録へ保存する。
- 添付位置は撮影時刻とGPSログに基づく目安である。
- ルートカードとHTMLアルバムでは写真メタデータを除いた派生画像を使う。
- 原本ZIPと個別共有では原本の解像度とメタデータを保持する。
- Live Photosは静止画とペア動画を保持し、RAW添付は対象外である。
- 完全バックアップには撮影ルート共有用の原本、ペア動画、サムネイルが含まれる場合がある。
- 位置情報、写真、Exif、照合結果を開発者の独自サーバーへ送信しない。
- 写真ライブラリ全体を自動走査しません。未選択写真を収集しない。
- 広告、第三者追跡、行動分析、独自アカウントを使用しない。
- アプリ削除後もiCloud Drive、写真アプリ、Files、共有先の作成済み項目が残る場合がある。
```

Keep the existing contact email and explain that email providers process information supplied in support messages.

- [ ] **Step 3: Run privacy green and completeness checks**

```bash
python3 -c 'from pathlib import Path; s=Path("Fotrail/privacy-policy.html").read_text(); required=["最終更新日：2026年8月3日","ユーザーが選択した写真と撮影情報","写真付きルート共有","ペア動画","写真メタデータを除いた派生画像","位置情報付きの新規コピー","XMPサイドカー","撮影ルート共有用の原本","写真ライブラリ全体を自動走査しません","開発者の独自サーバーへ送信しません","広告","第三者追跡","独自アカウント"]; missing=[x for x in required if x not in s]; assert not missing, missing'
```

Expected: PASS.

- [ ] **Step 4: Commit the privacy update**

```bash
git add -- Fotrail/privacy-policy.html
git diff --cached --check
git commit -m "Update Fotrail privacy policy for 2.1"
```

### Task 4: 構文・リンク・レスポンシブ表示を統合検証する

**Files:**
- Verify: `Fotrail/index.html`
- Verify: `Fotrail/support.html`
- Verify: `Fotrail/privacy-policy.html`
- Verify unchanged: `Fotrail/styles.css`

**Interfaces:**
- Consumes: Tasks 1–3の完成ページ
- Produces: HTML構文、内部導線、外部導線、危険属性、デスクトップ・モバイル表示の検証結果

- [ ] **Step 1: Parse all HTML and verify required document structure**

```bash
python3 -c 'from html.parser import HTMLParser; from pathlib import Path; files=list(Path("Fotrail").glob("*.html")); required={"html","head","body","nav","main","footer"};
class P(HTMLParser):
 def __init__(self): super().__init__(); self.tags=set()
 def handle_starttag(self,tag,attrs): self.tags.add(tag)
for f in files:
 p=P(); p.feed(f.read_text()); missing=required-p.tags; assert not missing,(f,missing)
print("parsed",len(files),"HTML files")'
```

Expected: `parsed 3 HTML files`.

- [ ] **Step 2: Verify internal links, App Store link, and forbidden active content**

```bash
python3 -c 'from html.parser import HTMLParser; from pathlib import Path;
class P(HTMLParser):
 def __init__(self): super().__init__(); self.links=[]; self.bad=[]
 def handle_starttag(self,tag,attrs):
  d=dict(attrs); self.links += [d["href"]] if tag=="a" and "href" in d else []; self.bad += [tag] if tag=="script" or any(k.lower().startswith("on") for k in d) else []
for f in Path("Fotrail").glob("*.html"):
 p=P(); p.feed(f.read_text()); assert not p.bad,(f,p.bad)
 for href in p.links:
  if href.endswith(".html"): assert (f.parent/href).is_file(),(f,href)
s=Path("Fotrail/index.html").read_text(); assert "https://apps.apple.com/jp/app/fotrail/id6792297035" in s
print("links and active-content checks passed")'
```

Expected: `links and active-content checks passed`.

- [ ] **Step 3: Start a local static server**

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

Expected: local pages are available under `http://127.0.0.1:8765/Fotrail/`.

- [ ] **Step 4: Capture desktop and mobile pages with Playwright and assert no horizontal overflow**

Create `/tmp/fotrail-site-qa.js` with `apply_patch` using the exact script below, then use the bundled Node executable and Playwright package:

```javascript
const { chromium } = require('/Users/yuta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('fs');

(async () => {
  fs.mkdirSync('/tmp/fotrail-site-qa', { recursive: true });
  const browser = await chromium.launch({ headless: true });
  for (const [label, viewport] of [
    ['desktop', { width: 1440, height: 1000 }],
    ['mobile', { width: 390, height: 844 }],
  ]) {
    const page = await browser.newPage({ viewport });
    for (const name of ['index', 'support', 'privacy-policy']) {
      await page.goto(`http://127.0.0.1:8765/Fotrail/${name}.html`, { waitUntil: 'networkidle' });
      const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
      if (!fits) throw new Error(`${label}/${name} has horizontal overflow`);
      await page.screenshot({ path: `/tmp/fotrail-site-qa/${name}-${label}.png`, fullPage: true });
    }
    await page.close();
  }
  await browser.close();
})();
```

Run it with:

```bash
/Users/yuta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node /tmp/fotrail-site-qa.js
```

Expected: six screenshots in `/tmp/fotrail-site-qa/` and no overflow error.

- [ ] **Step 5: Visually inspect all six screenshots**

Confirm:

```text
- App Store、使い方、データの扱いの3ボタンが重ならない。
- モバイルのナビゲーションが画面外へはみ出さない。
- 6枚の機能カードがデスクトップで3列、モバイルで1列になる。
- サポートの3手順とFAQが読み分けられる。
- プライバシーポリシーの長文と見出しが欠けない。
- 既存のルートビジュアル、配色、余白感が維持される。
```

- [ ] **Step 6: Run final scope and diff checks**

```bash
git diff --check
git status --short
git diff --stat main...HEAD
git diff --name-only main...HEAD
```

Expected changed paths:

```text
Fotrail/index.html
Fotrail/privacy-policy.html
Fotrail/support.html
docs/superpowers/plans/2026-08-03-fotrail-2-1-site-refresh.md
docs/superpowers/specs/2026-08-03-fotrail-2-1-site-refresh-design.md
```

- [ ] **Step 7: Report publication state separately**

Do not call the local implementation "published" until the branch has been pushed or merged and GitHub Pages serves the new commit. Report local validation, Git push, GitHub merge, Pages deployment, and live-page verification as separate outcomes.
