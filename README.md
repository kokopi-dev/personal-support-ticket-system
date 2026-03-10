# Personal Support Ticket System

For demo purposes. A support ticket system that lets the user experience both the user and admin side features.

# Features
- Auth and Non-Auth'd User States
    - Auth Users
        - Tickets and replies are stored in database
        - Able to see all tickets created by all users in the Admin tab
        - Tickets, can create 10 max
        - Ticket replies, can reply 20 max per ticket
    - Non-Auth Users
        - Tickets and replies are stored in localstorage (browser)
        - Admin tab only shows localstorage tickets
        - Tickets and replies have no creation limit

# Dev
`bun run dev`
