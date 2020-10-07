package http

import (
	"net/http"
	"time"

	"github.com/kudarap/dotagiftx/core"
)

const statsCacheMarketSummary = time.Minute * 2

func handleStatsMarketSummary(marketSvc core.MarketService, cache core.Cache) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Check for cache hit and render them.
		cacheKey, noCache := core.CacheKeyFromRequest(r)
		if !noCache {
			if hit, _ := cache.Get(cacheKey); hit != "" {
				respondOK(w, hit)
				return
			}
		}

		var err error
		summary := struct {
			Live      int `json:"live"`
			Reserved  int `json:"reserved"`
			Delivered int `json:"delivered"`
		}{}

		// Collect live market.
		summary.Live, err = marketCountByStatus(r, marketSvc, core.MarketStatusLive)
		if err != nil {
			respondError(w, err)
			return
		}

		// Collect reserve market.
		summary.Reserved, err = marketCountByStatus(r, marketSvc, core.MarketStatusReserved)
		if err != nil {
			respondError(w, err)
			return
		}

		// Collect sold market.
		summary.Delivered, err = marketCountByStatus(r, marketSvc, core.MarketStatusSold)
		if err != nil {
			respondError(w, err)
			return
		}

		_ = cache.Set(cacheKey, summary, statsCacheMarketSummary)
		respondOK(w, summary)
	}
}

func marketCountByStatus(r *http.Request, marketSvc core.MarketService, status core.MarketStatus) (int, error) {
	opts, err := findOptsFromURL(r.URL, &core.Market{})
	if err != nil {
		return 0, err
	}
	opts.Limit = 1
	filter := opts.Filter.(*core.Market)
	filter.Status = status
	opts.Filter = filter

	_, meta, err := marketSvc.Markets(r.Context(), opts)
	if err != nil {
		return 0, err
	}

	return meta.TotalCount, nil
}

const statsCacheExpr = time.Hour

func handleStatsTopOrigins(itemSvc core.ItemService, cache core.Cache) http.HandlerFunc {
	return topStatsBaseHandler(itemSvc.TopOrigins, cache)
}

func handleStatsTopHeroes(itemSvc core.ItemService, cache core.Cache) http.HandlerFunc {
	return topStatsBaseHandler(itemSvc.TopHeroes, cache)
}

func topStatsBaseHandler(fn func() ([]string, error), cache core.Cache) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Check for cache hit and render them.
		cacheKey, noCache := core.CacheKeyFromRequest(r)
		if !noCache {
			if hit, _ := cache.Get(cacheKey); hit != "" {
				respondOK(w, hit)
				return
			}
		}

		l, err := fn()
		if err != nil {
			respondError(w, err)
			return
		}
		top10 := l[:10]

		_ = cache.Set(cacheKey, top10, statsCacheExpr)
		respondOK(w, top10)
	}
}
