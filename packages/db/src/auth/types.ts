import {account, session, user, verification} from './tables';
import {createTableSchemas} from '../utils/createTableSchemas';

export const UserSchemas = createTableSchemas(user);

export const SessionSchemas = createTableSchemas(session);

export const AccountSchemas = createTableSchemas(account);

export const VerificationSchemas = createTableSchemas(verification);
