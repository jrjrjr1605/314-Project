from fastapi import APIRouter, Form, Body
from app.controllers.login_controller import LoginController
from app.controllers.user_controller import getUserController, updateUserController, suspendUserController, reactivateUserController, createUserController, searchUserController, getUserProfilesController, createUserProfilesController, updateUserProfilesController, suspendUserProfilesController, reactivateUserProfilesController, searchUserProfilesController
from app.controllers.pin_controller import getPinRequestsController, createPinRequestController, searchPinRequestController, deletePinRequestController, updatePinRequestController, getPinRequestViewsController, getPinRequestShortlistsController, getPinRequestCompletedController, searchPinRequestCompletedController
from app.controllers.csr_controller import getCSRRequestAvailableController, searchCSRRequestAvailableController, shortlistCSRRequestController, removeShortlistCSRRequestController, incrementRequestViewController, searchCSRRequestShortlistedController, getCSRRequestShortlistedController, getCSRRequestCompletedController, searchCSRRequestCompletedController
from app.controllers.pm_controller import createCategoryController, updateCategoryController, deleteCategoryController, getCategoryController, searchCategoryController, generateWeeklyReportController, generateDailyReportController, generateMonthlyReportController
from app.controllers.assignment_controller import getAllRequestsController, updateRequestController, viewRequestController
from typing import Optional, List, Dict

router = APIRouter(prefix="/api", tags=["API"])

# ----------------- Routes -----------------

# ------------------ User Admin ------------------

# Login
@router.post("/login")
def login(username: str = Form(...), password: str = Form(...)):
    controller = LoginController()
    user = controller.login(username, password)

    return user # Return user object on success and str on failure

# View
@router.get("/users")
def get_all_users():
    controller = getUserController()
    users = controller.get_all_users()

    return users # Return the list of users if success and empty list on failure

# Update
@router.put("/users/{user_id}")
def update_user(user_id: int, user_data: dict):
    controller = updateUserController()
    result = controller.update_user(user_id, user_data)

    return result # Return True on success and str on failure

# Suspend
@router.put("/users/suspend/{user_id}")
def suspend_user(user_id: int):
    controller = suspendUserController()
    result = controller.suspend_user(user_id)

    return result # Return True on success and str on failure

# Reactivate
@router.put("/users/reactivate/{user_id}")
def reactivate_user(user_id: int):
    controller = reactivateUserController()
    result = controller.reactivate_user(user_id)

    return result # Return True on success and str on failure

# Create
@router.post("/users")
def create_user(user_data: dict):
    controller = createUserController() 
    result = controller.create_user(user_data)

    return result # Return True on success and str on failure

# Search
@router.get("/users/search")
def search_users(search_input: str):
    controller = searchUserController()
    result = controller.search_users(search_input)

    return result # Return the list of matching users if success and empty list on failure

# View
@router.get("/user_profiles/")
def get_user_profiles():
    controller = getUserProfilesController()
    result = controller.get_user_profiles()

    return result # Return the list of user profiles if success and empty list on failure

# Create
@router.post("/user_profiles/")
def create_user_profile(profile_data: dict):
    controller = createUserProfilesController()
    result = controller.create_user_profile(profile_data)

    return result # Return True on success and str on failure

# Update
@router.put("/user_profiles/{profile_id}")
def update_user_profile(profile_id: int, profile_data: dict):
    controller = updateUserProfilesController()
    result = controller.update_user_profile(profile_id, profile_data)

    return result # Return True on success and str on failure

# Suspend
@router.put("/user_profiles/suspend/{profile_id}")
def suspend_user_profile(profile_id: int):
    controller = suspendUserProfilesController()
    result = controller.suspend_user_profile(profile_id)

    return result # Return True on success and str on failure

# Reactivate
@router.put("/user_profiles/reactivate/{profile_id}")
def reactivate_user_profile(profile_id: int):
    controller = reactivateUserProfilesController()
    result = controller.reactivate_user_profile(profile_id)

    return result # Return True on success and str on failure

# Search
@router.get("/user_profiles/search")
def search_user_profiles(search_input: str):
    controller = searchUserProfilesController()
    result = controller.search_user_profiles(search_input)

    return result # Return the list of matching user profiles if success and empty list on failure

# ------------------ PIN ------------------

# View
@router.get("/pin-requests")
def get_pin_requests(id: int, filter: str = ""): # filter is optional search query, and set to none on default
    controller = getPinRequestsController()
    result = controller.get_pin_requests(id, filter)

    return result # Return the list of PIN requests objects if success and empty list on failure

# Search
@router.get("/pin-requests/search")
def search_pin_requests(search_input: str, pin_user_id: int):
    controller = searchPinRequestController()
    result = controller.search_pin_requests(search_input, pin_user_id)

    return result # Return the list of PIN requests objects if success and empty list on failure

# Create
@router.post("/pin-requests")
def create_pin_request(form_data: dict):
    controller = createPinRequestController()
    result = controller.create_pin_request(form_data)

    return result # Return True on success and str on failure

# Delete
@router.delete("/pin-requests/{request_id}")
def delete_pin_request(request_id: int):
    controller = deletePinRequestController()
    result = controller.delete_pin_request(request_id)

    return result # Return True on success and str on failure

# Update
@router.put("/pin-requests/{request_id}")
def update_pin_request(request_id: int, request_data: dict):
    controller = updatePinRequestController()
    result = controller.update_pin_request(request_id, request_data)

    return result # Return True on success and str on failure

