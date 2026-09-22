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
from pwdlib import PasswordHash #密碼加密
from pydantic import BaseModel, EmailStr, Field #email validator

app=FastAPI()
app.add_middleware(SessionMiddleware,secret_key="grgergg2")

password_hash = PasswordHash.recommended()

class SignupRequest(BaseModel):

    name: str = Field(min_length=2, max_length=50)

    email: EmailStr

    password: str = Field(min_length=8, max_length=128)



@app.post("/api/member")
def signup(body: SignupRequest):

    name = body.name.strip()

    email = body.email.lower()

    password = body.password

    hashed_password = password_hash.hash(password)
    
    cursor=con.cursor()
    cursor.execute("Select * from users where email=%s",[email])
    result=cursor.fetchone()

    if result==None:
        cursor.execute("INSERT INTO users(name,email,password_hash) VALUES (%s,%s,%s)",[name,email,hashed_password])
        con.commit()
        return {"ok":True}
    else:#代表email 重複
        return  {"ok":False}

#登入帳號的api
@app.put("/api/member/auth")
def login(request:Request,body: SignupRequest):

    email = body.email.lower()
    password = body.password

    cursor=con.cursor()
    #先只用 email 找使用者
    cursor.execute(
        "SELECT * FROM users WHERE email=%s",
        [email]
    )

    result=cursor.fetchone()

    if result==None:
        request.session["member"]=None
        return {"ok":False}

    stored_hash=result[3]

    # 驗證密碼
    if not password_hash.verify(password,stored_hash):
        request.session["member"]=None
        return {"ok":False}

    request.session["member"]={
        "name":result[1],
        "email":result[2]
    }

    return {"ok":True}

#檢查登入狀態的api
@app.get("/api/member/auth")
def checkstatus(request:Request):
    if "member" in request.session and request.session["member"]!=None:
        member=request.session["member"]
        return {"ok":True,"name":member["name"],"email":member["email"]}
    else:
        return {"ok":False}

#登出
@app.delete("/api/member/auth")
def logout(request:Request):
    request.session["member"]=None
    return {"ok":True}
    


