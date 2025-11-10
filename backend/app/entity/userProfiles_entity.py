from app.models.models import UserProfile, UserAccount
from app.database import get_db_session

class UserProfilesEntity:
    def get_user_profiles(self):
        with get_db_session() as db:
            profiles = db.query(UserProfile).order_by(UserProfile.id.asc()).all()
            return profiles

    def create_user_profile(self, profile_data: dict):
        with get_db_session() as db:
            try:
                # Prevent duplicate names
                existing = (
                    db.query(UserProfile)
                    .filter(UserProfile.name == profile_data.get("name"))
                    .first()
                )
                if existing:
                    return f"Profile with name '{profile_data.get('name')}' already exists." # Return str on duplicate

                new_profile = UserProfile(
                    name=profile_data.get("name"),
                    status=profile_data.get("status", "active"),
                )
                db.add(new_profile) # Add new profile to the session
                db.commit() # Commit the changes
                db.refresh(new_profile) # Refresh the instance, reflect latest changes
                return True # Return True on successful creation
            except Exception as e:
                db.rollback()
                print(f"Error creating user profile: {e}")
                return f"Failed to create user profile : {str(e)}" # Return str on failure

    def update_user_profile(self, profile_id: int, profile_data: dict):
        with get_db_session() as db:
            try:
                profile = db.query(UserProfile).filter(UserProfile.id == profile_id).first()
                if not profile:
                    return "User profile not found" # Return str if profile does not exist

                # Only allow name update here
                new_name = profile_data.get("name")
                if not new_name:
                    return "No name provided for update" # Return str if no name provided

                # Prevent duplicate name
                existing = (
                    db.query(UserProfile)
                    .filter(UserProfile.name == new_name, UserProfile.id != profile_id)
                    .first()
                )
                if existing:
                    return f"Profile name '{new_name}' already exists." # Return str on duplicate

                profile.name = new_name # Update name
                db.commit() # Commit the changes
                db.refresh(profile) # Refresh the instance, reflect latest changes
                return True # Return True on success
            except Exception as e:
                db.rollback()
                print(f"Error updating user profile: {e}")
                return f"Failed to update user profile : {str(e)}" # Return str on failure

    def suspend_user_profile(self, profile_id: int):
        with get_db_session() as db:
            try:
                profile = db.query(UserProfile).filter(UserProfile.id == profile_id).first()
                if not profile:
                    return "User profile not found" # Return str if profile does not exist

                # Prevent suspending an already suspended profile
                if profile.status == "suspended":
                    return f"Profile '{profile.name}' is already suspended." # Return str if already suspended

                # Set status to suspended
                profile.status = "suspended"

                # Unlink all accounts with this role
                affected_accounts = (
                    db.query(UserAccount)
                    .filter(UserAccount.role == profile_id)
                    .all()
                )

                for acc in affected_accounts:
                    acc.role = None

                if affected_accounts:
                    print(
                        f"⚠️ {len(affected_accounts)} user_accounts unlinked "
                        f"from suspended profile '{profile.name}'."
                    )

                db.commit() # Commit the changes
                db.refresh(profile) # Refresh the instance, reflect latest changes
                return True # Return True on success
            except Exception as e:
                db.rollback()
                print(f"Error suspending user profile: {e}")
                return f"Failed to suspend user profile : {str(e)}" # Return str on failure
            
    def reactivate_user_profile(self, profile_id: int):
        with get_db_session() as db:
            try:
                profile = db.query(UserProfile).filter(UserProfile.id == profile_id).first()
                if not profile:
                    return "User profile not found" # Return str if profile does not exist

                if profile.status == "active":
                    return f"Profile '{profile.name}' is already active." # Return str if already active

                profile.status = "active" # Set status to active
                db.commit() # Commit the changes
                db.refresh(profile) # Refresh the instance, reflect latest changes
                return True # Return True on success
            except Exception as e:
                db.rollback()
                print(f"Error reactivating user profile: {e}")
                return f"Failed to reactivate user profile : {str(e)}" # Return str on failure
            
    def search_user_profiles(self, search_input: str):
        with get_db_session() as db:
            try:
                search_pattern = f"%{search_input}%"
                profiles = (
                    db.query(UserProfile)
                    .filter(UserProfile.name.ilike(search_pattern))
                    .order_by(UserProfile.id.asc())
                    .all()
                )
                return profiles # Return the list of matching user profile objects
            except Exception as e:
                print(f"Error searching user profiles: {e}")
                return [] # Return empty list on failure

