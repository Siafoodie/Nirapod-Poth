from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

print("Starting Emergency Page Test...")

driver = webdriver.Chrome()
driver.maximize_window()

try:
    # Open Emergency page
    driver.get("http://localhost:5173/emergency")

    wait = WebDriverWait(driver, 10)

    # Test 1: Emergency SOS heading
    heading = wait.until(
        EC.visibility_of_element_located(
            (By.XPATH, "//*[contains(text(),'Emergency SOS')]")
        )
    )
    print("PASS: Emergency SOS page loaded")

    # Test 2: Send Emergency SMS button
    sms_button = wait.until(
        EC.visibility_of_element_located(
            (By.XPATH, "//*[contains(text(),'SEND EMERGENCY SMS')]")
        )
    )
    print("PASS: Send Emergency SMS button found")

    # Test 3: National Emergency 999
    emergency_999 = driver.find_element(
        By.XPATH,
        "//*[contains(text(),'Call National Emergency (999)')]"
    )
    print("PASS: National Emergency 999 found")

    # Test 4: Women & Children Helpline 109
    helpline_109 = driver.find_element(
        By.XPATH,
        "//*[contains(text(),'Women & Children Helpline (109)')]"
    )
    print("PASS: Women & Children Helpline 109 found")

    print("\nAll Emergency Page tests PASSED!")

    time.sleep(3)

except Exception as e:
    print("\nTEST FAILED:")
    print(e)

finally:
    driver.quit()