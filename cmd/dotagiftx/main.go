package main

import (
	"fmt"
	"time"

	"github.com/sirupsen/logrus"

	"github.com/kudarap/dotagiftx/gokit/envconf"
	"github.com/kudarap/dotagiftx/gokit/file"
	"github.com/kudarap/dotagiftx/gokit/log"
	"github.com/kudarap/dotagiftx/gokit/version"
	"github.com/kudarap/dotagiftx/http"
	"github.com/kudarap/dotagiftx/jobs"
	"github.com/kudarap/dotagiftx/redis"
	"github.com/kudarap/dotagiftx/rethink"
	"github.com/kudarap/dotagiftx/service"
	"github.com/kudarap/dotagiftx/steam"
	"github.com/kudarap/dotagiftx/worker"
)

const configPrefix = "DG"

var logger = log.Default()

func main() {
	app := newApp()

	logger.Println("loading config...")
	if err := app.loadConfig(); err != nil {
		logger.Fatalln("could not load config:", err)
	}

	logger.Println("setting up...")
	if err := app.setup(); err != nil {
		logger.Fatalln("could not setup:", err)
	}

	logger.Println("running app...")
	if err := app.run(); err != nil {
		logger.Fatalln("could not run:", err)
	}
	logger.Println("stopped!")
}

type application struct {
	config Config
	server *http.Server
	worker *worker.Worker
	logger *logrus.Logger

	closerFn func()
}

func (app *application) loadConfig() error {
	envconf.EnvPrefix = configPrefix
	if err := envconf.Load(&app.config); err != nil {
		return fmt.Errorf("could not load config: %s", err)
	}

	return nil
}

func (app *application) setup() error {
	// Logs setup.
	logger.Println("setting up persistent logs...")
	logSvc, err := log.New(app.config.Log)
	if err != nil {
		return fmt.Errorf("could not set up logs: %s", err)
	}
	app.logger = logSvc

	// Database setup.
	logSvc.Println("setting up database...")
	redisClient, err := setupRedis(app.config.Redis)
	if err != nil {
		return err
	}
	rethinkClient, err := setupRethink(app.config.Rethink)
	if err != nil {
		return err
	}

	// External services setup.
	logSvc.Println("setting up external services...")
	steamClient, err := setupSteam(app.config.Steam, redisClient)
	if err != nil {
		return err
	}

	// Storage inits.
	logSvc.Println("setting up data stores...")
	userStg := rethink.NewUser(rethinkClient)
	authStg := rethink.NewAuth(rethinkClient)
	catalogStg := rethink.NewCatalog(rethinkClient, app.contextLog("storage_catalog"))
	itemStg := rethink.NewItem(rethinkClient)
	marketStg := rethink.NewMarket(rethinkClient)
	trackStg := rethink.NewTrack(rethinkClient)
	statsStg := rethink.NewStats(rethinkClient)
	reportStg := rethink.NewReport(rethinkClient)
	deliveryStg := rethink.NewDelivery(rethinkClient)

	// Service inits.
	logSvc.Println("setting up services...")
	fileMgr := setupFileManager(app.config)
	userSvc := service.NewUser(userStg, fileMgr)
	authSvc := service.NewAuth(steamClient, authStg, userSvc)
	imageSvc := service.NewImage(fileMgr)
	itemSvc := service.NewItem(itemStg, fileMgr)
	marketSvc := service.NewMarket(
		marketStg,
		userStg,
		itemStg,
		trackStg,
		catalogStg,
		steamClient,
		app.contextLog("service_market"),
	)
	trackSvc := service.NewTrack(trackStg, itemStg)
	statsSvc := service.NewStats(statsStg)
	reportSvc := service.NewReport(reportStg)
	deliverySvc := service.NewDelivery(deliveryStg)

	// NOTE! this is for run-once scripts
	//fixes.GenerateFakeMarket(itemStg, userStg, marketSvc)
	//fixes.ReIndexAll(itemStg, catalogStg)
	//fixes.ResolveCompletedBidSteamID(marketStg, steamClient)
	//redisClient.BulkDel("")

	// Server setup.
	logSvc.Println("setting up http server...")
	srv := http.NewServer(
		app.config.SigKey,
		userSvc,
		authSvc,
		imageSvc,
		itemSvc,
		marketSvc,
		trackSvc,
		statsSvc,
		reportSvc,
		steamClient,
		redisClient,
		initVer(app.config),
		logSvc,
	)
	srv.Addr = app.config.Addr
	app.server = srv

	// Worker setup.
	wrk := worker.New(
		jobs.NewVerifyDelivery(marketSvc, deliverySvc, app.contextLog("job_verify_delivery")),
		jobs.NewVerifyInventory(marketSvc, app.contextLog("job_verify_inventory")),
	)
	wrk.SetLogger(app.contextLog("worker"))
	app.worker = wrk

	app.closerFn = func() {
		logSvc.Println("closing and stopping app...")
		if err = app.worker.Stop(); err != nil {
			logSvc.Fatal("could not stop worker", err)
		}
		if err = redisClient.Close(); err != nil {
			logSvc.Fatal("could not close redis client", err)
		}
		if err = rethinkClient.Close(); err != nil {
			logSvc.Fatal("could not close rethink client", err)
		}
	}

	return nil
}

func (app *application) run() error {
	defer app.closerFn()

	go app.worker.Start()

	return app.server.Run()
}

func (app *application) contextLog(name string) log.Logger {
	return log.WithPrefix(app.logger, name)
}

func newApp() *application {
	a := &application{}
	a.closerFn = func() {}
	return a
}

func setupSteam(cfg steam.Config, rc *redis.Client) (*steam.Client, error) {
	c, err := steam.New(cfg, rc)
	if err != nil {
		return nil, fmt.Errorf("could not setup steam client: %s", err)
	}

	return c, nil
}

func setupFileManager(cfg Config) *file.Local {
	c := cfg.Upload
	return file.New(c.Path, c.Size, c.Types)
}

func setupRethink(cfg rethink.Config) (c *rethink.Client, err error) {
	c = &rethink.Client{}
	fn := func() error {
		c, err = rethink.New(cfg)
		if err != nil {
			return fmt.Errorf("could not setup rethink client: %s", err)
		}

		return nil
	}

	err = connRetry("rethink", fn)
	return
}

func setupRedis(cfg redis.Config) (c *redis.Client, err error) {
	c = &redis.Client{}
	fn := func() error {
		c, err = redis.New(cfg)
		if err != nil {
			return fmt.Errorf("could not setup redis client: %s", err)
		}

		return nil
	}

	err = connRetry("redis", fn)
	return
}

func connRetry(name string, fn func() error) error {
	const delay = time.Second * 5

	// Catches a panic to retry.
	defer func() {
		if err := recover(); err != nil {
			logger.Printf("[%s] conn error: %s. retrying in %s...", name, err, delay)
			time.Sleep(delay)
			err = connRetry(name, fn)
		}
	}()

	// Causes panic to retry.
	if err := fn(); err != nil {
		panic(err)
	}

	return nil
}

// version details used by ldflags.
var tag, commit, built string

func initVer(cfg Config) *version.Version {
	v := version.New(cfg.Prod, tag, commit, built)
	return v
}
