package verified

import (
	"fmt"

	"github.com/kudarap/dotagiftx/core"
	"github.com/kudarap/dotagiftx/steam"
)

/*

objective: verify buyer received reserved item from seller

params:
	- seller persona name: check for sender value
	- buyer steam id: for parsing inventory
	- item name: item key name to check against sender

result:
	- detect private inventory
	- detect malformed json
	- support multiple json for large inventory
	- challenge check

process:
	- download json inventory
	- parse json file
	- search item name
	- check sender name

*/

// Delivery checks item existence on buyer's inventory.
//
// Returns an error when request has status error or body malformed.
func Delivery(source AssetSource, sellerPersona, buyerSteamID, itemName string) (core.DeliveryStatus, []steam.Asset, error) {
	if sellerPersona == "" || buyerSteamID == "" || itemName == "" {
		return core.DeliveryStatusError, nil, fmt.Errorf("all params are required")
	}

	// Pull inventory data using buyerSteamID.
	assets, err := source(buyerSteamID)
	if err != nil {
		if err == steam.ErrInventoryPrivate {
			return core.DeliveryStatusPrivate, nil, nil
		}

		return core.DeliveryStatusError, nil, err
	}

	assets = filterByName(assets, itemName)
	if len(assets) == 0 {
		return core.DeliveryStatusNoHit, assets, nil
	}

	status := core.DeliveryStatusNameVerified
	// Check asset gifter matches the seller persona name.
	//
	// NOTE! checking against seller persona name might not be accurate since
	// buyer can clear gift information that's why it need to snapshot
	// buyer inventory immediately.
	for _, ss := range assets {
		if ss.GiftFrom != sellerPersona {
			continue
		}
		status = core.DeliveryStatusSenderVerified
	}

	return status, assets, nil
}
