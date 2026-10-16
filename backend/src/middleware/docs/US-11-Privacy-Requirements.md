# US-11: Privacy & Security Requirements

**Project:** Nirapod Poth  
**Task:** T-11.1 — Define Privacy Data-Flow, Retention Rules and Anonymous Report Requirements

## 1. Objective

The objective of US-11 is to protect users' privacy by ensuring that anonymous incident reports do not store or expose personally identifiable information or travel history.

## 2. Data Collection Requirements

The system may collect the following information for incident reporting:

- Incident type
- Incident location
- Incident description
- Incident coordinates, when necessary
- Report creation and update timestamps
- Report moderation status

Anonymous reports must not store:

- Reporter user ID
- Reporter name
- Email address
- Phone number
- Travel history or route history
- Authentication tokens
- Unnecessary device identifiers or IP addresses

Users must be advised not to include personally identifiable information in free-text descriptions.

## 3. Anonymous Reporting Requirements

- Users must be able to submit anonymous reports without their identity being stored with the report.
- Only explicitly allowed incident fields may be persisted.
- Unexpected identity-related fields in API requests must be ignored or rejected.
- Public API responses must not expose reporter identity.
- Voting and moderation features must continue functioning without identifying anonymous reporters.

## 4. Privacy Data Flow

1. User submits an incident report from the frontend.
2. Backend validates the request.
3. Backend selects only approved incident fields.
4. MongoDB stores the report without reporter identity or travel history.
5. Backend returns a privacy-safe response.
6. Approved reports may be displayed publicly according to moderation rules.

## 5. Client Storage and Logging

- Anonymous report identity and travel history must not be saved in browser localStorage or sessionStorage.
- Sensitive request bodies, authentication tokens and location query parameters must not be written to application logs.
- API error responses must not expose internal stack traces or sensitive diagnostic information.
- Public responses must not expose voter identifiers or moderation audit details.
- Other routes, middleware and infrastructure logs must be reviewed for sensitive information.

## 6. Report Retention Policy

**Proposed retention period: 90 days.**

- Anonymous incident reports should be retained for a maximum of 90 days after creation.
- Expired reports should be removed automatically after the retention period.
- Expired reports should not appear in public API responses.
- Retention must be verified through database and API testing.
- Deletion should also cover report-associated voting and moderation data.

**Important:** The 90-day period is a proposed project requirement and must be approved before automatic deletion is enabled.

## 7. Acceptance Criteria

- Anonymous reports do not contain reporter identity or travel history.
- API responses do not expose sensitive personal information.
- Client storage does not retain identifiable reporting history.
- Application logs do not expose sensitive identity or location details.
- The approved retention policy is implemented and tested.
- Existing reporting, voting and moderation functionality remains operational.

## 8. Verification Status

- Anonymous report submission: Tested successfully.
- Reporter identity excluded from test database record: Verified.
- Reporter identity excluded from report submission response: Verified.
- Client storage privacy: Pending review.
- Complete application logging audit: Pending.
- Retention implementation and testing: Pending.