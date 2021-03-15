package steam

import (
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"strings"
	"time"

	"github.com/kudarap/dotagiftx/steam/cache"

	jsoniter "github.com/json-iterator/go"
	"github.com/kudarap/dotagiftx/core"
)

var fastjson = jsoniter.ConfigFastest

var ErrInventoryPrivate = errors.New("profile inventory is private")

const inventoryCacheExpr = time.Hour * 24

// Asset represents compact inventory base of RawInventory model.
type Asset = core.SteamAsset

// InventoryAsset returns a compact format from raw inventory data.
func InventoryAsset(steamID string) ([]Asset, error) {
	r, err := reqDota2Inventory(steamID)
	if err != nil {
		return nil, fmt.Errorf("could send request: %s", err)
	}
	defer r.Body.Close()
	return assetParser(r.Body)
}

func InventoryAssetWithCache(steamID string) ([]Asset, error) {
	hit, err := cache.Get(steamID)
	if err != nil {
		return nil, err
	}
	if hit != nil {
		b, _ := fastjson.Marshal(hit)
		var asset []Asset
		_ = fastjson.Unmarshal(b, &asset)
		return asset, nil
	}

	asset, err := InventoryAsset(steamID)
	if err != nil {
		return nil, err
	}

	if err = cache.Set(steamID, asset, inventoryCacheExpr); err != nil {
		return nil, err
	}

	return asset, nil
}

func assetParser(r io.Reader) ([]Asset, error) {
	raw, err := inventoryParser(r)
	if err != nil {
		return nil, err
	}
	if raw.IsPrivate() {
		return nil, ErrInventoryPrivate
	}
	if raw.Error != "" {
		return nil, fmt.Errorf(raw.Error)
	}

	return raw.ToAssets(), nil
}

// AllInventory represents raw and collated inventory.
type AllInventory struct {
	AllInvs  []RawInventoryAsset         `json:"allInventory"`
	AllDescs map[string]RawInventoryDesc `json:"allDescriptions"`
}

type assetIDQty struct {
	AssetID     string
	InstanceIDs []string
}

func (i *AllInventory) ToAssets() []Asset {
	// Collate asset and instance ids for qty reference later.
	assetIDs := map[string]assetIDQty{}
	for _, aa := range i.AllInvs {
		row, ok := assetIDs[aa.ClassID]
		if !ok {
			assetIDs[aa.ClassID] = assetIDQty{
				aa.AssetID, []string{aa.InstanceID},
			}
			continue
		}

		// add new instance id
		row.InstanceIDs = append(row.InstanceIDs, aa.InstanceID)
		assetIDs[aa.ClassID] = row
	}

	// Composes and collect inventory on flat format.
	var assets []Asset
	for _, dd := range i.AllDescs {
		ids := assetIDs[dd.ClassID]
		a := dd.ToAsset()
		a.AssetID = ids.AssetID
		a.Qty = len(ids.InstanceIDs)
		assets = append(assets, a)
	}

	return assets
}

// RawInventory represents steam's raw inventory data model.
type RawInventory struct {
	Success   bool                         `json:"success"`
	More      bool                         `json:"more"`
	MoreStart RawInventoryPageOffset       `json:"more_start"`
	RgInvs    map[string]RawInventoryAsset `json:"rgInventory"`
	RgDescs   map[string]RawInventoryDesc  `json:"rgDescriptions"`
	Error     string                       `json:"Error"`
}

func (i RawInventory) IsPrivate() bool {
	return strings.ToUpper(i.Error) == "THIS PROFILE IS PRIVATE."
}

func (i *RawInventory) ToAssets() []Asset {
	// Collate asset and instance ids for qty reference later.
	assetIDs := map[string]assetIDQty{}
	for _, aa := range i.RgInvs {
		row, ok := assetIDs[aa.ClassID]
		if !ok {
			assetIDs[aa.ClassID] = assetIDQty{
				aa.ID, []string{aa.InstanceID},
			}
			continue
		}

		// add new instance id
		row.InstanceIDs = append(row.InstanceIDs, aa.InstanceID)
		assetIDs[aa.ClassID] = row
	}

	// Composes and collect inventory on simple format.
	var assets []Asset
	for _, dd := range i.RgDescs {
		ids := assetIDs[dd.ClassID]
		a := dd.ToAsset()
		a.AssetID = ids.AssetID
		a.Qty = len(ids.InstanceIDs)
		assets = append(assets, a)
	}

	return assets
}

