---
applyTo: '**'
---
Create a simple web application that integrates with the Moneybird API to clock in and out.

API Documentation: https://developer.moneybird.com/
Environment Variables:
- ADMINISTRATION_ID: Your Moneybird administration ID.
- CLIENT_ID: Your Moneybird API client ID.
- CLIENT_SECRET: Your Moneybird API client secret.
- REDIRECT_URI: The redirect URI for OAuth2 authentication.

Process:
1. User first logs in via OAuth2 to authorize the application to access their Moneybird data.
2. After successful authentication, the webapp fetches the list of users from the Moneybird API. The user can then select their user. The goal is to get the user ID, therefore if it is possible to fetch only the current user, that is preferred.
3. The user specify the following fields:
    - Description
    - Project (fetched from Moneybird API)
    - Contact (fetched from Moneybird API)
4. The user can then clock in. A time entry is created in Moneybird with the start time.
5. When the user clocks out, the time entry is updated with the end time.

Frameworks/Libraries: Next.js