# Number of views
@router.get("/pin-request-views")
def get_pin_request_views(request_id: int):
    controller = getPinRequestViewsController()
    result = controller.get_pin_request_views(request_id)

    return result # Return int when success and str on failure

# Number of shortlists
@router.get("/pin-request-shortlists")
def get_pin_request_shortlists(request_id: int):
    controller = getPinRequestShortlistsController()
    result = controller.get_pin_request_shortlists(request_id)

    return result # Return int when success and str on failure

# View completed requests
@router.get("/requests/completed/pin")
def get_pin_requests_completed():
    controller = getPinRequestCompletedController()
    result = controller.get_pin_requests_completed()

    return result # Return the list of completed PIN requests if success and empty list on failure

# Search completed requests
@router.post("/requests/search/completed/pin")
def search_pin_requests_completed(filters: dict = Body(...)):
    controller = searchPinRequestCompletedController()
    result = controller.search_pin_requests_completed(filters)

    return result # Return the list of completed PIN requests if success and empty list on failure

# ------------------ CSR ------------------

# View available requests
@router.get("/requests/available")
def get_csr_requests_available(csr_user_id: int = None):
    controller = getCSRRequestAvailableController()
    result = controller.get_csr_requests_available(csr_user_id)

    return result # Return the list of CSR requests objects if success and empty list on failure

# View shortlisted requests
@router.get("/requests/shortlisted")
def get_csr_requests_shortlisted(csr_user_id: int = None):
    controller = getCSRRequestShortlistedController()
    result = controller.get_csr_requests_shortlisted(csr_user_id)

    return result # Return the list of CSR requests objects if success and empty list on failure

# Search for available requests
@router.get("/requests/search/available")
def search_csr_requests_available(search_input: str, csr_user_id: int = None):
    controller = searchCSRRequestAvailableController()
    result = controller.search_csr_requests_available(search_input, csr_user_id)

    return result # Return the list of CSR requests objects if success and empty list on failure

# Search for shortlisted requests
@router.get("/requests/search/shortlisted")
def search_csr_requests_shortlisted(search_input: str, csr_user_id: int = None):
    controller = searchCSRRequestShortlistedController()
    result = controller.search_csr_requests_shortlisted(search_input, csr_user_id)

    return result # Return the list of CSR requests objects if success and empty list on failure

# Shortlist/Save
@router.post("/requests/{request_id}/shortlist")
def add_to_shortlist(request_id: int, request_info: dict):
    controller = shortlistCSRRequestController()
    result = controller.shortlist_csr_requests(request_id, request_info)

    return result # Return True on success and str on failure

# Remove shortlist/unsave
@router.delete("/requests/{request_id}/shortlist")
def remove_from_shortlist(request_id: int, csr_id: int):
    controller = removeShortlistCSRRequestController()
    result = controller.remove_from_shortlist(request_id, csr_id)

    return result # Return True on success and str on failure

# Increment view count
@router.post("/requests/{request_id}/view")
def increment_request_view(request_id: int):
    controller = incrementRequestViewController()
    result = controller.increment_request_view(request_id)

    return result # Return True on success and str on failure

# View completed requests
@router.get("/requests/completed/csr")
def get_csr_requests_completed():
    controller = getCSRRequestCompletedController()
    result = controller.get_csr_requests_completed()

    return result # Return the list of completed CSR requests if success and empty list on failure

# Search completed requests
@router.post("/requests/search/completed/csr")
def search_completed_requests(filters: dict = Body(...)):
    controller = searchCSRRequestCompletedController()
    result = controller.search_csr_requests_completed(filters)

    return result # Return the list of completed CSR requests if success and empty list on failure

# ------------------ PM ------------------

# Create
@router.post("/categories")
def create_category(category_info: dict):
    controller = createCategoryController()
    result = controller.create_category(category_info)

    return result # Return True on success and str on failure

# Update
@router.put("/categories/{category_id}")
def update_category(category_id: int, category_info: dict):
    controller = updateCategoryController()
    result = controller.update_category(category_id, category_info)

    return result # Return True on success and str on failure

# Delete
@router.delete("/categories/{category_id}")
def delete_category(category_id: int):
    controller = deleteCategoryController()
    result = controller.delete_category(category_id)

    return result # Return True on success and str on failure

# View
@router.get("/categories")
def get_category():
    controller = getCategoryController()
    result = controller.get_category()

    return result # Return list of categories if success and empty list on failure

# Search
@router.get("/categories/search")
def search_category(search_input: str):
    controller = searchCategoryController()
    result = controller.search_category(search_input)

    return result # Return list of matching categories if success and empty list on failure

# Generate daily report
@router.get("/pm-daily-report")
def generate_pm_daily_report():
    controller = generateDailyReportController()
    result = controller.generate_pm_daily_report()

    return result # Return daily report data if success and error message on failure

# Generate weekly report
@router.get("/pm-weekly-report")
def generate_pm_weekly_report():
    controller = generateWeeklyReportController()
    result = controller.generate_pm_weekly_report()

    return result # Return weekly report data if success and error message on failure

# Generate monthly report
@router.get("/pm-monthly-report")
def generate_pm_monthly_report():
    controller = generateMonthlyReportController()
    result = controller.generate_pm_monthly_report()

    return result # Return monthly report data if success and error message on failure

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
