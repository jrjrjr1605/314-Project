from app.entity.userAccount_entity import UserAccountEntity

class getUserController:
    def get_all_users(self):

        entity = UserAccountEntity() # Create an instance of UserAccountEntity

        return entity.get_all_users() # Call the get_all_users method of the entity and return the list of user objects
    
class updateUserController:
    def update_user(self, user_id: int, user_data: dict):

        entity = UserAccountEntity() # Create an instance of UserAccountEntity

        return entity.update_user(user_id, user_data) # Call the update_user method of the entity and return the bool result
    
class suspendUserController:
    def suspend_user(self, user_id: int):

        entity = UserAccountEntity() # Create an instance of UserAccountEntity

        return entity.suspend_user(user_id) # Call the suspend_user method of the entity and return the bool result

class reactivateUserController:
    def reactivate_user(self, user_id: int):

        entity = UserAccountEntity() # Create an instance of UserAccountEntity

        return entity.reactivate_user(user_id) # Call the reactivate_user method of the entity and return the bool result
    
class createUserController:
    def create_user(self, user_data: dict):

        entity = UserAccountEntity() # Create an instance of UserAccountEntity

        return entity.create_user(user_data) # Call the create_user method of the entity and return the bool result