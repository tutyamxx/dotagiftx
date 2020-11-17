package http

import (
	"net/http"
	"time"

	"github.com/go-chi/chi"
	"github.com/kudarap/dotagiftx/core"
	"github.com/sirupsen/logrus"
)

const (
	marketCacheKeyPrefix = "svc_market" // For cache invalidation control.
	marketCacheExpr      = time.Hour
)

func handleMarketList(svc core.MarketService, trackSvc core.TrackService, logger *logrus.Logger, cache core.Cache) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Check for cache hit and render them.
		cacheKey, noCache := core.CacheKeyFromRequestWithPrefix(r, marketCacheKeyPrefix)
		if !noCache {
			if hit, _ := cache.Get(cacheKey); hit != "" {
				respondOK(w, hit)
				return
			}
		}

		opts, err := findOptsFromURL(r.URL, &core.Market{})
		if err != nil {
			respondError(w, err)
			return
		}

		go func() {
			if err := trackSvc.CreateSearchKeyword(r, opts.Keyword); err != nil {
				logger.Errorf("search keyword tracking error: %s", err)
			}
		}()

		list, md, err := svc.Markets(r.Context(), opts)
		if err != nil {
			respondError(w, err)
			return
		}
		if list == nil {
			list = []core.Market{}
		}

		o := newDataWithMeta(list, md)
		go func() {
			if err := cache.Set(cacheKey, o, marketCacheExpr); err != nil {
				logger.Errorf("could save cache on catalog details: %s", err)
			}
		}()
		respondOK(w, o)
	}
}

func handleMarketDetail(svc core.MarketService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		m, err := svc.Market(r.Context(), chi.URLParam(r, "id"))
		if err != nil {
			respondError(w, err)
			return
		}

		respondOK(w, m)
	}
}

func handleMarketCreate(svc core.MarketService, cache core.Cache) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		m := new(core.Market)
		if err := parseForm(r, m); err != nil {
			respondError(w, err)
			return
		}

		if err := svc.Create(r.Context(), m); err != nil {
			respondError(w, err)
			return
		}

		go cache.BulkDel(marketCacheKeyPrefix)
		//if err := cache.BulkDel(marketCacheKeyPrefix); err != nil {
		//	respondError(w, err)
		//	return
		//}

		respondOK(w, m)
	}
}

func handleMarketUpdate(svc core.MarketService, cache core.Cache) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		m := new(core.Market)
		if err := parseForm(r, m); err != nil {
			respondError(w, err)
			return
		}
		m.ID = chi.URLParam(r, "id")

		if err := svc.Update(r.Context(), m); err != nil {
			respondError(w, err)
			return
		}

		go cache.BulkDel(marketCacheKeyPrefix)
		//if err := cache.BulkDel(marketCacheKeyPrefix); err != nil {
		//	respondError(w, err)
		//	return
		//}

		respondOK(w, m)
	}
}

const (
	queryFlagRecentItems  = "recent"
	queryFlagPopularItems = "popular"
)

func handleMarketCatalogList(svc core.MarketService, trackSvc core.TrackService, cache core.Cache, logger *logrus.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var noCache bool
		query := r.URL.Query()

		// Special query flags with findOpts override for popular and recent items.
		if hasQueryField(r.URL, "sort") {
			switch query.Get("sort") {
			case queryFlagRecentItems:
				query.Set("sort", "recent_ask:desc")
				noCache = true
				break
			case queryFlagPopularItems:
				query.Set("sort", "view_count:desc")
				break
			}

			r.URL.RawQuery = query.Encode()
		}

		opts, err := findOptsFromURL(r.URL, &core.Catalog{})
		if err != nil {
			respondError(w, err)
			return
		}

		go func() {
			if err := trackSvc.CreateSearchKeyword(r, opts.Keyword); err != nil {
				logger.Errorf("search keyword tracking error: %s", err)
			}
		}()

		// Check for cache hit and render them.
		cacheKey, noCache := core.CacheKeyFromRequestWithPrefix(r, marketCacheKeyPrefix)
		if !noCache {
			if hit, _ := cache.Get(cacheKey); hit != "" {
				respondOK(w, hit)
				return
			}
		}

		list, md, err := svc.Catalog(opts)
		if err != nil {
			respondError(w, err)
			return
		}
		if list == nil {
			list = []core.Catalog{}
		}

		// Save result to cache.
		data := newDataWithMeta(list, md)
		go func() {
			if err := cache.Set(cacheKey, data, marketCacheExpr); err != nil {
				logger.Errorf("could save cache on catalog list: %s", err)
			}
		}()

		respondOK(w, data)
	}
}

func handleMarketCatalogDetail(svc core.MarketService, cache core.Cache, logger *logrus.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Check for cache hit and render them.
		cacheKey, noCache := core.CacheKeyFromRequestWithPrefix(r, marketCacheKeyPrefix)
		if !noCache {
			if hit, _ := cache.Get(cacheKey); hit != "" {
				respondOK(w, hit)
				return
			}
		}

		c, err := svc.CatalogDetails(chi.URLParam(r, "slug"))
		if err != nil {
			respondError(w, err)
			return
		}

		go func() {
			if err := cache.Set(cacheKey, c, marketCacheExpr); err != nil {
				logger.Errorf("could save cache on catalog details: %s", err)
			}
		}()

		respondOK(w, c)
	}
}

const catalogTrendCacheExpr = time.Hour

func handleMarketCatalogTrendList(svc core.MarketService, cache core.Cache, logger *logrus.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var noCache bool
		opts, err := findOptsFromURL(r.URL, &core.Catalog{})
		if err != nil {
			respondError(w, err)
			return
		}

		// Check for cache hit and render them.
		cacheKey, noCache := core.CacheKeyFromRequestWithPrefix(r, marketCacheKeyPrefix)
		if !noCache {
			if hit, _ := cache.Get(cacheKey); hit != "" {
				respondOK(w, hit)
				return
			}
		}

		list, md, err := svc.TrendingCatalog(opts)
		if err != nil {
			respondError(w, err)
			return
		}
		if list == nil {
			list = []core.Catalog{}
		}

		// Save result to cache.
		data := newDataWithMeta(list, md)
		go func() {
			if err := cache.Set(cacheKey, data, catalogTrendCacheExpr); err != nil {
				logger.Errorf("could save cache on catalog trend list: %s", err)
			}
		}()

		respondOK(w, data)
	}
}
