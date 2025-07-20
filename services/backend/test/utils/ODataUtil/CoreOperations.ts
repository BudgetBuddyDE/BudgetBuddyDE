import { ApiResponse } from "./ApiResponse";
import { type ODataQueryOptions } from "./index";
import { type DataKey, ODataUtil } from "./ODataUtil";

/**
 * Class for handling core OData operations in test scenarios
 * Provides methods for CRUD operations on OData entities
 * without draft capabilities
 */
export class CoreOperations {
  /** Reference to the parent ODataUtil instance */
  private parent: ODataUtil;

  /**
   * Creates a new CoreOperations instance
   * @param parent - The parent ODataUtil instance this core handler belongs to
   */
  constructor(parent: ODataUtil) {
    this.parent = parent;
  }

  async executeAction<T, P>(
    entitySet: string,
    entityId: string,
    actionName: string,
    actionParams?: P,
  ) {
    let url = `${this.parent.serviceBaseUrl}/${entitySet}(ID=${entityId},IsActiveEntity=true)/${this.parent.serviceName}.${actionName}`;

    const headers = {
      Accept: "application/json",
    };
    const cfg = this.parent.assembleConfig({ headers });

    const response = await this.parent.testInstance.POST<T>(
      url,
      actionParams,
      cfg,
    );
    return this.parent.buildResponse<T>(response);
  }

  /**
   * Retrieves data from an entity set
   * @param entitySet - The name of the entity set
   * @param options - OData query parameters (e.g., $select, $filter, $expand)
   * @returns Promise resolving to the retrieved data
   */
  async get<T>(
    entitySet: string,
    options?: ODataQueryOptions,
  ): Promise<ApiResponse<T[]>> {
    console.log("Fetching data from entity set:", entitySet);
    let url = `${this.parent.serviceBaseUrl}/${entitySet}`;

    if (options) {
      const queryParams = this.parent.buildQueryString(options);
      url = `${url}${queryParams ? "?" + queryParams : ""}`;
    }

    const headers = {
      Accept: "application/json",
    };
    const cfg = this.parent.assembleConfig({ headers });

    const response = await this.parent.testInstance.GET(url, cfg);
    // Bei einer OData-Get Request, wird der Wert nicht unter data, sondern unter data.value bereitgestellt
    // Da wir einen generischen Typen haben, welcher nicht definiert sein soll, casten wir den dataKey als gültigen DataKey, da wir wissen dass die Daten unter diesem Knoten bereitliegen
    return this.parent.buildResponse<T[]>(response, {
      dataKey: "data.value" as DataKey<T>,
    });
  }

  /**
   * Retrieves a single entity by its ID
   * @param entitySet - The name of the entity set
   * @param id - The ID of the entity
   * @param options - OData query parameters (e.g., $select, $expand)
   * @returns Promise resolving to the retrieved entity
   */
  async getById<T>(
    entitySet: string,
    id: string,
    options?: Omit<ODataQueryOptions, "$filter">,
  ): Promise<ApiResponse<T>> {
    let url = `${this.parent.serviceBaseUrl}/${entitySet}(ID='${id}',IsActiveEntity=true)`;

    if (options) {
      const { $filter, ...restOptions } = options as any;
      const queryParams = this.parent.buildQueryString(restOptions);
      url = `${url}${queryParams ? "?" + queryParams : ""}`;
    }

    const headers = {
      Accept: "application/json",
    };
    const cfg = this.parent.assembleConfig({ headers });

    const response = await this.parent.testInstance.GET(url, cfg);
    return this.parent.buildResponse<T>(response);
  }

  /**
   * Creates a new entity
   * @param entitySet - The name of the entity set
   * @param entityData - The data to create
   * @returns Promise resolving to the created entity
   */
  async create<T>(
    entitySet: string,
    entityData: Partial<T>,
  ): Promise<ApiResponse<T>> {
    const url = `${this.parent.serviceBaseUrl}/${entitySet}`;
    const headers = {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };
    const cfg = this.parent.assembleConfig({ headers });

    const response = await this.parent.testInstance.POST(url, entityData, cfg);
    return this.parent.buildResponse<T>(response);
  }

  /**
   * Updates an entity
   * @param entitySet - The name of the entity set
   * @param id - The ID of the entity
   * @param entityData - The data to update
   * @returns Promise resolving to the updated entity
   */
  async update<T>(
    entitySet: string,
    id: string,
    entityData: Partial<T>,
  ): Promise<ApiResponse<T>> {
    const url = `${this.parent.serviceBaseUrl}/${entitySet}(ID='${id}',IsActiveEntity=true)`;
    const headers = {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };
    const cfg = this.parent.assembleConfig({ headers });

    const response = await this.parent.testInstance.PATCH(url, entityData, cfg);
    return this.parent.buildResponse<T>(response);
  }

  /**
   * Deletes an entity
   * @param entitySet - The name of the entity set
   * @param id - The ID of the entity
   * @returns Promise resolving when deletion is complete
   */
  async delete(entitySet: string, id: string): Promise<ApiResponse<string>> {
    const url = `${this.parent.serviceBaseUrl}/${entitySet}(ID='${id}',IsActiveEntity=true)`;
    const cfg = this.parent.assembleConfig({});
    const response = await this.parent.testInstance.DELETE(url, cfg);
    return this.parent.buildResponse<string>(response);
  }
}
