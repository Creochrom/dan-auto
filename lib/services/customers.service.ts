import { customersRepository } from "@/lib/repositories/customers.repository";
import type { Customer, UpsertCustomerInput } from "@/lib/types/workshop-data";

export const customersService = {
  findById(id: string): Promise<Customer | undefined> {
    return customersRepository.findById(id);
  },

  upsert(input: UpsertCustomerInput): Promise<Customer> {
    return customersRepository.upsert(input);
  },
};
