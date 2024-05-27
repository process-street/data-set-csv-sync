import {
  listDataSetRecordsResponseSchema,
  DataSetRecord,
  ListDataSetRecordsResponse,
  CreateDataSetRecordResponse,
  createDataSetRecordResponseSchema,
  ListDataSetsResponse,
  listDataSetsResponseSchema,
  DataSet,
} from './schemas';
import axios from 'axios';

export async function getDataSet(dataSetId: string): Promise<DataSet | undefined> {
  // There's no direct way to get the data set, so we need to cycle all of them to find it
  for await (const dss of listDataSets()) {
    for (const ds of dss) {
      if (ds.id === dataSetId) {
        return ds;
      }
    }
  }
}

export async function* listDataSets(): AsyncGenerator<DataSet[]> {
  let url: string | undefined = `${process.env.PROCESS_STREET_API_URL}/data-sets`;
  while (url) {
    const response = await axios.get(url, {
      headers: { 'X-API-KEY': process.env.PROCESS_STREET_API_KEY },
    });
    const validatedResponse: ListDataSetsResponse = await listDataSetsResponseSchema.validate(response.data);
    yield validatedResponse.dataSets;
    url = validatedResponse.links.find(link => link.name === 'next')?.href;
  }
}

export async function createDataSetRecord(dataSetId: string, cells: DataSetRecord['cells']): Promise<string> {
  const response = await axios.post(
    `${process.env.PROCESS_STREET_API_URL}/data-sets/${dataSetId}/records`,
    { cells },
    {
      headers: { 'X-API-KEY': process.env.PROCESS_STREET_API_KEY },
    },
  );
  const validatedResponse: CreateDataSetRecordResponse = await createDataSetRecordResponseSchema.validate(
    response.data,
  );
  return validatedResponse.id;
}

export async function* listDataSetRecords(dataSetId: string): AsyncGenerator<DataSetRecord[]> {
  let url: string | undefined = `${process.env.PROCESS_STREET_API_URL}/data-sets/${dataSetId}/records`;
  while (url) {
    const response = await axios.get(url, {
      headers: { 'X-API-KEY': process.env.PROCESS_STREET_API_KEY },
    });
    const validatedResponse: ListDataSetRecordsResponse = await listDataSetRecordsResponseSchema.validate(
      response.data,
    );
    yield validatedResponse.records;
    url = validatedResponse.links.find(link => link.name === 'next')?.href;
  }
}
