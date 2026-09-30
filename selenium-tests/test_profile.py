from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

print("Starting Profile Test...")

driver = webdriver.Chrome()
driver.maximize_window()

try:
    wait = WebDriverWait(driver, 15)

    # ==========================================
    # 1. OPEN LOGIN PAGE
    # ==========================================

    driver.get("http://localhost:5173/login")

    email_input = wait.until(
        EC.element_to_be_clickable(
            (By.CSS_SELECTOR, 'input[type="email"]')
        )
    )

    password_input = wait.until(
        EC.element_to_be_clickable(
            (By.CSS_SELECTOR, 'input[type="password"]')
        )
    )

    # ==========================================
    # 2. ENTER LOGIN INFORMATION
    # ==========================================

    # Use your existing registered account
    email_input.send_keys("tanima@gmail.com")
    password_input.send_keys("tanima123")

    sign_in_button = wait.until(
        EC.element_to_be_clickable(
            (By.XPATH, "//button[contains(., 'Sign In')]")
        )
    )

    sign_in_button.click()

    # Wait for successful login
    wait.until(
        EC.url_contains("/home")
    )

    print("Login successful")

    # ==========================================
    # 3. OPEN PROFILE PAGE
    # ==========================================

    driver.get("http://localhost:5173/profile")

    wait.until(
        EC.visibility_of_element_located(
            (
                By.XPATH,
                "//h3[contains(., 'Personal Information')]"
            )
        )
    )

    print("Profile page opened successfully")

    # ==========================================
    # 4. FIND EDIT PROFILE BUTTON
    # ==========================================

    edit_button = wait.until(
        EC.presence_of_element_located(
            (
                By.XPATH,
                "//button[contains(., 'Edit Profile')]"
            )
        )
    )

    # Scroll button into view
    driver.execute_script(
        "arguments[0].scrollIntoView({block: 'center'});",
        edit_button
    )

    time.sleep(1)

    # ==========================================
    # 5. CLICK EDIT PROFILE USING JAVASCRIPT
    # ==========================================

    driver.execute_script(
        "arguments[0].click();",
        edit_button
    )

    print("Edit Profile clicked")

    # ==========================================
    # 6. VERIFY EDIT MODE OPENED
    # ==========================================

    save_button = wait.until(
        EC.visibility_of_element_located(
            (
                By.XPATH,
                "//button[contains(., 'Save Changes')]"
            )
        )
    )

    print("Edit mode opened successfully")

    # ==========================================
    # 7. FIND NAME INPUT
    # ==========================================

    name_input = wait.until(
        EC.visibility_of_element_located(
            (
                By.XPATH,
                "//input[@placeholder='Enter your name']"
            )
        )
    )

    # ==========================================
    # 8. FIND PHONE INPUT
    # ==========================================

    phone_input = wait.until(
        EC.visibility_of_element_located(
            (
                By.XPATH,
                "//input[@placeholder='Enter phone number']"
            )
        )
    )

    print("Name and Phone fields found")

    # ==========================================
    # 9. UPDATE NAME
    # ==========================================

    name_input.clear()
    name_input.send_keys("Selenium Test User")

    # ==========================================
    # 10. UPDATE PHONE NUMBER
    # ==========================================

    phone_input.clear()
    phone_input.send_keys("01700000000")

    print("Profile information entered")

    # ==========================================
    # 11. CLICK SAVE CHANGES
    # ==========================================

    driver.execute_script(
        "arguments[0].scrollIntoView({block: 'center'});",
        save_button
    )

    time.sleep(1)

    driver.execute_script(
        "arguments[0].click();",
        save_button
    )

    print("Save Changes clicked")

    # ==========================================
    # 12. VERIFY SUCCESS MESSAGE
    # ==========================================

    success_message = wait.until(
        EC.visibility_of_element_located(
            (
                By.CLASS_NAME,
                "profile-success-message"
            )
        )
    )

    print(
        "Success Message:",
        success_message.text
    )

    assert (
        "Profile updated successfully!"
        in success_message.text
    )

   
    print("Profile update verified successfully")

    # ==========================================
    # TEST PASSED
    # ==========================================

    print("")
    print("==============================")
    print("PROFILE TEST PASSED")
    print("==============================")

    time.sleep(3)

except Exception as error:

    print("")
    print("==============================")
    print("PROFILE TEST FAILED")
    print("==============================")

    print("Error:", error)

    # Keep browser open for a few seconds
    # so you can see where the test failed
    time.sleep(5)

finally:

    driver.quit()