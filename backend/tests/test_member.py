"""/api/member 的請求、回應與 session 行為（spec 的後端契約）。"""

MEMBER = {"name": "Ada Lovelace", "email": "ada@example.com"}


def test_sign_up_creates_member_and_starts_session(client, member):
    res = client.post("/api/member", json=member)

    assert res.status_code == 201
    assert res.json() == {"ok": True, "member": MEMBER, "error": None}
    #註冊完就是登入狀態，重新整理不會掉回未登入
    assert client.get("/api/member/auth").json()["member"] == MEMBER


def test_sign_up_rejects_duplicate_email(client, member):
    client.post("/api/member", json=member)

    res = client.post("/api/member", json={**member, "name": "Someone Else"})

    assert res.status_code == 409
    assert res.json() == {"ok": False, "member": None, "error": "email_taken"}


def test_sign_up_rejects_invalid_input(client):
    short_password = client.post(
        "/api/member", json={"name": "Ada", "email": "ada@example.com", "password": "short"}
    )
    bad_email = client.post(
        "/api/member", json={"name": "Ada", "email": "nope", "password": "long enough"}
    )

    #422 跟 409 / 401 是三種不同的可觀察錯誤
    assert short_password.status_code == 422
    assert bad_email.status_code == 422


def test_sign_in_does_not_require_a_name(client, member):
    client.post("/api/member", json=member)
    client.delete("/api/member/auth")

    res = client.put(
        "/api/member/auth", json={"email": member["email"], "password": member["password"]}
    )

    assert res.status_code == 200
    assert res.json() == {"ok": True, "member": MEMBER, "error": None}


def test_sign_in_hides_whether_the_email_exists(client, member):
    client.post("/api/member", json=member)
    client.delete("/api/member/auth")

    wrong_password = client.put(
        "/api/member/auth", json={"email": member["email"], "password": "not the password"}
    )
    unknown_email = client.put(
        "/api/member/auth", json={"email": "nobody@example.com", "password": "not the password"}
    )

    assert wrong_password.status_code == unknown_email.status_code == 401
    assert wrong_password.json() == unknown_email.json()
    assert wrong_password.json()["error"] == "invalid_credentials"


def test_sign_in_normalises_email_case(client, member):
    client.post("/api/member", json=member)
    client.delete("/api/member/auth")

    res = client.put(
        "/api/member/auth", json={"email": "ADA@Example.com", "password": member["password"]}
    )

    assert res.json()["ok"] is True


def test_failed_sign_in_leaves_the_session_anonymous(client, member):
    client.post("/api/member", json=member)
    client.delete("/api/member/auth")

    client.put("/api/member/auth", json={"email": member["email"], "password": "wrong"})

    assert client.get("/api/member/auth").json()["ok"] is False


def test_session_read_is_anonymous_without_a_cookie(client):
    res = client.get("/api/member/auth")

    assert res.status_code == 200
    assert res.json() == {"ok": False, "member": None, "error": None}


def test_session_survives_across_requests(client, member):
    client.post("/api/member", json=member)

    #連續讀兩次都要維持登入
    assert client.get("/api/member/auth").json()["ok"] is True
    assert client.get("/api/member/auth").json()["ok"] is True


def test_sign_out_clears_the_session_and_is_repeatable(client, member):
    client.post("/api/member", json=member)

    first = client.delete("/api/member/auth")
    second = client.delete("/api/member/auth")

    assert first.json() == {"ok": True, "member": None, "error": None}
    assert second.json()["ok"] is True
    assert client.get("/api/member/auth").json()["ok"] is False


def test_password_is_never_returned(client, member):
    signed_up = client.post("/api/member", json=member)
    session = client.get("/api/member/auth")

    assert member["password"] not in signed_up.text
    assert member["password"] not in session.text
