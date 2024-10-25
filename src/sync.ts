import 'dotenv/config';
import { createDataSetRecord, deleteDataSetRecord, getDataSet, listDataSetRecords, updateDataSetRecord } from './api';
import axios from 'axios';
import * as fs from 'fs';
import csv from 'csv-parser';
import { Command } from 'commander';
import axiosRetry from 'axios-retry';

// Set up axios retry with custom logic
axiosRetry(axios, {
  retries: 3, // Number of retry attempts
  retryCondition: error => {
    const response = error.response;
    const ratedLimited = response?.status === 429; // Retry only on 429 status code
    if (ratedLimited) {
      const retryAfter = error.response?.headers['retry-after'];
      console.warn(`Rate limited, retrying after ${retryAfter}...`);
    }
    return ratedLimited;
  },
  retryDelay: (retryCount, error) => {
    const retryAfter = error.response?.headers['retry-after'];

    // Parse `Retry-After` header as either seconds or a date
    if (retryAfter) {
      const delay = isNaN(Number(retryAfter))
        ? new Date(retryAfter).getTime() - new Date().getTime()
        : Number(retryAfter) * 1000;
      return delay > 0 ? delay : 1000; // Default to 1s delay if header value is invalid
    } else {
      return axiosRetry.exponentialDelay(retryCount); // Fallback to exponential delay if no `Retry-After` header
    }
  },
});

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
      const fieldId = csvColumnToFieldIdLookup[indexColumn];
      const indexCell = r.cells.find(cell => cell.fieldId === fieldId);
      if (indexCell) {
        indexToRecordIdLookup[indexCell.value] = r.id;
      } else {
        console.error(`The field id "${fieldId}" does not exist in the data set record "${r.id}"`);
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
  const cells = dataSet.fields.map(field => ({
    fieldId: field.id,
    value: row[field.name] ?? '',
  }));
  if (recordId) {
    updatedRecordsIds.push(recordId);
    console.log(`Updating record with index value "${indexValue}"...`);
    await updateDataSetRecord(dataSetId, recordId, cells);
  } else {
    console.log(`Creating record with index value "${indexValue}"...`);
    await createDataSetRecord(dataSetId, cells);
  }
}

// Finally, we'll delete any rows that are no longer in the CSV file.

const recordIdsToDelete = Object.values(indexToRecordIdLookup).filter(id => !updatedRecordsIds.includes(id));
for (const recordId of recordIdsToDelete) {
  console.log(`Deleting record with record ID "${recordId}"...`);
  await deleteDataSetRecord(dataSetId, recordId);
}
