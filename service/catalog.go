package service

import (
	"context"

	"github.com/kudarap/dotagiftx/core"
)

func (s *marketService) Catalog(opts core.FindOpts) ([]core.Catalog, *core.FindMetadata, error) {
	res, err := s.catalogStg.Find(opts)
	if err != nil {
		return nil, nil, err
	}

	if !opts.WithMeta {
		return res, nil, err
	}

	// Get result and total count for metadata.
	tc, err := s.catalogStg.Count(opts)
	if err != nil {
		return nil, nil, err
	}

	return res, &core.FindMetadata{
		ResultCount: len(res),
		TotalCount:  tc,
	}, nil
}

func (s *marketService) TrendingCatalog(opts core.FindOpts) ([]core.Catalog, *core.FindMetadata, error) {
	res, err := s.catalogStg.Trending()
	if err != nil {
		return nil, nil, err
	}

	if !opts.WithMeta {
		return res, nil, err
	}

	return res, &core.FindMetadata{
		ResultCount: len(res),
		TotalCount:  10, // Fixed value of top 10
	}, nil
}

func (s *marketService) CatalogDetails(slug string, opts core.FindOpts) (*core.Catalog, error) {
	if slug == "" {
		return nil, core.CatalogErrNotFound
	}

	catalog, err := s.catalogStg.Get(slug)
	if err == core.CatalogErrNotFound {
		i, err := s.itemStg.GetBySlug(slug)
		if err != nil {
			return nil, err
		}

		c := i.ToCatalog()
		return &c, nil

	} else if err != nil {
		return nil, err
	}

	// Override filter to specific item id.
	filter := opts.Filter.(*core.Market)
	filter.ItemID = catalog.ID
	opts.Filter = filter
	res, meta, err := s.Markets(context.Background(), opts)
	if err != nil {
		return nil, err
	}
	catalog.Asks = res
	catalog.Quantity = meta.TotalCount

	return catalog, err
}
