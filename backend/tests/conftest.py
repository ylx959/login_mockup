import mysql.connector
import pytest
from fastapi.testclient import TestClient

import app.main as backend

#跟 app/main.py 同一組連線設定，只是換一個資料庫
DB = backend.DB
TEST_DB = "login_mockup_test"

SCHEMA = """
CREATE TABLE users(
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    UNIQUE KEY email(email)
)
"""


@pytest.fixture()
def client(monkeypatch):
    """每個測試拿到一份空的 login_mockup_test，完全不碰 login_mockup。"""
    try:
        setup = mysql.connector.connect(**DB)
    except mysql.connector.Error as error:
        pytest.skip(f"需要本機 MySQL 才能跑：{error}")

    cur = setup.cursor()
    cur.execute(f"DROP DATABASE IF EXISTS {TEST_DB}")
    cur.execute(f"CREATE DATABASE {TEST_DB}")
    setup.close()

    con = mysql.connector.connect(**DB, database=TEST_DB)
    con.cursor().execute(SCHEMA)
    con.commit()

    #app/main.py 的查詢都走模組層的 con，換掉它就等於換掉整個資料庫
    monkeypatch.setattr(backend, "con", con)

    with TestClient(backend.app) as test_client:
        yield test_client

    con.close()
    teardown = mysql.connector.connect(**DB)
    teardown.cursor().execute(f"DROP DATABASE IF EXISTS {TEST_DB}")
    teardown.close()


@pytest.fixture()
def member():
    return {"name": "Ada Lovelace", "email": "ada@example.com", "password": "correct horse"}
