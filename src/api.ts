import { listDataSetRecordsResponseSchema, Record } from './schemas';
import axios from 'axios';

export async function* listDataSetRecords(dataSetId: string): AsyncGenerator<Record[]> {
  let url: string | undefined = `${process.env.PROCESS_STREET_API_URL}/data-sets/${dataSetId}/records`;
  while (url) {
    const response = await axios.get(url, {
      headers: { 'X-API-KEY': process.env.PROCESS_STREET_API_KEY}
    });
    const recordsResponse = await listDataSetRecordsResponseSchema.validate(response.data)
    yield recordsResponse.records;
    url = recordsResponse.links.find(link => link.name === 'next')?.href;
  }
}
