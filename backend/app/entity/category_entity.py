from app.database import get_db_session
from app.models.models import Category, Request
from sqlalchemy.exc import SQLAlchemyError

class CategoryEntity:
    def create_category(self, category_info: dict):
        try:
            name = category_info.get("name", "").strip()
            if not name:
                return "Category name cannot be empty" # Validate input, return str if invalid

            with get_db_session() as db:
                # Check for existing category
                existing = db.query(Category).filter(Category.name.ilike(name)).first()
                if existing:
                    return "Category already exists" # Return str if category exists

                # Create and commit new category
                new_cat = Category(name=name)
                db.add(new_cat)
                db.commit()
                db.refresh(new_cat)

                return True  # success

        except SQLAlchemyError as e:
            print(f"SQLAlchemy Error creating category: {e}")
            return "Database error while creating category"
        except Exception as e:
            print(f"Error creating category: {e}")
            return f"Failed to create category: {str(e)}"

    def update_category(self, category_id: int, category_info: dict):
        try:
            with get_db_session() as db:
                category = db.query(Category).filter(Category.id == category_id).first()
                if not category:
                    return "Category not found" # Return str if category does not exist

                new_name = category_info.get("name", "").strip()
                if not new_name:
                    return "Category name cannot be empty" # Validate input, return str if invalid

                # Prevent duplicates
                existing = (
                    db.query(Category)
                    .filter(Category.name.ilike(new_name), Category.id != category_id)
                    .first()
                )
                if existing:
                    return "Another category with this name already exists" # Return str if duplicate found

                category.name = new_name # Update the category name
                db.commit() # Commit the changes
                db.refresh(category) # Refresh the instance

                return True  # success

        except SQLAlchemyError as e:
            print(f"SQLAlchemy Error updating category: {e}")
            return "Database error while updating category"
        except Exception as e:
            print(f"Error updating category: {e}")
            return f"Failed to update category: {str(e)}"
        
    def delete_category(self, category_id: int):
        try:
            with get_db_session() as db:
                category = db.query(Category).filter(Category.id == category_id).first()
                if not category:
                    return "Category not found" # Return str if category does not exist

                # Set category_id = None for all requests that use this category
                requests_in_use = db.query(Request).filter(Request.category_id == category_id).all()
                for req in requests_in_use:
                    req.category_id = None

                db.delete(category) # Delete the category
                db.commit() # Commit the changes

                return True  # Success

        except SQLAlchemyError as e:
            print(f"SQLAlchemy Error deleting category: {e}")
            return "Database error while deleting category"
        except Exception as e:
            print(f"Error deleting category: {e}")
            return f"Failed to delete category: {str(e)}"
        
    def get_category(self):
        try:
            with get_db_session() as db:
                categories = db.query(Category).order_by(Category.id).all() # Fetch all categories

                return [
                    {
                        "id": c.id,
                        "name": c.name,
                        "created_at": c.created_at,
                        "updated_at": c.updated_at,
                    }
                    for c in categories
                ] # Return list of categories
        except SQLAlchemyError as e:
            print(f"Database error fetching categories: {e}")
            return [] # Return empty list on DB error
        except Exception as e:
            print(f"Error fetching categories: {e}")
            return []  # Return empty list on general error
        
    def search_category(self, search_input: str):
        try:
            with get_db_session() as db:
                if not search_input or not search_input.strip():
                    return []  # Return empty if search term is missing

                search_term = f"%{search_input.strip()}%"
                categories = (
                    db.query(Category)
                    .filter(Category.name.ilike(search_term))
                    .order_by(Category.id)
                    .all()
                )

                return [
                    {
                        "id": c.id,
                        "name": c.name,
                        "created_at": c.created_at,
                        "updated_at": c.updated_at,
                    }
                    for c in categories
                ] # Return list of matching categories

        except SQLAlchemyError as e:
            print(f"Database error searching categories: {e}")
            return [] # Return empty list on DB error
        except Exception as e:
            print(f"Error searching categories: {e}")
            return []  # Return empty list on general error