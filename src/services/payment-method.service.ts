import type { TExportType } from '../components/user-profile.component';
import { PaymentMethod } from '../models/paymentMethod.model';
import { supabase } from '../supabase';
import type {
  IBasePaymentMethod,
  IExportPaymentMethod,
  IPaymentMethod,
} from '../types/paymentMethod.type';

export class PaymentMethodService {
  private static table = 'paymentMethods';

  static async createPaymentMethods(
    paymentMethods: Partial<IBasePaymentMethod>[]
  ): Promise<PaymentMethod[]> {
    return new Promise(async (res, rej) => {
      const { data, error } = await supabase
        .from<IBasePaymentMethod>(this.table)
        .insert(paymentMethods);
      if (error) rej(error);
      res(data ? data.map((paymentMethod) => new PaymentMethod(paymentMethod)) : []);
    });
  }

  static async getPaymentMethods(): Promise<PaymentMethod[]> {
    return new Promise(async (res, rej) => {
      const { data, error } = await supabase
        .from<IPaymentMethod>(this.table)
        .select('*')
        .order('name', { ascending: true });
      if (error) rej(error);
      res(data ? data.map((paymentMethod) => new PaymentMethod(paymentMethod)) : []);
    });
  }

  static async updatePaymentMethod(
    id: number,
    updatedPaymentMethod: Partial<IBasePaymentMethod>
  ): Promise<PaymentMethod[]> {
    return new Promise(async (res, rej) => {
      const { data, error } = await supabase
        .from<IBasePaymentMethod>(this.table)
        .update(updatedPaymentMethod)
        .match({ id: id });
      if (error) rej(error);
      res(data ? data.map((paymentMethod) => new PaymentMethod(paymentMethod)) : []);
    });
  }

  static async deletePaymentMethodById(id: number): Promise<PaymentMethod[]> {
    return new Promise(async (res, rej) => {
      const { data, error } = await supabase
        .from<IBasePaymentMethod>(this.table)
        .delete()
        .match({ id: id });
      if (error) rej(error);
      res(data ? data.map((paymentMethod) => new PaymentMethod(paymentMethod)) : []);
    });
  }

  /**
   * Get all payment-methods, ready for the export
   */
  static export(type: TExportType = 'json'): Promise<IExportPaymentMethod[] | string> {
    return new Promise((res, rej) => {
      switch (type) {
        case 'json':
          supabase
            .from<IExportPaymentMethod>(this.table)
            .select(`*`)
            .then((result) => {
              if (result.error) rej(result.error);
              res(result.data ?? []);
            });
          break;

        case 'csv':
          supabase
            .from<IPaymentMethod>(this.table)
            .select(`*`)
            .csv()
            .then((result) => {
              if (result.error) rej(result.error);
              res(result.data ?? '');
            });
          break;
      }
    });
  }
}
