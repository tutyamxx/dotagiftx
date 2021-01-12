package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
	"time"

	"github.com/kudarap/dotagiftx/steaminventory"

	"github.com/kudarap/dotagiftx/core"
)

func main0() {
	//status, err := steaminventory.Crawl("76561198088587178")
	//fmt.Println(status, err)

	//meta, err := steaminventory.GetMeta("76561198849220681")
	//fmt.Println(meta, err)

	//inv, err := steaminventory.Get("76561198088587178")
	//fmt.Println(inv, err)

	//inv, err := steaminventory.GetNWait("76561198088587178")
	//fmt.Println(inv, err)

	//flat, err := steaminventory.NewFlatInventoryFromV2(*inv)
	//fmt.Println(flat, err)

}

func main() {
	//flat, err := steaminventory.VerifyDelivery("karosu!", "76561198088587178", "Ravenous Abyss")
	//fmt.Println(flat, err)

	var processed, failed, verified int

	// Benchmark things up.
	ts := time.Now()
	defer func() {
		fmt.Println(time.Now().Sub(ts))
	}()

	delivered, _ := getDelivered()
	for _, mkt := range delivered {
		processed++
		fmt.Println(strings.Repeat("-", 70))
		fmt.Println(fmt.Sprintf("%s -> %s (%s)", mkt.User.Name, mkt.PartnerSteamID, mkt.Item.Name))
		fmt.Println(strings.Repeat("-", 70))

		res, err := steaminventory.VerifyDelivery(mkt.User.Name, mkt.PartnerSteamID, mkt.Item.Name)
		if err != nil {
			fmt.Println("Error:", err)
			fmt.Println("")
			failed++
			continue
		}

		fmt.Println("Found:", len(res))
		if len(res) != 0 {
			r := res[0]
			fmt.Println("GiftFrom:", r.GiftFrom)
			fmt.Println("DateReceived:", r.DateReceived)
			fmt.Println("Dedication:", r.Dedication)
			verified++
		}

		fmt.Println("")
	}

	fmt.Println(fmt.Sprintf("%d/%d total | %d error | %d/%d verified", processed, len(delivered), failed, processed-verified, verified))
}

func getDelivered() ([]core.Market, error) {
	resp, err := http.Get("https://api.dotagiftx.com/markets?sort=updated_at:desc&limit=100&status=400")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	data := struct {
		Data []core.Market
	}{}
	b, err := ioutil.ReadAll(resp.Body)
	if err := json.Unmarshal(b, &data); err != nil {
		return nil, err
	}

	return data.Data, nil
}
