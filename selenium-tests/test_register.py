from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

print("Starting Register Test...")

driver = webdriver.Chrome()
driver.maximize_window()

try:
    wait = WebDriverWait(driver, 10)

    # 1. Open Register page
    driver.get("http://localhost:5173/register")

    # 2. Verify Register page opened
    heading = wait.until(
        EC.visibility_of_element_located(
            (By.XPATH, "//h1[contains(text(),'Create Account')]")
        )
    )

    print("Register page opened successfully")

    # 3. Find Name field
    name = driver.find_element(
        By.CSS_SELECTOR,
        'input[placeholder="Name"]'
    )

    # 4. Find Email field
    email = driver.find_element(
        By.CSS_SELECTOR,
        'input[type="email"]'
    )

    # 5. Find Password field
    password = driver.find_element(
        By.CSS_SELECTOR,
        'input[type="password"]'
    )

    # 6. Enter registration information
    name.send_keys("Selenium Test User")

    # IMPORTANT:
    # Use a new email every time you run this test
    email.send_keys("seleniumtest101@gmail.com")

    password.send_keys("Test1234")

    # 7. Click Create Account
    create_account = driver.find_element(
        By.XPATH,
        "//button[contains(., 'Create Account')]"
    )

    create_account.click()

    # 8. Successful registration should redirect to /home
    wait.until(
        EC.url_contains("/home")
    )

    print("Current URL:", driver.current_url)
    print("REGISTER TEST PASSED")

    time.sleep(3)

except Exception as error:
    print("REGISTER TEST FAILED")
    print("Error:", error)

    time.sleep(5)

finally:
    driver.quit()