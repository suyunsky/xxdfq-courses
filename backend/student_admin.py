"""管理员学员档案与课时账户 API。"""

from datetime import date, datetime
import re
import secrets
import string
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlalchemy import func, or_
from sqlalchemy.orm import Session as DBSession, joinedload

from auth import get_password_hash, verify_password
from dependencies import require_current_user_hybrid
from models import (
    get_db, User, StudentProfile, LessonHourAccount, LessonHourTransaction,
    Session as WebSession, SessionEvent,
)


router = APIRouter(tags=["学员课时管理"])
STUDENT_STATUSES = {"active", "paused"}
TRANSACTION_TYPES = {"add", "consume"}


def require_admin_user(
    current_user: User = Depends(require_current_user_hybrid),
) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="需要管理员权限")
    return current_user


def normalize_phone(value: str) -> str:
    phone = re.sub(r"[\s-]", "", value or "")
    if phone.startswith("+86"):
        phone = phone[3:]
    elif phone.startswith("86") and len(phone) == 13:
        phone = phone[2:]
    if not re.fullmatch(r"1[3-9]\d{9}", phone):
        raise ValueError("请输入有效的中国大陆手机号")
    return phone


def calculate_age(birth_date: date) -> int:
    today = date.today()
    return today.year - birth_date.year - (
        (today.month, today.day) < (birth_date.month, birth_date.day)
    )


def validate_student_age(birth_date: date) -> None:
    if not 6 <= calculate_age(birth_date) <= 12:
        raise HTTPException(status_code=422, detail="学员年龄需在6–12岁之间")


def mask_phone(phone: str) -> str:
    return f"{phone[:3]}****{phone[-4:]}" if len(phone) == 11 else phone


def generate_temporary_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits
    while True:
        password = "".join(secrets.choice(alphabet) for _ in range(length))
        if any(c.islower() for c in password) and any(c.isupper() for c in password) and any(c.isdigit() for c in password):
            return password


class StudentCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    username: str = Field(min_length=3, max_length=50, pattern=r"^[A-Za-z0-9_.-]+$")
    email: Optional[EmailStr] = None
    guardian_phone: str
    birth_date: date
    notes: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("full_name", "username")
    @classmethod
    def strip_required(cls, value: str) -> str:
        return value.strip()

    @field_validator("guardian_phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        return normalize_phone(value)


class StudentUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    guardian_phone: Optional[str] = None
    birth_date: Optional[date] = None
    status: Optional[Literal["active", "paused"]] = None
    notes: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("full_name")
    @classmethod
    def strip_name(cls, value: Optional[str]) -> Optional[str]:
        return value.strip() if value else value

    @field_validator("guardian_phone")
    @classmethod
    def validate_phone(cls, value: Optional[str]) -> Optional[str]:
        return normalize_phone(value) if value else value


class LessonHourChange(BaseModel):
    operation: Literal["add", "consume"]
    quantity: int = Field(ge=1, le=999)
    occurred_on: date
    reason: str = Field(min_length=2, max_length=200)
    note: Optional[str] = Field(default=None, max_length=1000)
    idempotency_key: str = Field(min_length=8, max_length=64)

    @field_validator("reason")
    @classmethod
    def strip_reason(cls, value: str) -> str:
        return value.strip()


class TransactionReverse(BaseModel):
    reason: str = Field(min_length=2, max_length=200)
    note: Optional[str] = Field(default=None, max_length=1000)
    idempotency_key: str = Field(min_length=8, max_length=64)

    @field_validator("reason")
    @classmethod
    def strip_reason(cls, value: str) -> str:
        return value.strip()


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


def get_profile_or_404(db: DBSession, student_id: int) -> StudentProfile:
    profile = db.query(StudentProfile).options(
        joinedload(StudentProfile.user), joinedload(StudentProfile.hour_account)
    ).filter(StudentProfile.id == student_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="学员不存在")
    return profile


def serialize_student(profile: StudentProfile, include_phone: bool = False) -> dict:
    account = profile.hour_account
    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "full_name": profile.user.full_name,
        "username": profile.user.username,
        "email": profile.user.email,
        "guardian_phone": profile.guardian_phone if include_phone else mask_phone(profile.guardian_phone),
        "birth_date": profile.birth_date.isoformat(),
        "age": calculate_age(profile.birth_date),
        "status": profile.status,
        "notes": profile.notes,
        "lesson_balance": account.balance if account else 0,
        "must_change_password": profile.user.must_change_password,
        "created_at": profile.created_at.isoformat(),
        "updated_at": profile.updated_at.isoformat(),
    }


