前提：MVPは「1科目 + ネスト評価ツリー + 入力 + 集計（現在/見込み/上限） + 落単判定60% + 一覧ランキング」。学校運用のフル権限や汎用イベントエンジンは後回し。

下はそのままGitHub Issueにコピペできる粒度で切ってある。各Issueは「完了条件（Acceptance Criteria）」を必ず満たしたら閉じていい。

---

Milestone: MVP v0.1（1科目で落単判定）

  

Issue 1: リポジトリ初期化（Vite + React/TS + Django）

- ラベル: setup, backend, frontend
    
- 目的: 実行できる骨組みを作る
    
- 完了条件:
    
    - frontend: Viteで起動できる（npm run dev）
        
    - backend: Djangoで起動できる（python manage.py runserver）
        
    - CORS設定があり、ローカルで疎通できる
        
    

  

Issue 2: DB選定と接続（開発SQLite / 本番Postgres想定）

- ラベル: backend, infra
    
- 完了条件:
    
    - settingsで環境変数によりDB切替可能
        
    - マイグレーションが通る
        
    - READMEに開発手順がある
        
    

  

Issue 3: データモデル定義（Course / EvalNode / EvalEntry / Threshold）

- ラベル: backend, model
    
- 目的: 仕様の中心（評価ツリーと入力）を確定させる
    
- 完了条件:
    
    - 以下のモデルがある（最低限）
        
        - Course（年度/学期/必修選択/名前）
            
        - EvalNode（course, parent, name, weight, input_type, is_leaf, order）
            
        - EvalEntry（student, node, earned, max, rate, attended, total, adjustment, status, timestamp）
            
        - Threshold（course, type=root_only, value=60）
            
        
    - マイグレーション作成済み
        
    

  

Issue 4: 評価ツリーの制約（葉だけ入力、重み正規化前提）

- ラベル: backend, logic
    
- 完了条件:
    
    - is_leaf=false のノードに EvalEntry を作れない（バリデーション）
        
    - 同一parent配下のweightが0や負の場合の扱いが定義されている（例: 無効、エラー、除外）
        
    - orderで表示順が安定する
        
    

  

Issue 5: 集計ロジック実装（現在値 / 見込み / 上限 / 不足点 / 確定落単）

- ラベル: backend, logic, core
    
- 目的: アプリの心臓部
    
- 完了条件:
    
    - leafScore計算（点数/割合/出席 + adjustment + clamp）が実装されている
        
    - nodeScoreが重み付き平均で再帰集計される
        
    - 2系統の集計がある
        
        - 現在値: 未実施除外
            
        - 見込み: 未実施0扱い
            
        
    - 上限（未実施満点）計算がある
        
    - 不足点数と確定落単フラグが出る
        
    

  

Issue 6: 集計ロジックのユニットテスト

- ラベル: backend, test, core
    
- 完了条件:
    
    - 最低8ケース
        
        - 正規化あり/なし
            
        - adjustment正負
            
        - 未実施混在（現在値/見込み差が出る）
            
        - 上限で確定落単 true/false
            
        - ネスト3段以上
            
        
    - テストがCIで落ちない
        
    

  

Issue 7: API設計（MVP endpoints）

- ラベル: backend, api
    
- 目的: フロントが迷わない入口を作る
    
- 完了条件:
    
    - OpenAPI/DRF schema か README にAPI仕様がある
        
    - 最低限のエンドポイント
        
        - GET /courses
            
        - POST /courses（MVPは1科目作成用）
            
        - GET /courses/{id}
            
        - GET /courses/{id}/nodes
            
        - PUT /courses/{id}/nodes（管理設定、MVPは簡易でも可）
            
        - GET /courses/{id}/summary
            
        - POST /courses/{id}/entries
            
        - GET /courses/{id}/entries
            
        
    

  

Issue 8: API実装（Course CRUD 最小）

- ラベル: backend, api
    
- 完了条件:
    
    - 1科目の作成・取得・一覧が動く
        
    - 学期/必修選択が保存される
        
    

  

Issue 9: API実装（EvalNode: ツリー取得・更新）

- ラベル: backend, api, core
    
- 完了条件:
    
    - ツリーをネスト形式で返せる
        
    - 更新でツリー構造が壊れない（parent循環禁止）
        
    - weightの保存と order の安定がある
        
    

  

Issue 10: API実装（EvalEntry: 入力・取得）

- ラベル: backend, api, core
    
- 完了条件:
    
    - 葉ノードへの入力が作成/更新できる
        
    - status（未入力/入力済）が管理される
        
    - timestamp付きで履歴が残る（時系列グラフの布石）
        
    

  

Issue 11: API実装（Summary: 集計結果返却）

- ラベル: backend, api, core
    
- 完了条件:
    
    - summaryに以下が含まれる
        
        - currentScore100
            
        - predictedScore100
            
        - upperBoundScore100
            
        - deficitTo60_current / deficitTo60_predicted（どちらか1つでも可、MVPはpredicted優先）
            
        - isCertainFail
            
        - isFailPredicted（predicted <= 60）
            
        
    - 集計はIssue5のロジックを利用（重複実装禁止）
        
    

  

