# Login Mockup

深色毛玻璃的登入介面：半透明面板浮在會流動的背景上，可切換登入／註冊，登入後換成歡迎卡片。
後端是 FastAPI + MySQL，前端是 React 19 + TypeScript + Vite，樣式用原生 CSS Modules（沒有 UI 套件、icon 套件或動畫函式庫）。

## 需求

- Python 3.12+ 與本機 MySQL（資料庫 `login_mockup`，內含 `users` 表）
- Node 20+

## 啟動

兩個終端機分別跑：

```bash
# 後端（預設 127.0.0.1:9000）
./backend/dev.sh

# 前端（http://localhost:5173）
npm --prefix frontend run dev
```

Vite 會把 `/api` 代理到後端，所以前端用相對路徑 `fetch("/api/...")` 就好，不會有 CORS 問題。
後端如果跑在別的 port，用環境變數覆蓋代理目標，不需要改任何程式碼：

```bash
API_TARGET=http://127.0.0.1:8000 npm --prefix frontend run dev
```

`backend/dev.sh` 的 port 預設是 `${PORT:-9000}`，所以 `PORT=8000 ./backend/dev.sh` 也可以。

## 測試

```bash
# 後端契約（11 項）；會自動建立並刪除 login_mockup_test，不碰正式資料庫
./backend/.venv/bin/python -m pytest backend/tests -v

# 前端（55 項：http、adapter、狀態機、驗證、元件）
npm --prefix frontend test

# 型別檢查
npm --prefix frontend run typecheck

# 正式build
npm --prefix frontend run build
```

第一次跑後端測試前要先裝開發相依：

```bash
source backend/dev.sh                      # 進 venv
pip install -qr backend/requirements-dev.txt
```

## API

四個端點共用 `{ ok, member, error }` 的回應形狀，`member` 是 `{ name, email }`。

| 方法 | 路徑 | 送出 | 成功 | 失敗 |
| --- | --- | --- | --- | --- |
| POST | `/api/member` | `{name,email,password}` | `201` + member | `409` `email_taken` |
| PUT | `/api/member/auth` | `{email,password}` | `200` + member | `401` `invalid_credentials` |
| GET | `/api/member/auth` | — | `200` `{ok,member}` | 未登入回 `ok:false` |
| DELETE | `/api/member/auth` | — | `200` `{ok:true}` | — |

輸入格式錯誤一律是 `422`，跟 `409`／`401` 是三種不同的可觀察錯誤。登入時帳號不存在與密碼錯誤回完全相同的結果，不讓人試出哪些 email 註冊過。

## 結構

```
backend/
  app/main.py                  FastAPI + mysql.connector，四個端點與 session
  tests/                       契約測試（隔離的 login_mockup_test 資料庫）

frontend/src/
  lib/http.ts                  唯一知道 fetch 怎麼設定的地方
  modules/auth/
    types.ts                   Member、錯誤碼、請求/結果型別
    auth-client.ts             唯一知道 /api/member 的 adapter
    auth-machine.ts            純狀態轉移，擋掉遲到的回應
    validate.ts                純驗證，規則對齊後端
    use-auth.ts                元件唯一需要認識的認證介面
  data/
    copy.ts                    所有使用者看得到的字串
    fields.ts                  欄位規格與各模式的組合
  components/                  每個元件一個資料夾 + CSS Module
  styles/tokens.css            深色玻璃的語意 token
```

模組的切法照 deep module 原則：介面小、實作厚、依賴從外面注入。
`useAuth` 後面藏著狀態機、HTTP adapter、請求排序與遲到回應的防護，
元件只看得到 `state` 加三個動作；測試換掉 `AuthClient` 就能跑，不需要網路。
