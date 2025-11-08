from app.entity.request_entity import PinRequestEntity
from typing import Optional

class getPinRequestsController:
    def get_pin_requests(self, id: int, q: Optional[str] = None):

        entity = PinRequestEntity() # Create an instance of PinRequestEntity

        return entity.get_pin_requests(id, q) # Call the get_pin_requests method of the entity and return the list of pin requests
    
class createPinRequestController:
    def create_pin_request(self, request_data):

        entity = PinRequestEntity() # Create an instance of PinRequestEntity

        return entity.create_pin_request(request_data) # Call the create_pin_request method of the entity and return bool on success and str on failure