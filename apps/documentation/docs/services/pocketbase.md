# Pocketbase

| [Website](https://pocketbase.io/) | [Documentation](https://pocketbase.io/docs/) | [Repository](https://github.com/pocketbase/pocketbase) |
| :-------------------------------: | :------------------------------------------: | :----------------------------------------------------: |

[[ToC]]

## What is Pocketbase?

Pocketbase is an open-source backend solution that provides a NoSQL database, real-time APIs, and authentication mechanisms in a compact package. It is particularly useful for rapid prototyping, MVPs, and small to medium-sized applications.

We use Pocketbase to provide a robust and scalable backend infrastructure that can easily integrate into our existing applications. With Pocketbase, we can quickly create data models, authenticate users, and implement real-time updates without having to worry about the complex details of backend development.

### Why Pocketbase instead of custom development?

|           Aspect            | Details                                                                                                                                            |
| :-------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------- |
|      **Time savings**       | Pocketbase offers a variety of out-of-the-box features, significantly reducing development time.                                                   |
|       **Scalability**       | Pocketbase is scalable and can easily handle growing requirements.                                                                                 |
| **Real-time functionality** | With Pocketbase, we can easily implement real-time updates and notifications.                                                                      |
|        **Security**         | Pocketbase provides built-in authentication and authorization mechanisms, enhancing the security of our applications.                              |
|  **Community and support**  | Being an open-source project, Pocketbase has an active community and regular updates, meaning we benefit from continuous improvements and support. |

## Docker image

[**Repository**](https://github.com/BudgetBuddyDE/Pocketbase.git)

```Dockerfile
FROM alpine:latest

ARG PB_VERSION=0.22.8

RUN apk add --no-cache \
    unzip \
    ca-certificates

# download and unzip PocketBase
ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/

EXPOSE 8080

# start PocketBase
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8080"]
```

## Database Schema

::: code-group Install the package

```json [Production]
[
  {
    "id": "_pb_users_auth_",
    "name": "users",
    "type": "auth",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "rjhb0esu",
        "name": "name",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "cyraecqh",
        "name": "surname",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "users_avatar",
        "name": "avatar",
        "type": "file",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "mimeTypes": ["image/jpeg", "image/png", "image/svg+xml", "image/gif", "image/webp"],
          "thumbs": null,
          "maxSelect": 1,
          "maxSize": 5242880,
          "protected": false
        }
      },
      {
        "system": false,
        "id": "xgrazjio",
        "name": "newsletter",
        "type": "relation",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "6wnb1i2qb25kj7z",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": null,
          "displayFields": null
        }
      }
    ],
    "indexes": [],
    "listRule": "id = @request.auth.id",
    "viewRule": "id = @request.auth.id",
    "createRule": "",
    "updateRule": "id = @request.auth.id",
    "deleteRule": "id = @request.auth.id",
    "options": {
      "allowEmailAuth": true,
      "allowOAuth2Auth": true,
      "allowUsernameAuth": true,
      "exceptEmailDomains": null,
      "manageRule": null,
      "minPasswordLength": 8,
      "onlyEmailDomains": null,
      "onlyVerified": false,
      "requireEmail": true
    }
  },
  {
    "id": "lz1u22pcdwebexa",
    "name": "budgets",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "h3t9lmnf",
        "name": "owner",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "gamsmrru",
        "name": "category",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "j6e2a0zrnd7d80h",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "g0m3rjyr",
        "name": "budget",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": false
        }
      }
    ],
    "indexes": ["CREATE INDEX `idx_5GNpves` ON `budgets` (\n  `owner`,\n  `category`\n)"],
    "listRule": "owner.id = @request.auth.id",
    "viewRule": "owner.id = @request.auth.id",
    "createRule": "",
    "updateRule": "owner.id = @request.auth.id",
    "deleteRule": "owner.id = @request.auth.id",
    "options": {}
  },
  {
    "id": "j6e2a0zrnd7d80h",
    "name": "categories",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "ly0gteeu",
        "name": "owner",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "6lc5tnkv",
        "name": "name",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 80,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "ymw9gkgj",
        "name": "description",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      }
    ],
    "indexes": ["CREATE UNIQUE INDEX `idx_AaKwX4L` ON `categories` (\n  `owner`,\n  `name`\n)"],
    "listRule": "owner.id = @request.auth.id",
    "viewRule": "owner.id = @request.auth.id",
    "createRule": "",
    "updateRule": "owner.id = @request.auth.id",
    "deleteRule": "owner.id = @request.auth.id",
    "options": {}
  },
  {
    "id": "6wnb1i2qb25kj7z",
    "name": "newsletters",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "h8qpxc5y",
        "name": "enabled",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
      },
      {
        "system": false,
        "id": "hv0qasxg",
        "name": "newsletter",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "chqdeby4",
        "name": "name",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "wcqzrvhw",
        "name": "description",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      }
    ],
    "indexes": ["CREATE UNIQUE INDEX `idx_fWBzw2U` ON `newsletters` (`newsletter`)"],
    "listRule": "",
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  },
  {
    "id": "fl7u8slb64ladln",
    "name": "payment_methods",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "gpi69fir",
        "name": "owner",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "3eanxytq",
        "name": "name",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 80,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "tcs9zxse",
        "name": "provider",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 100,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "xuraqcwj",
        "name": "address",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 100,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "hugvhogo",
        "name": "description",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      }
    ],
    "indexes": [
      "CREATE INDEX `idx_n0yprOz` ON `payment_methods` (\n  `owner`,\n  `name`,\n  `provider`,\n  `address`\n)"
    ],
    "listRule": "owner.id = @request.auth.id",
    "viewRule": "owner.id = @request.auth.id",
    "createRule": "",
    "updateRule": "owner.id = @request.auth.id",
    "deleteRule": "owner.id = @request.auth.id",
    "options": {}
  },
  {
    "id": "6ta4u8u5rppdqfh",
    "name": "stock_exchanges",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "fvipty3s",
        "name": "name",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "1wozyzlx",
        "name": "symbol",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "vmqvu38t",
        "name": "exchange",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": null,
          "pattern": ""
        }
      }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX `idx_9A7KSfy` ON `stock_exchanges` (\n  `symbol`,\n  `exchange`\n)"
    ],
    "listRule": "",
    "viewRule": "",
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  },
  {
    "id": "wtlidhxowydwwu0",
    "name": "stock_positions",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "yurv50er",
        "name": "owner",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "drowmjox",
        "name": "exchange",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "6ta4u8u5rppdqfh",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "o2ma5xlz",
        "name": "bought_at",
        "type": "date",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      },
      {
        "system": false,
        "id": "njwsfrn3",
        "name": "isin",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 12,
          "max": 12,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "uscmrh5g",
        "name": "buy_in",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": false
        }
      },
      {
        "system": false,
        "id": "etgj13bd",
        "name": "currency",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 3,
          "max": 3,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "nvmqgabg",
        "name": "quantity",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": false
        }
      }
    ],
    "indexes": [],
    "listRule": "owner.id = @request.auth.id",
    "viewRule": "owner.id = @request.auth.id",
    "createRule": "",
    "updateRule": "owner.id = @request.auth.id",
    "deleteRule": "owner.id = @request.auth.id",
    "options": {}
  },
  {
    "id": "lk1ilondt89zy5b",
    "name": "stock_watchlists",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "ygzsoywu",
        "name": "owner",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "qbswq130",
        "name": "exchange",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "6ta4u8u5rppdqfh",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "jnizvevy",
        "name": "isin",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 12,
          "max": 12,
          "pattern": ""
        }
      }
    ],
    "indexes": [
      "CREATE INDEX `idx_dPlOU1z` ON `stock_watchlists` (\n  `owner`,\n  `exchange`,\n  `isin`\n)"
    ],
    "listRule": "owner.id = @request.auth.id",
    "viewRule": "owner.id = @request.auth.id",
    "createRule": "",
    "updateRule": "owner.id = @request.auth.id",
    "deleteRule": "owner.id = @request.auth.id",
    "options": {}
  },
  {
    "id": "aijo6z3zdlm8ppw",
    "name": "subscriptions",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "i94iviym",
        "name": "owner",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "qvniyu8q",
        "name": "category",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "j6e2a0zrnd7d80h",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "9jgaowyp",
        "name": "payment_method",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "fl7u8slb64ladln",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "fgn6wxy9",
        "name": "paused",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
      },
      {
        "system": false,
        "id": "b5hoz2n8",
        "name": "execute_at",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 31,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "xibaelft",
        "name": "receiver",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 100,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "htzsfkkz",
        "name": "information",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "xub5erzz",
        "name": "transfer_amount",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": false
        }
      }
    ],
    "indexes": [],
    "listRule": "owner.id = @request.auth.id",
    "viewRule": "owner.id = @request.auth.id",
    "createRule": "",
    "updateRule": "owner.id = @request.auth.id",
    "deleteRule": "owner.id = @request.auth.id",
    "options": {}
  },
  {
    "id": "ql29ez1qvq77mvz",
    "name": "transactions",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "k62cdtun",
        "name": "owner",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "hsxpvazn",
        "name": "category",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "j6e2a0zrnd7d80h",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "jpmd1owh",
        "name": "payment_method",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "fl7u8slb64ladln",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "eb6hjfca",
        "name": "processed_at",
        "type": "date",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      },
      {
        "system": false,
        "id": "bvxh86m2",
        "name": "receiver",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "9sa8uf09",
        "name": "information",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "hkcql2lw",
        "name": "transfer_amount",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": false
        }
      },
      {
        "system": false,
        "id": "xslwzukn",
        "name": "attachments",
        "type": "file",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "mimeTypes": ["application/pdf", "image/jpeg", "image/png", "image/vnd.mozilla.apng"],
          "thumbs": [],
          "maxSelect": 99,
          "maxSize": 10485760,
          "protected": true
        }
      }
    ],
    "indexes": [],
    "listRule": "owner.id = @request.auth.id",
    "viewRule": "owner.id = @request.auth.id",
    "createRule": "",
    "updateRule": "owner.id = @request.auth.id",
    "deleteRule": "owner.id = @request.auth.id",
    "options": {}
  },
  {
    "id": "9rn6pzsmgwqku5u",
    "name": "v_monthly_balances",
    "type": "view",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "2ezuysf9",
        "name": "date",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 1
        }
      },
      {
        "system": false,
        "id": "kcgjsums",
        "name": "balance",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 1
        }
      },
      {
        "system": false,
        "id": "fp37ovg4",
        "name": "income",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 1
        }
      },
      {
        "system": false,
        "id": "qm95pqyh",
        "name": "expenses",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 1
        }
      },
      {
        "system": false,
        "id": "bqsgu0ar",
        "name": "owner",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      }
    ],
    "indexes": [],
    "listRule": "owner = @request.auth.id",
    "viewRule": "owner = @request.auth.id",
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {
      "query": "SELECT \n  (ROW_NUMBER() OVER()) AS id,\n  strftime('%Y-%m',transactions.processed_at) AS date,\n  SUM(transactions.transfer_amount) AS balance,\n  SUM(CASE WHEN transactions.transfer_amount > 0 THEN transactions.transfer_amount ELSE 0 END) AS income,\n  SUM(CASE WHEN transactions.transfer_amount < 0 THEN ABS(transactions.transfer_amount) ELSE 0 END) AS expenses,\n  transactions.owner\nFROM transactions\nWHERE transactions.processed_at <= CURRENT_TIMESTAMP\nGROUP BY strftime('%Y-%m',transactions.processed_at), transactions.owner\nORDER BY transactions.processed_at DESC;"
    }
  }
]
```

```json [Development]
[
  {
    "id": "_pb_users_auth_",
    "name": "users",
    "type": "auth",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "rjhb0esu",
        "name": "name",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "cyraecqh",
        "name": "surname",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "users_avatar",
        "name": "avatar",
        "type": "file",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "mimeTypes": ["image/jpeg", "image/png", "image/svg+xml", "image/gif", "image/webp"],
          "thumbs": null,
          "maxSelect": 1,
          "maxSize": 5242880,
          "protected": false
        }
      },
      {
        "system": false,
        "id": "xgrazjio",
        "name": "newsletter",
        "type": "relation",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "6wnb1i2qb25kj7z",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": null,
          "displayFields": null
        }
      }
    ],
    "indexes": [],
    "listRule": "id = @request.auth.id",
    "viewRule": "id = @request.auth.id",
    "createRule": "",
    "updateRule": "id = @request.auth.id",
    "deleteRule": "id = @request.auth.id",
    "options": {
      "allowEmailAuth": true,
      "allowOAuth2Auth": true,
      "allowUsernameAuth": true,
      "exceptEmailDomains": null,
      "manageRule": null,
      "minPasswordLength": 8,
      "onlyEmailDomains": null,
      "onlyVerified": false,
      "requireEmail": true
    }
  },
  {
    "id": "lz1u22pcdwebexa",
    "name": "budgets",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "h3t9lmnf",
        "name": "owner",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "gamsmrru",
        "name": "category",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "j6e2a0zrnd7d80h",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "g0m3rjyr",
        "name": "budget",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": false
        }
      }
    ],
    "indexes": ["CREATE INDEX `idx_5GNpves` ON `budgets` (\n  `owner`,\n  `category`\n)"],
    "listRule": "owner.id = @request.auth.id",
    "viewRule": "owner.id = @request.auth.id",
    "createRule": "",
    "updateRule": "owner.id = @request.auth.id",
    "deleteRule": "owner.id = @request.auth.id",
    "options": {}
  },
  {
    "id": "j6e2a0zrnd7d80h",
    "name": "categories",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "ly0gteeu",
        "name": "owner",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "6lc5tnkv",
        "name": "name",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 80,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "ymw9gkgj",
        "name": "description",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      }
    ],
    "indexes": ["CREATE UNIQUE INDEX `idx_AaKwX4L` ON `categories` (\n  `owner`,\n  `name`\n)"],
    "listRule": "owner.id = @request.auth.id",
    "viewRule": "owner.id = @request.auth.id",
    "createRule": "",
    "updateRule": "owner.id = @request.auth.id",
    "deleteRule": "owner.id = @request.auth.id",
    "options": {}
  },
  {
    "id": "6wnb1i2qb25kj7z",
    "name": "newsletters",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "h8qpxc5y",
        "name": "enabled",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
      },
      {
        "system": false,
        "id": "hv0qasxg",
        "name": "newsletter",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "chqdeby4",
        "name": "name",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "wcqzrvhw",
        "name": "description",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      }
    ],
    "indexes": ["CREATE UNIQUE INDEX `idx_fWBzw2U` ON `newsletters` (`newsletter`)"],
    "listRule": "",
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  },
  {
    "id": "fl7u8slb64ladln",
    "name": "payment_methods",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "gpi69fir",
        "name": "owner",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "3eanxytq",
        "name": "name",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 80,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "tcs9zxse",
        "name": "provider",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 100,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "xuraqcwj",
        "name": "address",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 100,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "hugvhogo",
        "name": "description",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      }
    ],
    "indexes": [
      "CREATE INDEX `idx_n0yprOz` ON `payment_methods` (\n  `owner`,\n  `name`,\n  `provider`,\n  `address`\n)"
    ],
    "listRule": "owner.id = @request.auth.id",
    "viewRule": "owner.id = @request.auth.id",
    "createRule": "",
    "updateRule": "owner.id = @request.auth.id",
    "deleteRule": "owner.id = @request.auth.id",
    "options": {}
  },
  {
    "id": "6ta4u8u5rppdqfh",
    "name": "stock_exchanges",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "fvipty3s",
        "name": "name",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "1wozyzlx",
        "name": "symbol",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "vmqvu38t",
        "name": "exchange",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": null,
          "pattern": ""
        }
      }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX `idx_9A7KSfy` ON `stock_exchanges` (\n  `symbol`,\n  `exchange`\n)"
    ],
    "listRule": "",
    "viewRule": "",
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  },
  {
    "id": "wtlidhxowydwwu0",
    "name": "stock_positions",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "yurv50er",
        "name": "owner",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "drowmjox",
        "name": "exchange",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "6ta4u8u5rppdqfh",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "o2ma5xlz",
        "name": "bought_at",
        "type": "date",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      },
      {
        "system": false,
        "id": "njwsfrn3",
        "name": "isin",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 12,
          "max": 12,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "uscmrh5g",
        "name": "buy_in",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": false
        }
      },
      {
        "system": false,
        "id": "etgj13bd",
        "name": "currency",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 3,
          "max": 3,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "nvmqgabg",
        "name": "quantity",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": false
        }
      }
    ],
    "indexes": [],
    "listRule": "owner.id = @request.auth.id",
    "viewRule": "owner.id = @request.auth.id",
    "createRule": "",
    "updateRule": "owner.id = @request.auth.id",
    "deleteRule": "owner.id = @request.auth.id",
    "options": {}
  },
  {
    "id": "lk1ilondt89zy5b",
    "name": "stock_watchlists",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "ygzsoywu",
        "name": "owner",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "qbswq130",
        "name": "exchange",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "6ta4u8u5rppdqfh",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "jnizvevy",
        "name": "isin",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 12,
          "max": 12,
          "pattern": ""
        }
      }
    ],
    "indexes": [
      "CREATE INDEX `idx_dPlOU1z` ON `stock_watchlists` (\n  `owner`,\n  `exchange`,\n  `isin`\n)"
    ],
    "listRule": "owner.id = @request.auth.id",
    "viewRule": "owner.id = @request.auth.id",
    "createRule": "",
    "updateRule": "owner.id = @request.auth.id",
    "deleteRule": "owner.id = @request.auth.id",
    "options": {}
  },
  {
    "id": "aijo6z3zdlm8ppw",
    "name": "subscriptions",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "i94iviym",
        "name": "owner",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "qvniyu8q",
        "name": "category",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "j6e2a0zrnd7d80h",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "9jgaowyp",
        "name": "payment_method",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "fl7u8slb64ladln",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "fgn6wxy9",
        "name": "paused",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
      },
      {
        "system": false,
        "id": "b5hoz2n8",
        "name": "execute_at",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 31,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "xibaelft",
        "name": "receiver",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 100,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "htzsfkkz",
        "name": "information",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "xub5erzz",
        "name": "transfer_amount",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": false
        }
      }
    ],
    "indexes": [],
    "listRule": "owner.id = @request.auth.id",
    "viewRule": "owner.id = @request.auth.id",
    "createRule": "",
    "updateRule": "owner.id = @request.auth.id",
    "deleteRule": "owner.id = @request.auth.id",
    "options": {}
  },
  {
    "id": "ql29ez1qvq77mvz",
    "name": "transactions",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "k62cdtun",
        "name": "owner",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "hsxpvazn",
        "name": "category",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "j6e2a0zrnd7d80h",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "jpmd1owh",
        "name": "payment_method",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "fl7u8slb64ladln",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "eb6hjfca",
        "name": "processed_at",
        "type": "date",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      },
      {
        "system": false,
        "id": "bvxh86m2",
        "name": "receiver",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "9sa8uf09",
        "name": "information",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "hkcql2lw",
        "name": "transfer_amount",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": false
        }
      },
      {
        "system": false,
        "id": "xslwzukn",
        "name": "attachments",
        "type": "file",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "mimeTypes": ["application/pdf", "image/jpeg", "image/png", "image/vnd.mozilla.apng"],
          "thumbs": [],
          "maxSelect": 99,
          "maxSize": 10485760,
          "protected": true
        }
      }
    ],
    "indexes": [],
    "listRule": "owner.id = @request.auth.id",
    "viewRule": "owner.id = @request.auth.id",
    "createRule": "",
    "updateRule": "owner.id = @request.auth.id",
    "deleteRule": "owner.id = @request.auth.id",
    "options": {}
  },
  {
    "id": "9rn6pzsmgwqku5u",
    "name": "v_monthly_balances",
    "type": "view",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "2ezuysf9",
        "name": "date",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 1
        }
      },
      {
        "system": false,
        "id": "kcgjsums",
        "name": "balance",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 1
        }
      },
      {
        "system": false,
        "id": "fp37ovg4",
        "name": "income",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 1
        }
      },
      {
        "system": false,
        "id": "qm95pqyh",
        "name": "expenses",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 1
        }
      },
      {
        "system": false,
        "id": "bqsgu0ar",
        "name": "owner",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      }
    ],
    "indexes": [],
    "listRule": "owner = @request.auth.id",
    "viewRule": "owner = @request.auth.id",
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {
      "query": "SELECT \n  (ROW_NUMBER() OVER()) AS id,\n  strftime('%Y-%m',transactions.processed_at) AS date,\n  SUM(transactions.transfer_amount) AS balance,\n  SUM(CASE WHEN transactions.transfer_amount > 0 THEN transactions.transfer_amount ELSE 0 END) AS income,\n  SUM(CASE WHEN transactions.transfer_amount < 0 THEN ABS(transactions.transfer_amount) ELSE 0 END) AS expenses,\n  transactions.owner\nFROM transactions\nWHERE transactions.processed_at <= CURRENT_TIMESTAMP\nGROUP BY strftime('%Y-%m',transactions.processed_at), transactions.owner\nORDER BY transactions.processed_at DESC;"
    }
  }
]
```

:::