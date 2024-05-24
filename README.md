# Data Set CSV Sync

A script to synchronize a CSV with an existing data set in Process Street.

## Setup

First, you'll need to install all the dependencies:

```shell
npm install
```

Next, you'll want to copy `.env.example` to `.env` and set `PROCESS_STREET_API_KEY` to your API key:

```shell
cp .env.example .env
```

## Usage

```shell
npm start -- <dataSetId> <csvPath> <indexColumn>
```

For example:

```shell
npm start -- jximA08020M34hrr8fZGsQ sample-data/updated_employee_data.csv EmpCode
```

Then it will synchronize the data set with the CSV file.

You can use this script to keep your data set in sync with a CSV file from another system that changes over time.
