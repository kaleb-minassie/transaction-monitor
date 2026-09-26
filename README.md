# Transaction Monitor

**Project context:** Independent portfolio project inspired by the software engineering skills used in Capital One's Technology Internship Program. This application was created for demonstration and was not commissioned, used, or endorsed by Capital One.

This application checks simulated purchases against a small set of risk rules. Visitors can try the browser demo, while the separate Spring Boot API stores transactions and returns a summary. 
## What It Does

Enter an account, merchant, amount, category, country, and risk threshold. The monitor labels the transaction **APPROVED** or **REVIEW**, explains the matched rules, and shows recent activity and flagged counts.

## How It Works

1. **Validate:** The Spring Boot API checks required fields and positive amounts with Jakarta Validation.
2. **Assess:** `RiskRules.java` flags amounts over the chosen threshold, purchases outside the US, and electronics purchases of $750 or more.
3. **Store:** `TransactionController.java` saves the result and reasons to a file-backed H2 database through Spring Data JPA.
4. **Retrieve:** REST endpoints return the 50 most recent transactions and analyzed/flagged counts.
5. **Demo:** `site/app.js` applies the sample rules in the visitor's browser. GitHub Pages does **not** call the API or share data across visitors.

## Features

- Configurable dollar threshold and three explainable risk rules
- Input validation and persisted backend records
- REST endpoints for submission, recent history, and summary
- Interactive browser demo with an in-memory activity log
- Unit tests for approved and flagged purchases

## Built With

Java 17, Spring Boot, Spring Web, Spring Data JPA, Jakarta Validation, H2, JUnit, Maven, Docker, and HTML/CSS/JavaScript for the demo.

## Getting Started

Clone this repository. From its root, run:

```bash
docker build -t transaction-monitor ./backend
docker run --rm -p 8080:8080 -v transaction_data:/data transaction-monitor
```

The API runs at `http://localhost:8080`. Open `site/index.html` for the separate no-setup demo. With Java and Maven installed, run `cd backend && mvn test` for backend tests.

## Example API Request

```bash
curl -X POST http://localhost:8080/api/transactions \
  -H 'Content-Type: application/json' \
  -d '{"accountId":"acct-1042","merchant":"Northline Electronics","amount":875.00,"category":"Electronics","country":"US","threshold":1000.00}'
```

This returns `REVIEW` because the electronics amount is at least $750. Use `GET /api/transactions` for recent records and `GET /api/transactions/summary` for counts.

## Limitations

These are illustrative rules, **not** a real fraud model. The public demo runs only in the browser. The API has no authentication or production controls, so use simulated data only.

## Future Improvements

Connect the UI to a deployed API, add account-specific baselines, and move persistence to a managed database with authentication.

## Skills Demonstrated

Designing validated REST endpoints, separating business rules from storage, persisting records, and explaining decisions in a usable interface.
