package tracing

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
)

type Tracer struct {
	store spanStore
}

func NewTracer(s spanStore) *Tracer {
	return &Tracer{s}
}

type spanStore interface {
	Add(name string, elapsedMs int64, t time.Time)
}

type Span struct {
	store spanStore
	name  string
	start time.Time
}

func (s *Span) End() {
	s.store.Add(s.name, time.Since(s.start).Milliseconds(), s.start)
}

func (t *Tracer) StartSpan(name string) *Span {
	return &Span{store: t.store, name: name, start: time.Now()}
}

func (t *Tracer) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// exclude these endpoints
		if r.Method == http.MethodOptions || strings.HasPrefix(r.URL.Path, "/images") {
			next.ServeHTTP(w, r)
			return
		}

		s := t.StartSpan("tbd")
		defer func() {
			s.name = fmt.Sprintf("%s %s", r.Method, chi.RouteContext(r.Context()).RoutePattern())
			s.End()
		}()
		next.ServeHTTP(w, r)
	})
}
