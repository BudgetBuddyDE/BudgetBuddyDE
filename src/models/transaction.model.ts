import { TransactionService } from '@/services/Transaction.service';
import type { Description, uuid } from '@/type';
import type { CategoryView } from '@/type/category.type';
import type { PaymentMethodView } from '@/type/payment-method.type';
import type { Transaction as TTransaction, TransactionTable } from '@/type/transaction.type';

export class Transaction {
    id: number;
    categories: CategoryView;
    paymentMethods: PaymentMethodView;
    receiver: string;
    description: Description;
    amount: number;
    date: Date;
    created_by: uuid;
    updated_at: Date;
    inserted_at: Date;

    constructor({
        id,
        categories,
        paymentMethods,
        receiver,
        description,
        amount,
        date,
        created_by,
        updated_at,
        inserted_at,
    }: TTransaction) {
        this.id = id;
        this.categories = categories;
        this.paymentMethods = paymentMethods;
        this.receiver = receiver;
        this.description = description;
        this.amount = amount;
        this.date = new Date(date);
        this.created_by = created_by;
        this.updated_at = new Date(updated_at);
        this.inserted_at = new Date(inserted_at);
    }

    async update(
        updatedInformation: Omit<TransactionTable, 'id' | 'created_by' | 'updated_at' | 'inserted_at' | 'created_at'>
    ) {
        try {
            return await TransactionService.updateTransaction(this.id, {
                ...updatedInformation,
                created_by: this.created_by,
            });
        } catch (error) {
            console.error(error);
        }
    }

    async delete() {
        try {
            return await TransactionService.deleteTransactionById(this.id);
        } catch (error) {
            console.error(error);
        }
    }
}
