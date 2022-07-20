// Type definitions for search-index 3.0
// Project: https://github.com/fergiemcdowall/search-index
// Definitions by: Travis Harrison <https://github.com/TravisYeah>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// Minimum TypeScript Version: 4.0

import { AbstractLevelDOWNConstructor } from 'abstract-leveldown';

export interface SearchIndexOptions {
    db?: AbstractLevelDOWNConstructor;
    cacheLength?: number | undefined;
    caseSensitive?: boolean | undefined;
    name?: string | undefined;
    tokenAppend?: string | undefined;
    stopwords?: string[] | undefined;
}

export interface Page {
    NUMBER: number;
    SIZE: number;
}

export type Type = 'NUMERIC' | 'ALPHABETIC';

export type Direction = 'ASCENDING' | 'DESCENDING';

export interface AND {
    AND: Token[];
}

export interface NOT {
    INCLUDE: Token;
    EXCLUDE: Token;
}

export interface OR {
    OR: Token[];
}

export interface SEARCH {
    SEARCH: Token[];
}

export type QueryVerb = AND | NOT | OR | SEARCH;

export type Field = string | string[];

export interface RangeValueObject {
    GTE: string | number;
    LTE: string | number;
}

export interface FieldValueObject {
    FIELD: Field;
    VALUE: string | RangeValueObject;
}

export interface FieldOnlyObject {
    FIELD: Field;
}

export type Token = Field | FieldValueObject | FieldOnlyObject | QueryVerb;

export interface Sort {
    TYPE: Type;
    DIRECTION: Direction;
    FIELD: string;
}

export type Score = 'TFIDF' | 'SUM' | 'PRODUCT' | 'CONCAT';

export type AlterToken = (token: Token) => Promise<Token>;

export interface Weight {
    FIELD: string;
    VALUE: string;
    WEIGHT: number;
}

export interface QueryOptions {
    BUCKETS?: string[];
    DOCUMENTS?: boolean;
    FACETS?: Token[];
    PAGE?: Page;
    PIPELINE?: AlterToken;
    SCORE?: Score;
    SORT?: Sort;
    WEIGHT?: Weight[];
}

export interface NGram {
    lengths: number[];
    join: string;
    fields?: string[];
}

export type ReplaceValues = {
    [key in string]: string[];
};

export interface Replace {
    fields: string[];
    values: ReplaceValues;
}

export type TokenizerArgs = [tokens: string, field: string, ops: PutOptions];
export type SplitTokenizerArgs = [tokens: string[], field: string, ops: PutOptions];
export type Tokenizer = (...args: TokenizerArgs) => Promise<string[]>;
export type SplitTokenizerStage = (args: TokenizerArgs) => Promise<SplitTokenizerArgs>;
export type TokenizerStage = (args: SplitTokenizerArgs) => Promise<SplitTokenizerArgs>;

export interface PutOptions {
    caseSensitive?: boolean;
    ngrams?: NGram;
    replace?: Replace;
    skipField?: string[];
    stopwords?: string[];
    storeRawDocs?: boolean;
    storeVectors?: boolean;
    tokenizer?: Tokenizer;
}

export interface QueryResultItemNoDoc {
    _id: string;
    _match: string[];
}

export interface QueryResultItem {
    _id: string;
    _match: string[];
    _doc: any[];
}

export interface QueryResult {
    RESULT: QueryResultItem[] | QueryResultItemNoDoc[];
    RESULT_LENGTH: number;
}

export interface AllDocumentsResultItem {
    _id: number;
    _doc: any;
}

export interface FieldValueIdObject extends FieldValueObject {
    _id: string[];
}

export interface Operation {
    _id: string;
    operation: string;
    status: string;
}

export interface FieldValue {
    FIELD: string;
    VALUE: string;
}

export interface KeyValue {
    key: string;
    value: any;
}

export interface TokenizationPipelineStages {
    SPLIT: SplitTokenizerStage;
    SKIP: TokenizerStage;
    LOWCASE: TokenizerStage;
    REPLACE: TokenizerStage;
    NGRAMS: TokenizerStage;
    STOPWORDS: TokenizerStage;
    SCORE_TERM_FREQUENCY: TokenizerStage;
}

export interface SearchIndex {
    INDEX: any;
    QUERY(query: Token, options?: QueryOptions): Promise<QueryResult>;
    SEARCH(token: Token): Promise<QueryResult>;
    ALL_DOCUMENTS(limit?: number): Promise<AllDocumentsResultItem[]>;
    BUCKETS(...tokens: ReadonlyArray<Token>): Promise<FieldValueIdObject[]>;
    DELETE(...docIds: ReadonlyArray<string>): Promise<Operation[]>;
    CREATED(): Promise<number>;
    DICTIONARY(token?: Token): Promise<string[]>;
    DOCUMENTS(...docIds: ReadonlyArray<string>): Promise<any[]>;
    DISTINCT(token?: Token): Promise<FieldValue[]>;
    DOCUMENT_COUNT(): Promise<number>;
    EXPORT(): Promise<KeyValue[]>;
    FACETS(token?: Token): Promise<FieldValueIdObject[]>;
    FIELDS(): Promise<string[]>;
    FLUSH(): Promise<void>;
    IMPORT(index: ReadonlyArray<KeyValue>): Promise<void>;
    MIN(token?: Token): Promise<string>;
    MAX(token?: Token): Promise<string>;
    PUT(documents: ReadonlyArray<any>, options?: PutOptions): Promise<Operation[]>;
    PUT_RAW(documents: ReadonlyArray<any>): Promise<Operation[]>;
    TOKENIZATION_PIPELINE_STAGES: TokenizationPipelineStages;
}

declare function si(options?: SearchIndexOptions): Promise<SearchIndex>;

export = si;
