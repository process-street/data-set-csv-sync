import {
  CreateDataSetRecordResponse,
  createDataSetRecordResponseSchema,
  DataSet,
  DataSetRecord,
  deleteDataSetRecordResponseSchema,
  ListDataSetRecordsResponse,
  listDataSetRecordsResponseSchema,
  ListDataSetsResponse,
  listDataSetsResponseSchema,
  updateDataSetRecordResponseSchema,
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

export async function updateDataSetRecord(
  dataSetId: string,
  recordId: string,
  cells: DataSetRecord['cells'],
): Promise<DataSetRecord> {
  const response = await axios.put(
    `${process.env.PROCESS_STREET_API_URL}/data-sets/${dataSetId}/records/${recordId}`,
    { cells },
    {
      headers: { 'X-API-KEY': process.env.PROCESS_STREET_API_KEY },
    },
  );
  return await updateDataSetRecordResponseSchema.validate(response.data);
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

export async function deleteDataSetRecord(dataSetId: string, recordId: string): Promise<DataSetRecord> {
  const response = await axios.delete(
    `${process.env.PROCESS_STREET_API_URL}/data-sets/${dataSetId}/records/${recordId}`,
    {
      headers: { 'X-API-KEY': process.env.PROCESS_STREET_API_KEY },
    },
  );
  return await deleteDataSetRecordResponseSchema.validate(response.data);
}
