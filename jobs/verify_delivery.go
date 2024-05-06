package jobs

import (
	"context"
	"time"

	"github.com/kudarap/dotagiftx"
	"github.com/kudarap/dotagiftx/gokit/log"
	"github.com/kudarap/dotagiftx/steaminvorg"
	"github.com/kudarap/dotagiftx/verified"
)

// VerifyDelivery represents a delivery verification job.
type VerifyDelivery struct {
	deliverySvc dotagiftx.DeliveryService
	marketStg   dotagiftx.MarketStorage
	logger      log.Logger
	// job settings
	name     string
	interval time.Duration
	filter   dotagiftx.Market
}

func NewVerifyDelivery(ds dotagiftx.DeliveryService, ms dotagiftx.MarketStorage, lg log.Logger) *VerifyDelivery {
	f := dotagiftx.Market{Type: dotagiftx.MarketTypeAsk, Status: dotagiftx.MarketStatusSold}
	return &VerifyDelivery{
		ds, ms, lg,
		"verify_delivery", defaultJobInterval, f}
}

func (vd *VerifyDelivery) String() string { return vd.name }

func (vd *VerifyDelivery) Interval() time.Duration { return vd.interval }

func (vd *VerifyDelivery) Run(ctx context.Context) error {
	bs := time.Now()
	defer func() {
		vd.logger.Println("VERIFIED DELIVERY BENCHMARK TIME", time.Since(bs))
	}()

	opts := dotagiftx.FindOpts{Filter: vd.filter}
	opts.Sort = "updated_at:desc"
	opts.Limit = 10
	opts.Page = 0

	src := steaminvorg.InventoryAsset
	for {
		res, err := vd.marketStg.PendingDeliveryStatus(opts)
		if err != nil {
			return err
		}

		for _, mkt := range res {
			// Skip verified statuses.
			if mkt.DeliveryStatus == dotagiftx.DeliveryStatusNameVerified ||
				mkt.DeliveryStatus == dotagiftx.DeliveryStatusSenderVerified {
				continue
			}

			if mkt.User == nil || mkt.Item == nil {
				vd.logger.Errorf("skipped process! missing data user:%#v item:%#v", mkt.User, mkt.Item)
				continue
			}

			status, assets, err := verified.Delivery(src, mkt.User.Name, mkt.PartnerSteamID, mkt.Item.Name)
			if err != nil {
				continue
			}
			vd.logger.Println("batch", opts.Page, mkt.User.Name, mkt.PartnerSteamID, mkt.Item.Name, status)

			err = vd.deliverySvc.Set(ctx, &dotagiftx.Delivery{
				MarketID: mkt.ID,
				Status:   status,
				Assets:   assets,
			})
			if err != nil {
				vd.logger.Errorln(mkt.User.SteamID, mkt.Item.Name, status, err)
			}

			//rest(5)
			time.Sleep(time.Second / 4)
		}

		// Is there more?
		if len(res) < opts.Limit {
			return nil
		}
		//opts.Page++
	}
}
