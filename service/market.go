package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/kudarap/dotagiftx/core"
	"github.com/kudarap/dotagiftx/errors"
	"github.com/kudarap/dotagiftx/gokit/log"
)

type TaskProcessor interface {
	Queue(ctx context.Context, p core.TaskPriority, t core.TaskType, payload interface{}) (id string, err error)
}

// NewMarket returns new Market service.
func NewMarket(
	ss core.MarketStorage,
	us core.UserStorage,
	is core.ItemStorage,
	ts core.TrackStorage,
	cs core.CatalogStorage,
	st core.StatsStorage,
	vd core.DeliveryService,
	vi core.InventoryService,
	sc core.SteamClient,
	tp TaskProcessor,
	lg log.Logger,
) core.MarketService {
	return &marketService{
		ss, us,
		is,
		ts,
		cs,
		st,
		vd,
		vi,
		sc,
		tp,
		lg,
	}
}

type marketService struct {
	marketStg    core.MarketStorage
	userStg      core.UserStorage
	itemStg      core.ItemStorage
	trackStg     core.TrackStorage
	catalogStg   core.CatalogStorage
	statsStg     core.StatsStorage
	deliverySvc  core.DeliveryService
	inventorySvc core.InventoryService
	steam        core.SteamClient
	taskProc     TaskProcessor
	logger       log.Logger
}

func (s *marketService) Markets(ctx context.Context, opts core.FindOpts) ([]core.Market, *core.FindMetadata, error) {
	// Set market owner result.
	if au := core.AuthFromContext(ctx); au != nil {
		opts.UserID = au.UserID
	}

	res, err := s.marketStg.Find(opts)
	if err != nil {
		return nil, nil, err
	}

	// Assign inventory and delivery status.
	for i, mkt := range res {
		res[i] = mkt
	}

	if !opts.WithMeta {
		return res, nil, err
	}

	// Get total count for metadata.
	tc, err := s.marketStg.Count(opts)
	if err != nil {
		return nil, nil, err
	}

	return res, &core.FindMetadata{
		ResultCount: len(res),
		TotalCount:  tc,
	}, nil
}

func (s *marketService) Market(ctx context.Context, id string) (*core.Market, error) {
	mkt, err := s.marketStg.Get(id)
	if err != nil {
		return nil, err
	}

	// Check market ownership.
	if au := core.AuthFromContext(ctx); au != nil && mkt.UserID != au.UserID {
		return nil, core.MarketErrNotFound
	}

	return mkt, nil
}

func (s *marketService) Create(ctx context.Context, market *core.Market) error {
	// Set market ownership.
	au := core.AuthFromContext(ctx)
	if au == nil {
		return core.AuthErrNoAccess
	}
	market.UserID = au.UserID
	// Prevents access to create new market when account is flagged.
	if err := s.checkFlaggedUser(au.UserID); err != nil {
		return err
	}

	market.SetDefaults()
	if err := market.CheckCreate(); err != nil {
		return err
	}

	// Check Item existence.
	item, _ := s.itemStg.Get(market.ItemID)
	if item == nil || !item.IsActive() {
		return core.ItemErrNotFound
	}
	market.ItemID = item.ID

	// Check market details by type.
	switch market.Type {
	case core.MarketTypeAsk:
		if err := s.checkAskType(market); err != nil {
			return err
		}

		m, err := s.processShopkeepersContract(market)
		if err != nil {
			return err
		}
		market = m
	case core.MarketTypeBid:
		if err := s.checkBidType(market); err != nil {
			return fmt.Errorf("could not check bid type: %s", err)
		}
	}

	if err := s.marketStg.Create(market); err != nil {
		return err
	}

	//if err := s.UpdateUserRankScore(market.UserID); err != nil {
	//	return err
	//}
	bench(s.logger, "market create :: UpdateUserRankScore", func() {
		if err := s.UpdateUserRankScore(market.UserID); err != nil {
			s.logger.Errorf("could not update user rank %s: %s", market.UserID, err)
		}
	})
	bench(s.logger, "market create :: marketStg.Index", func() {
		if _, err := s.marketStg.Index(market.ID); err != nil {
			s.logger.Errorf("could not index market %s: %s", market.ItemID, err)
		}
	})
	bench(s.logger, "market create :: catalogStg.Index", func() {
		if _, err := s.catalogStg.Index(market.ItemID); err != nil {
			s.logger.Errorf("could not index item %s: %s", market.ItemID, err)
		}
	})

	// Queueing tasks for verifying post to prepare task payload.
	if market.Type == core.MarketTypeAsk {
		user, err := s.userStg.Get(market.UserID)
		if err != nil {
			return err
		}

		market.User = user
		market.Item = item
		if _, err = s.taskProc.Queue(ctx, user.TaskPriorityQueue(), core.TaskTypeVerifyInventory, market); err != nil {
			s.logger.Errorf("could not queue task: market id %s: %s", market.ID, err)
		}
	}

	return nil
}

