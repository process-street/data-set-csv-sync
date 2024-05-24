import { ListDataSetRecordsResponse, listDataSetRecordsResponseSchema } from './schemas';
import axios from 'axios';

async function fetchDataSetRecords(dataSetId: string): Promise<ListDataSetRecordsResponse> {
  const url = `https://public-api.process.st/api/v1.1/data-sets/${dataSetId}/records`;
  const response = await axios.get(url);
  return await listDataSetRecordsResponseSchema.validate(response.data);
}
