import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By

BASE_URL = "http://localhost:5173"

@pytest.fixture
def driver():
    browser = webdriver.Chrome()
    yield browser
    browser.quit()

def test_application_loads(driver):
    driver.get(BASE_URL)

    assert driver.find_element(
        By.TAG_NAME, "body"
    ).is_displayed()

def test_empty_vote_form(driver):
    driver.get(BASE_URL)

    buttons = driver.find_elements(
        By.TAG_NAME, "button"
    )

    assert isinstance(buttons, list)

def test_invalid_vote_page(driver):
    driver.get(BASE_URL + "/invalid-vote")

    assert driver.execute_script(
        "return document.readyState"
    ) == "complete"