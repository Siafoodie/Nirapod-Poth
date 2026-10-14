# Report Anonymity Testing Checklist

## Test Objective

Verify that users can submit an incident report anonymously and that
personal information is not exposed when anonymous reporting is selected.

## Test Cases

### Test Case 1: Anonymous Option Available

Steps:
1. Open the Report Incident page.
2. Check the report form.
3. Verify that an anonymous reporting option is available.

Expected Result:
The user should be able to select anonymous reporting.

Status: Pending


### Test Case 2: Submit Anonymous Report

Steps:
1. Open the Report Incident form.
2. Enter incident type.
3. Enter location.
4. Enter incident description.
5. Select anonymous reporting.
6. Click Submit.

Expected Result:
The report should be submitted successfully.

Status: Pending


### Test Case 3: Personal Information Hidden

Steps:
1. Submit a report with anonymous reporting enabled.
2. Check the submitted report data.

Expected Result:
The user's name, email, phone number, or other personal information
should not be displayed or included in the report.

Automated coverage: `backend/tests/report.test.js` verifies that personal
information in the request is neither persisted nor returned by the API.
Manual full-flow verification: Pending


### Test Case 4: Normal Report Submission

Steps:
1. Open the Report Incident form.
2. Fill in the required information.
3. Do not select anonymous reporting.
4. Submit the report.

Expected Result:
The report should be submitted normally according to the application flow.

Status: Pending


### Test Case 5: Anonymous Selection Retained During Submission

Steps:
1. Select anonymous reporting.
2. Fill in all required report fields.
3. Submit the report.

Expected Result:
The anonymous setting should remain enabled during the submission process.

Status: Pending