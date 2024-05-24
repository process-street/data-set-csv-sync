import 'dotenv/config'
import { listDataSetRecords } from './api';
import axios from 'axios';

const dataSetId = 'hdRudJ8fUpAPbqfAxntIOQ'

// First, let's get all the records from the data set
try {
  for await (const records of listDataSetRecords(dataSetId)) {
    console.log(records.length)
  }
} catch (error) {
  if (axios.isAxiosError(error)) {
    console.error(`We couldn't fetch the records: ${error.message}`)
  } else {
    throw error;
  }
}

