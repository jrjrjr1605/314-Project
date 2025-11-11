from app.entity.request_entity import PinRequestEntity
from typing import Optional

class getPinRequestsController:
    def get_pin_requests(self, id: int, filter: str):

        entity = PinRequestEntity() # Create an instance of PinRequestEntity

        return entity.get_pin_requests(id, filter) # Call the get_pin_requests method of the entity and return the list of pin requests
    
class createPinRequestController:
    def create_pin_request(self, form_data: dict):

        entity = PinRequestEntity() # Create an instance of PinRequestEntity

        return entity.create_pin_request(form_data) # Call the create_pin_request method of the entity and return bool on success and str on failure

class searchPinRequestController:
    def search_pin_requests(self, search_input: str, pin_user_id: int):

        entity = PinRequestEntity() # Create an instance of PinRequestEntity

        return entity.search_pin_requests(search_input, pin_user_id) # Call the search_pin_requests method of the entity and return the list of pin requests

class deletePinRequestController:
    def delete_pin_request(self, request_id: int):

        entity = PinRequestEntity() # Create an instance of PinRequestEntity

        return entity.delete_pin_request(request_id) # Call the delete_pin_request method of the entity and return bool on success and str on failure
    
class updatePinRequestController:
    def update_pin_request(self, request_id: int, request_data: dict):

        entity = PinRequestEntity() # Create an instance of PinRequestEntity

        return entity.update_pin_request(request_id, request_data) # Call the update_pin_request method of the entity and return bool on success and str on failure
    
class getPinRequestViewsController:
    def get_pin_request_views(self, request_id: int):
        entity = PinRequestEntity() # Create an instance of PinRequestEntity

        return entity.get_pin_request_views(request_id) # Call the get_pin_request_views method of the entity and return bool on success and str on failure
    
class getPinRequestShortlistsController:
    def get_pin_request_shortlists(self, request_id: int):
        entity = PinRequestEntity() # Create an instance of PinRequestShortlist

        return entity.get_pin_request_shortlists(request_id)
    
class getPinRequestCompletedController:
    def get_pin_requests_completed(self):
        entity = PinRequestEntity() # Create an instance of PinRequestShortlist

        return entity.get_pin_requests_completed() # Call the get_pin_requests_completed method and return the list of completed pin request objects

class searchPinRequestCompletedController:
    def search_pin_requests_completed(self, filters: dict):
        entity = PinRequestEntity() # Create an instance of PinRequestShortlist

        return entity.search_pin_requests_completed(filters) # Call the search_pin_requests_completed method and return the list of completed pin request objects by filters