def serialize_transaction(tx: LessonHourTransaction, reversed_ids: set[int] | None = None) -> dict:
    operator_name = (tx.operator.full_name or tx.operator.username) if tx.operator else "管理员"
    return {
        "id": tx.id,
        "transaction_type": tx.transaction_type,
        "quantity_delta": tx.quantity_delta,
        "balance_after": tx.balance_after,
        "occurred_on": tx.occurred_on.isoformat(),
        "reason": tx.reason,
        "note": tx.note,
        "operator": operator_name,
        "reversal_of_id": tx.reversal_of_id,
        "is_reversed": tx.id in (reversed_ids or set()),
        "created_at": tx.created_at.isoformat(),
    }


@router.get("/api/student/dashboard")
def get_student_dashboard(
    db: DBSession = Depends(get_db),
    current_user: User = Depends(require_current_user_hybrid),
):
    """返回当前登录用户自己的学员档案和课时数据。"""
    response = {
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "full_name": current_user.full_name,
            "email": current_user.email,
            "role": current_user.role,
            "must_change_password": current_user.must_change_password,
        },
        "profile": None,
        "lesson_hours": None,
    }

    profile = db.query(StudentProfile).options(
        joinedload(StudentProfile.hour_account)
    ).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        return response

    response["profile"] = {
        "birth_date": profile.birth_date.isoformat(),
        "age": calculate_age(profile.birth_date),
        "status": profile.status,
        "guardian_phone_masked": mask_phone(profile.guardian_phone),
    }

    account = profile.hour_account
    if not account:
        return response

    transactions = db.query(LessonHourTransaction).options(
        joinedload(LessonHourTransaction.operator)
    ).filter(
        LessonHourTransaction.account_id == account.id
    ).order_by(
        LessonHourTransaction.occurred_on.desc(),
        LessonHourTransaction.created_at.desc(),
        LessonHourTransaction.id.desc(),
    ).limit(10).all()
    transaction_ids = [transaction.id for transaction in transactions]
    reversed_ids = {
        row[0] for row in db.query(LessonHourTransaction.reversal_of_id).filter(
            LessonHourTransaction.account_id == account.id,
            LessonHourTransaction.reversal_of_id.in_(transaction_ids),
        ).all() if row[0] is not None
    } if transaction_ids else set()

    response["lesson_hours"] = {
        "balance": account.balance,
        "recent_transactions": [
            {
                "id": transaction.id,
                "transaction_type": transaction.transaction_type,
                "quantity_delta": transaction.quantity_delta,
                "balance_after": transaction.balance_after,
                "occurred_on": transaction.occurred_on.isoformat(),
                "reason": transaction.reason,
                "operator": (
                    transaction.operator.full_name or transaction.operator.username
                ) if transaction.operator else "管理员",
                "is_reversed": transaction.id in reversed_ids,
            }
            for transaction in transactions
        ],
    }
    return response


