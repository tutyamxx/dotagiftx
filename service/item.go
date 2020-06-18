package service

import (
	"context"
	"strings"

	"github.com/kudarap/dota2giftables/core"
	"github.com/kudarap/dota2giftables/errors"
)

// NewItem returns new Item service.
func NewItem(is core.ItemStorage) core.ItemService {
	return &itemService{is}
}

type itemService struct {
	itemStg core.ItemStorage
}

func (s *itemService) Items(opts core.FindOpts) ([]core.Item, *core.FindMetadata, error) {
	res, err := s.itemStg.Find(opts)
	if err != nil {
		return nil, nil, err
	}

	if !opts.WithMeta {
		return res, nil, err
	}

	// Get result and total count for metadata.
	tc, err := s.itemStg.Count(opts)
	if err != nil {
		return nil, nil, err
	}

	return res, &core.FindMetadata{
		ResultCount: len(res),
		TotalCount:  tc,
	}, nil
}

func (s *itemService) Item(id string) (*core.Item, error) {
	return s.itemStg.Get(id)
}

func (s *itemService) Create(ctx context.Context, item *core.Item) error {
	// TODO check moderator/contributors
	au := core.AuthFromContext(ctx)
	if au == nil {
		return core.AuthErrNoAccess
	}
	item.Contributors = []string{au.UserID}

	item.Name = strings.TrimSpace(item.Name)
	item.Hero = strings.TrimSpace(item.Hero)
	item.Slug = item.MakeSlug()
	if err := item.CheckCreate(); err != nil {
		return errors.New(core.ItemErrRequiredFields, err)
	}

	if err := s.itemStg.IsItemExist(item.Name); err != nil {
		return err
	}

	return s.itemStg.Create(item)
}

func (s *itemService) Update(ctx context.Context, it *core.Item) error {
	panic("implement me")
}
