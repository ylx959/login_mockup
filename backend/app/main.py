#準備與資料庫連線

import mysql.connector
con=mysql.connector.connect(
    user="root",
    password="12345678",
    host="localhost",
    database="login_mockup"
)

print("Database Ready")

from fastapi import FastAPI, Request,Body,Response,status
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
import json
from pwdlib import PasswordHash #密碼加密
from pydantic import BaseModel, EmailStr, Field #email validator

app=FastAPI()
app.add_middleware(SessionMiddleware,secret_key="grgergg2")

password_hash = PasswordHash.recommended()

#連線閒置太久會被 MySQL 斷掉，每次查詢前先確認
def cursor():
    con.ping(reconnect=True)
    return con.cursor(dictionary=True)#用欄位名取值，表格欄位順序改了也不會錯

class SignupRequest(BaseModel):

    name: str = Field(min_length=2, max_length=50)

    email: EmailStr

    password: str = Field(min_length=8, max_length=128)

#登入不需要 name，所以跟註冊分開
class LoginRequest(BaseModel):

    email: EmailStr

    password: str = Field(min_length=1, max_length=128)


@app.post("/api/member")
def signup(request:Request,response:Response,body: SignupRequest):

    name = body.name.strip()

    email = body.email.lower()

    password = body.password

    hashed_password = password_hash.hash(password)

    cur=cursor()
    cur.execute("Select * from users where email=%s",[email])
    result=cur.fetchone()

    if result==None:
        cur.execute("INSERT INTO users(name,email,password_hash) VALUES (%s,%s,%s)",[name,email,hashed_password])
        con.commit()
        #註冊完直接登入，重新整理才不會掉回未登入
        request.session["member"]={"name":name,"email":email}
        response.status_code=status.HTTP_201_CREATED
        return {"ok":True,"member":request.session["member"],"error":None}
    else:#代表email 重複
        response.status_code=status.HTTP_409_CONFLICT
        return {"ok":False,"member":None,"error":"email_taken"}

#登入帳號的api
@app.put("/api/member/auth")
def login(request:Request,response:Response,body: LoginRequest):

    email = body.email.lower()
    password = body.password

    cur=cursor()
    #先只用 email 找使用者
    cur.execute(
        "SELECT * FROM users WHERE email=%s",
        [email]
    )

    result=cur.fetchone()

    #查無此人跟密碼錯誤回一模一樣的結果，不讓人試出哪些 email 註冊過
    if result==None or not password_hash.verify(password,result["password_hash"]):
        request.session["member"]=None
        response.status_code=status.HTTP_401_UNAUTHORIZED
        return {"ok":False,"member":None,"error":"invalid_credentials"}

    request.session["member"]={
        "name":result["name"],
        "email":result["email"]
    }

    return {"ok":True,"member":request.session["member"],"error":None}

#檢查登入狀態的api
@app.get("/api/member/auth")
def checkstatus(request:Request):
    if "member" in request.session and request.session["member"]!=None:
        return {"ok":True,"member":request.session["member"],"error":None}
    else:
        return {"ok":False,"member":None,"error":None}

#登出
@app.delete("/api/member/auth")
def logout(request:Request):
    request.session["member"]=None
    return {"ok":True,"member":None,"error":None}
