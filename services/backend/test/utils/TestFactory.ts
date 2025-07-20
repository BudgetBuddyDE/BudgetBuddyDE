import cds from "@sap/cds";
import { type AuthConfig, ODataService, ODataUtil } from "./ODataUtil";
import { LocalizationOperations } from "./ODataUtil/LocalizationOperations";

/** Type representing a CDS Test instance */
export type TestInstance = ReturnType<(typeof cds.test)["in"]>;

/**
 * TestFactory class for creating and managing test instances
 * Provides utilities for initializing test environments, resetting test data,
 * and creating OData utility instances for testing
 */
export class TestFactory {
  /** Path to the project root directory */
  private path: string;
  /** Current test instance or null if not initialized */
  private testInstance: TestInstance | null = null;
  private logger: ReturnType<typeof cds.log>;
  private localizationOperations: LocalizationOperations | null = null;

  /**
   * Creates a new TestFactory instance
   * @param path - Path to the project directory to be used for test initialization
   */
  constructor(path: string) {
    this.path = path;
    this.logger = cds.log(TestFactory.name, {
      level: "info",
    });
  }

  get localization() {
    this.isInstanceBound(this.testInstance);
    if (!this.localizationOperations) {
      this.localizationOperations = new LocalizationOperations(
        this.testInstance.cds,
      );
    }

    return this.localizationOperations;
  }

  /**
   * Initializes a new test instance with in-memory database
   * @returns The initialized test instance
   */
  public init(
    options?: Partial<{ profile: string; cmd: string; args: string[] }>,
  ): TestInstance {
    const { Test } = cds.test;
    const cmd = options?.cmd || "serve";
    const args = options?.args || ["all", "--in-memory"];
    if (options && options.profile) {
      args.push("--profile", options.profile);
    }
    console.log(cmd, args, this.path);
    const test = new Test().run(cmd, ...args).in(this.path);
    this.testInstance = test;
    this.logger.debug(
      `Test instance initialized with command: ${cmd} and args: ${args.join(" ")}`,
    );
    return test;
  }

  /**
   * Resets all test data in the current test instance
   * @returns Promise that resolves when data has been reset
   * @throws Error if test instance hasn't been initialized
   */
  public async resetData() {
    this.isInstanceBound(this.testInstance);
    return await this.testInstance.data.reset();
  }

  /**
   * Creates an ODataUtil instance for the specified service
   * @param service - The OData service to create a utility for
   * @returns An ODataUtil instance configured for the specified service
   * @throws Error if test instance hasn't been initialized
   */
  public getODataUtil(
    service: ODataService,
    authConfig?: AuthConfig,
  ): ODataUtil {
    this.isInstanceBound(this.testInstance);
    return new ODataUtil(this.testInstance, service, authConfig);
  }

  /**
   * Type guard that verifies if a test instance is initialized
   * @param value - The value to check for test instance initialization
   * @throws Error if test instance hasn't been initialized
   */
  public isInstanceBound(value: unknown): asserts value is TestInstance {
    if (!value)
      throw new Error(
        `Test instance hasn't been initialized yet! Execute ${this.init.name} first...`,
      );
  }
}
