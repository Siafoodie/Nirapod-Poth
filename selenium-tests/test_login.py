from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

print("Starting Login Test...")

driver = webdriver.Chrome()
driver.maximize_window()

try:
    # 1. Open login page
    driver.get("http://localhost:5173/login")

    wait = WebDriverWait(driver, 10)

    # 2. Check Login page opened
    heading = wait.until(
        EC.visibility_of_element_located(
            (By.XPATH, "//h1[contains(text(),'Welcome Back')]")
        )
    )

    print("Login page opened successfully")

    # 3. Find email field
    email = driver.find_element(
        By.CSS_SELECTOR,
        'input[type="email"]'
    )

    # 4. Find password field
    password = driver.find_element(
        By.CSS_SELECTOR,
        'input[type="password"]'
    )

    # 5. Enter existing account information
    email.send_keys("tanima@gmail.com")
    password.send_keys("tanima123")

    # 6. Click Sign In
    sign_in = driver.find_element(
        By.XPATH,
        "//button[contains(., 'Sign In')]"
    )

    sign_in.click()

    # 7. Wait until successful login redirects to /home
    wait.until(
        EC.url_contains("/home")
    )

    print("Current URL:", driver.current_url)
    print("LOGIN TEST PASSED")

    time.sleep(3)

except Exception as error:
    print("LOGIN TEST FAILED")
    print("Error:", error)

    time.sleep(5)

finally:
    driver.quit()