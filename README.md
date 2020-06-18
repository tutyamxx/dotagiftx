# Dota2 Giftables

Market place for giftable Dota 2 items

### Tech Stack

- Docker 19
- RethinkDB 2.4
- Go 1.14

### Architecture

- Standard Package Layout
- Dependency Injections
- Containerized

### Entities

- auth
- user
- item
- sell

### API endpoints

- public
    - `GET /auth/steam` -- user login/register
    - `GET /auth/renew` -- renews access token
    - `GET /auth/revoke` -- revokes access token
    - `GET /items` -- item search
    - `GET /items/{item-id}` -- item details
    - `GET /sells` -- sell search
    - `GET /sells/{item-id}` -- item sell details
    - `GET /users/{user-id}` -- user details
    - `GET /users/{user-id}/sells` -- user sell search

- private
    - `GET /my/profile` -- user profile details
    - `PATCH /my/profile` -- user profile update
    - `GET /my/sells` -- user sell list
    - `GET /my/sells/{sell-id}` -- user sell listing details
    - `POST /my/sells` -- create user sell
    - `PATCH /my/sells` -- update user sell