// Inventory retrieve data from API and parse into RawInventory.
func Inventory(steamID string) (*RawInventory, error) {
	r, err := reqDota2Inventory(steamID)
	if err != nil {
		return nil, fmt.Errorf("could send request: %s", err)
	}
	defer r.Body.Close()
	return inventoryParser(r.Body)
}

func inventoryParser(r io.Reader) (*RawInventory, error) {
	raw := &RawInventory{}
	b, err := ioutil.ReadAll(r)
	if err != nil {
		return nil, err
	}
	if err = fastjson.Unmarshal(b, raw); err != nil {
		return nil, err
	}
	return raw, nil
}

// RawInventoryAsset represents steam's raw asset inventory data model.
type RawInventoryAsset struct {
	ID         string `json:"id"`
	AssetID    string `json:"assetid"` // asset id field for AllInventory
	ClassID    string `json:"classid"`
	InstanceID string `json:"instanceid"`
}

// asset description field prefix and flags.
const (
	assetPrefixHero         = "Used By: "
	assetPrefixGiftFrom     = "Gift From: "
	assetPrefixDateReceived = "Date Received: "
	assetPrefixDedication   = "Dedication: "
	assetFlagNotTradable    = "( Not Tradable )"
	assetFlagGiftOnce       = "( This item may be gifted once )"
)

// RawInventoryDesc represents steam's raw description inventory data model.
type RawInventoryDesc struct {
	ClassID      string                  `json:"classid"`
	InstanceID   string                  `json:"instanceid"`
	Name         string                  `json:"name"`
	Image        string                  `json:"icon_url_large"`
	Type         string                  `json:"type"`
	Descriptions RawInventoryItemDetails `json:"descriptions"`
}

func (d RawInventoryDesc) ToAsset() Asset {
	asset := Asset{
		ClassID:    d.ClassID,
		InstanceID: d.InstanceID,
		Name:       d.Name,
		Image:      d.Image,
		Type:       d.Type,
	}

	var desc []string
	for _, dd := range d.Descriptions {
		v := dd.Value
		desc = append(desc, v)
		if pv, ok := extractValueFromPrefix(v, assetPrefixHero); ok {
			asset.Hero = pv
		}
		if pv, ok := extractValueFromPrefix(v, assetPrefixGiftFrom); ok {
			asset.GiftFrom = pv
		}
		if pv, ok := extractValueFromPrefix(v, assetPrefixDateReceived); ok {
			asset.DateReceived = pv
		}
		if pv, ok := extractValueFromPrefix(v, assetPrefixDedication); ok {
			asset.Dedication = pv
		}
		if isFlagExists(v, assetFlagGiftOnce) {
			asset.GiftOnce = true
		}
		if isFlagExists(v, assetFlagNotTradable) {
			asset.NotTradable = true
		}
	}
	asset.Descriptions = desc

	return asset
}

// RawInventoryItemDetails represents steam's raw description detail values data model.
type RawInventoryItemDetails []struct {
	Value string `json:"value"`
}

func (d *RawInventoryItemDetails) UnmarshalJSON(data []byte) error {
	s := string(data)
	if s == `""` {
		*d = nil
		return nil
	}

	var details []struct {
		Value string `json:"value"`
	}
	if err := fastjson.Unmarshal(data, &details); err != nil {
		return err
	}
	*d = details
	return nil
}

type RawInventoryPageOffset int

func (po *RawInventoryPageOffset) UnmarshalJSON(data []byte) error {
	s := string(data)
	if s == `false` {
		*po = 0
		return nil
	}

	o := 0
	if err := fastjson.Unmarshal(data, &o); err != nil {
		return err
	}
	*po = RawInventoryPageOffset(o)
	return nil
}

const Dota2AppID = 570
const inventoryEndpoint = "https://steamcommunity.com/profiles/%s/inventory/json/%d/2"

func reqDota2Inventory(steamID string) (*http.Response, error) {
	url := fmt.Sprintf(inventoryEndpoint, steamID, Dota2AppID)
	return http.Get(url)
}

func extractValueFromPrefix(s, prefix string) (value string, ok bool) {
	if !strings.HasPrefix(strings.ToUpper(s), strings.ToUpper(prefix)) {
		return
	}

	return strings.TrimPrefix(s, prefix), true
}

func isFlagExists(s, flag string) (ok bool) {
	return strings.ToUpper(s) == strings.ToUpper(flag)
}
