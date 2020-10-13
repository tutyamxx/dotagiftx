package http

import (
	"fmt"
	"net/http"

	jsoniter "github.com/json-iterator/go"
	"github.com/kudarap/dotagiftx/core"
	"github.com/kudarap/dotagiftx/errors"
)

var json = jsoniter.ConfigCompatibleWithStandardLibrary

func respond(w http.ResponseWriter, code int, body interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)

	// Check for string response body.
	if s, ok := body.(string); ok {
		_, _ = w.Write([]byte(s))
		return
	}

	// Generate the response
	enc := json.NewEncoder(w)
	if err := enc.Encode(body); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte(fmt.Sprintf("could not encode body into JSON: %s", err)))
	}
}

func respondOK(w http.ResponseWriter, body interface{}) {
	respond(w, http.StatusOK, body)
}

func respondError(w http.ResponseWriter, err error) {
	var body interface{}
	status := http.StatusBadRequest

	// Try to parse handled errors.
	cErr, ok := errors.Parse(err)
	if ok {
		if cErr.Fatal {
			status = http.StatusInternalServerError
		} else if cErr.IsEqual(core.AuthErrNoAccess) {
			status = http.StatusUnauthorized
		}

		body = httpMsg{true, cErr.Type.String(), err.Error()}

	} else {
		// Use generic error message
		body = newError(err)
	}

	respond(w, status, body)
}

func handle404() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		respond(w, http.StatusNotFound, newError(fmt.Errorf("resource not found")))
	}
}

func handle405() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		respond(w, http.StatusMethodNotAllowed, newError(fmt.Errorf("method not allowed")))
	}
}

func parseForm(r *http.Request, form interface{}) error {
	if err := json.NewDecoder(r.Body).Decode(form); err != nil {
		return fmt.Errorf("could not parse json form: %s", err)
	}

	return nil
}
