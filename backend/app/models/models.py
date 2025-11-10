from sqlalchemy import (
    Column, Integer, String, ForeignKey, DateTime, UniqueConstraint, Table
)
from sqlalchemy.orm import relationship
from app.database import Base
from sqlalchemy.sql import func


# ===============================================================
# 🧩 Association Table (Many-to-Many between CSR and Request)
# ===============================================================
request_shortlists = Table(
    "request_shortlists",
    Base.metadata,
    Column("csr_user_id", Integer, ForeignKey("csrs.csr_user_id", ondelete="CASCADE"), primary_key=True),
    Column("request_id", Integer, ForeignKey("requests.id", ondelete="CASCADE"), primary_key=True),
    UniqueConstraint("csr_user_id", "request_id", name="uq_request_shortlist")
)


# ===============================================================
# 🧱 User Profiles (Linked to UserAccount.role)
# ===============================================================
class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    status = Column(String, default="active", nullable=False)  # only 'active' or 'suspended'

    # 🟩 Relationship back to UserAccount
    user_accounts = relationship("UserAccount", back_populates="profile")


# ===============================================================
# 🧱 User Accounts (Base Table)
# ===============================================================
class UserAccount(Base):
    __tablename__ = "user_accounts"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    email_address = Column(String, unique=True, nullable=False)
    role = Column(Integer, ForeignKey("user_profiles.id", ondelete="SET NULL"), nullable=True)
    status = Column(String, default="active")
    last_login = Column(DateTime, nullable=True)

    # 🔗 Link to profile
    profile = relationship("UserProfile", back_populates="user_accounts")

    # One-to-one relationships
    csr = relationship("CSR", back_populates="user", uselist=False)
    pin = relationship("PIN", back_populates="user", uselist=False)


# ===============================================================
# 🧩 CSR (Customer Service Representative)
# ===============================================================
class CSR(Base):
    __tablename__ = "csrs"

    csr_user_id = Column(Integer, primary_key=True, autoincrement=True)
    id = Column(Integer, ForeignKey("user_accounts.id", ondelete="CASCADE"), nullable=False)
    company = Column(String, nullable=False)

    user = relationship("UserAccount", back_populates="csr")

    shortlisted_requests = relationship(
        "Request",
        secondary=request_shortlists,
        back_populates="shortlistees",
    )

    assigned_requests = relationship(
        "Request",
        primaryjoin="Request.assigned_to==CSR.csr_user_id",
        back_populates="assigned_csr",
    )


# ===============================================================
# 🧍 PIN User
# ===============================================================
class PIN(Base):
    __tablename__ = "pins"

    pin_user_id = Column(Integer, primary_key=True, autoincrement=True)
    id = Column(Integer, ForeignKey("user_accounts.id", ondelete="CASCADE"), nullable=False)

    user = relationship("UserAccount", back_populates="pin")

    requests = relationship(
        "Request",
        back_populates="pin",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


# ===============================================================
# 🗂 Categories
# ===============================================================
class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    requests = relationship("Request", back_populates="category")


# ===============================================================
# 📋 Requests
# ===============================================================
class Request(Base):
    __tablename__ = "requests"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    pin_user_id = Column(
        Integer,
        ForeignKey("pins.pin_user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(String, nullable=False, default="pending")

    category_id = Column(
        Integer,
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    view = Column(Integer, default=0, nullable=False)

    assigned_to = Column(
        Integer,
        ForeignKey("csrs.csr_user_id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    assigned_csr = relationship(
        "CSR",
        primaryjoin="Request.assigned_to==CSR.csr_user_id",
        foreign_keys=[assigned_to],
        back_populates="assigned_requests",
    )

    pin = relationship("PIN", back_populates="requests")

    shortlistees = relationship(
        "CSR",
        secondary=request_shortlists,
        back_populates="shortlisted_requests",
    )

    category = relationship("Category", back_populates="requests")

    def __repr__(self):
        return f"<Request id={self.id}, title={self.title!r}, status={self.status!r}>"
