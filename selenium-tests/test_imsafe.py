from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time


print("Starting ImSafe test...")


driver = webdriver.Chrome(
    service=Service(ChromeDriverManager().install())
)

driver.maximize_window()


# Open ImSafe page
driver.get("http://localhost:5173/imsafe")

time.sleep(3)


# Check page title
assert "Safety Check-In" in driver.page_source

print("✓ ImSafe page opened")


# Check contacts loaded
contacts = driver.find_elements(
    By.CLASS_NAME,
    "contactcheck"
)

assert len(contacts) > 0

print("✓ Trusted contacts loaded")


# Check selected checkbox
checkboxes = driver.find_elements(
    By.CSS_SELECTOR,
    "input[type='checkbox']"
)


print("Total checkboxes:", len(checkboxes))


# Click third contact checkbox
if len(checkboxes) > 2:
    checkboxes[2].click()
    print("✓ Contact selection works")


time.sleep(1)


# Find Send Check-In button
button = driver.find_element(
    By.XPATH,
    "//button[contains(text(),'Send Check-In')]"
)


assert button.is_displayed()

print("✓ Send Check-In button visible")


button.click()

time.sleep(3)


# Check success message
assert (
    "Check-in prepared successfully"
    in driver.page_source
    or
    "Message ready"
    in driver.page_source
)

print("✓ Check-in process completed")


driver.quit()


print("All ImSafe Selenium tests passed!")