from sqlalchemy.orm import joinedload
from sqlalchemy import or_, select, insert, delete, func, case, extract
from app.database import get_db_session
from app.models.models import Request, request_shortlists, CSR, Category
from typing import Optional
from sqlalchemy.exc import SQLAlchemyError
import random
from collections import Counter
from datetime import datetime, timedelta, timezone, date

class PinRequestEntity:
    def get_pin_requests(self, id: int, filter: str):
        with get_db_session() as db:
            query = (
                db.query(Request)
                .options(
                    joinedload(Request.category),
                    joinedload(Request.shortlistees)
                )
                .filter(Request.pin_user_id == id)
            )

            # Apply search if q provided
            if filter:
                query = query.filter(
                    or_(
                        Request.title.ilike(f"%{q}%"),
                        Request.description.ilike(f"%{q}%"),
                    )
                )

            # Sort and execute
            rows = query.order_by(Request.created_at.desc()).all()

            result = []
            for r in rows:
                result.append({
                    "id": r.id,
                    "pin_user_id": r.pin_user_id,
                    "title": r.title,
                    "description": r.description,
                    "status": r.status,
                    "category_name": r.category.name if r.category else "Misc",
                    "created_at": r.created_at,
                    "updated_at": r.updated_at,
                    "view": r.view,
                    "shortlistees_count": len(r.shortlistees or []),
                    "shortlistees": [
                        {
                            "user_id": csr.csr_user_id,
                            "id": csr.id,
                            "company": csr.company
                        }
                        for csr in r.shortlistees
                    ]
                }) # Build result list
            return result # Return the list of PIN requests objects if success, and an empty list on failure
    
    def search_pin_requests(self, search_input: str, pin_user_id: int):
        with get_db_session() as db:
            try:
                # Base query with eager loads
                q = (
                    db.query(Request)
                    .options(
                        joinedload(Request.category),
                        joinedload(Request.shortlistees),
                    )
                    .filter(Request.pin_user_id == pin_user_id)
                )

                # Apply search if provided
                if search_input:
                    search_pattern = f"%{search_input}%"
                    q = q.filter(
                        or_(
                            Request.title.ilike(search_pattern),
                            Request.description.ilike(search_pattern),
                        )
                    )

                # Sort & fetch
                rows = q.order_by(Request.created_at.desc()).all()

                # Build output
                result = []
                for r in rows:
                    result.append({
                        "id": r.id,
                        "pin_user_id": r.pin_user_id,
                        "title": r.title,
                        "description": r.description,
                        "status": r.status,
                        "category_name": r.category.name if r.category else "Misc",
                        "created_at": r.created_at,
                        "updated_at": r.updated_at,
                        "view": r.view,
                        "shortlistees_count": len(r.shortlistees or []),
                        "shortlistees": [
                            {
                                "csr_user_id": csr.csr_user_id,
                                "id": csr.id,
                                "company": csr.company,
                            }
                            for csr in r.shortlistees
                        ],
                    })

                return result  # Return the list of search results

            except Exception as e:
                print(f"Error searching requests: {e}")
                return []  # empty list on failure

    
    def delete_pin_request(self, request_id: int):
        with get_db_session() as db:
            try:
                # Fetch the request
                req = db.query(Request).filter(Request.id == request_id).first()
                if not req:
                    return "Request not found" # Return str if request does not exist

                # Optional: Prevent deletion if already assigned or completed
                if req.status != "pending":
                    return f"Cannot delete a '{req.status}' request" # Return str on failure

                # Delete the request
                db.delete(req) # Mark for deletion
                db.commit() # Commit the changes
                return True  # Successful deletion
            except Exception as e:
                db.rollback()
                print(f"Error deleting request ID {request_id}: {e}")
                return f"Failed to delete request: {str(e)}" # Return str on failure

    def update_pin_request(self, request_id: int, request_data: dict):
        with get_db_session() as db:
            try:
                # Fetch the request
                req = db.query(Request).filter(Request.id == request_id).first()
                if not req:
                    return "Request not found"

                # Prevent editing completed or assigned requests
                if req.status.lower() != "pending":
                    return f"Cannot update a '{req.status}' request"

                # Extract and validate fields
                title = request_data.get("title")
                description = request_data.get("description")
                category_id = request_data.get("category_id")

                # Optional: Validate title
                if not title or not title.strip():
                    return "Title cannot be empty" # Return str on failure

                # If category provided, validate it exists
                if category_id:
                    category = db.query(Category).filter(Category.id == category_id).first()
                    if not category:
                        return f"Category with ID {category_id} does not exist" # Return str on failure

                # Apply updates
                req.title = title.strip()
                req.description = description.strip() if description else None
                req.category_id = category_id if category_id else None

                db.commit() # Commit the changes
                db.refresh(req) # Refresh the instance, reflect latest changes
                return True  # Successful update
            except Exception as e:
                db.rollback()
                print(f"Error updating request ID {request_id}: {e}")
                return f"Failed to update request: {str(e)}" # Return str on failure
            
    def create_pin_request(self, form_data: dict):
        with get_db_session() as db:
            try:
                new_request = Request(
                    pin_user_id=form_data["pin_user_id"],
                    title=form_data["title"],
                    description=form_data.get("description"),
                    category_id=form_data.get("category_id"),
                    status="pending",
                ) # Create new Request instance

                db.add(new_request) # Add new request to the session
                db.commit() # Commit the changes
                db.refresh(new_request) # Refresh the instance, reflect latest changes

                return True # Return True on successful creation

            except SQLAlchemyError as e:
                db.rollback() # Rollback in case of error
                print(f"Error creating request: {e}") # Log the error in terminal
                return f"Failed to create request: {str(e)}" # Return str on failure
            
    def get_csr_requests(self, status: Optional[str] = "pending", csr_id: Optional[int] = None):
        try:
            with get_db_session() as db:
                query = db.query(Request).options(joinedload(Request.category))

                # Shortlist filter
                if status == "shortlisted" and csr_id:
                    query = query.join(
                        request_shortlists,
                        Request.id == request_shortlists.c.request_id
                    ).filter(request_shortlists.c.csr_user_id == csr_id)
                elif status in ("pending", "assigned", "completed"):
                    query = query.filter(Request.status == status)

                query = query.order_by(Request.created_at.desc())
                rows = query.all()

                result = []
                for r in rows:
                    # Compute shortlist info safely
                    my_shortlisted = False
                    if csr_id:
                        my_shortlisted = db.query(request_shortlists).filter(
                            request_shortlists.c.csr_user_id == csr_id,
                            request_shortlists.c.request_id == r.id
                        ).first() is not None # Check if CSR has shortlisted this request

                    shortlistees_count = db.query(request_shortlists).filter(
                        request_shortlists.c.request_id == r.id
                    ).count() # Count of shortlistees

                    result.append({
                        "id": r.id,
                        "pin_user_id": r.pin_user_id,
                        "title": r.title,
                        "description": r.description,
                        "status": r.status,
                        "category_name": r.category.name if r.category else "Misc",
                        "assigned_to": r.assigned_to,
                        "created_at": r.created_at,
                        "updated_at": r.updated_at,
                        "completed_at": r.completed_at,
                        "my_shortlisted": my_shortlisted,
                        "shortlistees_count": shortlistees_count,
                    })

                return result # Return the list of CSR requests objects if success

        except Exception as e:
            print(f"❌ Error fetching CSR requests: {e}")
            return {} # Return empty list on failure
        
    def search_csr_requests(self, q: str, csr_id: int):
        try:
            with get_db_session() as db:
                query = (
                    db.query(Request)
                    .options(joinedload(Request.category))
                    .filter(
                        or_(
                            Request.title.ilike(f"%{q}%"),
                            Request.description.ilike(f"%{q}%"),
                        )
                    )
                    .order_by(Request.created_at.desc())
                )

                rows = query.all()

                # Build results
                result = []
                for r in rows:
                    my_shortlisted = False
                    if csr_id:
                        my_shortlisted = db.query(request_shortlists).filter(
                            request_shortlists.c.csr_user_id == csr_id,
                            request_shortlists.c.request_id == r.id
                        ).first() is not None # Check if CSR has shortlisted this request

                    shortlistees_count = db.query(request_shortlists).filter(
                        request_shortlists.c.request_id == r.id
                    ).count() # Count of shortlistees

                    result.append({
                        "id": r.id,
                        "pin_user_id": r.pin_user_id,
                        "title": r.title,
                        "description": r.description,
                        "status": r.status,
                        "category_name": r.category.name if r.category else "Misc",
                        "assigned_to": r.assigned_to,
                        "created_at": r.created_at,
                        "updated_at": r.updated_at,
                        "completed_at": r.completed_at,
                        "my_shortlisted": my_shortlisted,
                        "shortlistees_count": shortlistees_count,
                    })

                return result  # Return list of search results

        except Exception as e:
            print(f"Error searching CSR requests: {e}")
            return {}  # Return empty object on failure

    def shortlist_csr_requests(self, request_id: int, request_info: dict):
        csr_id = request_info.get("csr_id")
        if not csr_id:
            return "Request not found"

        try:
            with get_db_session() as db:
                req = db.query(Request).filter(Request.id == request_id).first()
                if not req:
                    return "Request not found"

                # Check if already shortlisted
                existing = db.execute(
                    select(request_shortlists).where(
                        request_shortlists.c.request_id == request_id,
                        request_shortlists.c.csr_user_id == csr_id
                    )
                ).first()

                if existing:
                    return "Request already shortlisted"

                # Insert record into association table
                db.execute(
                    insert(request_shortlists).values(
                        csr_user_id=csr_id,
                        request_id=request_id,
                    )
                )
                db.commit() # Commit the changes
                db.refresh(req) # Refresh the instance, reflect latest changes

                return True # Return True on successful addition to shortlist

        except Exception as e:
            print(f"Error adding to shortlist: {e}")
            return f"Failed to add to shortlist: {str(e)}"
        
    def remove_from_shortlist(self, request_id: int, csr_id: int):
        try:
            with get_db_session() as db:
                # Check if the record exists
                existing = db.execute(
                    select(request_shortlists).where(
                        request_shortlists.c.request_id == request_id,
                        request_shortlists.c.csr_user_id == csr_id
                    )
                ).first()

                if not existing:
                    return "Not shortlisted"

                # Delete record
                db.execute(
                    delete(request_shortlists).where(
                        request_shortlists.c.request_id == request_id,
                        request_shortlists.c.csr_user_id == csr_id
                    )
                )

                db.commit() # Commit the changes

                return True  # success

        except Exception as e:
            print(f"Error removing from shortlist: {e}")
            return f"Failed to remove from shortlist: {str(e)}"
        
    def increment_request_view(self, request_id: int):
        try:
            with get_db_session() as db:
                req = db.query(Request).filter(Request.id == request_id).first()
                if not req:
                    return "Request not found" # Return str if request does not exist

                # Only increment if status is "pending"
                if req.status and req.status.lower() == "pending":
                    req.view = (req.view or 0) + 1
                    db.commit() # Commit the changes
                    db.refresh(req) # Refresh the instance, reflect latest changes

                return True  # success

        except Exception as e:
            print(f"Error incrementing request view: {e}")
            return f"Failed to increment view: {str(e)}"
        
    def get_all_requests(self):
        try:
            with get_db_session() as db:
                # Load category + shortlistees
                requests = db.query(Request).options(
                    joinedload(Request.category),
                    joinedload(Request.shortlistees)
                ).all()

                result = []
                for req in requests:
                    result.append({
                        "id": req.id,
                        "pin_user_id": req.pin_user_id,
                        "title": req.title,
                        "description": req.description,
                        "status": req.status,
                        "category_name": req.category.name if req.category else None,
                        "created_at": req.created_at,
                        "updated_at": req.updated_at,
                        "view": req.view,
                        "shortlistees_count": len(req.shortlistees),
                        "shortlistees": [
                            {
                                "user_id": csr.user_id,
                                "username": csr.username,
                                "company": csr.company
                            }
                            for csr in req.shortlistees
                        ]
                    })

                return result # Return list of all requests

        except Exception as e:
            print(f"Error fetching all requests: {e}")
            return []  # Return empty list on failure
        
    def update_request(self, request_id: int, body: dict):
        try:
            with get_db_session() as db:
                # Fetch request + shortlistees
                req = (
                    db.query(Request)
                    .options(joinedload(Request.shortlistees))
                    .filter(Request.id == request_id)
                    .first()
                )

                if not req:
                    return "Request not found" # Return str if request does not exist

                # Handle assignment
                assigned_to = body.get("assigned_to")
                if not assigned_to:
                    if not req.shortlistees or len(req.shortlistees) == 0:
                        return "No shortlistees available to assign"
                    assigned_csr = random.choice(req.shortlistees)
                    assigned_to = assigned_csr.user_id
                else:
                    csr = db.query(CSR).filter(CSR.user_id == assigned_to).first()
                    if not csr:
                        return "CSR not found" # Return str if CSR does not exist

                # Validate status
                valid_statuses = {"pending", "assigned", "completed"}
                new_status = body.get("status", req.status)
                if new_status not in valid_statuses:
                    return "Invalid status value" # Return str on invalid status

                # Apply updates
                req.assigned_to = assigned_to
                req.status = new_status

                db.commit() # Commit the changes
                db.refresh(req) # Refresh the instance, reflect latest changes

                return True  # Success

        except Exception as e:
            print(f"Error updating request: {e}")
            return f"Failed to update request: {str(e)}" # Return str on failure
        
    def view_request(self, request_id: int):
        try:
            with get_db_session() as db:
                req = (
                    db.query(Request)
                    .options(joinedload(Request.shortlistees), joinedload(Request.category))
                    .filter(Request.id == request_id)
                    .first()
                ) # Fetch request with related data

                if not req:
                    return f"Request with ID {request_id} not found" # Return str if request does not exist

                return {
                    "id": req.id,
                    "pin_user_id": req.pin_user_id,
                    "title": req.title,
                    "description": req.description,
                    "status": req.status,
                    "category_name": req.category.name if req.category else None,
                    "created_at": req.created_at,
                    "updated_at": req.updated_at,
                    "view": req.view,
                    "shortlistees_count": len(req.shortlistees),
                    "shortlistees": [
                        {
                            "user_id": csr.user_id,
                            "username": csr.username,
                            "company": csr.company,
                        }
                        for csr in req.shortlistees
                    ],
                } # Return request details

        except Exception as e:
            print(f"Error fetching request {request_id}: {e}")
            return f"Failed to fetch request: {str(e)}" # Return str on failure

    def generate_daily_report(self):
        try:
            # Determine date
            target_date = date.today()

            start_dt = datetime.combine(target_date, datetime.min.time())
            end_dt = datetime.combine(target_date, datetime.max.time())

            with get_db_session() as db:
                # Queries
                created_today = (
                    db.query(Request)
                    .options(joinedload(Request.category))
                    .filter(Request.created_at >= start_dt, Request.created_at <= end_dt)
                )

                assigned_today = (
                    db.query(Request)
                    .options(joinedload(Request.category))
                    .filter(
                        Request.updated_at >= start_dt,
                        Request.updated_at <= end_dt,
                        Request.status == "assigned",
                    )
                )

                completed_today = (
                    db.query(Request)
                    .options(joinedload(Request.category))
                    .filter(
                        Request.completed_at >= start_dt,
                        Request.completed_at <= end_dt,
                        Request.status == "completed",
                    )
                )

                # Collect all requests with activity today
                all_requests_today = (
                    db.query(Request)
                    .options(joinedload(Request.category))
                    .filter(
                        (Request.created_at >= start_dt)
                        | (Request.updated_at >= start_dt)
                        | (Request.completed_at >= start_dt)
                    )
                    .order_by(Request.id.asc())
                    .all()
                )

                summary = {
                    "total": len(all_requests_today),
                    "created": created_today.count(),
                    "assigned": assigned_today.count(),
                    "completed": completed_today.count(),
                } # Summary dict

                requests_out = [
                    {
                        "id": r.id,
                        "title": r.title,
                        "status": r.status,
                        "category": r.category.name if r.category else "Uncategorized",
                        "created_at": r.created_at.isoformat() if r.created_at else None,
                        "updated_at": r.updated_at.isoformat() if r.updated_at else None,
                        "completed_at": r.completed_at.isoformat() if r.completed_at else None,
                    }
                    for r in all_requests_today
                ] # List of request dicts

                return {
                    "date": target_date.isoformat(),
                    "summary": summary,
                    "requests": requests_out,
                } # Return the report

        except Exception as e:
            print(f"Error generating daily report: {e}")
            return {"error": f"Failed to generate daily report: {str(e)}"} # Return str on failure
        
    def generate_weekly_report(self):
        try:
            with get_db_session() as db:
                now = datetime.now(timezone.utc)
                week_ago = now - timedelta(days=7)

                # Fetch relevant requests
                requests = (
                    db.query(Request)
                    .options(joinedload(Request.category))
                    .filter(
                        or_(
                            Request.created_at >= week_ago,
                            Request.updated_at >= week_ago,
                            Request.completed_at >= week_ago,
                            Request.updated_at >= week_ago,
                        )
                    )
                    .all()
                )

                if not requests:
                    return {
                        "range": {
                            "start": week_ago.date().isoformat(),
                            "end": now.date().isoformat(),
                        },
                        "summary": {"total": 0, "created": 0, "assigned": 0, "completed": 0},
                        "categories": {},
                        "created_by_category": {},
                        "assigned_by_category": {},
                        "completed_by_category": {},
                        "requests": [],
                    } # Return empty report if no requests
                
                # Filter requests by activity
                created = [r for r in requests if r.created_at and r.created_at >= week_ago]
                assigned = [r for r in requests if r.status == "assigned" and r.updated_at and r.updated_at >= week_ago]
                completed = [r for r in requests if r.status == "completed" and r.completed_at and r.completed_at >= week_ago]

                # Compute category counts
                categories = Counter(getattr(r.category, "name", "Uncategorized") for r in requests)
                created_by_category = Counter(getattr(r.category, "name", "Uncategorized") for r in created)
                assigned_by_category = Counter(getattr(r.category, "name", "Uncategorized") for r in assigned)
                completed_by_category = Counter(getattr(r.category, "name", "Uncategorized") for r in completed)

                return {
                    "range": {
                        "start": week_ago.date().isoformat(),
                        "end": now.date().isoformat(),
                    },
                    "summary": {
                        "total": len(requests),
                        "created": len(created),
                        "assigned": len(assigned),
                        "completed": len(completed),
                    },
                    "categories": dict(categories),
                    "created_by_category": dict(created_by_category),
                    "assigned_by_category": dict(assigned_by_category),
                    "completed_by_category": dict(completed_by_category),
                    "requests": [
                        {
                            "id": r.id,
                            "title": r.title,
                            "status": r.status,
                            "category": getattr(r.category, "name", "Uncategorized"),
                            "created_at": r.created_at.isoformat() if r.created_at else None,
                            "updated_at": r.updated_at.isoformat() if r.updated_at else None,
                            "completed_at": r.completed_at.isoformat() if r.completed_at else None,
                        }
                        for r in requests
                    ],
                } # Return the report

        except Exception as e:
            print(f"Error generating weekly report: {e}")
            return {"error": f"Failed to generate weekly report: {str(e)}"} # Return str on failure

    def generate_monthly_report(self):
        try:
            with get_db_session() as db:
                now = datetime.now(timezone.utc)
                start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

                # First day of next month
                if start_of_month.month == 12:
                    start_next_month = start_of_month.replace(year=start_of_month.year + 1, month=1)
                else:
                    start_next_month = start_of_month.replace(month=start_of_month.month + 1)

                # Previous month start
                if start_of_month.month == 1:
                    start_last_month = start_of_month.replace(year=start_of_month.year - 1, month=12)
                else:
                    start_last_month = start_of_month.replace(month=start_of_month.month - 1)

                # --- Requests for this month ---
                requests = (
                    db.query(Request)
                    .options(joinedload(Request.category))
                    .filter(Request.created_at >= start_of_month, Request.created_at < start_next_month)
                    .all()
                )

                # --- Requests last month (for growth rate) ---
                last_month_requests = (
                    db.query(Request)
                    .filter(Request.created_at >= start_last_month, Request.created_at < start_of_month)
                    .count()
                )

                total_created = len(requests)
                total_completed = len([r for r in requests if r.status == "completed"])
                completion_rate = round((total_completed / total_created * 100) if total_created else 0, 2)

                # --- Average completion time (days) ---
                avg_completion_time = (
                    db.query(
                        func.avg(
                            func.extract("epoch", Request.completed_at - Request.created_at) / 86400.0
                        )
                    )
                    .filter(
                        Request.completed_at.isnot(None),
                        Request.completed_at >= start_of_month,
                        Request.completed_at < start_next_month,
                    )
                    .scalar()
                    or 0
                )
                avg_completion_time = round(avg_completion_time, 2)

                # --- Category distribution ---
                category_counts = Counter(getattr(r.category, "name", "Uncategorized") for r in requests)
                active_categories = len(category_counts)

                # --- Growth vs last month ---
                growth_vs_last_month = (
                    round(((total_created - last_month_requests) / last_month_requests * 100), 2)
                    if last_month_requests > 0 else 0
                )

                # --- Requests by week ---
                by_week_query = (
                    db.query(
                        func.floor((func.extract("day", Request.created_at) - 1) / 7 + 1).label("week_of_month"),
                        func.count(Request.id).label("created"),
                        func.sum(case((Request.status == "completed", 1), else_=0)).label("completed")
                    )
                    .filter(Request.created_at >= start_of_month, Request.created_at < start_next_month)
                    .group_by("week_of_month")
                    .order_by("week_of_month")
                    .all()
                )

                by_week = [
                    {
                        "week": int(row.week_of_month),
                        "created": int(row.created),
                        "completed": int(row.completed or 0)
                    }
                    for row in by_week_query
                ]

                # --- Growth trend (past 6 months) ---
                six_months_ago = (start_of_month - timedelta(days=180)).replace(day=1)
                growth_trend_query = (
                    db.query(
                        extract("year", Request.created_at).label("year"),
                        extract("month", Request.created_at).label("month"),
                        func.count(Request.id).label("requests")
                    )
                    .filter(Request.created_at >= six_months_ago)
                    .group_by("year", "month")
                    .order_by("year", "month")
                    .all()
                )

                growth_trend = [
                    {
                        "month": datetime(int(row.year), int(row.month), 1).strftime("%b"),
                        "requests": int(row.requests)
                    }
                    for row in growth_trend_query
                ]

                # --- Top 5 Most Shortlisted Requests ---
                top_shortlisted_query = (
                    db.query(
                        Request.id,
                        Request.title,
                        func.count(request_shortlists.c.csr_user_id).label("shortlist_count")
                    )
                    .join(request_shortlists, Request.id == request_shortlists.c.request_id)
                    .filter(Request.created_at >= start_of_month, Request.created_at < start_next_month)
                    .group_by(Request.id)
                    .order_by(func.count(request_shortlists.c.csr_user_id).desc())
                    .limit(5)
                    .all()
                )

                top_shortlisted = [
                    {
                        "id": r.id,
                        "title": r.title,
                        "shortlist_count": int(r.shortlist_count),
                    }
                    for r in top_shortlisted_query
                ] # List of top shortlisted requests

                # Final response
                return {
                    "range": {
                        "start": start_of_month.date().isoformat(),
                        "end": start_next_month.date().isoformat(),
                    },
                    "month": start_of_month.strftime("%Y-%m"),
                    "summary": {
                        "created": total_created,
                        "completed": total_completed,
                        "completion_rate": completion_rate,
                        "avg_completion_time": avg_completion_time,
                        "active_categories": active_categories,
                        "growth_vs_last_month": growth_vs_last_month,
                    },
                    "by_week": by_week,
                    "by_category": dict(category_counts),
                    "growth_trend": growth_trend,
                    "top_shortlisted": top_shortlisted,
                    "requests": [
                        {
                            "id": r.id,
                            "title": r.title,
                            "status": r.status,
                            "category": getattr(r.category, "name", "Uncategorized"),
                            "created_at": r.created_at.isoformat() if r.created_at else None,
                            "updated_at": r.updated_at.isoformat() if r.updated_at else None,
                            "completed_at": r.completed_at.isoformat() if r.completed_at else None,
                        }
                        for r in requests
                    ],
                } # Return the report

        except Exception as e:
            print(f"Error generating monthly report: {e}")
            return {"error": f"Failed to generate monthly report: {str(e)}"} # Return str on failure


