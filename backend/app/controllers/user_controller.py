from app.entity.userAccount_entity import UserAccountEntity
from app.entity.userProfiles_entity import UserProfilesEntity

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
    
class searchUserController:
    def search_users(self, search_input: str):

        entity = UserAccountEntity() # Create an instance of UserAccountEntity

        return entity.search_users(search_input) # Call the search_users method of the entity and return the list of user objects

class getUserProfilesController:
    def get_user_profiles(self):

        entity = UserProfilesEntity() # Create an instance of UserProfilesEntity

        return entity.get_user_profiles() # Call the get_user_profiles method of the entity and return the list of user profile objects
    
class createUserProfilesController:
    def create_user_profile(self, profile_data: dict):

        entity = UserProfilesEntity() # Create an instance of UserProfilesEntity

        return entity.create_user_profile(profile_data) # Call the create_user_profile method of the entity and return the bool result
    
class updateUserProfilesController:
    def update_user_profile(self, profile_id: int, profile_data: dict):

        entity = UserProfilesEntity() # Create an instance of UserProfilesEntity

        return entity.update_user_profile(profile_id, profile_data) # Call the update_user_profile method of the entity and return the bool result
    
class suspendUserProfilesController:
    def suspend_user_profile(self, profile_id: int):

        entity = UserProfilesEntity() # Create an instance of UserProfilesEntity

        return entity.suspend_user_profile(profile_id) # Call the suspend_user_profile method of the entity and return the bool result

class reactivateUserProfilesController:
    def reactivate_user_profile(self, profile_id: int):

        entity = UserProfilesEntity() # Create an instance of UserProfilesEntity

        return entity.reactivate_user_profile(profile_id) # Call the reactivate_user_profile method of the entity and return the bool result

class searchUserProfilesController:
    def search_user_profiles(self, search_input: str):

        entity = UserProfilesEntity() # Create an instance of UserProfilesEntity

        return entity.search_user_profiles(search_input) # Call the search_user_profiles method of the entity and return the list of user profile objects