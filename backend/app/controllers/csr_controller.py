from app.entity.request_entity import PinRequestEntity
from typing import Optional

class getCSRRequestController:

    def get_csr_requests(self, status: Optional[str], csr_id: int):

        entity = PinRequestEntity() # Create an instance of PinRequestEntity

        return entity.get_csr_requests(status, csr_id) # Call the get_csr_requests method of the entity and return the list of CSR requests

class searchCSRRequestsController:
    def search_csr_requests(self, q, csr_id: int):

        entity = PinRequestEntity() # Create an instance of PinRequestEntity

        return entity.search_csr_requests(q, csr_id) # Call the search_csr_requests method of the entity and return the list of CSR requests
    
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