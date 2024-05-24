import 'dotenv/config';
import { listDataSetRecords } from './api';
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

interface Row {
  [key: string]: string;
}

const results: Row[] = [];
try {
  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('headers', (headers: string[]) => {
      if (!headers.includes(indexColumn)) {
        console.error(`The index column "${indexColumn}" does not exist in the CSV`);
        process.exit(1);
      }
    })
    .on('data', (data: Row) => results.push(data))
    .on('end', () => {})
    .on('error', error => {
      console.error('Error during CSV parsing:', error.message);
    });
} catch (error) {
  console.error('Error reading CSV file');
}

// Let's read in the CSV and make sure the index column exists

// First, let's get all the records from the data set
console.log(`Fetching records for data set "${dataSetId}"...`);
try {
  for await (const records of listDataSetRecords(dataSetId)) {
    console.log(records.length);
  }
} catch (error) {
  if (axios.isAxiosError(error)) {
    console.error(`We couldn't fetch the records: ${error.message}`);
  } else {
    throw error;
  }
}

// We'll make a look-up table to find them later