@router.get("/api/admin/students")
def list_students(
    query: Optional[str] = None,
    student_status: Optional[str] = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: DBSession = Depends(get_db),
    _: User = Depends(require_admin_user),
):
    if student_status and student_status not in STUDENT_STATUSES:
        raise HTTPException(status_code=422, detail="无效的学员状态")

    base = db.query(StudentProfile).join(User, StudentProfile.user_id == User.id)
    if query and query.strip():
        keyword = f"%{query.strip()}%"
        base = base.filter(or_(
            User.full_name.like(keyword), User.username.like(keyword),
            StudentProfile.guardian_phone.like(keyword),
        ))
    if student_status:
        base = base.filter(StudentProfile.status == student_status)

    total = base.count()
    profiles = base.options(
        joinedload(StudentProfile.user), joinedload(StudentProfile.hour_account)
    ).order_by(StudentProfile.updated_at.desc(), StudentProfile.id.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()

    items = []
    for profile in profiles:
        item = serialize_student(profile)
        last_transaction = db.query(LessonHourTransaction).filter(
            LessonHourTransaction.account_id == profile.hour_account.id
        ).order_by(LessonHourTransaction.created_at.desc()).first() if profile.hour_account else None
        item["last_transaction_at"] = last_transaction.created_at.isoformat() if last_transaction else None
        items.append(item)

    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.post("/api/admin/students", status_code=status.HTTP_201_CREATED)
def create_student(
    data: StudentCreate,
    db: DBSession = Depends(get_db),
    admin: User = Depends(require_admin_user),
):
    validate_student_age(data.birth_date)
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=409, detail="用户名已存在")
    if data.email and db.query(User).filter(User.email == str(data.email)).first():
        raise HTTPException(status_code=409, detail="邮箱已存在")

    temporary_password = generate_temporary_password()
    try:
        user = User(
            username=data.username,
            email=str(data.email) if data.email else None,
            password_hash=get_password_hash(temporary_password),
            full_name=data.full_name,
            role="student",
            is_active=True,
            must_change_password=True,
        )
        db.add(user)
        db.flush()
        profile = StudentProfile(
            user_id=user.id,
            guardian_phone=data.guardian_phone,
            birth_date=data.birth_date,
            status="active",
            notes=data.notes.strip() if data.notes else None,
            created_by_user_id=admin.id,
        )
        db.add(profile)
        db.flush()
        account = LessonHourAccount(student_profile_id=profile.id, balance=0)
        db.add(account)
        db.commit()
        db.refresh(profile)
    except Exception:
        db.rollback()
        raise

    return {"student": serialize_student(get_profile_or_404(db, profile.id), include_phone=True), "temporary_password": temporary_password}


@router.get("/api/admin/students/{student_id}")
def get_student(
    student_id: int,
    db: DBSession = Depends(get_db),
    _: User = Depends(require_admin_user),
):
    return serialize_student(get_profile_or_404(db, student_id), include_phone=True)


@router.put("/api/admin/students/{student_id}")
def update_student(
    student_id: int,
    data: StudentUpdate,
    db: DBSession = Depends(get_db),
    _: User = Depends(require_admin_user),
):
    profile = get_profile_or_404(db, student_id)
    changes = data.model_dump(exclude_unset=True)
    if "birth_date" in changes:
        validate_student_age(changes["birth_date"])
    if "full_name" in changes:
        profile.user.full_name = changes.pop("full_name")
    for field, value in changes.items():
        setattr(profile, field, value.strip() if field == "notes" and value else value)
    db.commit()
    db.refresh(profile)
    return serialize_student(get_profile_or_404(db, profile.id), include_phone=True)


