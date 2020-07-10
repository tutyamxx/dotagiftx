package http

import "github.com/go-chi/chi"

func (s *Server) publicRouter(r chi.Router) {
	r.Group(func(r chi.Router) {
		r.Get("/", handleInfo(s.version))
		r.Route("/auth", func(r chi.Router) {
			r.Get("/steam", handleAuthSteam(s.authSvc))
			r.Post("/renew", handleAuthRenew(s.authSvc))
			r.Post("/revoke", handleAuthRevoke(s.authSvc))
		})
		r.Route("/images", func(r chi.Router) {
			r.Get("/{id}", handleImage(s.imageSvc))
			r.Get("/{id}/{w}x{h}", handleImageThumbnail(s.imageSvc))
		})
		r.Route("/items", func(r chi.Router) {
			r.Get("/", handleItemList(s.itemSvc, s.trackSvc, s.logger))
			r.Get("/{id}", handleItemDetail(s.itemSvc))
		})
		r.Route("/markets", func(r chi.Router) {
			r.Get("/", handleMarketList(s.marketSvc, s.trackSvc, s.logger))
			r.Get("/{id}", handleMarketDetail(s.marketSvc))
		})
		r.Get("/catalogs", handleMarketCatalogList(s.marketSvc, s.trackSvc, s.cache, s.logger))
		r.Get("/catalogs/{slug}", handleMarketCatalogDetail(s.marketSvc))
		r.Get("/users/{id}", handlePublicProfile(s.userSvc))
		r.Get("/t", handleTracker(s.trackSvc, s.logger))
		r.Get("/sitemap.xml", handleSitemap(s.marketSvc, s.userSvc))
	})
}

func (s *Server) privateRouter(r chi.Router) {
	r.Group(func(r chi.Router) {
		r.Use(s.authorizer)
		r.Route("/my", func(r chi.Router) {
			r.Get("/profile", handleProfile(s.userSvc))
			r.Route("/markets", func(r chi.Router) {
				r.Get("/", handleMarketList(s.marketSvc, s.trackSvc, s.logger))
				r.Post("/", handleMarketCreate(s.marketSvc))
				r.Get("/{id}", handleMarketDetail(s.marketSvc))
				r.Patch("/{id}", handleMarketUpdate(s.marketSvc))
			})
		})
		r.Post("/items", handleItemCreate(s.itemSvc))
		r.Post("/items_import", handleItemImport(s.itemSvc))
		r.Post("/images", handleImageUpload(s.imageSvc))
	})
}
