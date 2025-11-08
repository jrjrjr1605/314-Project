from app.entity.userAccount_entity import UserAccountEntity

class LoginController:
    def login(self, username: str, password: str):

        entity = UserAccountEntity() # Create an instance of UserAccountEntity

        return entity.login(username, password) # Call the login method of the entity and return the result