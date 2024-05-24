import * as yup from 'yup';
import { InferType } from 'yup';

export const cellSchema = yup.object().shape({
  fieldId: yup.string().required(),
  value: yup.string().required(),
});

export type Cell = InferType<typeof cellSchema>;

export const recordSchema = yup.object().shape({
  id: yup.string().required(),
  cells: yup.array().of(cellSchema).required(),
});

export type Record = InferType<typeof recordSchema>;

export const linkSchema = yup.object().shape({
  name: yup.string().required(),
  href: yup.string().required(),
  rel: yup.string().required(),
});

export type Link = InferType<typeof linkSchema>;

export const listDataSetRecordsResponseSchema = yup.object().shape({
  records: yup.array().of(recordSchema).required(),
  links: yup.array().of(linkSchema).required(),
});

export type ListDataSetRecordsResponse = InferType<typeof listDataSetRecordsResponseSchema>;