func (s *marketService) Update(ctx context.Context, market *core.Market) error {
	cur, err := s.checkOwnership(ctx, market.ID)
	if err != nil {
		return err
	}
	// Prevents access to update existing market when account is flagged.
	if err = s.checkFlaggedUser(cur.UserID); err != nil {
		return err
	}

	if err = market.CheckUpdate(); err != nil {
		return err
	}

	// Resolves steam profile URL input as partner steam id.
	if strings.TrimSpace(market.PartnerSteamID) != "" {
		market.PartnerSteamID, err = s.steam.ResolveVanityURL(market.PartnerSteamID)
		if err != nil {
			return err
		}
	}
	// Try to find a matching bid and set its status to complete.
	if cur.Type == core.MarketTypeAsk && market.Status == core.MarketStatusReserved {
		if err = s.AutoCompleteBid(ctx, *cur, market.PartnerSteamID); err != nil {
			return err
		}
	}

	// Append note to existing notes.
	market.Notes = strings.TrimSpace(fmt.Sprintf("%s\n%s", cur.Notes, market.Notes))

	// Do not allow update on these fields.
	market.UserID = ""
	market.ItemID = ""
	market.Price = 0
	market.Currency = ""
	if err = s.marketStg.Update(market); err != nil {
		return err
	}

	// Queueing tasks for verifications on inventory and delivery to prepare task payload.
	if market.Type == core.MarketTypeAsk {
		user, err := s.userStg.Get(market.UserID)
		if err != nil {
			return err
		}
		item, err := s.itemStg.Get(market.ItemID)
		if err != nil {
			return err
		}

		market.User = user
		market.Item = item
		priority := user.TaskPriorityQueue()
		switch market.Status {
		case core.MarketStatusReserved:
			if _, err = s.taskProc.Queue(ctx, priority, core.TaskTypeVerifyInventory, market); err != nil {
				s.logger.Errorf("could not queue task: market id %s: %s", market.ID, err)
			}
		case core.MarketStatusSold:
			if _, err = s.taskProc.Queue(ctx, priority, core.TaskTypeVerifyDelivery, market); err != nil {
				s.logger.Errorf("could not queue task: market id %s: %s", market.ID, err)
			}
		}
	}

	//if err = s.UpdateUserRankScore(market.UserID); err != nil {
	//	return err
	//}
	bench(s.logger, "market update :: UpdateUserRankScore", func() {
		if err = s.UpdateUserRankScore(market.UserID); err != nil {
			s.logger.Errorf("could not update user rank %s: %s", market.UserID, err)
		}
	})
	bench(s.logger, "market update :: marketStg.Index", func() {
		if _, err = s.marketStg.Index(market.ID); err != nil {
			s.logger.Errorf("could not index market %s: %s", market.ItemID, err)
		}
	})
	bench(s.logger, "market update :: catalogStg.Index", func() {
		if _, err = s.catalogStg.Index(market.ItemID); err != nil {
			s.logger.Errorf("could not index item %s: %s", market.ItemID, err)
		}
	})

	return nil
}

func (s *marketService) UpdateUserRankScore(userID string) error {
	stats, err := s.statsStg.CountUserMarketStatus(userID)
	if err != nil {
		return fmt.Errorf("error getting user market stats: %s", err)
	}

	benchS := time.Now()
	u := &core.User{ID: userID, MarketStats: *stats}
	u = u.CalcRankScore(*stats)
	if err = s.marketStg.UpdateUserScore(u.ID, u.RankScore); err != nil {
		return err
	}
	s.logger.Println("service/market UpdateUserScore", time.Now().Sub(benchS))
	return s.userStg.BaseUpdate(u)
}

// AutoCompleteBid detects if there's matching reservation on buy order and automatically
// resolve it by setting complete-bid status.
func (s *marketService) AutoCompleteBid(_ context.Context, ask core.Market, partnerSteamID string) error {
	if ask.ItemID == "" || ask.UserID == "" || partnerSteamID == "" {
		return fmt.Errorf("ask market item id, user id, and partner steam id are required")
	}

	// Use buyer ID to get the matching market.
	buyer, err := s.userStg.Get(partnerSteamID)
	if err != nil {
		return nil
	}

	// Find matching bid market to update status.
	fo := core.FindOpts{
		Filter: core.Market{
			Type:   core.MarketTypeBid,
			Status: core.MarketStatusLive,
			ItemID: ask.ItemID,
			UserID: buyer.ID,
		},
	}
	bids, _ := s.marketStg.Find(fo)
	if bids == nil || len(bids) == 0 {
		return nil
	}

	// Set complete status and seller steam id on matching bid.
	seller, err := s.userStg.Get(ask.UserID)
	if err != nil {
		return err
	}
	b := bids[0]
	b.Status = core.MarketStatusBidCompleted
	b.PartnerSteamID = seller.SteamID
	return s.marketStg.Update(&b)
}

