from app.models.models import UserAccount, UserProfile, PIN, CSR
from app.database import get_db_session

class UserAccountEntity:
    def login(self, username: str, password: str):
        with get_db_session() as db:
            user = db.query(UserAccount).filter(UserAccount.username == username).first()
            if not user or user.password != password:
                # Invalid credentials → return empty object
                return {}

            # Fetch role info from user_profiles using the foreign key
            role_data = None
            if user.role:
                role = db.query(UserProfile).filter(UserProfile.id == user.role).first()
                if role:
                    role_data = {
                        "id": role.id,
                        "name": role.name,
                        "status": role.status,
                    }
            
            # Fetch PIN data if role is PIN
            pin_data = None
            if role_data and role_data["name"].upper() == "PIN":
                pin = db.query(PIN).filter(PIN.id == user.id).first()
                if pin:
                    pin_data = {"pin_user_id": pin.pin_user_id}
            
            # Fetch CSR data if role is CSR
            csr_data = None
            if role_data and role_data["name"].upper() == "CSR":
                pin = db.query(CSR).filter(CSR.id == user.id).first()
                if pin:
                    csr_data = {"csr_user_id": pin.csr_user_id}

            return {
                "id": user.id,
                "username": user.username,
                "email_address": user.email_address,
                "status": user.status,
                "last_login": str(user.last_login) if user.last_login else None,
                "role": role_data["name"] if role_data else None,
                "pin_user_id": pin_data["pin_user_id"] if pin_data else None,
                "csr_user_id": csr_data["csr_user_id"] if csr_data else None,
            } # Return user data as dict
        
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

            existing_email = (db.query(UserAccount).filter(UserAccount.email_address == user_data.get("email_address")).first()) # Check for existing email address
            if existing_email:
                return "Email address already exists" # Return str if email address exists
            
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
                print(f"Error creating user: {e}")
                return "Failed to create user" # Return str on failure
            
    def search_users(self, search_input: str):
        with get_db_session() as db:
            search_pattern = f"%{search_input}%" # Create search pattern for LIKE query
            users = db.query(UserAccount).join(UserProfile, UserAccount.role == UserProfile.id, isouter=True).filter(
                (UserAccount.username.ilike(search_pattern)) |
                (UserAccount.email_address.ilike(search_pattern)) |
                (UserProfile.name.ilike(search_pattern)) |
                (UserAccount.status.ilike(search_pattern))
            ).all() # Fetch users matching the search criteria
            return users # Return the list of matching users
    