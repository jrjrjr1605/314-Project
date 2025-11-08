from fastapi import APIRouter, Form
from app.controllers.login_controller import LoginController
from app.controllers.user_controller import getUserController, updateUserController, suspendUserController, reactivateUserController, createUserController
from app.controllers.pin_controller import getPinRequestsController, createPinRequestController
from app.controllers.csr_controller import getCSRRequestController, searchCSRRequestsController, shortlistCSRRequestController, removeShortlistCSRRequestController, incrementRequestViewController
from app.controllers.pm_controller import createCategoryController, updateCategoryController, deleteCategoryController, getCategoryController, searchCategoryController, generateWeeklyReportController, generateDailyReportController, generateMonthlyReportController
from app.controllers.assignment_controller import getAllRequestsController, updateRequestController, viewRequestController
from typing import Optional, List

router = APIRouter(prefix="/api", tags=["API"])

# ----------------- Routes -----------------

# ------------------ User Admin ------------------

@router.post("/login")
def login(username: str = Form(...), password: str = Form(...)):
    controller = LoginController()
    user = controller.login(username, password)

    return user # Return user object on success and str on failure

@router.get("/users")
def get_users():
    controller = getUserController()
    users = controller.get_all_users()

    return users # Return the list of users if success and empty list on failure

@router.put("/users/{user_id}")
def update_user(user_id: int, user_data: dict):
    controller = updateUserController()
    result = controller.update_user(user_id, user_data)

    return result # Return True on success and str on failure


@router.put("/users/suspend/{user_id}")
def suspend_user(user_id: int):
    controller = suspendUserController()
    result = controller.suspend_user(user_id)

    return result # Return True on success and str on failure

@router.put("/users/reactivate/{user_id}")
def reactivate_user(user_id: int):
    controller = reactivateUserController()
    result = controller.reactivate_user(user_id)

    return result # Return True on success and str on failure

@router.post("/users")
def create_user(user_data: dict):
    controller = createUserController() 
    result = controller.create_user(user_data)

    return result # Return True on success and str on failure

# ------------------ PIN ------------------

@router.get("/pin-requests", response_model=List)
def get_pin_requests(id: int, q: Optional[str]):
    controller = getPinRequestsController()
    result = controller.get_pin_requests(id, q)

    return result # Return the list of PIN requests objects if success and empty list on failure

@router.post("/pin-requests")
def create_pin_request(request_data: dict):
    controller = createPinRequestController()
    result = controller.create_pin_request(request_data)

    return result # Return True on success and str on failure

# ------------------ CSR ------------------

@router.get("/requests")
def get_csr_requests(status: str = "pending", csr_id: int = None):
    controller = getCSRRequestController()
    result = controller.get_csr_requests(status, csr_id)

    return result # Return the list of CSR requests objects if success and empty list on failure

@router.get("/requests/search")
def search_csr_requests(q: str, csr_id: int = None):
    controller = searchCSRRequestsController()
    result = controller.search_csr_requests(q, csr_id)

    return result # Return the list of CSR requests objects if success and empty list on failure

@router.post("/requests/{request_id}/shortlist")
def add_to_shortlist(request_id: int, request_info: dict):
    controller = shortlistCSRRequestController()
    result = controller.shortlist_csr_requests(request_id, request_info)

    return result # Return True on success and str on failure

@router.delete("/requests/{request_id}/shortlist")
def remove_from_shortlist(request_id: int, csr_id: int):
    controller = removeShortlistCSRRequestController()
    result = controller.remove_from_shortlist(request_id, csr_id)

    return result # Return True on success and str on failure

@router.post("/requests/{request_id}/view")
def increment_request_view(request_id: int):
    controller = incrementRequestViewController()
    result = controller.increment_request_view(request_id)

    return result # Return True on success and str on failure

# ------------------ PM ------------------

@router.post("/categories")
def create_category(category_info: dict):
    controller = createCategoryController()
    result = controller.create_category(category_info)

    return result # Return True on success and str on failure

@router.put("/categories/{category_id}")
def update_category(category_id: int, category_info: dict):
    controller = updateCategoryController()
    result = controller.update_category(category_id, category_info)

    return result # Return True on success and str on failure

@router.delete("/categories/{category_id}")
def delete_category(category_id: int):
    controller = deleteCategoryController()
    result = controller.delete_category(category_id)

    return result # Return True on success and str on failure

@router.get("/categories")
def get_category():
    controller = getCategoryController()
    result = controller.get_category()

    return result # Return list of categories if success and empty list on failure

@router.get("/categories/search")
def search_category(search_input: str):
    controller = searchCategoryController()
    result = controller.search_category(search_input)

    return result # Return list of matching categories if success and empty list on failure

# ------------------ Assignment ------------------

@router.get("/show-all-requests")
def get_all_requests():
    controller = getAllRequestsController()
    result = controller.get_all_requests()

    return result  # returns list of requests or []

@router.put("/requests/{request_id}")
def update_request(request_id: int, body: dict):
    controller = updateRequestController()
    result = controller.update_request(request_id, body)

    return result # Returns true on success and str on failure
    
@router.get("/show-all-requests/{request_id}")
def get_request(request_id: int):
    controller = viewRequestController()
    result = controller.view_request(request_id)

    return result # returns request object or str on failure
    
@router.get("/pm-daily-report")
def get_pm_daily_report():
    controller = generateDailyReportController()
    result = controller.generate_daily_report()

    return result # Return daily report data if success and error message on failure

@router.get("/pm-weekly-report")
def generate_weekly_report():
    controller = generateWeeklyReportController()
    result = controller.generate_weekly_report()

    return result # Return weekly report data if success and error message on failure

@router.get("/pm-monthly-report")
def get_pm_monthly_report():
    controller = generateMonthlyReportController()
    result = controller.generate_monthly_report()

    return result # Return monthly report data if success and error message on failure