func (s *marketService) checkFlaggedUser(userID string) error {
	u, err := s.userStg.Get(userID)
	if err != nil {
		return err
	}
	if err = u.CheckStatus(); err != nil {
		return err
	}

	return nil
}

func (s *marketService) processShopkeepersContract(m *core.Market) (*core.Market, error) {
	user, err := s.userStg.Get(m.UserID)
	if err != nil {
		return nil, err
	}

	if strings.TrimSpace(m.SellerSteamID) == "" {
		return m, nil
	}
	if !user.HasBoon(core.BoonShopKeepersContract) {
		return nil, fmt.Errorf("could not find BoonShopKeepersContract")
	}

	ssid, err := s.steam.ResolveVanityURL(m.SellerSteamID)
	if err != nil {
		return nil, err
	}
	truePtr := true
	m.Resell = &truePtr
	m.SellerSteamID = ssid
	m.InventoryStatus = core.InventoryStatusVerified // Override verification by reseller
	return m, nil
}

func (s *marketService) checkAskType(ask *core.Market) error {
	//if err := s.restrictMatchingPriceValue(ask); err != nil {
	//	return err
	//}

	user, err := s.userStg.Get(ask.UserID)
	if err != nil {
		return err
	}
	qtyLimit := core.MaxMarketQtyLimitPerFreeUser
	if user.HasBoon(core.BoonRefresherOrb) {
		qtyLimit = core.MaxMarketQtyLimitPerPremiumUser
	}

	// Check Item max offer limit.
	qty, err := s.marketStg.Count(core.FindOpts{
		Filter: core.Market{
			ItemID: ask.ItemID,
			Type:   core.MarketTypeAsk,
			Status: core.MarketStatusLive,
		},
		UserID: ask.UserID,
	})
	if err != nil {
		return err
	}
	if qty >= qtyLimit {
		return fmt.Errorf("market quantity limit(%d) per item reached", qtyLimit)
	}

	return nil
}

func (s *marketService) checkBidType(bid *core.Market) error {
	//if err := s.restrictMatchingPriceValue(bid); err != nil {
	//	return err
	//}

	// Remove existing buy order if exists.
	res, err := s.marketStg.Find(core.FindOpts{
		Filter: core.Market{
			ItemID: bid.ItemID,
			Type:   core.MarketTypeBid,
			Status: core.MarketStatusLive,
		},
		UserID: bid.UserID,
	})
	if err != nil {
		return err
	}
	for _, m := range res {
		m.Status = core.MarketStatusRemoved
		if err = s.marketStg.Update(&m); err != nil {
			return err
		}
	}

	return nil
}

// restrictMatchingPriceValue restricts market price against its counter-part entry.
// 1. market bid price should lower than the lowest ask price.
// 2. market ask price should higher than the highest bid price.
// This was design to enforce the user to check available offers or orders
// with desired price value.
// Update 2021/03/08: It turns out some users are picky on which user they
// want to get the item from, which is very reasonable, and will disable this restriction for now.
func (s *marketService) restrictMatchingPriceValue(mkt *core.Market) error {
	switch mkt.Type {
	case core.MarketTypeAsk:
		bid, err := s.catalogStg.Index(mkt.ItemID)
		if err != nil {
			return err
		}
		if bid.Quantity != 0 && bid.HighestBid > mkt.Price {
			return core.MarketErrInvalidAskPrice
		}
	case core.MarketTypeBid:
		ask, err := s.catalogStg.Index(mkt.ItemID)
		if err != nil {
			return err
		}
		if ask.Quantity != 0 && ask.LowestAsk < mkt.Price {
			return core.MarketErrInvalidBidPrice
		}
	}

	return nil
}

func (s *marketService) checkOwnership(ctx context.Context, id string) (*core.Market, error) {
	au := core.AuthFromContext(ctx)
	if au == nil {
		return nil, core.AuthErrNoAccess
	}

	mkt, err := s.userMarket(au.UserID, id)
	if err != nil {
		return nil, errors.New(core.AuthErrForbidden, err)
	}

	if mkt == nil {
		return nil, errors.New(core.AuthErrForbidden, core.MarketErrNotFound)
	}

	return mkt, nil
}

func (s *marketService) userMarket(userID, id string) (*core.Market, error) {
	cur, err := s.marketStg.Get(id)
	if err != nil {
		return nil, err
	}
	if cur.UserID != userID {
		return nil, core.MarketErrNotFound
	}

	return cur, nil
}

func bench(l log.Logger, name string, fn func()) {
	s := time.Now()
	fn()
	l.Println("BENCH service/market", name, time.Now().Sub(s))
}