@router.get("/api/admin/students/{student_id}/lesson-hour-transactions")
def list_lesson_hour_transactions(
    student_id: int,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: DBSession = Depends(get_db),
    _: User = Depends(require_admin_user),
):
    profile = get_profile_or_404(db, student_id)
    query = db.query(LessonHourTransaction).options(
        joinedload(LessonHourTransaction.operator)
    ).filter(LessonHourTransaction.account_id == profile.hour_account.id)
    total = query.count()
    rows = query.order_by(
        LessonHourTransaction.created_at.desc(), LessonHourTransaction.id.desc()
    ).offset((page - 1) * page_size).limit(page_size).all()
    reversed_ids = {
        row[0] for row in db.query(LessonHourTransaction.reversal_of_id).filter(
            LessonHourTransaction.account_id == profile.hour_account.id,
            LessonHourTransaction.reversal_of_id.isnot(None),
        ).all()
    }
    return {
        "items": [serialize_transaction(row, reversed_ids) for row in rows],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("/api/admin/students/{student_id}/lesson-hours")
def change_lesson_hours(
    student_id: int,
    data: LessonHourChange,
    db: DBSession = Depends(get_db),
    admin: User = Depends(require_admin_user),
):
    profile = get_profile_or_404(db, student_id)
    account = db.query(LessonHourAccount).filter(
        LessonHourAccount.id == profile.hour_account.id
    ).with_for_update().one()
    existing = db.query(LessonHourTransaction).filter(
        LessonHourTransaction.idempotency_key == data.idempotency_key
    ).first()
    if existing:
        if existing.account_id != account.id:
            raise HTTPException(status_code=409, detail="请求标识已被其他课时账户使用")
        return {"balance": account.balance, "transaction": serialize_transaction(existing)}

    delta = data.quantity if data.operation == "add" else -data.quantity
    new_balance = account.balance + delta
    if new_balance < 0:
        raise HTTPException(status_code=409, detail="剩余课时不足，无法消课")

    transaction = LessonHourTransaction(
        account_id=account.id,
        transaction_type=data.operation,
        quantity_delta=delta,
        balance_after=new_balance,
        occurred_on=data.occurred_on,
        reason=data.reason,
        note=data.note.strip() if data.note else None,
        operator_user_id=admin.id,
        idempotency_key=data.idempotency_key,
    )
    account.balance = new_balance
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return {"balance": account.balance, "transaction": serialize_transaction(transaction)}


@router.post("/api/admin/lesson-hour-transactions/{transaction_id}/reverse")
def reverse_lesson_hour_transaction(
    transaction_id: int,
    data: TransactionReverse,
    db: DBSession = Depends(get_db),
    admin: User = Depends(require_admin_user),
):
    original = db.query(LessonHourTransaction).filter(
        LessonHourTransaction.id == transaction_id
    ).first()
    if not original:
        raise HTTPException(status_code=404, detail="课时流水不存在")
    if original.transaction_type == "reversal":
        raise HTTPException(status_code=409, detail="冲正流水不能再次冲正")

    account = db.query(LessonHourAccount).filter(
        LessonHourAccount.id == original.account_id
    ).with_for_update().one()
    existing_key = db.query(LessonHourTransaction).filter(
        LessonHourTransaction.idempotency_key == data.idempotency_key
    ).first()
    if existing_key:
        if existing_key.account_id != account.id:
            raise HTTPException(status_code=409, detail="请求标识已被其他课时账户使用")
        return {"balance": account.balance, "transaction": serialize_transaction(existing_key)}
    if db.query(LessonHourTransaction).filter(
        LessonHourTransaction.reversal_of_id == original.id
    ).first():
        raise HTTPException(status_code=409, detail="该流水已经冲正")

    delta = -original.quantity_delta
    new_balance = account.balance + delta
    if new_balance < 0:
        raise HTTPException(status_code=409, detail="当前余额不足，无法冲正该添加记录")

    reversal = LessonHourTransaction(
        account_id=account.id,
        transaction_type="reversal",
        quantity_delta=delta,
        balance_after=new_balance,
        occurred_on=date.today(),
        reason=data.reason,
        note=data.note.strip() if data.note else None,
        operator_user_id=admin.id,
        reversal_of_id=original.id,
        idempotency_key=data.idempotency_key,
    )
    account.balance = new_balance
    db.add(reversal)
    db.commit()
    db.refresh(reversal)
    return {"balance": account.balance, "transaction": serialize_transaction(reversal)}


@router.post("/api/admin/students/{student_id}/reset-password")
def reset_student_password(
    student_id: int,
    db: DBSession = Depends(get_db),
    _: User = Depends(require_admin_user),
):
    profile = get_profile_or_404(db, student_id)
    temporary_password = generate_temporary_password()
    profile.user.password_hash = get_password_hash(temporary_password)
    profile.user.must_change_password = True
    db.query(SessionEvent).filter(SessionEvent.user_id == profile.user_id).delete(synchronize_session=False)
    db.query(WebSession).filter(WebSession.user_id == profile.user_id).delete(synchronize_session=False)
    db.commit()
    return {"temporary_password": temporary_password, "must_change_password": True}


@router.post("/api/auth/change-password")
def change_password(
    data: PasswordChange,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(require_current_user_hybrid),
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=422, detail="当前密码不正确")
    if data.current_password == data.new_password:
        raise HTTPException(status_code=422, detail="新密码不能与当前密码相同")
    current_user.password_hash = get_password_hash(data.new_password)
    current_user.must_change_password = False
    db.commit()
    return {"success": True, "must_change_password": False}
