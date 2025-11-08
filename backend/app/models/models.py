from sqlalchemy import (
    Column, Integer, String, ForeignKey, DateTime, UniqueConstraint, Table
)
from sqlalchemy.orm import relationship
from app.database import Base
from sqlalchemy.sql import func

request_shortlists = Table(
    "request_shortlists",
    Base.metadata,
    Column("csr_user_id", Integer, ForeignKey("csrs.user_id", ondelete="CASCADE"), primary_key=True),
    Column("request_id", Integer, ForeignKey("requests.id", ondelete="CASCADE"), primary_key=True),
    UniqueConstraint("csr_user_id", "request_id", name="uq_request_shortlist")
)

class UserAccount(Base):
    __tablename__ = "user_accounts"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    email_address = Column(String, unique=True, nullable=False)
    role = Column(String, nullable=True)
    status = Column(String, default="active")
    last_login = Column(DateTime, nullable=True)

    # One-to-one relationships with role-specific tables
    admin = relationship("UserAdmin", back_populates="user", uselist=False)
    csr = relationship("CSR", back_populates="user", uselist=False)
    pin = relationship("PIN", back_populates="user", uselist=False)
    platform = relationship("PlatformManagement", back_populates="user", uselist=False)


class UserAdmin(Base):
    __tablename__ = "user_admins"

    user_id = Column(Integer, ForeignKey("user_accounts.id"), primary_key=True)
    username = Column(String, unique=True, nullable=False)

    user = relationship("UserAccount", back_populates="admin")


class CSR(Base):
    __tablename__ = "csrs"

    user_id = Column(Integer, ForeignKey("user_accounts.id", ondelete="CASCADE"), primary_key=True)
    username = Column(String, unique=True, nullable=False)
    company = Column(String, nullable=False)

    user = relationship("UserAccount", back_populates="csr")

    # 🟩 link to requests (shortlisting)
    shortlisted_requests = relationship(
        "Request",
        secondary=request_shortlists,
        back_populates="shortlistees",
    )

    # 🟩 link to requests (assigned)
    assigned_requests = relationship(
        "Request",
        primaryjoin="Request.assigned_to==CSR.user_id",
        back_populates="assigned_csr",
    )
    
class PIN(Base):
    __tablename__ = "pins"

    user_id = Column(Integer, ForeignKey("user_accounts.id"), primary_key=True)
    username = Column(String, unique=True, nullable=False)
    assigned_to = Column(String, nullable=True)

    user = relationship("UserAccount", back_populates="pin")

    requests = relationship(
        "Request",
        back_populates="pin",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class PlatformManagement(Base):
    __tablename__ = "platform_managements"

    user_id = Column(Integer, ForeignKey("user_accounts.id"), primary_key=True)
    username = Column(String, unique=True, nullable=False)

    user = relationship("UserAccount", back_populates="platform")

class Request(Base):
    __tablename__ = "requests"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    pin_user_id = Column(
        Integer,
        ForeignKey("pins.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(String, nullable=False, default="pending")

    # 🟩 New: Foreign key to categories table
    category_id = Column(
        Integer,
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Relationship to Category model
    category = relationship("Category", back_populates="requests")

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    completed_at = Column(DateTime(timezone=True), nullable=True)

    view = Column(Integer, default=0, nullable=False)

    # 🟩 Assigned CSR link
    assigned_to = Column(
        Integer,
        ForeignKey("csrs.user_id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    
    assigned_csr = relationship(
        "CSR",
        primaryjoin="Request.assigned_to==CSR.user_id",
        foreign_keys=[assigned_to],
        back_populates="assigned_requests",  # ensure reciprocal relationship exists in CSR
    )

    # Relationship back to PIN
    pin = relationship("PIN", back_populates="requests")

    # 🟩 Many-to-many: CSRs who shortlisted this request
    shortlistees = relationship(
        "CSR",
        secondary="request_shortlists",
        back_populates="shortlisted_requests",
    )

    def __repr__(self):
        return f"<Request id={self.id}, title={self.title!r}, status={self.status!r}>"

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # 🟩 Back-reference: all requests under this category
    requests = relationship("Request", back_populates="category")