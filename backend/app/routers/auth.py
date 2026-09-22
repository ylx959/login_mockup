from fastapi import APIRouter

from ..schemas import LoginRequest, LoginResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest) -> LoginResponse:
    # TODO: 查 DB 驗證帳密
    return LoginResponse(success=False, message="not implemented")
