#準備與資料庫連線

import mysql.connector
con=mysql.connector.connect(
    user="root",
    password="12345678",
    host="localhost",
    database="login_mockup"
)

print("Database Ready")

from fastapi import FastAPI, Request,Body
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
import json

app=FastAPI()

@app.post("/api/member")
def signup(body=Body(None)):
    body=json.loads(body)

    name=body["name"]
    email=body["email"]
    password=body["password"]

    cursor=con.cursor()
    cursor.execute("INt")
    con.commit()


