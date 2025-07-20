import { type _cds } from "@sap/cds";

export class LocalizationOperations {
  private cds: _cds;

  constructor(cds: _cds) {
    this.cds = cds;
  }

  public getLabel(label: string, ...args: any[]): string | undefined {
    // @ts-expect-error
    return this.cds.i18n.labels.at(label, ...args);
  }

  public getMessage(label: string, ...args: any[]): string | undefined {
    // @ts-expect-error
    return this.cds.i18n.messages.at(label, ...args);
  }
}
