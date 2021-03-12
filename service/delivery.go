package service

import (
	"context"

	"github.com/kudarap/dotagiftx/core"
	"github.com/kudarap/dotagiftx/errors"
)

// NewDelivery returns new Delivery service.
func NewDelivery(rs core.DeliveryStorage) core.DeliveryService {
	return &deliveryService{rs}
}

type deliveryService struct {
	deliveryStg core.DeliveryStorage
}

func (s *deliveryService) Deliveries(opts core.FindOpts) ([]core.Delivery, *core.FindMetadata, error) {
	res, err := s.deliveryStg.Find(opts)
	if err != nil {
		return nil, nil, err
	}

	if !opts.WithMeta {
		return res, nil, err
	}

	// Get result and total count for metadata.
	tc, err := s.deliveryStg.Count(opts)
	if err != nil {
		return nil, nil, err
	}

	return res, &core.FindMetadata{
		ResultCount: len(res),
		TotalCount:  tc,
	}, nil
}

func (s *deliveryService) Delivery(id string) (*core.Delivery, error) {
	return s.deliveryStg.Get(id)
}

func (s *deliveryService) DeliveryByMarketID(marketID string) (*core.Delivery, error) {
	res, err := s.deliveryStg.Find(core.FindOpts{Filter: core.Delivery{
		MarketID: marketID,
	}})
	if err != nil {
		return nil, err
	}
	if len(res) == 0 {
		return nil, core.DeliveryErrNotFound
	}

	return &res[0], nil
}

func (s *deliveryService) Set(_ context.Context, del *core.Delivery) error {
	if err := del.CheckCreate(); err != nil {
		return errors.New(core.DeliveryErrRequiredFields, err)
	}

	// Just update existing record.
	cur, err := s.DeliveryByMarketID(del.MarketID)
	if err != nil {
		return err
	}
	if cur != nil {
		del.ID = cur.ID
		return s.deliveryStg.Update(del)
	}

	return s.deliveryStg.Create(del)
}
