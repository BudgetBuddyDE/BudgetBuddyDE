export class EnvironmentVariableNotSetError extends Error {
  constructor(variableName: string) {
    super(`${variableName} is required`);
    this.name = 'EnvironmentVariableNotSetError';
  }
}

export class InvalidCliArgumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCliArgumentError';
  }
}
