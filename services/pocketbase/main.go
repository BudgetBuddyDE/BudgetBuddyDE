package main

import (
	"fmt"
	"log"
	"math"
	"net/http"
	"time"

	"budget-buddy/pocketbase/custom_models"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/daos"
	"github.com/pocketbase/pocketbase/tools/cron"
	"github.com/pocketbase/pocketbase/tools/types"
)

func main() {
	app := pocketbase.New()

	bindAppHooks(app)

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}

func bindAppHooks(app core.App) {
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		scheduler := cron.New()

		scheduler.MustAdd("process-recurring-payments", "1 0 * * *", func() {
			subscriptionTable := "subscriptions"
			if result := app.Dao().HasTable(subscriptionTable); !result {
				log.Fatalf("Table '%s' doesn't exist", subscriptionTable)
			}

			subscriptions, err := app.Dao().FindRecordsByFilter(
				subscriptionTable,
				"paused = false && execute_at = {:day}",
				"-execute_at",
				-1,
				0,
				dbx.Params{
					"day": time.Now().Day(),
				})
			if err != nil {
				log.Fatal(err.Error())
			}

			app.Dao().RunInTransaction(func(txDao *daos.Dao) error {
				for _, record := range subscriptions {
					transaction := &custom_models.Transaction{
						Owner:          record.GetString("owner"),
						Category:       record.GetString("category"),
						PaymentMethod:  record.GetString("payment_method"),
						ProcessedAt:    types.NowDateTime(),
						Receiver:       record.GetString("receiver"),
						Information:    record.GetString("information"),
						TransferAmount: record.GetFloat("transfer_amount"),
					}

					if err := txDao.Save(transaction); err != nil {
						log.Fatal(err.Error())
					}
					log.Printf("Transaction created: %s", transaction.Id)
				}

				return nil
			})
		})

		scheduler.Start()

		// /transactions/stats
		e.Router.AddRoute(echo.Route{
			Method: http.MethodGet,
			Path:   "/transactions/stats",
			Handler: func(c echo.Context) error {
				startDate := c.QueryParam("startDate")
				endDate := c.QueryParam("endDate")
				requestInfo := apis.RequestInfo(c)
				requestUser := requestInfo.AuthRecord

				transactionTable := "transactions"
				if result := app.Dao().HasTable(transactionTable); !result {
					return apis.NewApiError(500, fmt.Sprintf("Table '%s' doesn't exist", transactionTable), nil)
				}

				transactions, err := app.Dao().FindRecordsByFilter(
					transactionTable,
					"owner = {:owner} && processed_at >= {:from} && processed_at <= {:to}",
					"-processed_at",
					-1,
					0,
					dbx.Params{
						"owner": requestUser.Id,
						"from":  startDate,
						"to":    endDate,
					})
				if err != nil {
					return apis.NewApiError(500, err.Error(), nil)
				}

				now := time.Now()
				incomeReceived := 0.0
				incomeUpcoming := 0.0
				expensesReceived := 0.0
				expensesUpcoming := 0.0
				for _, record := range transactions {
					amount := record.GetFloat("transfer_amount")
					processedAt := record.GetDateTime("processed_at")
					isExpense := amount < 0

					if processedAt.Time().Before(now) || processedAt.Time().Equal(now) {
						if isExpense {
							expensesReceived += math.Abs(amount)
						} else {
							incomeReceived += amount
						}
					} else {
						if isExpense {
							expensesUpcoming += math.Abs(amount)
						} else {
							incomeUpcoming += amount
						}
					}
				}

				subscriptionTable := "subscriptions"
				if result := app.Dao().HasTable(subscriptionTable); !result {
					return apis.NewApiError(500, fmt.Sprintf("Table '%s' doesn't exist", subscriptionTable), nil)
				}

				upcomingSubscriptions, err := app.Dao().FindRecordsByFilter(
					subscriptionTable,
					"owner = {:owner} && paused = false && execute_at > {:date}",
					"-execute_at",
					-1,
					0,
					dbx.Params{
						"owner": requestUser.Id,
						"date":  now.Day(),
					})
				if err != nil {
					return apis.NewApiError(500, err.Error(), nil)
				}

				for _, record := range upcomingSubscriptions {
					amount := record.GetFloat("transfer_amount")

					if amount < 0 {
						expensesUpcoming += math.Abs(amount)
					} else {
						incomeUpcoming += amount
					}
				}

				response := map[string]interface{}{
					"startDate": startDate,
					"endDate":   endDate,
					"income": map[string]float64{
						"received": incomeReceived,
						"upcoming": incomeUpcoming,
					},
					"expenses": map[string]float64{
						"received": expensesReceived,
						"upcoming": expensesUpcoming,
					},
					"balance": map[string]float64{
						"current":   incomeReceived - expensesReceived,
						"estimated": (incomeReceived + incomeUpcoming) - (expensesReceived + expensesUpcoming),
					},
				}

				return c.JSON(http.StatusOK, response)
			},
			Middlewares: []echo.MiddlewareFunc{
				apis.ActivityLogger(app),
				apis.RequireAdminOrRecordAuth("users"),
			},
		})

		// /transactions/budget
		e.Router.AddRoute(echo.Route{
			Method: http.MethodGet,
			Path:   "/transactions/budget",
			Handler: func(c echo.Context) error {
				startDate := c.QueryParam("startDate")
				endDate := c.QueryParam("endDate")
				requestInfo := apis.RequestInfo(c)
				requestUser := requestInfo.AuthRecord

				transactionTable := "transactions"
				if result := app.Dao().HasTable(transactionTable); !result {
					return apis.NewApiError(500, fmt.Sprintf("Table '%s' doesn't exist", transactionTable), nil)
				}

				transactions, err := app.Dao().FindRecordsByFilter(
					transactionTable,
					"owner = {:owner} && processed_at >= {:from} && processed_at <= {:to}",
					"-processed_at",
					-1,
					0,
					dbx.Params{
						"owner": requestUser.Id,
						"from":  startDate,
						"to":    endDate,
					})
				if err != nil {
					return apis.NewApiError(500, err.Error(), nil)
				}

				now := time.Now()
				expenses := 0.0
				upcomingExpenses := 0.0
				income := 0.0
				upcomingIncome := 0.0
				for _, record := range transactions {
					amount := record.GetFloat("transfer_amount")
					processedAt := record.GetDateTime("processed_at")
					isExpense := amount < 0

					if processedAt.Time().Before(now) || processedAt.Time().Equal(now) {
						if isExpense {
							expenses += math.Abs(amount)
						} else {
							income += amount
						}
					} else {
						if isExpense {
							upcomingExpenses += math.Abs(amount)
						} else {
							upcomingIncome += amount
						}
					}
				}

				subscriptionTable := "subscriptions"
				if result := app.Dao().HasTable(transactionTable); !result {
					return apis.NewApiError(500, fmt.Sprintf("Table '%s' doesn't exist", subscriptionTable), nil)
				}

				upcomingSubscriptions, err := app.Dao().FindRecordsByFilter(
					subscriptionTable,
					"owner = {:owner} && paused = false && execute_at > {:date}",
					"-execute_at",
					-1,
					0,
					dbx.Params{
						"owner": requestUser.Id,
						"date":  now.Day(),
					})
				if err != nil {
					return apis.NewApiError(500, err.Error(), nil)
				}

				for _, record := range upcomingSubscriptions {
					amount := record.GetFloat("transfer_amount")

					if amount < 0 {
						upcomingExpenses += math.Abs(amount)
					} else {
						upcomingIncome += amount
					}
				}

				response := map[string]interface{}{
					"startDate":        startDate,
					"endDate":          endDate,
					"expenses":         expenses,
					"upcomingExpenses": upcomingExpenses,
					"freeAmount":       (income + upcomingIncome) - (expenses + upcomingExpenses),
				}

				return c.JSON(http.StatusOK, response)
			},
			Middlewares: []echo.MiddlewareFunc{
				apis.ActivityLogger(app),
				apis.RequireAdminOrRecordAuth("users"),
			},
		})

		// /categories/stats
		e.Router.AddRoute(echo.Route{
			Method: http.MethodGet,
			Path:   "/cateogries/stats",
			Handler: func(c echo.Context) error {
				startDate := c.QueryParam("startDate")
				endDate := c.QueryParam("endDate")
				requestInfo := apis.RequestInfo(c)
				requestUser := requestInfo.AuthRecord

				transactionTable := "transactions"
				if result := app.Dao().HasTable(transactionTable); !result {
					return apis.NewApiError(500, fmt.Sprintf("Table '%s' doesn't exist", transactionTable), nil)
				}

				transactions, err := app.Dao().FindRecordsByFilter(
					transactionTable,
					"owner = {:owner} && processed_at >= {:from} && processed_at <= {:to}",
					"-processed_at",
					-1,
					0,
					dbx.Params{
						"owner": requestUser.Id,
						"from":  startDate,
						"to":    endDate,
					})
				if err != nil {
					return apis.NewApiError(500, err.Error(), nil)
				}

				categoryStats := make(map[string]map[string]float64)

				for _, record := range transactions {
					categoryID := record.GetString("category")
					amount := record.GetFloat("transfer_amount")
					isExpense := amount < 0

					if _, exists := categoryStats[categoryID]; !exists {
						categoryStats[categoryID] = map[string]float64{
							"income":   0,
							"expenses": 0,
							"balance":  0,
						}
					}

					if isExpense {
						categoryStats[categoryID]["expenses"] += math.Abs(amount)
					} else {
						categoryStats[categoryID]["income"] += amount
					}
					categoryStats[categoryID]["balance"] = categoryStats[categoryID]["income"] - categoryStats[categoryID]["expenses"]
				}

				categoryIDs := make(map[string]struct{})
				for _, record := range transactions {
					categoryID := record.GetString("category")
					categoryIDs[categoryID] = struct{}{}
				}

				var categoryIDList []string
				for id := range categoryIDs {
					categoryIDList = append(categoryIDList, id)
				}

				fetchedCategories, err := app.Dao().FindRecordsByIds("categories", categoryIDList)
				if err != nil {
					return apis.NewApiError(500, err.Error(), nil)
				}

				categoryMap := make(map[string]map[string]interface{})
				for _, category := range fetchedCategories {
					categoryMap[category.Id] = map[string]interface{}{
						"id":   category.Id,
						"name": category.GetString("name"),
					}
				}

				var categories []map[string]interface{}
				for categoryID, stats := range categoryStats {
					categories = append(categories, map[string]interface{}{
						"category": categoryMap[categoryID],
						"income":   stats["income"],
						"expenses": stats["expenses"],
						"balance":  stats["balance"],
					})
				}

				response := map[string]interface{}{
					"startDate":  startDate,
					"endDate":    endDate,
					"categories": categories,
				}

				return c.JSON(http.StatusOK, response)
			},
			Middlewares: []echo.MiddlewareFunc{
				apis.ActivityLogger(app),
				apis.RequireAdminOrRecordAuth("users"),
			},
		})

		return nil
	})
}
