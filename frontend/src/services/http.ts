/**
 * 唯一知道 fetch 怎麼設定的地方。
 *
 * 介面只有一個 requestJson，但它吃下了：JSON 編解碼、cookie 設定、
 * Content-Type、非 2xx 的狀態、伺服器回非 JSON（代理錯誤頁、502）、
 * 以及連不上線。呼叫端拿到的永遠是一個可以 switch 的結果，不需要 try/catch。
 */

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type JsonResult<T> =
  | { kind: "ok"; status: number; data: T }
  | { kind: "error"; status: number; data: unknown }
  | { kind: "offline" };

export type JsonRequest = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
};

export type HttpOptions = {
  fetchImpl?: FetchLike;
};

const defaultFetch: FetchLike = (input, init) => globalThis.fetch(input, init);

export async function requestJson<T>(
  url: string,
  request: JsonRequest = {},
  { fetchImpl = defaultFetch }: HttpOptions = {},
): Promise<JsonResult<T>> {
  const { method = "GET", body } = request;

  let response: Response;
  try {
    response = await fetchImpl(url, {
      method,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    return { kind: "offline" };
  }

  // 解析失敗不能蓋掉狀態碼，錯誤分支還要靠它分辨
  const data: unknown = await response.json().catch(() => null);

  return response.ok
    ? { kind: "ok", status: response.status, data: data as T }
    : { kind: "error", status: response.status, data };
}
