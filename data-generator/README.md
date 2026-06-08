# Data Generator

Generate test data for manual testing, API testing, imports, and database seed
scripts.

Generated files are written to `outputs/`.

Supported formats:

- CSV: parameterized data table for imports and data-driven tests
- SQL: `INSERT` statements for database seed data

The SQL output is plain insert text. Review table names and column names before
running it against any database.
