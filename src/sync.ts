import 'dotenv/config';
import { getDataSet, listDataSetRecords } from './api';
import axios from 'axios';
import * as fs from 'fs';
import csv from 'csv-parser';
import { Command } from 'commander';

const program = new Command();

program
  .arguments('<dataSetId> <csvPath> <indexColumn>')
  .description('Sync the data set with CSV matching on the index column')
  .action((dataSetId, csvPath, indexColumn) => {
    console.log(`Data Set ID: ${dataSetId}`);
    console.log(`CSV Path: ${csvPath}`);
    console.log(`Index Column: ${indexColumn}`);
    console.log('');
  })
  .parse(process.argv);

const [dataSetId, csvPath, indexColumn] = program.args as [string, string, string];

// Read in all the CSV rows and validate them.

interface CsvRow {
  [key: string]: string;
}

const csvRows: CsvRow[] = [];

try {
  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('headers', (headers: string[]) => {
      if (!headers.includes(indexColumn)) {
        console.error(`The index column "${indexColumn}" does not exist in the CSV file`);
        process.exit(1);
      }
    })
    .on('data', (data: CsvRow) => csvRows.push(data))
    .on('end', () => {})
    .on('error', error => {
      console.error('Error during CSV parsing:', error.message);
    });
} catch (error) {
  console.error('Error reading the CSV file');
}

// Let's make the lookup table to convert a CSV column name to a data set field ID.

const dataSet = await getDataSet(dataSetId);
if (!dataSet) {
  console.error(`The data set "${dataSetId}" does not exist`);
  process.exit(1);
}
const csvColumnToFieldIdLookup: Record<string, string> = {};
for (const field of dataSet.fields) {
  csvColumnToFieldIdLookup[field.name] = field.id;
}

// Now, let's make a lookup table from index column to record ID.

const indexToRecordIdLookup: Record<string, string> = {};

// First, let's get all the records from the data set
console.log(`Fetching records for data set "${dataSetId}"...`);
try {
  for await (const rs of listDataSetRecords(dataSetId)) {
    for (const r of rs) {
      const indexCell = r.cells.find(cell => cell.fieldId === indexColumn);
      if (indexCell) {
        indexToRecordIdLookup[indexCell.value] = r.id;
      } else {
        console.error(`The index column "${indexColumn}" does not exist in the data set record "${r.id}"`);
        process.exit(1);
      }
    }
  }
} catch (error) {
  if (axios.isAxiosError(error)) {
    console.error(`We couldn't fetch the records: ${error.message}`);
  } else {
    throw error;
  }
}

// Next, let's cycle through the CSV rows and update or create the records.

const updatedRecordsIds: string[] = [];

for (const row of csvRows) {
  const indexValue = row[indexColumn];
  if (!indexValue) {
    console.error(`The index column "${indexColumn}" is empty for a row in the CSV file`);
    process.exit(1);
  }
  const recordId = indexToRecordIdLookup[indexValue];
  if (recordId) {
    updatedRecordsIds.push(recordId);
    console.log(`Updating record with index value "${indexValue}"...`);
  } else {
    console.log(`Creating record with index value "${indexValue}"...`);
  }
}

// Finally, we'll delete any rows that are no longer in the CSV file.
