package rethink

import (
	"log"

	"github.com/imdario/mergo"
	"github.com/kudarap/dota2giftables/core"
	"github.com/kudarap/dota2giftables/errors"
	r "gopkg.in/rethinkdb/rethinkdb-go.v6"
)

const tableUser = "user"

// NewUser creates new instance of user data store.
func NewUser(c *Client) core.UserStorage {
	if err := c.autoMigrate(tableUser); err != nil {
		log.Fatalf("could not create %s table: %s", tableUser, err)
	}

	return &userStorage{c}
}

type userStorage struct {
	db *Client
}

func (s *userStorage) Find(o core.FindOpts) ([]core.User, error) {
	var res []core.User
	q := newFindOptsQuery(s.table(), o)
	if err := s.db.list(q, &res); err != nil {
		return nil, errors.New(core.StorageUncaughtErr, err)
	}

	return res, nil
}

func (s *userStorage) Get(id string) (*core.User, error) {
	row := &core.User{}
	if err := s.db.one(s.table().Get(id), row); err != nil {
		if err == r.ErrEmptyResult {
			return nil, core.UserErrNotFound
		}

		return nil, errors.New(core.StorageUncaughtErr, err)
	}

	return row, nil
}

func (s *userStorage) Create(in *core.User) error {
	t := now()
	in.CreatedAt = t
	in.UpdatedAt = t
	id, err := s.db.insert(s.table().Insert(in))
	if err != nil {
		return errors.New(core.StorageUncaughtErr, err)
	}
	in.ID = id

	return nil
}

func (s *userStorage) Update(in *core.User) error {
	cur, err := s.Get(in.ID)
	if err != nil {
		return err
	}

	in.UpdatedAt = now()
	err = s.db.update(s.table().Get(in.ID).Update(in))
	if err != nil {
		return errors.New(core.StorageUncaughtErr, err)
	}

	if err := mergo.Merge(in, cur); err != nil {
		return errors.New(core.StorageMergeErr, err)
	}

	return nil
}

func (s *userStorage) table() r.Term {
	return r.Table(tableUser)
}
