from app.models.models import UserAccount
from app.database import get_db_session

class UserAccountEntity:
    def login(self, username: str, password: str):
        with get_db_session() as db: # Passing the db session here
            user = db.query(UserAccount).filter(UserAccount.username == username).first() # Fetching user by username
            if not user or user.password != password: # Validating password
                return UserAccount(id=None, username="", password="") # Return empty user object if invalid
            return user # Else, return the relevant user object
        
    def get_all_users(self):
        with get_db_session() as db: # Passing the db session here
            users = db.query(UserAccount).all() # Fetch all users
            return users # Return the list of users
        
    def update_user(self, user_id: int, user_data: dict):
        with get_db_session() as db:
            user = db.query(UserAccount).filter(UserAccount.id == user_id).first() # Fetch user by ID
            if not user:
                return "User not found" # Return str if user does not exist

            # Update allowed fields if valid user
            for key in ["username", "email_address", "role", "status"]:
                if key in user_data:
                    setattr(user, key, user_data[key])

            db.commit() # Commit the changes
            db.refresh(user) # Refresh the instance, reflect lastest changes
            return True # Return True on successful update
        
    def suspend_user(self, user_id: int):
        with get_db_session() as db:
            user = db.query(UserAccount).filter(UserAccount.id == user_id).first() # Fetch user by ID
            if not user:
                return "User not found" # Return str if user does not exist

            if user.status.lower() == "suspended":
                return "User is already suspended" # Return str if already suspended

            user.status = "suspended" # Update status to suspended
            db.commit() # Commit the changes
            db.refresh(user) # Refresh the instance, reflect lastest changes
            return True # Return True on successful suspension
        
    def reactivate_user(self, user_id: int):
        with get_db_session() as db:
            user = db.query(UserAccount).filter(UserAccount.id == user_id).first() # Fetch user by ID
            if not user:
                return "User not found" # Return str if user does not exist

            if user.status.lower() == "active":
                return "User is already active" # Return str if already active

            user.status = "active" # Update status to active
            db.commit() # Commit the changes
            db.refresh(user) # Refresh the instance, reflect lastest changes
            return True # Return True on successful reactivation
        
    def create_user(self, user_data: dict):
        with get_db_session() as db:
            existing_user = (db.query(UserAccount).filter(UserAccount.username == user_data.get("username")).first()) # Check for existing username
            if existing_user:
                return "Username already exists" # Return str if username exists
            print(user_data)
            try:
                user = UserAccount(
                    username=user_data.get("username"),
                    email_address=user_data.get("email_address"),
                    role=None if user_data.get("role") is None else user_data.get("role"),
                    status=user_data.get("status"),
                    password=user_data.get("password"),
                ) # Create new UserAccount instance

                db.add(user) # Add new user to the session
                db.commit() # Commit the changes
                db.refresh(user) # Refresh the instance, reflect lastest changes
                return True # Return True on successful creation
            except Exception as e:
                db.rollback()
                print(f"❌ Error creating user: {e}")
                return "Failed to create user"
            
    