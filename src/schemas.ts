import * as yup from 'yup';
import { InferType } from 'yup';

export const dataSetFieldSchema = yup.object().shape({
  id: yup.string().required(),
  name: yup.string().defined(),
});

export type DataSetField = InferType<typeof dataSetFieldSchema>;

export const dataSetSchema = yup.object().shape({
  id: yup.string().required(),
  name: yup.string().required(),
  fields: yup.array().of(dataSetFieldSchema).required(),
});

export type DataSet = InferType<typeof dataSetSchema>;

export const cellSchema = yup.object().shape({
  fieldId: yup.string().required(),
  value: yup.string().defined(),
});

export type Cell = InferType<typeof cellSchema>;

export const dataSetRecordSchema = yup.object().shape({
  id: yup.string().required(),
  cells: yup.array().of(cellSchema).required(),
});

export type DataSetRecord = InferType<typeof dataSetRecordSchema>;

export const linkSchema = yup.object().shape({
  name: yup.string().required(),
  href: yup.string().required(),
  rel: yup.string().required(),
});

export type Link = InferType<typeof linkSchema>;

export const listDataSetsResponseSchema = yup.object().shape({
  dataSets: yup.array().of(dataSetSchema).required(),
  links: yup.array().of(linkSchema).required(),
});

export type ListDataSetsResponse = InferType<typeof listDataSetsResponseSchema>;

export const createDataSetRecordResponseSchema = yup.object().shape({
  id: yup.string().required(),
});

export type CreateDataSetRecordResponse = InferType<typeof createDataSetRecordResponseSchema>;

export const updateDataSetRecordResponseSchema = dataSetRecordSchema;

export type UpdateDataSetRecordResponse = InferType<typeof updateDataSetRecordResponseSchema>;

export const listDataSetRecordsResponseSchema = yup.object().shape({
  records: yup.array().of(dataSetRecordSchema).required(),
  links: yup.array().of(linkSchema).required(),
});

export type ListDataSetRecordsResponse = InferType<typeof listDataSetRecordsResponseSchema>;

export const deleteDataSetRecordResponseSchema = dataSetRecordSchema;

export type DeleteDataSetRecordResponse = InferType<typeof deleteDataSetRecordResponseSchema>;
