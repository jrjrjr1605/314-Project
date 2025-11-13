from app.entity.category_entity import CategoryEntity
from app.entity.request_entity import PinRequestEntity

class createCategoryController:
    def create_category(self, category_info: dict):
        entity = CategoryEntity() # Create an instance of CategoryEntity

        return entity.create_category(category_info) # Call the create_category method of the entity and return the result

class updateCategoryController:
    def update_category(self, category_id: int, category_info: dict):
        entity = CategoryEntity() # Create an instance of CategoryEntity

        return entity.update_category(category_id, category_info) # Call the update_category method of the entity and return the result
    
class deleteCategoryController:
    def delete_category(self, category_id: int):
        entity = CategoryEntity() # Create an instance of CategoryEntity

        return entity.delete_category(category_id) # Call the delete_category method of the entity and return the result
    
class getCategoryController:
    def get_category(self):
        entity = CategoryEntity() # Create an instance of CategoryEntity

        return entity.get_category() # Call the get_category method of the entity and return the result


class searchCategoryController:
    def search_category(self, search_input: str):
        entity = CategoryEntity() # Create an instance of CategoryEntity

        return entity.search_category(search_input) # Call the search_categories method of the entity and return the result

class generateDailyReportController:
    def generate_pm_daily_report(self):
        entity = PinRequestEntity() # Create an instance of PinRequestEntity

        return entity.generate_pm_daily_report() # Call the generate_daily_report method of the entity and return the result
    
class generateWeeklyReportController:
    def generate_pm_weekly_report(self):
        entity = PinRequestEntity() # Create an instance of PinRequestEntity

        return entity.generate_pm_weekly_report() # Call the generate_weekly_report method of the entity and return the result
    
class generateMonthlyReportController:
    def generate_pm_monthly_report(self):
        entity = PinRequestEntity() # Create an instance of PinRequestEntity

        return entity.generate_pm_monthly_report() # Call the generate_monthly_report method of the entity and return the result
    


