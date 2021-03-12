package core

import (
	"context"
	"time"
)

// Delivery statuses.
const (
	// DeliveryStatusNoHit buyer's inventory successfully parsed
	// but the item did not find any in match.
	DeliveryStatusNoHit DeliveryStatus = 100

	// DeliveryStatusNameVerified item exists on buyer's inventory
	// base on the item name challenge.
	//
	// No-gift info might mean:
	// 1. Buyer cleared the gift information
	// 2. Buyer is the original owner of the item
	// 3. Item might come from another source
	DeliveryStatusNameVerified DeliveryStatus = 200

	// DeliveryStatusSenderVerified both item existence and gift
	// information matched the seller's avatar name. We could
	// also use the date received to check against delivery data
	// to strengthen its validity.
	DeliveryStatusSenderVerified DeliveryStatus = 300

	// DeliveryStatusPrivate buyer's inventory is not visible to
	// public and we can do nothing about it.
	DeliveryStatusPrivate DeliveryStatus = 400

	// DeliveryStatusError error occurred during API request or
	// parsing inventory error.
	DeliveryStatusError DeliveryStatus = 500
)

type (

	// DeliveryStatus represents delivery status.
	DeliveryStatus uint

	/// Delivery represents steam inventory delivery.
	Delivery struct {
		ID               string         `json:"id"                 db:"id,omitempty,omitempty"`
		MarketID         string         `json:"market_id"          db:"market_id,omitempty"`
		BuyerConfirmed   *bool          `json:"buyer_confirmed"    db:"buyer_confirmed,omitempty"`
		BuyerConfirmedAt *time.Time     `json:"buyer_confirmed_at" db:"buyer_confirmed_at,omitempty"`
		Status           DeliveryStatus `json:"status"             db:"status,omitempty"`
		Assets           []SteamAsset   `json:"steam_assets"       db:"steam_assets,omitempty"`
		Retries          int            `json:"retries"            db:"retries,omitempty"`
		CreatedAt        *time.Time     `json:"created_at"         db:"created_at,omitempty,indexed,omitempty"`
		UpdatedAt        *time.Time     `json:"updated_at"         db:"updated_at,omitempty,indexed,omitempty"`
	}

	// DeliveryService provides access to Delivery service.
	DeliveryService interface {
		// Deliveries returns a list of deliveries.
		Deliveries(opts FindOpts) ([]Delivery, *FindMetadata, error)

		// Delivery returns Delivery details by id.
		Delivery(id string) (*Delivery, error)

		// Create saves new Delivery details.
		Set(context.Context, *Delivery) error
	}

	// DeliveryStorage defines operation for Delivery records.
	DeliveryStorage interface {
		// Find returns a list of deliveries from data store.
		Find(opts FindOpts) ([]Delivery, error)

		// Count returns number of deliveries from data store.
		Count(FindOpts) (int, error)

		// Get returns Delivery details by id from data store.
		Get(id string) (*Delivery, error)

		// Create persists a new Delivery to data store.
		Create(*Delivery) error

		// Update save changes of Delivery to data store.
		Update(*Delivery) error
	}
)