Issue 12: 認証（MVP: ログイン必須、ロールは仮）

- ラベル: backend, auth
    
- 完了条件:
    
    - ログインしてtoken/セッションが取得できる
        
    - APIが未ログインでは弾かれる
        
    - MVPではロールを固定（admin/student）でもよい
        
    

  

Issue 13: フロント: 画面ルーティング（Dashboard / CourseList / CourseDetail / Admin）

- ラベル: frontend
    
- 完了条件:
    
    - 4画面に遷移できる
        
    - API疎通の共通クライアントがある（fetch wrapper等）
        
    

  

Issue 14: フロント: 科目一覧（危険度ランキング）

- ラベル: frontend, core
    
- 完了条件:
    
    - coursesを表示
        
    - 各科目の危険度（不足点数）でソートできる
        
    - 確定落単は明確に表示（アイコン/ラベル）
        
    

  

Issue 15: フロント: 科目詳細（評価ツリー表示）

- ラベル: frontend, core
    
- 完了条件:
    
    - EvalNodeを階層で表示できる（折りたたみ可）
        
    - 葉ノードの入力形式がinput_typeに従って変わる
        
    

  

Issue 16: フロント: 入力フォーム（点数/割合/出席 + 補正）

- ラベル: frontend, core
    
- 完了条件:
    
    - 入力して保存できる
        
    - 未入力状態が分かる
        
    - 後から一括入力できる導線（最低限: 未入力フィルタ + 連続入力）
        
    

  

Issue 17: フロント: 集計表示（現在値/見込み/上限/不足/判定）

- ラベル: frontend, core
    
- 完了条件:
    
    - summaryを表示
        
    - 現在値と見込みを両方表示
        
    - 落単判定（predicted<=60）と確定落単（upper<60）を区別して表示
        
    

  

Issue 18: 可視化（MVP: 積み上げ棒 or 円グラフ 1つだけ）

- ラベル: frontend, visualization
    
- 完了条件:
    
    - 少なくとも1種類のグラフが科目詳細に出る
        
    - 「獲得/未獲得/未実施」が視覚的に分かる
        
    - データが0でも壊れない
        
    

  

Issue 19: CSVエクスポート（科目別）

- ラベル: backend, export
    
- 完了条件:
    
    - CSVをダウンロードできる
        
    - 最低限含める: course, node path, input values, timestamps, summary結果
        
    

  

Issue 20: CI（テスト + lint）

- ラベル: devops
    
- 完了条件:
    
    - PRで backend tests が走る
        
    - 失敗したら落ちる
        
    - フロントも型チェックが走る（tsc）
        
    

  

Issue 21: VPS環境構築（Backendホスティング）

- ラベル: infra
    
- 目的: 既存VPS (pai314.jp) でDjangoを動かす
    
- 完了条件:
    
    - VPSにPython 3.x, pip, venvが導入されている
    - Gunicorn等でDjangoが常駐プロセス(Systemd)として動く
    - Nginxの設定変更:
        - `/rakutan` -> フロントエンド静的ファイル
        - `/rakutan/api` -> Django (Proxy Pass)
    - データベース(SQLite/Postgres)が永続化できる場所にある

  

Issue 27: フロントエンド統合（サブディレクトリ配信）

- ラベル: frontend, build
    
- 完了条件:
    
    - Viteのbase設定が `/rakutan/` になっている
    - React Routerのbasenameが `/rakutan` に設定されている
    - API接続先が環境変数で切り替え可能（本番は相対パス `/rakutan/api` 等）

  

Issue 28: CI/CDパイプライン拡張（Backendデプロイ）

- ラベル: devops
    
- 完了条件:
    
    - GitHub Actionsで以下が自動化される:
        - フロントエンド: ビルド -> `/var/www/pai314/rakutan` へ配置
        - バックエンド: コード転送 -> `/var/www/rakutan-backend` -> migrate -> Gunicorn再起動
    - Secretsに必要な値（SSHキー、Django環境変数）が設定されている
        
    

---

Milestone: v0.2（学校運用の入口）

  

Issue 22: ロールと権限（admin/teacher/student）

- ラベル: backend, auth
    
- 完了条件:
    
    - teacherがテンプレ作成可能
        
    - studentは自分の入力のみ可能
        
    

  

Issue 23: 科目テンプレ複製（年度更新）

- ラベル: backend, model
    
- 完了条件:
    
    - templateから年度のcourseへ複製ができる
        
    - 評価ツリーも複製される
        
    

  

Issue 24: 通知（最低限: 日次リマインド）

- ラベル: backend, frontend
    
- 完了条件:
    
    - 未入力がある場合に通知が出る（まずはアプリ内通知で可）
        
    

---

Milestone: v1.0（最終形に近い）

  

Issue 25: 汎用イベントエンジン（ノード×条件×アクション）

- ラベル: backend, core
    
- 完了条件:
    
    - 条件（点数/出席）でイベントが発火
        
    - 再試フラグが立つ（最初はフラグだけ）
        
    

  

Issue 26: 落単確率推定（後段）

- ラベル: backend, ml-ish
    
- 完了条件:
    
    - 予測を確率として出す定義が文章で固定されている
        
    - 実装がその定義に一致する
        
    