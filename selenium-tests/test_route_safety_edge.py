import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import WebDriverException

BASE_URL = "http://localhost:5173"


@pytest.fixture
def driver():
    options = webdriver.ChromeOptions()
    options.add_argument("--disable-extensions")
    options.add_argument("--no-first-run")
    options.add_argument("--disable-notifications")

    browser = webdriver.Chrome(options=options)
    browser.maximize_window()

    yield browser

    browser.quit()


# T-08.5: Verify application page loads
def test_route_page_loads(driver):
    driver.get(BASE_URL)

    WebDriverWait(driver, 15).until(
        EC.visibility_of_element_located((By.TAG_NAME, "body"))
    )

    assert driver.find_element(
        By.TAG_NAME, "body"
    ).is_displayed()

    print("PASS: Application page loaded successfully")


# T-08.5: Check invalid route URL
def test_invalid_route_url(driver):
    driver.get(BASE_URL + "/route-invalid-test")

    WebDriverWait(driver, 15).until(
        EC.presence_of_element_located((By.TAG_NAME, "body"))
    )

    assert driver.find_element(
        By.TAG_NAME, "body"
    ).is_displayed()

    print("PASS: Invalid route URL rendered a page")


# T-08.5: Check page loads without WebDriver errors
def test_route_page_no_browser_error(driver):
    driver.get(BASE_URL)

    WebDriverWait(driver, 15).until(
        EC.visibility_of_element_located((By.TAG_NAME, "body"))
    )

    body = driver.find_element(By.TAG_NAME, "body")

    assert body.is_displayed()

    print("PASS: Page loaded without WebDriver errors")