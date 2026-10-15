import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

class LocalizationTest(unittest.TestCase):

    def setUp(self):
        self.driver = webdriver.Chrome()
        self.driver.maximize_window()
        self.driver.get("http://localhost:5173")
        self.wait = WebDriverWait(self.driver, 10)

    def test_01_homepage_loads(self):
        self.assertTrue(
            self.driver.find_element(By.TAG_NAME, "body").is_displayed()
        )

    def test_02_bangla_text_displays(self):
        body = self.driver.find_element(By.TAG_NAME, "body").text
        self.assertTrue(
            any("\u0980" <= char <= "\u09FF" for char in body),
            "Bangla text not found"
        )

    def test_03_mobile_layout(self):
        self.driver.set_window_size(390, 844)
        body = self.driver.find_element(By.TAG_NAME, "body")
        self.assertTrue(body.is_displayed())

    def tearDown(self):
        self.driver.quit()

if __name__ == "__main__":
    unittest.main()