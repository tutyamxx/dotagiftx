package http

import (
	"net/http"
	"path/filepath"

	"github.com/kudarap/dotagiftx/core"
	"github.com/sirupsen/logrus"
)

var pixel = filepath.Join("assets/image/pixel.gif")

func handleTracker(svc core.TrackService, logger *logrus.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := svc.CreateFromRequest(r); err != nil {
			logger.Errorf("tracker error: %s", err)
			return
		}

		// unset JSON headers
		w.Header().Set("Access-Control-Allow-Headers", "")
		w.Header().Set("Access-Control-Allow-Methods", "")
		w.Header().Set("Access-Control-Allow-Origin", "")

		// no cache
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		w.Header().Set("Pragma", "no-cache")
		w.Header().Set("Expires", "0")

		// output image
		w.Header().Set("Content-Type", "image/gif")
		http.ServeFile(w, r, pixel)
	}
}
