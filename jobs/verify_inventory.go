package jobs

import (
	"context"
	"time"

	"github.com/kudarap/dotagiftx/core"
	"github.com/kudarap/dotagiftx/gokit/log"
	"github.com/kudarap/dotagiftx/steam"
	"github.com/kudarap/dotagiftx/verified"
)

// VerifyInventory represents a inventory verification job.
type VerifyInventory struct {
	marketSvc core.MarketService
	logger    log.Logger
}

func NewVerifyInventory(ms core.MarketService, lg log.Logger) *VerifyInventory {
	return &VerifyInventory{ms, lg}
}

func (j *VerifyInventory) String() string { return "verify_inventory" }

func (j *VerifyInventory) Interval() time.Duration { return time.Hour }

// TODO batch pulling
func (j *VerifyInventory) Run(ctx context.Context) error {
	opts := core.FindOpts{Filter: core.Market{Type: core.MarketTypeAsk, Status: core.MarketStatusLive}}
	opts.Sort = "updated_at:desc"
	opts.Limit = 10
	opts.Page = 1

	for {
		j.logger.Printf("batch #%d", opts.Page)
		res, _, err := j.marketSvc.Markets(ctx, opts)
		if err != nil {
			return err
		}

		src := steam.InventoryAsset
		for _, mkt := range res {
			status, items, err := verified.Inventory(src, mkt.User.SteamID, mkt.Item.Name)
			if err != nil {
				continue
			}

			j.logger.Println(mkt.User.SteamID, mkt.Item.Name, status, len(items))
		}

		// should continue batching?
		if len(res) == 0 {
			return nil
		}
		opts.Page++
	}
}
