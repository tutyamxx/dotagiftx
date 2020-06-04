package core

import (
	"context"
	"time"
)

type (
	// User represents user information.
	User struct {
		ID             string     `json:"id"         db:"id,omitempty"`
		Name           string     `json:"name"       db:"name,omitempty"`
		RedditUsername string     `json:"username"   db:"username,omitempty"`
		SteamURL       string     `json:"email"      db:"email,omitempty"`
		CreatedAt      *time.Time `json:"created_at" db:"created_at,omitempty"`
		UpdatedAt      *time.Time `json:"updated_at" db:"updated_at,omitempty"`
	}

	// UserService provides access to user service.
	UserService interface {
		// Users returns a list of users.
		Users(opts FindOpts) ([]User, error)

		// User returns user details by id.
		User(id string) (*User, error)

		// UserFromContext returns user details from context.
		UserFromContext(context.Context) (*User, error)

		// Create saves new user and download profile image to local file.
		Create(*User) error

		// Update saves user changes.
		Update(context.Context, *User) error
	}

	// UserStorage defines operation for user records.
	UserStorage interface {
		// Find returns a list of users from data store.
		Find(opts FindOpts) ([]User, error)

		// Get returns user details by id from data store.
		Get(id string) (*User, error)

		// Create persists a new user to data store.
		Create(*User) error

		// Update persists user changes to data store.
		Update(*User) error
	}
)
