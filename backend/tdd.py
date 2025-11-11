# Inject login details into controller to test the code

import unittest
from app.controllers.login_controller import LoginController

class TestLogin(unittest.TestCase):
    def test_login_success_admin(self):
        controller = LoginController()
        result = controller.login("admin1", "*i+JIzi*G9")

        self.assertEqual(result["username"], "admin1") # Ensure that the correct object is retrieved by checking against username
        self.assertEqual(result["role"], "ADMIN") # Ensure that the correct object is retrieved by checking against role
    
    def test_login_wrong_password(self):
        controller = LoginController()
        result = controller.login("alice", "wrong")
        assert result == {} # Ensure that wrong login details will return an empty object

    def test_login_wrong_user(self):
        controller = LoginController()
        result = controller.login("charlie", "1234")
        assert result == {} # Ensure that wrong login details will return an empty object

if __name__ == "__main__":
    unittest.main()

