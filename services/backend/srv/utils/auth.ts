import { User } from "#cds-models/UserService";
import cds from "@sap/cds";

import { config } from "../core/config";
import { type TUser, ZGetSessionResponse } from "../types";

/**
 * Helper class to interact with the authentication service.
 * It provides methods to fetch the current session and user information.
 * It also provides a method to map the user object to a format compatible with cds.User.
 * @class AuthHelper
 */
export class AuthHelper {
  private logger: ReturnType<typeof config.getLogger>;
  private authHost: string | undefined;

  constructor() {
    this.logger = config.getLogger(AuthHelper.name, { label: AuthHelper.name });
    this.authHost = process.env.AUTH_HOST;
  }

  /**
   * Checks if the authentication host is set.
   * @param authHost The authentication host URL.
   */
  private isAuthHostSet(
    authHost: string | undefined,
  ): asserts authHost is string {
    if (!authHost) {
      throw new Error("AUTH_HOST not set");
    }
  }

  /**
   * Fetches the current session from the authentication service.
   * @param options Optional headers to include in the request.
   * @returns The current session information.
   * @throws Will throw an error if the response is not ok or if no session is found.
   */
  public async getSession(options?: { headers?: Headers }) {
    this.isAuthHostSet(this.authHost);

    const headers = options?.headers || undefined;
    this.logger.debug("Using headers", headers);
    const response = await fetch(this.authHost + "/api/auth/get-session", {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      const err = new Error("Response not ok");
      this.logger.error(err, { response, ...options });
      throw err;
    } else
      this.logger.debug("Response ok", { status: response.status, ...options });

    const json = await response.json();
    if (!json) {
      const err = new Error("No session found");
      this.logger.error(err, { response: json, ...options });
      throw err;
    } else this.logger.debug("Response JSON", { body: json, ...options });

    const parsedJsonBody = ZGetSessionResponse.safeParse(json);
    if (!parsedJsonBody.success) {
      const err = parsedJsonBody.error;
      this.logger.error(err, parsedJsonBody.error, {
        response: json,
        ...options,
      });
      throw err;
    } else
      this.logger.debug("Response JSON parsed successfully", {
        data: parsedJsonBody.data,
        ...options,
      });

    const session = parsedJsonBody.data;
    this.logger.debug("Session fetched successfully", {
      data: session,
      ...options,
    });

    return session;
  }

  /**
   * Fetches the backend user by user ID.
   * @param userId The ID of the user to fetch.
   * @returns The user object.
   * @throws Will throw an error if the user is not found.
   */
  public async getBackendUser(userId: TUser["id"]) {
    this.logger.info("Fetching backend user with id " + userId, { userId });
    const user = await SELECT.one.from(User).where({ userId: userId });
    if (!user) {
      const err = new Error("Internal user not found");
      this.logger.error(err, { userId });
      throw err;
    }

    return user;
  }

  /**
   * Maps a user object to a cds.User object.
   * @param user The user object to map.
   * @returns A cds.User object.
   */
  public static mapToUserObj(user: TUser): cds.User {
    return new cds.User({
      id: user.id,
      roles: "role" in user ? [user.role as string] : [],
      attr: {
        userId: user.id,
        name: user.name,
        email: user.email,
      },
    });
  }

  /**
   * Static method to map a user object to a cds.User object.
   * This is a wrapper around the static method of the same name.
   * @param params Parameters to pass to the static method.
   * @returns A cds.User object.
   */
  public mapToUserObj(...params: Parameters<typeof AuthHelper.mapToUserObj>) {
    return AuthHelper.mapToUserObj(...params);
  }
}
