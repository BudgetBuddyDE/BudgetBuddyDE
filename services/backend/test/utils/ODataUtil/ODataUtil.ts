import { type ODataQueryOptions } from "./index";
import { type TestInstance } from "../TestFactory";
import { CoreOperations } from "./CoreOperations";
import axios from "axios";
import { AuthCfg } from "./AuthConfig";
import { ApiResponse } from "./ApiResponse";

export type AuthConfig = axios.AxiosBasicCredentials;

/**
 * Enum to identify the available OData services
 */
export enum ODataService {
  Backend = "backend",
  Asset = "asset",
}

/**
 * Mapping of OData services to their base URLs and service names
 */
const ODataServiceMapping: Record<
  ODataService,
  { baseUrl: string; serviceName: string }
> = {
  backend: {
    baseUrl: "/odata/v4/backend",
    serviceName: "BackendService",
  },
  asset: {
    baseUrl: "/odata/v4/asset",
    serviceName: "AssetService",
  },
} as const;

export type StatusKey<T> = keyof axios.AxiosResponse<T>;
export type DataKey<T> = keyof axios.AxiosResponse<T>;

/**
 * Utility class for OData operations in test cases
 * Provides methods for interacting with OData services and offers support for
 * basic CRUD operations as well as draft functionalities.
 */
export class ODataUtil extends AuthCfg {
  /** The OData service to interact with */
  private service: ODataService;
  /** Test instance used for executing requests */
  private test: TestInstance;

  /** Core operations handler for standard OData operations */
  public core: CoreOperations;

  /**
   * Creates a new instance of the ODataUtil class
   * @param test - The test instance to use for executing requests
   * @param service - The OData service to interact with
   */
  constructor(
    test: TestInstance,
    service: ODataService,
    authConfig: AuthConfig | null = null,
  ) {
    super(authConfig);
    this.test = test;
    this.service = service;

    this.core = new CoreOperations(this);
  }

  /**
   * Returns the current test instance
   * @returns The test instance
   */
  get testInstance() {
    return this.test;
  }

  /**
   * Returns the metadata of the current OData service
   * @returns The service data containing baseUrl and serviceName
   */
  get serviceData() {
    return ODataServiceMapping[this.service];
  }

  /**
   * Returns the base URL of the current OData service
   * @returns The base URL of the service
   */
  get serviceBaseUrl() {
    return this.serviceData.baseUrl;
  }

  /**
   * Returns the name of the current OData service
   * @returns The service name
   */
  get serviceName(): string {
    return this.serviceData.serviceName;
  }

  buildResponse<T>(
    response: axios.AxiosResponse<T>,
    accessor?: Partial<{ statusKey: StatusKey<T>; dataKey: DataKey<T> }>,
  ): ApiResponse<T> {
    const status =
      accessor && accessor.statusKey
        ? response[accessor.statusKey]
        : response.status;
    const dataKey = accessor && accessor.dataKey ? accessor.dataKey : "data";
    let data = response;

    for (const p of dataKey.split(".")) {
      data = data[p as DataKey<T>];
    }

    return ApiResponse.builder<T>()
      .withStatus(status)
      .withData(data as T)
      .build();
  }

  /**
   * Builds a query string from the provided OData options
   * @param options - The OData query options (e.g., $select, $expand, $filter)
   * @returns A formatted query string for OData requests
   */
  buildQueryString(options: ODataQueryOptions): string {
    const params: string[] = [];

    if (options.$select) {
      params.push(`$select=${options.$select}`);
    }

    if (options.$expand) {
      params.push(`$expand=${options.$expand}`);
    }

    if (options.$filter) {
      params.push(`$filter=${encodeURIComponent(options.$filter)}`);
    }

    if (options.$orderby) {
      params.push(`$orderby=${options.$orderby}`);
    }

    if (options.$top !== undefined) {
      params.push(`$top=${options.$top}`);
    }

    if (options.$skip !== undefined) {
      params.push(`$skip=${options.$skip}`);
    }

    if (options.$count !== undefined) {
      params.push(`$count=${options.$count}`);
    }

    if (options.$search) {
      params.push(`$search=${encodeURIComponent(options.$search)}`);
    }

    return params.join("&");
  }
}
