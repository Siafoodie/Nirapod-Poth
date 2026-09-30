from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
import time

driver = webdriver.Chrome()

driver.get("http://localhost:5173/report")
driver.maximize_window()

time.sleep(2)

# Incident Type
incident = driver.find_element(By.TAG_NAME, "select")
Select(incident).select_by_index(1)

# Location
location = driver.find_element(
    By.XPATH,
    "//input[@placeholder='Enter incident location']"
)
location.send_keys("Dhanmondi, Dhaka")

# Description
description = driver.find_element(
    By.XPATH,
    "//textarea[@placeholder='Describe what happened...']"
)
description.send_keys(
    "A woman was verbally harassed near the bus stop."
)

time.sleep(1)

print("Form filled successfully")

driver.quit()