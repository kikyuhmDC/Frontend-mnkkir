"use client";

import { EntityCrud } from "@/components/entity-crud";
import { userEntity } from "@/lib/entities";

export default function UsersPage() {
  return <EntityCrud config={userEntity} />;
}
