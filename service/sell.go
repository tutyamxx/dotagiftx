package service

import (
	"context"

	"github.com/kudarap/dota2giftables/core"
	"github.com/kudarap/dota2giftables/errors"
)

// NewSell returns new Sell service.
func NewSell(ss core.SellStorage, us core.UserStorage, is core.ItemStorage) core.SellService {
	return &sellService{ss, us, is}
}

type sellService struct {
	sellStg core.SellStorage
	userStg core.UserStorage
	itemStg core.ItemStorage
}

func (s *sellService) Sells(opts core.FindOpts) ([]core.Sell, *core.FindMetadata, error) {
	res, err := s.sellStg.Find(opts)
	if err != nil {
		return nil, nil, err
	}
	for i, _ := range res {
		s.getRelatedFields(&res[i])
	}

	if !opts.WithMeta {
		return res, nil, err
	}

	// Get result and total count for metadata.
	tc, err := s.sellStg.Count(opts)
	if err != nil {
		return nil, nil, err
	}

	return res, &core.FindMetadata{
		ResultCount: len(res),
		TotalCount:  tc,
	}, nil
}

func (s *sellService) Sell(id string) (*core.Sell, error) {
	sell, err := s.sellStg.Get(id)
	if err != nil {
		return nil, err
	}

	s.getRelatedFields(sell)
	return sell, nil
}

func (s *sellService) getRelatedFields(sell *core.Sell) {
	sell.User, _ = s.userStg.Get(sell.UserID)
	sell.Item, _ = s.itemStg.Get(sell.ItemID)
}

func (s *sellService) Create(ctx context.Context, sell *core.Sell) error {
	// Set ownership
	au := core.AuthFromContext(ctx)
	if au == nil {
		return core.AuthErrNoAccess
	}
	sell.UserID = au.UserID

	sell.SetDefaults()
	if err := sell.CheckCreate(); err != nil {
		return errors.New(core.ItemErrRequiredFields, err)
	}

	return s.sellStg.Create(sell)
}

func (s *sellService) Update(ctx context.Context, sell *core.Sell) error {
	panic("implement me")
}
