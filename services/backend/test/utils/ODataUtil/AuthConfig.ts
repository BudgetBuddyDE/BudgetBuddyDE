import axios from "axios";
import { type AuthConfig } from "./ODataUtil";

export class AuthCfg {
  /** Auth credentials */
  private authConfig: AuthConfig | null;

  constructor(authConfig: AuthConfig | null = null) {
    this.authConfig = authConfig;
  }

  public set authCfg(v: AuthConfig | null) {
    this.authConfig = v;
  }

  public get authCfg() {
    return this.authConfig;
  }

  public clearAuthConfig() {
    this.authConfig = null;
  }

  public assembleConfig(config: Partial<axios.AxiosRequestConfig>) {
    let cfg = config;
    if (!cfg.auth && this.authConfig) {
      cfg.auth = this.authConfig;
    }

    return cfg;
  }
}
