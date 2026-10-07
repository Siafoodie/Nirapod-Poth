import time

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


driver = webdriver.Chrome()

try:
    # Open Route Safety page
    driver.get("http://localhost:5173/route-safety")
    driver.maximize_window()

    wait = WebDriverWait(driver, 10)

    # Wait for Sort By dropdown
    sort_dropdown = wait.until(
        EC.presence_of_element_located(
            (By.ID, "route-sort")
        )
    )

    print("PASS: Route Safety page loaded")

    # Check default value = Fastest
    select = Select(sort_dropdown)

    assert select.first_selected_option.get_attribute("value") == "fastest"

    print("PASS: Default sorting is Fastest")

    # Check first route before changing sort
    headings_before = driver.find_elements(
        By.XPATH,
        "//h2[starts-with(normalize-space(), 'Route ')]"
    )

    assert len(headings_before) > 0

    first_route_before = headings_before[0].text

    print(
        "First route before sorting:",
        first_route_before
    )

    # Change to Safest First
    select.select_by_value("safest")

    time.sleep(1)

    # Verify dropdown changed
    assert select.first_selected_option.get_attribute("value") == "safest"

    print("PASS: Safest First option selected")

    # Get routes after sorting
    headings_after = driver.find_elements(
        By.XPATH,
        "//h2[starts-with(normalize-space(), 'Route ')]"
    )

    assert len(headings_after) > 0

    first_route_after = headings_after[0].text

    print(
        "First route after sorting:",
        first_route_after
    )

    # Get visible safety scores
    page_text = driver.find_element(
        By.TAG_NAME,
        "body"
    ).text

    assert "Safety Score" in page_text

    print("PASS: Safety scores are visible")

    # Verify Safest First changed route ordering
    assert first_route_before != first_route_after, (
        "Route order did not change after selecting Safest First"
    )

    print("PASS: Route order changed after selecting Safest First")

    print("")
    print("T-08.4 SELENIUM TEST PASSED")

finally:
    time.sleep(2)
    driver.quit()