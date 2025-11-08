from app.entity.request_entity import PinRequestEntity

class getAllRequestsController():
    def get_all_requests(self):
        entity = PinRequestEntity()  # Create an instance of RequestEntity

        return entity.get_all_requests()  # Call the get_all_requests method of the entity and return the result
    
class updateRequestController():
    def update_request(self, request_id: int, body: dict):
        entity = PinRequestEntity()  # Create an instance of RequestEntity

        return entity.update_request(request_id, body)  # Call the update_request method of the entity and return the result
    
class viewRequestController():
    def view_request(self, request_id: int):
        entity = PinRequestEntity()  # Create an instance of RequestEntity

        return entity.view_request(request_id)  # Call the view_request method of the entity and return the result