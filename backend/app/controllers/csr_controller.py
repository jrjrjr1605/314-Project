from app.entity.request_entity import PinRequestEntity
from typing import Optional

class getCSRRequestAvailableController:
    def get_csr_requests_available(self, csr_user_id: int):

        entity = PinRequestEntity() # Create an instance of PinRequestEntity

        return entity.get_csr_requests_available(csr_user_id) # Call the get_csr_requests_available method of the entity and return the list of CSR requests

class getCSRRequestShortlistedController:
    def get_csr_requests_shortlisted(self, csr_user_id: int):

        entity = PinRequestEntity() # Create an instance of PinRequestEntity

        return entity.get_csr_requests_shortlisted(csr_user_id) # Call the get_csr_requests_shortlisted method of the entity and return the list of CSR requests

class searchCSRRequestAvailableController:
    def search_csr_requests_available(self, search_input, csr_user_id: int):

        entity = PinRequestEntity() # Create an instance of PinRequestEntity

        return entity.search_csr_requests_available(search_input, csr_user_id) # Call the search_csr_requests_available method of the entity and return the list of CSR requests
    
class searchCSRRequestShortlistedController:
    def search_csr_requests_shortlisted(self, search_input, csr_user_id: int):

        entity = PinRequestEntity() # Create an instance of PinRequestEntity

        return entity.search_csr_requests_shortlisted(search_input, csr_user_id) # Call the search_csr_requests_shortlisted method of the entity and return the list of CSR requests

class shortlistCSRRequestController:
    def shortlist_csr_requests(self, request_id: int, request_info: dict):

        entity = PinRequestEntity() # Create an instance of PinRequestEntity

        return entity.shortlist_csr_requests(request_id, request_info) # Call the shortlist_csr_requests method of the entity and return the result
    
class removeShortlistCSRRequestController:
    def remove_from_shortlist(self, request_id: int, csr_id: int):
        entity = PinRequestEntity() # Create an instance of PinRequestEntity

        return entity.remove_from_shortlist(request_id, csr_id) # Call the remove_from_shortlist method of the entity and return the result
    
class incrementRequestViewController:
    def increment_request_view(self, request_id: int):
        entity = PinRequestEntity() # Create an instance of PinRequestEntity

        return entity.increment_request_view(request_id) # Call the increment_request_view method of the entity and return the result
    
class getCSRRequestCompletedController:
    def get_csr_requests_completed(self):
        entity = PinRequestEntity() # Create an instance of PinRequestEntity

        return entity.get_csr_requests_completed() # Call the get_csr_request_completed method of the entity and return the list of completed CSR requests
    
class searchCSRRequestCompletedController:
    def search_csr_requests_completed(self, filter: dict):
        entity = PinRequestEntity() # Create an instance of PinRequestEntity

        return entity.search_csr_requests_completed(filter) # Call the search_csr_requests_completed method of the entity and return the list of completed CSR requests