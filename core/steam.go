package core

import (
	"net/http"
	"strings"
)

type (
	// SteamPlayer represents steam player information.
	SteamPlayer struct {
		ID     string `json:"id"     db:"id"`
		Name   string `json:"name"   db:"name"`
		URL    string `json:"url"    db:"url"`
		Avatar string `json:"avatar" db:"avatar"`
	}

	// SteamClient provides access to Steam API.
	SteamClient interface {
		// AuthorizeURL returns authorization url to steam open id.
		AuthorizeURL(r *http.Request) (redirectURL string, err error)

		// Authenticate returns player info on valid authorization.
		Authenticate(r *http.Request) (*SteamPlayer, error)

		// Player returns player summary base on steamID.
		Player(steamID string) (*SteamPlayer, error)

		// ResolveVanityURL returns steam id from profile url.
		ResolveVanityURL(url string) (steamID string, err error)
	}

	// SteamAsset represents a simplified version of inventory item.
	SteamAsset struct {
		AssetID      string   `json:"asset_id"      db:"asset_id,omitempty"`
		ClassID      string   `json:"class_id"      db:"class_id,omitempty"`     // unique id of an item
		InstanceIDs  []string `json:"instance_ids"  db:"instance_ids,omitempty"` // unique id per item instance
		Qty          int      `json:"qty"           db:"qty,omitempty"`
		Name         string   `json:"name"          db:"name,omitempty"`
		Image        string   `json:"image"         db:"image,omitempty"`
		Type         string   `json:"type"          db:"type,omitempty"`
		Hero         string   `json:"hero"          db:"hero,omitempty"`
		GiftFrom     string   `json:"gift_from"     db:"gift_from,omitempty"`
		DateReceived string   `json:"date_received" db:"date_received,omitempty"`
		Dedication   string   `json:"dedication"    db:"dedication,omitempty"`
		GiftOnce     bool     `json:"gift_once"     db:"gift_once,omitempty"`
		NotTradable  bool     `json:"not_tradable"  db:"not_tradable,omitempty"`
		Descriptions []string `json:"descriptions"  db:"descriptions,omitempty"`
	}
)

func (s *SteamAsset) IsBundled() bool {
	return strings.HasSuffix(s.Type, "Bundle")
}
