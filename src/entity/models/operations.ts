import { IEntity } from './interfaces';

type BulkOperationRequestBody = BulkCreateRequestBody | BulkDeleteRequestBody;

export enum BulkActions {
  CREATE = 'create',
  DELETE = 'delete',
}

export interface BulkCreateRequestBody {
  action: BulkActions.CREATE;
  payload: IEntity[];
}

export interface BulkDeleteRequestBody {
  action: BulkActions.DELETE;
  payload: string[];
}

export type MultiOperationBulksRequestBody = [BulkOperationRequestBody, BulkOperationRequestBody];

export type MultiOperationBulk = [BulkCreateRequestBody, BulkDeleteRequestBody];

export type BulkRequestBody = BulkCreateRequestBody | BulkDeleteRequestBody | MultiOperationBulksRequestBody;
