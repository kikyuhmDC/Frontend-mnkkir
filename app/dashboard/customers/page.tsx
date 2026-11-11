"use client";

import { EntityCrud } from "@/components/entity-crud";
import { customerEntity } from "@/lib/entities";

export default function CustomersPage() {
  return <EntityCrud config={customerEntity} />;
}
